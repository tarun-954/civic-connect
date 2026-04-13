/**
 * ML Service for Pothole Detection
 * Integrates with Python-based ML service for image analysis
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { analyzeImage: nodeAnalyzeImage } = require('../ml/simpleAnalyzer');

// Check if Python is available
function checkPythonAvailability() {
  return new Promise((resolve, reject) => {
    // Try different Python commands
    const pythonCommands = ['python', 'python3', 'py', 'py -3'];
    let attempts = 0;
    
    function tryNext() {
      if (attempts >= pythonCommands.length) {
        resolve(false);
        return;
      }
      
      const command = pythonCommands[attempts].split(' ');
      const python = spawn(command[0], command.slice(1).concat(['--version']));
      
      python.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Python found: ${pythonCommands[attempts]}`);
          resolve(true);
        } else {
          attempts++;
          tryNext();
        }
      });
      
      python.on('error', () => {
        attempts++;
        tryNext();
      });
    }
    
    tryNext();
  });
}

function generateComplaint(issue, priority, locationText) {
  return [
    'Civic Issue Report',
    '',
    `Issue Type: ${issue}`,
    `Priority: ${priority}`,
    `Location: ${locationText}`,
    '',
    'Description:',
    'This issue has been automatically detected using AI. Immediate attention is recommended.',
    '',
    'Please take necessary action.',
    '',
    '- Civic Connect System'
  ].join('\n');
}

function normalizeMlResult(rawResult, imagePath, category, options = {}) {
  const location = {
    latitude: options.latitude ?? null,
    longitude: options.longitude ?? null
  };
  const hasLocation = location.latitude !== null && location.longitude !== null;
  const locationText = hasLocation
    ? `${location.latitude}, ${location.longitude}`
    : 'Location not provided';

  const detected = !!rawResult?.detected;
  const totalIssues = Number.isFinite(rawResult?.total_issues)
    ? rawResult.total_issues
    : Number.isFinite(rawResult?.num_detections)
      ? rawResult.num_detections
      : (detected ? 1 : 0);

  const normalizedIssues = Array.isArray(rawResult?.issues)
    ? rawResult.issues.map((issue) => ({
        type: issue?.type || rawResult?.issueType || category || 'unknown',
        confidence: Number(issue?.confidence ?? rawResult?.confidence ?? 0),
        bbox: Array.isArray(issue?.bbox) ? issue.bbox : null
      }))
    : (detected
      ? [{
          type: rawResult?.issueType || category || 'unknown',
          confidence: Number(rawResult?.confidence ?? 0),
          bbox: null
        }]
      : []);

  const issueType = rawResult?.issueType || normalizedIssues?.[0]?.type || category || 'Issue';
  const priority = rawResult?.priority || (detected ? 'Medium' : 'Low');
  const severity = rawResult?.severity || (detected ? 'Medium' : 'Low');
  const complaint = rawResult?.complaint || generateComplaint(issueType, priority, locationText);

  return {
    // Legacy fields used by existing backend flow
    detected,
    issueType,
    confidence: Number(rawResult?.confidence ?? normalizedIssues?.[0]?.confidence ?? 0),
    severity,
    priority,
    num_detections: Number.isFinite(rawResult?.num_detections) ? rawResult.num_detections : totalIssues,
    total_area: Number.isFinite(rawResult?.total_area) ? rawResult.total_area : 0,
    recommendation: rawResult?.recommendation || rawResult?.complaint || (detected
      ? `Potential ${issueType} issue detected.`
      : `No significant ${issueType} issue detected.`),

    // New enriched payload shape
    success: rawResult?.success ?? true,
    total_issues: totalIssues,
    issues: normalizedIssues,
    location,
    annotated_image: rawResult?.annotated_image || null,
    complaint
  };
}

async function analyzeWithRemoteService(imagePath, category, options = {}) {
  const baseUrl = process.env.ML_SERVICE_URL;
  if (!baseUrl) {
    return null;
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/detect`;
  const fileBuffer = fs.readFileSync(imagePath);
  const form = new FormData();
  form.append('file', new Blob([fileBuffer]), path.basename(imagePath));
  form.append('category', category || 'road');

  if (options.latitude !== null && options.latitude !== undefined) {
    form.append('latitude', String(options.latitude));
  }
  if (options.longitude !== null && options.longitude !== undefined) {
    form.append('longitude', String(options.longitude));
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    const response = await fetch(endpoint, {
      method: 'POST',
      body: form,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const responseData = await response.json();

    console.log(`✅ Remote ML service analysis completed via ${endpoint}`);
    return normalizeMlResult(responseData, imagePath, category, options);
  } catch (error) {
    console.log(`⚠️ Remote ML service failed (${endpoint}), falling back to local CLI analysis`);
    const details = error?.response?.data || error?.message;
    if (details) {
      console.log('⚠️ Remote ML error details:', details);
    }
    return null;
  }
}

// Analyze image for issues using Python ML service
async function analyzeImageForPotholes(imagePath, category = 'road', options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Prefer remote FastAPI ML service when configured.
      const remoteResult = await analyzeWithRemoteService(imagePath, category, options);
      if (remoteResult) {
        return resolve(remoteResult);
      }

      // Check if Python is available
      const pythonAvailable = await checkPythonAvailability();
      
      if (!pythonAvailable) {
        console.log('⚠️ Python not available, using MOCK Node.js image analysis');
        console.log('⚠️ Note: This is NOT real ML detection - just file size based guessing');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ PYTHON NOT FOUND - REAL ML DETECTION NOT AVAILABLE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('To enable REAL ML detection, you need to:');
        console.log('');
        console.log('1. Install Python 3.11+ from https://www.python.org/downloads/');
        console.log('   ⚠️ IMPORTANT: Check "Add Python to PATH" during installation');
        console.log('');
        console.log('2. Install Python dependencies:');
        console.log('   cd backend\\ml');
        console.log('   python -m pip install -r requirements.txt');
        console.log('');
        console.log('3. Restart your backend server');
        console.log('');
        console.log('4. For detailed instructions, see: backend/ml/PYTHON_SETUP.md');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        const result = nodeAnalyzeImage(imagePath);
        return resolve(normalizeMlResult(result, imagePath, category, options));
      }

      // Check if ML requirements are installed
      const mlServicePath = path.join(__dirname, '..', 'ml', 'service.py');
      
      if (!fs.existsSync(mlServicePath)) {
        console.log('⚠️ ML service file (service.py) not found at:', mlServicePath);
        console.log('⚠️ Using MOCK Node.js image analysis');
        console.log('⚠️ Note: This is NOT real ML detection - just file size based guessing');
        const result = nodeAnalyzeImage(imagePath);
        return resolve(normalizeMlResult(result, imagePath, category, options));
      }

      // Try different Python commands
      const pythonCommands = ['python', 'python3', 'py', 'py -3'];
      let pythonCommand = 'python';
      
      // Find working Python command
      for (const cmd of pythonCommands) {
        try {
          const testCmd = spawn(cmd.split(' ')[0], cmd.split(' ').slice(1).concat(['--version']));
          await new Promise((resolve, reject) => {
            testCmd.on('close', (code) => {
              if (code === 0) {
                pythonCommand = cmd;
                resolve();
              } else {
                reject();
              }
            });
            testCmd.on('error', reject);
          });
          break;
        } catch (e) {
          continue;
        }
      }
      
      console.log(`🐍 Using Python command: ${pythonCommand}`);
      console.log(`🔬 Starting REAL ML Analysis (Python/OpenCV) for category: ${category}...`);
      
      // Call Python ML service with category parameter
      const command = pythonCommand.split(' ');
      const python = spawn(command[0], command.slice(1).concat([
        path.join(__dirname, '..', 'ml', 'service.py'),
        '--analyze',
        imagePath,
        '--category',
        category
      ]));

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to parse JSON output if available
            const result = JSON.parse(output);
            console.log('✅ REAL ML Analysis (Python/OpenCV) completed successfully');
            resolve(normalizeMlResult(result, imagePath, category, options));
          } catch (e) {
            console.log('⚠️ Failed to parse Python output, using fallback analysis');
            // Fallback to simple analysis
            resolve(normalizeMlResult(simpleDetectionAnalysis(imagePath, output), imagePath, category, options));
          }
        } else {
          console.log('⚠️ Python ML service error, using MOCK Node.js analysis:', error);
          console.log('⚠️ Note: This is NOT real ML detection - just file size based guessing');
          const result = nodeAnalyzeImage(imagePath);
          resolve(normalizeMlResult(result, imagePath, category, options));
        }
      });

      python.on('error', (err) => {
        console.log('⚠️ Failed to spawn Python, using MOCK Node.js analysis:', err.message);
        console.log('⚠️ Note: This is NOT real ML detection - just file size based guessing');
        const result = nodeAnalyzeImage(imagePath);
        resolve(normalizeMlResult(result, imagePath, category, options));
      });

    } catch (error) {
      console.error('❌ Error in ML analysis:', error);
      console.log('⚠️ Using MOCK Node.js analysis as fallback');
      console.log('⚠️ Note: This is NOT real ML detection - just file size based guessing');
      const result = nodeAnalyzeImage(imagePath);
      resolve(normalizeMlResult(result, imagePath, category, options));
    }
  });
}

// Simple image analysis fallback
function simpleDetectionAnalysis(imagePath, pythonOutput) {
  // This is a fallback that provides basic detection
  // In production, this would be replaced with actual ML results
  
  try {
    const fs = require('fs');
    const stats = fs.statSync(imagePath);
    const fileSize = stats.size;
    
    // Mock detection based on file size and name
    const isPotholeRelated = imagePath.toLowerCase().includes('pothole') || 
                             imagePath.toLowerCase().includes('road');
    
    // Generate consistent confidence based on file characteristics
    const baseConfidence = isPotholeRelated ? 0.7 : 0.3;
    const sizeFactor = Math.min(fileSize / 200000, 1); // Normalize file size
    const confidence = Math.min(baseConfidence + (sizeFactor * 0.2), 0.95);
    
    const detected = confidence > 0.5;
    const severity = detected ? 
      (confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low') : 
      'Low';
    const priority = detected ? 
      (confidence > 0.8 ? 'Urgent' : confidence > 0.6 ? 'High' : 'Medium') : 
      'Low';
    
    return {
      detected: detected,
      confidence: parseFloat(confidence.toFixed(2)),
      severity: severity,
      priority: priority,
      num_detections: detected ? (isPotholeRelated ? 2 : 1) : 0,
      total_area: detected ? fileSize : 0,
      recommendation: detected 
        ? (confidence > 0.8 ? 'Severe pothole damage detected. Immediate repair required.' :
           confidence > 0.6 ? 'Moderate pothole damage detected. Repair recommended.' :
           'Minor pothole damage detected. Monitor and repair when convenient.')
        : 'Image analysis complete. No significant pothole damage detected.'
    };
  } catch (error) {
    return getMockDetectionResults(imagePath);
  }
}

// Mock detection results for testing
function getMockDetectionResults(imagePath) {
  // This provides mock results for demonstration
  // In production, this would be replaced with actual ML results
  
  const imageName = path.basename(imagePath);
  const isRoadRelated = imageName.includes('road') || 
                        imageName.includes('street') || 
                        imageName.includes('pothole');
  
  // Generate consistent results
  const randomValue = Math.random();
  const confidence = isRoadRelated ? 
    parseFloat((0.65 + randomValue * 0.25).toFixed(2)) : // 0.65-0.90 for road images
    parseFloat((0.2 + randomValue * 0.3).toFixed(2));    // 0.20-0.50 for non-road images
  
  const detected = confidence > 0.5; // Consistent with confidence threshold
  
  const severity = detected ? 
    (confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low') : 
    'Low';
    
  const priority = detected ? 
    (confidence > 0.8 ? 'Urgent' : confidence > 0.6 ? 'High' : 'Medium') : 
    'Low';
  
  return {
    detected: detected,
    confidence: confidence,
    severity: severity,
    priority: priority,
    num_detections: detected ? (isRoadRelated ? 2 : 1) : 0,
    total_area: detected ? (1000 + Math.random() * 5000) : 0,
    recommendation: detected 
      ? (confidence > 0.8 ? 'Severe pothole damage detected. Immediate repair required.' :
         confidence > 0.6 ? 'Moderate pothole damage detected. Repair recommended.' :
         'Minor pothole damage detected. Monitor and repair when convenient.')
      : 'Image analysis complete. No significant pothole damage detected.'
  };
}

/**
 * Determine priority based on ML detection results
 */
function determinePriorityFromML(mlResults) {
  if (!mlResults || !mlResults.detected) {
    return 'Low';
  }
  
  return mlResults.priority || 'Medium';
}

/**
 * Determine severity based on ML detection results
 */
function determineSeverityFromML(mlResults) {
  if (!mlResults || !mlResults.detected) {
    return 'Low';
  }
  
  return mlResults.severity || 'Medium';
}

module.exports = {
  analyzeImageForPotholes,
  determinePriorityFromML,
  determineSeverityFromML
};


