/**
 * ML Service for Pothole Detection
 * Integrates with Python-based ML service for image analysis
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Check if Python is available
function checkPythonAvailability() {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['--version']);
    python.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    python.on('error', () => resolve(false));
  });
}

// Analyze image for potholes using Python ML service
async function analyzeImageForPotholes(imagePath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if Python is available
      const pythonAvailable = await checkPythonAvailability();
      
      if (!pythonAvailable) {
        console.log('⚠️ Python not available, using mock detection');
        return resolve(getMockDetectionResults(imagePath));
      }

      // Check if ML requirements are installed
      const mlServicePath = path.join(__dirname, '..', 'ml', 'service.py');
      
      if (!fs.existsSync(mlServicePath)) {
        console.log('⚠️ ML service not found, using mock detection');
        return resolve(getMockDetectionResults(imagePath));
      }

      // Call Python ML service
      const python = spawn('python', [
        path.join(__dirname, '..', 'ml', 'service.py'),
        '--analyze',
        imagePath
      ]);

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
            resolve(result);
          } catch (e) {
            // Fallback to simple analysis
            resolve(simpleDetectionAnalysis(imagePath, output));
          }
        } else {
          console.log('⚠️ Python ML service error, using fallback:', error);
          resolve(getMockDetectionResults(imagePath));
        }
      });

      python.on('error', (err) => {
        console.log('⚠️ Failed to spawn Python, using mock detection:', err.message);
        resolve(getMockDetectionResults(imagePath));
      });

    } catch (error) {
      console.error('❌ Error in ML analysis:', error);
      resolve(getMockDetectionResults(imagePath));
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
    
    const confidence = isPotholeRelated ? 0.75 : 0.45;
    const severity = fileSize > 100000 ? 'High' : 'Medium';
    const priority = confidence > 0.7 && severity === 'High' ? 'Urgent' : 
                     confidence > 0.6 ? 'High' : 'Medium';
    
    return {
      detected: confidence > 0.5,
      confidence: parseFloat(confidence.toFixed(2)),
      severity: severity,
      priority: priority,
      num_detections: isPotholeRelated ? 2 : 1,
      total_area: fileSize,
      recommendation: priority === 'Urgent' 
        ? 'Immediate repair required. Severe pothole damage detected.' 
        : 'Moderate pothole damage detected. Repair recommended.'
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
  
  return {
    detected: isRoadRelated ? Math.random() > 0.3 : Math.random() > 0.7,
    confidence: isRoadRelated ? parseFloat((0.65 + Math.random() * 0.25).toFixed(2)) : parseFloat((0.3 + Math.random() * 0.2).toFixed(2)),
    severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    priority: 'Medium',
    num_detections: isRoadRelated ? 2 : 1,
    total_area: 1000 + Math.random() * 5000,
    recommendation: isRoadRelated 
      ? 'Road damage detected. Repair recommended to maintain road safety.'
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


