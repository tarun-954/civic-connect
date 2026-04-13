from fastapi import FastAPI, File, UploadFile, Form
from ultralytics import YOLO
import shutil
import uuid
import os
import cv2

app = FastAPI(title="Civic Connect YOLO ML Service")

# Model setup
# - For production, you should point `YOLO_MODEL_PATH` to your custom trained weights
#   that include classes like `pothole`, `dustbin`, etc.
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolo11n.pt")
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.5"))
SAVE_ANNOTATED_IMAGES = os.getenv("SAVE_ANNOTATED_IMAGES", "false").strip().lower() in ("1", "true", "yes")

ALLOWED_LABELS = os.getenv("ALLOWED_LABELS")  # optional, comma-separated

MODEL_FALLBACK_PATH = os.getenv("YOLO_MODEL_FALLBACK_PATH", "yolov8n.pt")

MODEL_USED_PATH = YOLO_MODEL_PATH
try:
    model = YOLO(YOLO_MODEL_PATH)
except Exception:
    # Keep service alive even if a "latest model" weight isn't available in the environment.
    MODEL_USED_PATH = MODEL_FALLBACK_PATH
    model = YOLO(MODEL_FALLBACK_PATH)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def label_matches_alias(label: str, alias: str) -> bool:
    # Substring match so `dustbin` matches `dustbin/garbage` model names, etc.
    return alias.lower() in (label or "").lower()


def get_allowed_labels_for_category(category):
    if not category:
        return None

    c = category.lower()
    category_aliases = {
        "road": ["pothole"],
        "pothole": ["pothole"],
        "garbage": ["dustbin", "garbage", "trash"],
        "dustbin": ["dustbin"],
        "waste": ["dustbin", "garbage", "trash"],
        "water": ["waterlogging", "drainage", "flood"],
        "construction": ["construction"],
        "streetlight": ["streetlight", "light"],
        "light": ["streetlight", "light"],
    }

    for key, aliases in category_aliases.items():
        if key in c:
            return aliases
    return None


def generate_complaint(issue, priority, location):
    return f"""Civic Issue Report

Issue Type: {issue}
Priority: {priority}
Location: {location}

Description:
This issue has been automatically detected using AI. Immediate attention is recommended.

Please take necessary action.

- Civic Connect System"""


def calculate_severity_and_priority(total_issues):
    if total_issues == 0:
        return "Low", "Low"
    if total_issues <= 2:
        return "Medium", "Medium"
    if total_issues <= 5:
        return "High", "High"
    return "Critical", "Urgent"


@app.get("/health")
async def health():
    return {
        "ok": True,
        "service": "ml_service",
        "model_path": MODEL_USED_PATH,
        "conf_threshold": CONF_THRESHOLD,
        "save_annotated_images": SAVE_ANNOTATED_IMAGES,
        "model_labels": getattr(model, "names", None),
    }


@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    latitude: float = Form(None),
    longitude: float = Form(None),
    category: str = Form(None)
):
    try:
        filename = f"{uuid.uuid4()}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model.predict(filepath, conf=CONF_THRESHOLD)
        detections = []

        # Only needed if we want to return an annotated debug image.
        image = None
        if SAVE_ANNOTATED_IMAGES:
            image = cv2.imread(filepath)
            if image is None:
                return {"success": False, "error": "Invalid image file"}

        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0])
                if conf < CONF_THRESHOLD:
                    continue

                cls_id = int(box.cls[0])
                label = model.names.get(cls_id, str(cls_id))
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                detections.append({
                    "type": label,
                    "confidence": round(conf, 2),
                    "bbox": [x1, y1, x2, y2]
                })

                if SAVE_ANNOTATED_IMAGES and image is not None:
                    cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        image,
                        f"{label} {conf:.2f}",
                        (x1, max(y1 - 10, 10)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 255, 0),
                        2
                    )

        # Sort so "main issue" is the most confident detection.
        detections.sort(key=lambda d: d.get("confidence", 0), reverse=True)

        # Optional filtering (useful when the model has many generic labels).
        # If filtering removes everything, we keep original detections.
        filtered_detections = detections
        allowed_from_env = None
        if ALLOWED_LABELS:
            allowed_from_env = [x.strip() for x in ALLOWED_LABELS.split(",") if x.strip()]

        allowed_from_category = get_allowed_labels_for_category(category)
        allowed_labels = allowed_from_env or allowed_from_category
        if allowed_labels:
            filtered_detections = [
                d for d in detections
                if any(label_matches_alias(d.get("type", ""), alias) for alias in allowed_labels)
            ]
            if filtered_detections:
                detections = filtered_detections

        output_path = None
        if SAVE_ANNOTATED_IMAGES and image is not None:
            output_path = os.path.join(OUTPUT_DIR, filename)
            cv2.imwrite(output_path, image)

        total_issues = len(detections)
        severity, priority = calculate_severity_and_priority(total_issues)

        location_text = (
            f"{latitude}, {longitude}"
            if latitude is not None and longitude is not None
            else "Location not provided"
        )
        main_issue = detections[0]["type"] if detections else (category or "No Issue")
        complaint_text = generate_complaint(main_issue, priority, location_text)

        return {
            "success": True,
            "detected": total_issues > 0,
            "total_issues": total_issues,
            "issues": detections,
            "severity": severity,
            "priority": priority,
            "location": {
                "latitude": latitude,
                "longitude": longitude
            },
            "annotated_image": output_path,
            "complaint": complaint_text
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}
