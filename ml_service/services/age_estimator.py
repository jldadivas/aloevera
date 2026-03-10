"""
Age Estimation Service for Aloe Vera
Estimates plant age based on physical features
"""

import cv2
import numpy as np
import pickle
import os
from typing import Dict, Tuple
from pathlib import Path

try:
    from sklearn.preprocessing import StandardScaler
    from sklearn.ensemble import RandomForestRegressor
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


class AgeEstimator:
    """Estimates Aloe Vera plant age based on physical features"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize age estimator
        
        Args:
            model_path: Path to trained model pickle file
        """
        self.model = None
        self.scaler = None
        self.model_path = model_path
        self.leaf_detector = None
        
        if model_path and os.path.exists(model_path):
            ext = os.path.splitext(model_path)[1].lower()
            if ext == '.pt':
                self._load_yolo_model(model_path)
            else:
                self._load_model(model_path)
        else:
            self._init_default_model()
    
    def _load_model(self, model_path: str):
        """Load trained model from pickle"""
        try:
            with open(model_path, 'rb') as f:
                saved_data = pickle.load(f)
                self.model = saved_data.get('model')
                self.scaler = saved_data.get('scaler')
        except Exception as e:
            print(f"Error loading model: {e}. Using default estimator.")
            self._init_default_model()

    def _load_yolo_model(self, model_path: str):
        """Load YOLO leaf detector model (.pt) for age feature extraction."""
        try:
            if not YOLO_AVAILABLE:
                raise ImportError("ultralytics not installed")
            self.leaf_detector = YOLO(model_path)
            print(f"Loaded age YOLO model: {model_path}")
            self._init_default_model()
        except Exception as e:
            print(f"Error loading YOLO age model: {e}. Using default estimator.")
            self.leaf_detector = None
            self._init_default_model()
    
    def _init_default_model(self):
        """Initialize default rule-based estimator"""
        if SKLEARN_AVAILABLE:
            self.model = None  # Will be created if needed
            self.scaler = StandardScaler()
        else:
            self.model = None
    
    def extract_features(self, image_path: str) -> Dict:
        """
        Extract plant features from image
        
        Args:
            image_path: Path to plant image
            
        Returns:
            Dict with extracted features
        """
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Could not read image"}
        
        return self._extract_features_from_array(image)
    
    def extract_features_from_bytes(self, image_bytes: bytes) -> Dict:
        """
        Extract features from image bytes
        
        Args:
            image_bytes: Image as bytes
            
        Returns:
            Dict with extracted features
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return {"error": "Could not decode image"}
        
        return self._extract_features_from_array(image)
    
    def _extract_features_from_array(self, image: np.ndarray) -> Dict:
        """Extract features from image array"""
        try:
            # If a YOLO leaf detector is available, prefer learned leaf detections.
            if self.leaf_detector is not None:
                yolo_features = self._extract_features_with_yolo(image)
                if "error" not in yolo_features:
                    return yolo_features
                print(f"[AGE] YOLO age fallback: {yolo_features.get('error')}")

            return self._extract_features_with_color_segmentation(image)
        
        except Exception as e:
            return {"error": str(e)}

    def _extract_features_with_color_segmentation(self, image: np.ndarray) -> Dict:
        """Fallback feature extraction using color segmentation + contours."""
        try:
            # Convert to HSV for better segmentation
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

            # Define range for green (Aloe is green)
            # Looser bounds improve detection on low-light webcam images.
            lower_green = np.array([20, 20, 20])
            upper_green = np.array([100, 255, 255])
            
            # Mask for green regions
            mask = cv2.inRange(hsv, lower_green, upper_green)
            
            # Find contours
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                return {"error": "No plant detected"}
            
            # Get largest contour (plant body)
            largest_contour = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest_contour)
            
            # Estimate number of "leaves" (peaks in contour)
            moments = cv2.moments(largest_contour)
            if moments['m00'] > 0:
                cx = int(moments['m10'] / moments['m00'])
                cy = int(moments['m01'] / moments['m00'])
            else:
                cx, cy = image.shape[1] // 2, image.shape[0] // 2
            
            # Calculate convexity (leaf count proxy)
            hull = cv2.convexHull(largest_contour)
            hull_area = cv2.contourArea(hull)
            
            # Solidity indicates leaf separation
            solidity = float(area) / float(hull_area) if hull_area > 0 else 0
            
            # Estimate leaf count from contour complexity
            perimeter = cv2.arcLength(largest_contour, True)
            approximation = cv2.approxPolyDP(largest_contour, 0.02 * perimeter, True)
            leaf_count = max(3, len(approximation) // 2)  # Each leaf creates peaks
            
            # Plant width and height
            x, y, w, h = cv2.boundingRect(largest_contour)
            plant_width = w
            plant_height = h
            aspect_ratio = plant_height / plant_width if plant_width > 0 else 1
            
            # Pixel to cm conversion (assuming ~100 pixels = 5cm for typical phone camera)
            pixels_per_cm = 20  # Adjust based on camera calibration
            leaf_length_cm = (plant_height / pixels_per_cm)
            plant_width_cm = (plant_width / pixels_per_cm)
            
            features = {
                "plant_area": float(area),
                "leaf_count": int(leaf_count),
                "leaf_length_cm": float(leaf_length_cm),
                "plant_width_cm": float(plant_width_cm),
                "aspect_ratio": float(aspect_ratio),
                "solidity": float(solidity),
                "perimeter": float(perimeter),
                "image_size": {
                    "width": image.shape[1],
                    "height": image.shape[0]
                }
            }
            
            return features
        
        except Exception as e:
            return {"error": str(e)}

    def _extract_features_with_yolo(self, image: np.ndarray) -> Dict:
        """Extract age-related features from YOLO leaf detections."""
        try:
            # Lower confidence for age model so small/partial leaves are still counted.
            results = self.leaf_detector(image, conf=0.08, imgsz=640, verbose=False)
            boxes = results[0].boxes if results and len(results) > 0 else None
            if boxes is None or len(boxes) == 0:
                return {"error": "No leaves detected by age model"}

            bbox_wh = boxes.xywh.cpu().numpy() if hasattr(boxes.xywh, "cpu") else boxes.xywh.numpy()
            widths = bbox_wh[:, 2]
            heights = bbox_wh[:, 3]
            areas = widths * heights

            leaf_count = int(len(bbox_wh))
            leaf_length_px = float(np.mean(heights)) if len(heights) > 0 else 0.0
            plant_width_px = float(np.max(widths)) if len(widths) > 0 else 0.0
            total_leaf_area = float(np.sum(areas))

            pixels_per_cm = 20
            leaf_length_cm = leaf_length_px / pixels_per_cm
            plant_width_cm = plant_width_px / pixels_per_cm
            aspect_ratio = (leaf_length_px / plant_width_px) if plant_width_px > 0 else 1.0

            return {
                "plant_area": total_leaf_area,
                "leaf_count": leaf_count,
                "leaf_length_cm": float(leaf_length_cm),
                "plant_width_cm": float(plant_width_cm),
                "aspect_ratio": float(aspect_ratio),
                "solidity": 0.8,
                "perimeter": float(np.sum(widths + heights)),
                "image_size": {
                    "width": int(image.shape[1]),
                    "height": int(image.shape[0])
                }
            }
        except Exception as e:
            return {"error": str(e)}
    
    def estimate_age(self, features: Dict) -> Dict:
        """
        Estimate plant age from features
        
        Args:
            features: Dict with extracted features
            
        Returns:
            Dict with age estimation
        """
        if "error" in features:
            return {"error": features["error"], "success": False}
        
        try:
            leaf_count = features.get("leaf_count", 0)
            leaf_length = features.get("leaf_length_cm", 0)
            plant_area = features.get("plant_area", 0)
            
            # Rule-based age estimation (baseline)
            if leaf_count < 6:
                age_months = 1 + (leaf_count / 6) * 1  # 1-2 months
                confidence = 0.70
            elif leaf_count < 10:
                age_months = 2 + ((leaf_count - 6) / 4) * 3  # 2-5 months
                confidence = 0.75
            elif leaf_count < 15:
                age_months = 5 + ((leaf_count - 10) / 5) * 4  # 5-9 months
                confidence = 0.80
            elif leaf_count < 20:
                age_months = 9 + ((leaf_count - 15) / 5) * 6  # 9-15 months
                confidence = 0.75
            else:
                age_months = 15 + ((leaf_count - 20) / 10) * 12  # 15+ months
                confidence = 0.65
            
            # Adjust based on leaf length
            if leaf_length > 30:
                age_adjustment = 2  # Could be older
                confidence -= 0.05
            elif leaf_length < 5:
                age_adjustment = -1  # Could be younger
                confidence += 0.05
            else:
                age_adjustment = 0
            
            age_months = max(0.5, age_months + age_adjustment)
            confidence = min(1.0, max(0.5, confidence))
            
            # Convert to readable format
            months = int(age_months)
            weeks = int((age_months - months) * 4.33)
            
            return {
                "success": True,
                "age_months": round(age_months, 2),
                "age_formatted": f"{months}m {weeks}w",
                "confidence": round(confidence, 2),
                "estimation_method": "feature-based",
                "features_used": {
                    "leaf_count": leaf_count,
                    "leaf_length_cm": round(leaf_length, 2),
                    "plant_area": int(plant_area)
                }
            }
        
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def estimate_age_from_image(self, image_path: str) -> Dict:
        """
        Estimate age directly from image
        
        Args:
            image_path: Path to plant image
            
        Returns:
            Age estimation result
        """
        features = self.extract_features(image_path)
        return self.estimate_age(features)
    
    def estimate_age_from_bytes(self, image_bytes: bytes) -> Dict:
        """
        Estimate age from image bytes
        
        Args:
            image_bytes: Image as bytes
            
        Returns:
            Age estimation result
        """
        features = self.extract_features_from_bytes(image_bytes)
        return self.estimate_age(features)
    
    def train_model(self, training_data: list, model_save_path: str = None):
        """
        Train age estimation model with historical data
        
        Args:
            training_data: List of {"features": {...}, "actual_age": months}
            model_save_path: Where to save trained model
        """
        if not SKLEARN_AVAILABLE:
            return {"error": "scikit-learn not installed"}
        
        try:
            X = []
            y = []
            
            for item in training_data:
                features = item.get("features", {})
                age = item.get("actual_age", 0)
                
                X.append([
                    features.get("leaf_count", 0),
                    features.get("leaf_length_cm", 0),
                    features.get("plant_width_cm", 0),
                    features.get("plant_area", 0),
                    features.get("aspect_ratio", 0),
                    features.get("solidity", 0)
                ])
                y.append(age)
            
            X = np.array(X)
            y = np.array(y)
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Train model
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X_scaled, y)
            
            self.model = model
            self.scaler = scaler
            
            # Save model
            if model_save_path:
                save_data = {
                    "model": model,
                    "scaler": scaler
                }
                with open(model_save_path, 'wb') as f:
                    pickle.dump(save_data, f)
            
            return {"success": True, "message": "Model trained successfully"}
        
        except Exception as e:
            return {"error": str(e)}
