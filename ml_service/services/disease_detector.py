"""
Disease Detection Service using YOLOv8
Detects Aloe Vera diseases and health status
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
import os

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


class DiseaseDetector:
    """YOLOv8 based disease detection for Aloe Vera plants"""
    
    # Disease classes for Aloe Vera
    DISEASE_CLASSES = {
        0: "healthy",
        1: "leaf_spot",
        2: "rust",
        3: "fungal_disease",
        4: "bacterial_soft_rot"
    }
    
    # Confidence gates to suppress low-quality detections.
    CONFIDENCE_THRESHOLD = 0.5  # Default threshold for normal scans
    LIVE_CONFIDENCE_THRESHOLD = 0.35  # Slightly lower for live preview
    
    def __init__(self, model_path: str = None):
        """
        Initialize the disease detector
        
        Args:
            model_path: Path to YOLOv8 model (if None, uses nano model)
        """
        self.model = None
        self.model_path = model_path
        self.human_detector = None
        self.face_detector = None
        self._init_human_detector()
        self._load_model()

    def _init_human_detector(self):
        """Initialize OpenCV person detector used to suppress live false positives on humans."""
        try:
            hog = cv2.HOGDescriptor()
            hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            self.human_detector = hog
        except Exception as e:
            print(f"[WARN] Human detector init failed: {e}")
            self.human_detector = None

        try:
            cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
            face_cascade = cv2.CascadeClassifier(cascade_path)
            self.face_detector = face_cascade if not face_cascade.empty() else None
            if self.face_detector is None:
                print("[WARN] Face detector cascade is empty")
        except Exception as e:
            print(f"[WARN] Face detector init failed: {e}")
            self.face_detector = None

    def _contains_person(self, image: np.ndarray) -> bool:
        """
        Detect whether a person is present in the frame.
        Used only in live mode to avoid showing disease labels on humans.
        """
        if self.human_detector is None:
            # Continue to face detector fallback below.
            pass

        try:
            max_width = 640
            h, w = image.shape[:2]
            if w > max_width:
                scale = max_width / float(w)
                resized = cv2.resize(image, (max_width, int(h * scale)))
            else:
                resized = image

            if self.human_detector is not None:
                rects, _ = self.human_detector.detectMultiScale(
                    resized,
                    winStride=(8, 8),
                    padding=(8, 8),
                    scale=1.05
                )

                frame_area = float(resized.shape[0] * resized.shape[1])
                for (x, y, rw, rh) in rects:
                    box_area = float(rw * rh)
                    # Keep only person-like boxes with meaningful size.
                    if rh >= rw and box_area >= frame_area * 0.05:
                        return True

            # Face fallback catches selfie/upper-body frames where HOG may fail.
            if self.face_detector is not None:
                gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
                faces = self.face_detector.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(40, 40)
                )
                if len(faces) > 0:
                    return True

            return False
        except Exception as e:
            print(f"[WARN] Human detection failed: {e}")
            return False
    
    def _load_model(self):
        """Load YOLOv8 model"""
        try:
            if YOLO is None:
                raise ImportError("ultralytics not installed. Run: pip install ultralytics")

            if not self.model_path:
                raise FileNotFoundError("Custom model path is required for disease detection.")

            model_loaded = False

            # Try absolute path first
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                model_loaded = True
                print(f"✅ Loaded custom model from: {self.model_path}")
            else:
                # Try relative to current directory
                alt_path = os.path.join(os.getcwd(), self.model_path)
                if os.path.exists(alt_path):
                    self.model = YOLO(alt_path)
                    model_loaded = True
                    print(f"✅ Loaded custom model from: {alt_path}")
                else:
                    raise FileNotFoundError(f"Custom model not found: {self.model_path}")

            if not model_loaded:
                raise FileNotFoundError("Custom model path is required for disease detection.")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model = None

    def _get_class_name(self, cls_id: int) -> str:
        """Resolve class name from model metadata, with static fallback."""
        if self.model is not None and hasattr(self.model, "names"):
            names = self.model.names
            if isinstance(names, dict):
                return names.get(cls_id, "unknown")
            if isinstance(names, list) and 0 <= cls_id < len(names):
                return names[cls_id]
        return self.DISEASE_CLASSES.get(cls_id, "unknown")
    def detect_from_image(self, image_path: str) -> Dict:
        """
        Detect diseases in an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dict containing detection results
        """
        if not self.model:
            return {"error": "Model not loaded", "success": False}
        
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return {"error": "Could not read image", "success": False}
            
            # Run detection
            results = self.model(image, conf=self.CONFIDENCE_THRESHOLD)
            
            # Parse results
            detections = []
            health_status = "healthy"  # default
            confidence = 0
            max_conf_any = 0.0
            max_conf_healthy = 0.0
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    disease_name = self._get_class_name(cls_id)
                    
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0]
                    bbox = {
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1)
                    }
                    
                    detection = {
                        "disease": disease_name,
                        "confidence": conf,
                        "bbox": bbox,
                        "class_id": cls_id
                    }
                    detections.append(detection)
                    if conf > max_conf_any:
                        max_conf_any = conf
                    if disease_name in ("healthy", "unknown") and conf > max_conf_healthy:
                        max_conf_healthy = conf
                    
                    # Update health status (worst case)
                    if disease_name not in ("healthy", "unknown") and conf > confidence:
                        health_status = disease_name
                        confidence = conf
            
            # If no diseased detections, it's healthy
            if not detections:
                health_status = "healthy"
                confidence = 0.0
            elif health_status == "healthy":
                health_status = "healthy"
                confidence = max(max_conf_healthy, max_conf_any)
            
            return {
                "success": True,
                "health_status": health_status,
                "confidence": float(confidence),
                "detections": detections,
                "image_size": {
                    "width": image.shape[1],
                    "height": image.shape[0]
                }
            }
        
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def detect_from_bytes(self, image_bytes: bytes, live_mode: bool = False) -> Dict:
        """
        Detect diseases from image bytes
        
        Args:
            image_bytes: Image as bytes
            
        Returns:
            Dict containing detection results
        """
        if not self.model:
            return {"error": "Model not loaded", "success": False}
        
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return {"error": "Could not decode image", "success": False}

            # In live preview, suppress disease output when a human is in frame.
            if live_mode and self._contains_person(image):
                return {
                    "success": True,
                    "health_status": "healthy",
                    "confidence": 0.99,
                    "detections": [],
                    "image_size": {
                        "width": image.shape[1],
                        "height": image.shape[0]
                    }
                }
            
            # Run detection with a lower threshold in live mode to surface weak but useful candidates.
            threshold = self.LIVE_CONFIDENCE_THRESHOLD if live_mode else self.CONFIDENCE_THRESHOLD
            results = self.model(image, conf=threshold)
            
            # Parse results
            detections = []
            health_status = "healthy"
            confidence = 0
            max_conf_any = 0.0
            max_conf_healthy = 0.0
            
            print(f"[DEBUG] Model results count: {len(results)}")
            
            for r in results:
                boxes = r.boxes
                print(f"[DEBUG] Boxes for this result: {len(boxes.cls) if len(boxes) > 0 else 0}")
                
                for box_idx, box in enumerate(boxes):
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    disease_name = self._get_class_name(cls_id)
                    
                    print(f"[DEBUG] Detection {box_idx}: class_id={cls_id}, disease={disease_name}, confidence={conf:.4f}")
                    
                    x1, y1, x2, y2 = box.xyxy[0]
                    bbox = {
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1)
                    }
                    
                    detection = {
                        "disease": disease_name,
                        "confidence": conf,
                        "bbox": bbox,
                        "class_id": cls_id
                    }
                    detections.append(detection)
                    if conf > max_conf_any:
                        max_conf_any = conf
                    if disease_name in ("healthy", "unknown") and conf > max_conf_healthy:
                        max_conf_healthy = conf
                    
                    # Accept detection if above the active threshold
                    if conf >= threshold:
                        if disease_name not in ("healthy", "unknown") and conf > confidence:
                            health_status = disease_name
                            confidence = conf
                            print(f"[DEBUG] Updated health_status to {disease_name} with confidence {conf:.4f}")
            
            if not detections:
                health_status = "healthy"
                confidence = 0.0
            elif health_status == "healthy":
                health_status = "healthy"
                confidence = max(max_conf_healthy, max_conf_any)
                # Keep boxes in live mode so frontend can draw what YOLO sees, even if final class is healthy.
                if not live_mode:
                    detections = []
                print(f"[DEBUG] No disease detections - marked as healthy")
            else:
                # Filter detections to only include ones above the active threshold.
                detections = [d for d in detections if d['confidence'] >= threshold]
            
            print(f"[DEBUG] Final result: health_status={health_status}, confidence={confidence:.4f}, detections={len(detections)}")
            
            return {
                "success": True,
                "health_status": health_status,
                "confidence": float(confidence),
                "detections": detections,
                "image_size": {
                    "width": image.shape[1],
                    "height": image.shape[0]
                }
            }
        
        except Exception as e:
            print(f"[ERROR] Detection error: {str(e)}")
            return {"error": str(e), "success": False}
    
    def get_recommendations(self, disease: str) -> List[str]:
        """Get treatment recommendations for a disease"""
        recommendations = {
            "healthy": ["Continue regular care", "Monitor for any changes"],
            "leaf_spot": [
                "Remove infected leaves",
                "Improve air circulation",
                "Reduce watering frequency"
            ],
            "rust": [
                "Isolate the plant",
                "Remove affected leaves",
                "Apply sulfur-based fungicide"
            ],
            "fungal_disease": [
                "Improve drainage",
                "Reduce humidity",
                "Remove infected parts",
                "Apply fungicide if severe"
            ],
            "bacterial_soft_rot": [
                "Remove affected leaves immediately",
                "Reduce watering",
                "Improve soil drainage",
                "Consider repotting in new soil"
            ]
        }
        return recommendations.get(disease, ["Monitor plant health"])



