# ML Civic Issue Detection Service

This directory contains the ML service for detecting various civic issues (potholes, garbage, construction, etc.) in images.

## ⚠️ IMPORTANT: Setup Required

**If you see "Python not available, using MOCK Node.js image analysis"** in your logs, you need to set up Python. See [PYTHON_SETUP.md](./PYTHON_SETUP.md) for detailed instructions.

## How It Works

### Real ML Detection (Python + OpenCV CLI)
The local CLI analyzer (`service.py`) uses Python with OpenCV to:
- Analyze images using computer vision techniques
- Detect potholes using edge detection and contour analysis
- Calculate confidence scores based on actual image analysis
- Determine severity and priority based on detected features

### Production ML API (FastAPI + YOLO)
You can now run a dedicated ML HTTP service using `ml_service.py`:
- Endpoint: `POST /detect`
- Framework: FastAPI
- Model: YOLO (`ultralytics`)
- Returns enriched payload: `issues`, `severity`, `priority`, `location`, `annotated_image`, `complaint`

When backend env var `ML_SERVICE_URL` is set (example: `http://127.0.0.1:8000`), Node backend will call this API first and automatically fall back to CLI/local analysis if unavailable.

### Mock/Demo Detection (Node.js Fallback)
If Python is not available or fails, the system falls back to a **mock/demo** analyzer that:
- Only uses file size and filename to guess
- Provides fake confidence scores (NOT real detection)
- Should NOT be used for production

## Setup Instructions

### Step 1: Install Python
Make sure Python 3.7+ is installed and accessible from command line:
- Check with: `python --version` or `py --version`
- If not found, install from [python.org](https://www.python.org/downloads/)
- Make sure to add Python to your PATH during installation

### Step 2: Install Python Dependencies
Navigate to this directory and install required packages:

```bash
cd backend/ml
pip install -r requirements.txt
```

Or using pip3:
```bash
pip3 install -r requirements.txt
```

Required packages:
- `opencv-python-headless` - For image processing and computer vision (headless version works better with newer Python versions)
- `numpy` - For numerical operations
- `Pillow` - For image handling
- `requests` - For HTTP requests (if needed)
- `fastapi` - ML API framework
- `uvicorn` - ASGI server for FastAPI
- `python-multipart` - Multipart file upload support
- `ultralytics` - YOLO model runtime

**Note for Python 3.14+**: If `opencv-python` installation fails, use `opencv-python-headless` instead.

### Step 3: Verify Installation
Test if everything works:

```bash
python backend/ml/service.py
```

You should see: "Issue Detection Service initialized"

### Step 4: Test with an Image
```bash
python backend/ml/service.py --analyze path/to/your/image.jpg
```

This should output JSON with detection results.

### Step 5: Run FastAPI + YOLO Service (Production Path)
From `backend` directory:

```bash
npm run ml:serve
```

Or directly:

```bash
uvicorn ml.ml_service:app --host 0.0.0.0 --port 8000
```

Then set backend env var:

```bash
ML_SERVICE_URL=http://127.0.0.1:8000
```

## How to Know Which Analyzer is Running

Check your backend server logs:

- **✅ REAL ML Analysis**: You'll see:
  - `✅ Remote ML service analysis completed via http://.../detect` (when `ML_SERVICE_URL` is set and service is reachable)
  - or
  - `🐍 Using Python command: python`
  - `🔬 Starting REAL ML Analysis (Python/OpenCV)...`
  - `✅ REAL ML Analysis (Python/OpenCV) completed successfully`

- **⚠️ MOCK Analysis**: You'll see:
  - `⚠️ Python not available, using MOCK Node.js image analysis`
  - `⚠️ Note: This is NOT real ML detection - just file size based guessing`

## Troubleshooting

### Python Not Found
- Make sure Python is in your PATH
- Try using `python3` instead of `python`
- On Windows, try `py` or `py -3`

### OpenCV Import Error
- Install OpenCV: `pip install opencv-python`
- If you get import errors, try: `pip install opencv-python-headless`

### NumPy Import Error
- Install NumPy: `pip install numpy`

### Permission Errors
- Use `pip install --user -r requirements.txt` to install for current user only

## Notes

- The Python ML service uses **real** computer vision techniques (OpenCV)
- It analyzes actual image features (edges, contours, circularity)
- Confidence scores are based on detected image characteristics
- This is the **recommended** method for production use

