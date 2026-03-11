"""
FastAPI ML Service for YOLOv8 Disease Detection and Age Estimation
Main server for Aloe Vera plant analysis
"""

# ============================================================
# PyTorch 2.6+ FIX — must run BEFORE any ultralytics import
# ============================================================
import torch

try:
    import ultralytics.nn.tasks as _tasks
    import ultralytics.nn.modules.head as _head

    _safe_globals = []
    for _name in [
        "DetectionModel", "SegmentationModel", "PoseModel",
        "ClassificationModel", "WorldModel",
    ]:
        _cls = getattr(_tasks, _name, None)
        if _cls is not None:
            _safe_globals.append(_cls)

    for _name in ["Detect", "Segment", "Pose", "Classify", "OBB", "WorldDetect"]:
        _cls = getattr(_head, _name, None)
        if _cls is not None:
            _safe_globals.append(_cls)

    if _safe_globals:
        torch.serialization.add_safe_globals(_safe_globals)
        print(f"✅ PyTorch safe globals registered ({len(_safe_globals)} classes)")
except Exception as _e:
    print(f"⚠️  Safe globals registration skipped: {_e}")
# ============================================================

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import cv2
import numpy as np
import os
import tempfile
import io
from typing import Optional

from services.disease_detector import DiseaseDetector
from services.age_estimator import AgeEstimator

# Initialize models
disease_detector = None
age_estimator = None


def _normalize_label(value: str) -> str:
    return str(value or "").strip().lower().replace("-", "_").replace(" ", "_")


_PEST_LABELS = {
    "mealybug",
    "mealybugs",
    "mealy_bug",
    "mealy_bugs",
    "spider_mite",
    "spider_mites",
    "spidermite",
    "spidermites",
}


def _is_likely_aloe_image(
    image_bytes: bytes,
    allow_closeup_fallback: bool = True,
    disease_closeup_mode: bool = False
) -> bool:
    """
    Heuristic Aloe gate to reject obvious non-Aloe uploads (e.g., fruits/people).
    Uses green coverage + shape features extracted by age estimator.
    """
    feature_probe = age_estimator.extract_features_from_bytes(image_bytes)

    # Green coverage check (always computed; used as fallback for close-up diseased leaves).
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        return False
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    lower_green = np.array([20, 25, 20])
    upper_green = np.array([100, 255, 255])
    lower_red_1 = np.array([0, 60, 40])
    upper_red_1 = np.array([12, 255, 255])
    lower_red_2 = np.array([165, 60, 40])
    upper_red_2 = np.array([180, 255, 255])
    green_mask = cv2.inRange(hsv, lower_green, upper_green)
    red_mask = cv2.bitwise_or(
        cv2.inRange(hsv, lower_red_1, upper_red_1),
        cv2.inRange(hsv, lower_red_2, upper_red_2)
    )
    green_ratio = float(np.count_nonzero(green_mask)) / float(green_mask.size)
    red_ratio = float(np.count_nonzero(red_mask)) / float(red_mask.size)
    mean_saturation = float(np.mean(hsv[:, :, 1]))
    frame_area = float(green_mask.shape[0] * green_mask.shape[1])

    # Reject fruit-like frames where red dominates relative to green foreground.
    if not disease_closeup_mode:
        if red_ratio >= 0.10 and red_ratio > (green_ratio * 0.60):
            return False

    # Aloe-like images should have enough green coverage.
    if green_ratio < 0.08:
        return False

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(green_mask, connectivity=8)
    significant_components = 0
    largest_component_ratio = 0.0
    largest_component_bbox_ratio = 0.0
    min_component_area = frame_area * 0.002
    for idx in range(1, num_labels):
        area = float(stats[idx, cv2.CC_STAT_AREA])
        if area >= min_component_area:
            significant_components += 1
            area_ratio = area / frame_area
            if area_ratio >= largest_component_ratio:
                largest_component_ratio = area_ratio
                width = float(stats[idx, cv2.CC_STAT_WIDTH] or 0)
                height = float(stats[idx, cv2.CC_STAT_HEIGHT] or 0)
                if width > 0 and height > 0:
                    ratio = width / height
                    largest_component_bbox_ratio = ratio if ratio >= 1 else (1 / ratio)
                else:
                    largest_component_bbox_ratio = 0.0

    has_leaf_axis_profile = largest_component_bbox_ratio >= 1.6

    # Fallback path: close-up disease/pest shots may fail feature extraction but still be Aloe leaves.
    if feature_probe.get("error"):
        if not allow_closeup_fallback:
            return (
                green_ratio >= 0.18 and
                mean_saturation >= 45.0 and
                red_ratio <= 0.08 and
                significant_components <= 8 and
                largest_component_ratio >= 0.12
            )
        return (
            green_ratio >= 0.20 and
            mean_saturation >= 45.0 and
            largest_component_ratio >= 0.06 and
            (red_ratio <= 0.10 or (has_leaf_axis_profile and largest_component_ratio >= 0.10))
        )

    # Basic morphology from extracted features.
    leaf_count = int(feature_probe.get("leaf_count", 0) or 0)
    aspect_ratio = float(feature_probe.get("aspect_ratio", 0) or 0)
    leaf_length_cm = float(feature_probe.get("leaf_length_cm", 0) or 0)
    plant_area = float(feature_probe.get("plant_area", 0) or 0)

    strict_signals = 0
    if leaf_count >= 1:
        strict_signals += 1
    if leaf_length_cm >= 2.2:
        strict_signals += 1
    if aspect_ratio >= 0.95:
        strict_signals += 1
    if plant_area >= 6500:
        strict_signals += 1
    if largest_component_ratio >= 0.06:
        strict_signals += 1

    aloe_leaf_profile = leaf_count >= 1 and leaf_length_cm >= 2.2 and aspect_ratio >= 0.95
    spiky_cluster_profile = largest_component_ratio >= 0.06 and significant_components <= 12 and aspect_ratio >= 0.9
    has_strict_aloe_shape = strict_signals >= 3 and (aloe_leaf_profile or spiky_cluster_profile)

    has_leaf_like_shape = aspect_ratio >= 0.75 and leaf_length_cm >= 1.5
    has_enough_plant_pixels = plant_area >= 8000
    has_min_leaf_signal = leaf_count >= 1
    has_green_closeup_signal = green_ratio >= 0.18 and mean_saturation >= 45.0

    if allow_closeup_fallback:
        relaxed_signals = 0
        if has_leaf_like_shape:
            relaxed_signals += 1
        if has_enough_plant_pixels:
            relaxed_signals += 1
        if has_min_leaf_signal:
            relaxed_signals += 1
        if has_green_closeup_signal:
            relaxed_signals += 1
        if relaxed_signals < 2:
            return False
        if red_ratio > 0.10 and not disease_closeup_mode:
            if not (has_leaf_axis_profile and largest_component_ratio >= 0.10 and green_ratio >= 0.12):
                return False
        min_component_ratio = 0.02 if disease_closeup_mode else 0.04
        if largest_component_ratio < min_component_ratio:
            return False
    else:
        if not has_strict_aloe_shape:
            return False
        if green_ratio < 0.12:
            return False
        if red_ratio > 0.12:
            return False

    if not allow_closeup_fallback and not has_strict_aloe_shape:
        return False

    return True


def _has_confident_disease_signal(disease_result: dict) -> bool:
    """
    True when detector sees a reasonably confident disease/pest signal.
    """
    if not isinstance(disease_result, dict):
        return False

    health_status = str(disease_result.get("health_status", "")).strip().lower()
    if health_status in ("", "healthy", "unknown"):
        return False

    detections = disease_result.get("detections", [])
    if not isinstance(detections, list) or len(detections) == 0:
        return False

    max_conf = 0.0
    for det in detections:
        try:
            conf = float(det.get("confidence", 0) or 0)
        except Exception:
            conf = 0.0
        if conf > max_conf:
            max_conf = conf

    return max_conf >= 0.55


def _has_confident_pest_signal(disease_result: dict, min_conf: float = 0.35) -> bool:
    """
    True when detector sees a confident mealybug/spider_mite class.
    """
    if not isinstance(disease_result, dict):
        return False

    detections = disease_result.get("detections", [])
    if not isinstance(detections, list) or len(detections) == 0:
        return False

    for det in detections:
        label = _normalize_label(det.get("disease", ""))
        if label not in _PEST_LABELS:
            continue
        try:
            conf = float(det.get("confidence", 0) or 0)
        except Exception:
            conf = 0.0
        if conf >= min_conf:
            return True

    return False


def init_models():
    """Initialize ML models on startup"""
    global disease_detector, age_estimator
    
    try:
        disease_detector = DiseaseDetector(model_path='models/AV5.pt')
        print("✅ Disease Detector loaded")
    except Exception as e:
        print(f"❌ Error loading Disease Detector: {e}")
        disease_detector = None
    
    try:
        age_estimator = AgeEstimator(model_path='models/ageV3.pt')
        print("✅ Age Estimator loaded")
    except Exception as e:
        print(f"❌ Error loading Age Estimator: {e}")
        age_estimator = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize models on app startup."""
    init_models()
    print("ML Service started")
    yield


# Initialize FastAPI app
app = FastAPI(
    title="Aloe Vera ML Service",
    description="YOLOv8 Disease Detection + Age Estimation",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "disease_detector": "ready" if disease_detector else "not_ready",
            "age_estimator": "ready" if age_estimator else "not_ready"
        }
    }


@app.post("/scan")
async def scan_plant(file: UploadFile = File(...)):
    """
    Complete plant scan: disease detection + age estimation
    """
    if not disease_detector or not age_estimator:
        raise HTTPException(status_code=503, detail="ML models not ready")
    
    try:
        contents = await file.read()
        print(f"[AGE DEBUG] /scan received file={file.filename} bytes={len(contents)}")
        
        # Disease detection
        disease_result = disease_detector.detect_from_bytes(contents)
        if not disease_result.get("success"):
            raise HTTPException(status_code=400, detail=disease_result.get("error"))

        # Validate Aloe for every scan request.
        strict_aloe = _is_likely_aloe_image(contents, allow_closeup_fallback=False)
        relaxed_aloe = _is_likely_aloe_image(contents, allow_closeup_fallback=True)
        disease_closeup_ok = _has_confident_disease_signal(disease_result) and _is_likely_aloe_image(
            contents,
            allow_closeup_fallback=True,
            disease_closeup_mode=True
        )
        pest_closeup_ok = _has_confident_pest_signal(disease_result) and _is_likely_aloe_image(
            contents,
            allow_closeup_fallback=True,
            disease_closeup_mode=True
        )
        health_status = str(disease_result.get("health_status", "")).strip().lower()

        if health_status == "healthy":
            if not (strict_aloe or relaxed_aloe):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid image: Aloe Vera plant not detected. Please upload a clear Aloe Vera photo."
                )
        elif not strict_aloe and not relaxed_aloe and not disease_closeup_ok and not pest_closeup_ok:
            raise HTTPException(
                status_code=400,
                detail="Invalid image: Aloe Vera plant not detected. Please upload a clear Aloe Vera photo."
            )
        
        # Age estimation
        age_result = age_estimator.estimate_age_from_bytes(contents)
        print(f"[AGE DEBUG] raw age_result: {age_result}")
        if not age_result.get("success"):
            print(f"[AGE DEBUG] age estimation failed: {age_result.get('error', 'unknown error')}")
            age_result = {
                "success": False,
                "error": age_result.get("error", "Age estimation failed")
            }
        else:
            age_months = age_result.get("age_months")
            if age_months is None:
                print("[AGE DEBUG] age_months is None (no valid estimate)")
            elif age_months <= 0:
                print(f"[AGE DEBUG] age_months is non-positive: {age_months}")
            print(
                "[AGE DEBUG] final age estimation -> "
                f"age_months={age_months}, "
                f"age_formatted={age_result.get('age_formatted')}, "
                f"confidence={age_result.get('confidence')}, "
                f"features={age_result.get('features_used')}"
            )
        
        # Get recommendations
        disease = disease_result.get("health_status", "unknown")
        recommendations = disease_detector.get_recommendations(disease)
        
        # Combine results
        scan_result = {
            "success": True,
            "scan_data": {
                "plant": "Aloe Vera",
                "health_status": disease_result.get("health_status"),
                "disease_confidence": disease_result.get("confidence"),
                "detected_diseases": disease_result.get("detections", []),
                "age_estimation": {
                    "age_months": age_result.get("age_months"),
                    "age_formatted": age_result.get("age_formatted"),
                    "confidence": age_result.get("confidence")
                } if age_result.get("success") else None,
                "recommendations": recommendations,
                "image_analysis": {
                    "image_size": disease_result.get("image_size"),
                    "features": age_result.get("features_used")
                }
            }
        }
        
        return scan_result
    
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e), "success": False}
        )


@app.post("/detect-disease")
async def detect_disease(
    file: UploadFile = File(...),
    live: bool = Query(False, description="Enable live preview detection mode with lower threshold")
):
    """
    Detect disease in plant image
    """
    if not disease_detector:
        raise HTTPException(status_code=503, detail="Disease detector not ready")
    
    try:
        contents = await file.read()
        result = disease_detector.detect_from_bytes(contents, live_mode=live)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        disease = result.get("health_status")
        recommendations = disease_detector.get_recommendations(disease)
        result["recommendations"] = recommendations
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e), "success": False}
        )


@app.post("/estimate-age")
async def estimate_age(file: UploadFile = File(...)):
    """
    Estimate plant age from image
    """
    if not age_estimator:
        raise HTTPException(status_code=503, detail="Age estimator not ready")
    
    try:
        contents = await file.read()
        result = age_estimator.estimate_age_from_bytes(contents)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e), "success": False}
        )


@app.get("/recommendations/{disease}")
async def get_recommendations(disease: str):
    """
    Get treatment recommendations for a disease
    """
    if not disease_detector:
        raise HTTPException(status_code=503, detail="Disease detector not ready")
    
    recommendations = disease_detector.get_recommendations(disease)
    return {
        "disease": disease,
        "recommendations": recommendations
    }


@app.get("/info")
async def service_info():
    """Get service information"""
    return {
        "service": "Aloe Vera ML Analysis",
        "version": "1.0.0",
        "models": {
            "disease_detection": {
                "framework": "YOLOv8",
                "status": "ready" if disease_detector else "not_ready"
            },
            "age_estimation": {
                "framework": "Feature-based + ML",
                "status": "ready" if age_estimator else "not_ready"
            }
        },
        "endpoints": {
            "POST /scan": "Complete scan (disease + age)",
            "POST /detect-disease": "Disease detection only",
            "POST /estimate-age": "Age estimation only",
            "GET /recommendations/{disease}": "Get disease recommendations",
            "GET /health": "Health check",
            "GET /info": "Service info"
        }
    }


if __name__ == "__main__":
    import uvicorn
    service_port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=service_port,
        reload=False
    )