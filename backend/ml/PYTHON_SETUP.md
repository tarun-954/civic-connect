# Python Setup for ML Service

## Problem
The ML service is currently using **MOCK data** because Python is not found in your system PATH. This means it's not using real ML detection.

## Solution: Install and Configure Python

### Step 1: Download Python

1. Go to [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Download Python 3.11 or newer (Windows installer, 64-bit)
3. **Important**: During installation, check the box **"Add Python to PATH"**
4. Click "Install Now"

### Step 2: Verify Installation

Open a **NEW** PowerShell/Command Prompt window and run:

```powershell
python --version
```

You should see something like: `Python 3.11.x`

If you see an error, try:

```powershell
py --version
```

### Step 3: Install Python Dependencies

Navigate to the ML service directory:

```powershell
cd backend\ml
```

Install required packages:

```powershell
python -m pip install -r requirements.txt
```

Or if `python` doesn't work:

```powershell
py -m pip install -r requirements.txt
```

### Step 4: Verify Python Dependencies

Test if OpenCV is installed:

```powershell
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
```

You should see: `OpenCV version: 4.x.x`

### Step 5: Test ML Service

Test the ML service with a sample image:

```powershell
python service.py
```

You should see: `Issue Detection Service initialized`

### Step 6: Restart Your Backend Server

After installing Python:
1. Stop your backend server (Ctrl+C)
2. Start it again: `npm start` or `node server.js`
3. Submit a report with an image
4. Check logs - you should now see: `✅ REAL ML Analysis (Python/OpenCV)`

## Troubleshooting

### Python Not Found After Installation

1. **Restart your terminal/PowerShell** (required after adding to PATH)
2. **Restart VS Code/IDE** (if using)
3. Check PATH manually:
   ```powershell
   $env:Path -split ';' | Select-String Python
   ```
4. If Python path is not shown, manually add it:
   - Search for "Environment Variables" in Windows
   - Add Python installation directory to PATH
   - Common locations:
     - `C:\Python3x\`
     - `C:\Users\YourName\AppData\Local\Programs\Python\Python3x\`
     - `C:\Program Files\Python3x\`

### "pip is not recognized"

Use:

```powershell
python -m pip install -r requirements.txt
```

Or:

```powershell
py -m pip install -r requirements.txt
```

### OpenCV Installation Fails

**For Python 3.14+ users**: If you get dependency errors installing `opencv-python`, use `opencv-python-headless` instead:

```powershell
python -m pip install opencv-python-headless
```

Or install with no-deps to avoid version conflicts:

```powershell
python -m pip install opencv-python-headless --no-deps
```

**Note**: `opencv-python-headless` works the same as `opencv-python` but without GUI support (which we don't need for backend image processing).

### Permission Errors

Install for current user only:

```powershell
python -m pip install --user -r requirements.txt
```

## Verify It's Working

After setup, when you submit a report, you should see in backend logs:

```
✅ Python found: python
🐍 Using Python command: python
🔬 Starting REAL ML Analysis (Python/OpenCV) for category: road...
✅ REAL ML Analysis (Python/OpenCV) completed successfully
```

If you still see:

```
⚠️ Python not available, using MOCK Node.js image analysis
```

Then Python is still not in PATH. Follow Step 1 again and make sure to check "Add Python to PATH".



