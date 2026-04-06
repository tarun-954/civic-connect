from fastapi import FastAPI, File, UploadFile, Form
from ultralytics import YOLO
import shutil
import uuid
import os
import cv2

app = FastAPI(title="Civic Connect YOLO ML Service")

# Load pretrained model (replace with custom trained model file in production).
model = YOLO("yolov8n.pt")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

CLASS_NAMES = {
    0: "pothole",
    1: "garbage",
    2: "waterlogging",
    3: "construction",
    4: "streetlight_issue"
}


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
    return {"ok": True, "service": "ml_service", "model": "yolov8n.pt"}


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

        image = cv2.imread(filepath)
        if image is None:
            return {"success": False, "error": "Invalid image file"}

        results = model(filepath)
        detections = []

        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0])
                if conf < 0.5:
                    continue

                cls_id = int(box.cls[0])
                label = CLASS_NAMES.get(cls_id, "unknown")
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                detections.append({
                    "type": label,
                    "confidence": round(conf, 2),
                    "bbox": [x1, y1, x2, y2]
                })

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
