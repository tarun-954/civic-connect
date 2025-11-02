"""
ML Service for Pothole Detection in Images
Uses a pre-trained model to detect and analyze potholes
"""

import os
import sys
import json
import cv2
import numpy as np
from PIL import Image
import requests
from io import BytesIO
import base64
import logging

# Configure logging
logging.basicConfig(level=logging.ERROR)  # Reduce logging to only errors
logger = logging.getLogger(__name__)

class PotholeDetector:
    """
    A simple pothole detection service that analyzes images
    for pothole characteristics
    """
    
    def __init__(self):
        self.detection_threshold = 0.6
        
    def detect_potholes(self, image_path):
        """
        Detect potholes in an image and return analysis results
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Analysis results with detection status, confidence, and recommendations
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return self._create_response(False, 0.0, "Failed to read image")
            
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Detect edges using Canny edge detection
            edges = cv2.Canny(blurred, 50, 150)
            
            # Find contours that might represent potholes
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Analyze contours for pothole-like characteristics
            potential_potholes = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 100:  # Filter small areas
                    # Calculate circularity (potholes are often circular/elliptical)
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter ** 2)
                        if circularity > 0.3:  # Potholes have moderate to high circularity
                            potential_potholes.append({
                                'area': area,
                                'circularity': circularity
                            })
            
            # Calculate confidence based on number and characteristics of detected regions
            num_detections = len(potential_potholes)
            
            if num_detections == 0:
                return self._create_response(False, 0.2, "No pothole-like features detected")
            
            # Calculate confidence score
            confidence = min(0.95, 0.3 + (num_detections * 0.15))
            
            # Determine severity based on area of detected regions
            total_area = sum(p['area'] for p in potential_potholes)
            severity = self._calculate_severity(total_area, img.shape[0] * img.shape[1])
            
            # Determine priority
            priority = self._determine_priority(confidence, severity, total_area)
            
            return {
                'detected': True,
                'confidence': round(confidence, 2),
                'severity': severity,
                'priority': priority,
                'num_detections': num_detections,
                'total_area': int(total_area),
                'recommendation': self._get_recommendation(priority, severity)
            }
            
        except Exception as e:
            logger.error(f"Error in pothole detection: {str(e)}")
            return self._create_response(False, 0.0, f"Error during analysis: {str(e)}")
    
    def _calculate_severity(self, total_area, image_area):
        """
        Calculate pothole severity based on area
        """
        coverage = (total_area / image_area) * 100
        
        if coverage < 2:
            return 'Low'
        elif coverage < 5:
            return 'Medium'
        elif coverage < 10:
            return 'High'
        else:
            return 'Critical'
    
    def _determine_priority(self, confidence, severity, total_area):
        """
        Determine priority based on detection results
        """
        # High confidence with Critical/High severity = Urgent
        if confidence > 0.7 and severity in ['Critical', 'High']:
            return 'Urgent'
        
        # High confidence with Medium severity = High priority
        if confidence > 0.7 and severity == 'Medium':
            return 'High'
        
        # Medium confidence with High/Critical = High priority
        if confidence > 0.5 and severity in ['High', 'Critical']:
            return 'High'
        
        # Medium confidence with Medium severity = Medium priority
        if confidence > 0.5 and severity == 'Medium':
            return 'Medium'
        
        # Low confidence or Low severity = Low priority
        if severity == 'Low' or confidence < 0.5:
            return 'Low'
        
        return 'Medium'
    
    def _get_recommendation(self, priority, severity):
        """
        Generate recommendation based on priority and severity
        """
        if priority == 'Urgent':
            return 'Immediate repair required. Multiple severe potholes detected.'
        elif priority == 'High':
            return 'High priority repair needed. Significant pothole damage detected.'
        elif priority == 'Medium':
            return 'Repair recommended. Moderate pothole damage detected.'
        else:
            return 'Low priority. Minor pothole damage detected.'
    
    def _create_response(self, detected, confidence, message):
        """
        Create a standardized response
        """
        return {
            'detected': detected,
            'confidence': confidence,
            'severity': 'N/A',
            'priority': 'Low',
            'num_detections': 0,
            'total_area': 0,
            'recommendation': message
        }


# Flask-like simple HTTP server function for integration
def analyze_image_for_potholes(image_path):
    """
    Analyze an image for potholes and return results
    
    Args:
        image_path: Path to the image file
        
    Returns:
        dict: Analysis results
    """
    detector = PotholeDetector()
    return detector.detect_potholes(image_path)


if __name__ == '__main__':
    # Handle command-line arguments
    if len(sys.argv) >= 3 and sys.argv[1] == '--analyze':
        image_path = sys.argv[2]
        
        if not os.path.exists(image_path):
            result = {
                'detected': False,
                'confidence': 0.0,
                'severity': 'Low',
                'priority': 'Low',
                'num_detections': 0,
                'total_area': 0,
                'recommendation': f'Image file not found: {image_path}'
            }
            print(json.dumps(result))
            sys.exit(1)
        
        try:
            detector = PotholeDetector()
            result = detector.detect_potholes(image_path)
            # Output JSON for Node.js to parse
            print(json.dumps(result))
        except Exception as e:
            result = {
                'detected': False,
                'confidence': 0.0,
                'severity': 'Low',
                'priority': 'Low',
                'num_detections': 0,
                'total_area': 0,
                'recommendation': f'Error during analysis: {str(e)}'
            }
            print(json.dumps(result))
            sys.exit(1)
    else:
        # Just initialize for testing
        detector = PotholeDetector()
        print("Pothole Detection Service initialized")


