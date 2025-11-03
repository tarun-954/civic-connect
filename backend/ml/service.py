"""
ML Service for Civic Issue Detection in Images
Detects various civic issues like potholes, garbage/dustbins, construction, etc.
Uses computer vision techniques to analyze images
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

class IssueDetector:
    """
    A general issue detection service that analyzes images
    for various civic issues based on category
    """
    
    def __init__(self, category='road'):
        self.category = category.lower()
        self.detection_threshold = 0.6
    
    def detect_issue(self, image_path):
        """
        Detect issues in an image based on category
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Analysis results with detection status, confidence, and recommendations
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return self._create_response(False, 0.0, "Failed to read image", self.category.title())
            
            # Route to appropriate detector based on category
            if 'road' in self.category or 'pothole' in self.category:
                return self._detect_potholes(img, image_path)
            elif 'garbage' in self.category or 'waste' in self.category or 'dustbin' in self.category:
                return self._detect_garbage(img, image_path)
            elif 'construction' in self.category or 'infrastructure' in self.category:
                return self._detect_construction(img, image_path)
            elif 'water' in self.category or 'drainage' in self.category:
                return self._detect_water_issue(img, image_path)
            elif 'streetlight' in self.category or 'light' in self.category:
                return self._detect_streetlight_issue(img, image_path)
            else:
                # Generic detection for unknown categories
                return self._detect_generic_issue(img, image_path)
            
        except Exception as e:
            logger.error(f"Error in issue detection: {str(e)}")
            return self._create_response(False, 0.0, f"Error during analysis: {str(e)}", self.category.title())
    
    def _detect_potholes(self, img, image_path):
        """
        Detect potholes in an image
        """
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Detect edges using Canny edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours that might represent potholes
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Analyze contours for pothole-like characteristics
        potential_issues = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:  # Filter small areas
                # Calculate circularity (potholes are often circular/elliptical)
                perimeter = cv2.arcLength(contour, True)
                if perimeter > 0:
                    circularity = 4 * np.pi * area / (perimeter ** 2)
                    if circularity > 0.3:  # Potholes have moderate to high circularity
                        potential_issues.append({
                            'area': area,
                            'circularity': circularity
                        })
        
        num_detections = len(potential_issues)
        
        if num_detections == 0:
            return self._create_response(False, 0.2, "No pothole-like features detected", "Pothole")
        
        # Calculate confidence score
        confidence = min(0.95, 0.3 + (num_detections * 0.15))
        
        # Determine severity based on area of detected regions
        total_area = sum(p['area'] for p in potential_issues)
        severity = self._calculate_severity(total_area, img.shape[0] * img.shape[1])
        
        # Determine priority
        priority = self._determine_priority(confidence, severity, total_area)
        
        return {
            'detected': True,
            'issueType': 'Pothole',
            'confidence': round(confidence, 2),
            'severity': severity,
            'priority': priority,
            'num_detections': num_detections,
            'total_area': int(total_area),
            'recommendation': self._get_recommendation('Pothole', priority, severity)
        }
    
    def _detect_garbage(self, img, image_path):
        """
        Detect garbage/waste/dustbin issues in an image
        """
        # Convert to HSV color space for better color detection
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Detect darker regions (garbage bags, waste)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Analyze for garbage-like patterns
        potential_issues = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 500:  # Garbage items are typically larger
                potential_issues.append({'area': area})
        
        num_detections = len(potential_issues)
        
        if num_detections == 0:
            return self._create_response(False, 0.2, "No garbage/waste features detected", "Garbage/Waste")
        
        confidence = min(0.95, 0.4 + (num_detections * 0.1))
        total_area = sum(p['area'] for p in potential_issues)
        severity = self._calculate_severity(total_area, img.shape[0] * img.shape[1])
        priority = self._determine_priority(confidence, severity, total_area)
        
        return {
            'detected': True,
            'issueType': 'Garbage/Waste',
            'confidence': round(confidence, 2),
            'severity': severity,
            'priority': priority,
            'num_detections': num_detections,
            'total_area': int(total_area),
            'recommendation': self._get_recommendation('Garbage/Waste', priority, severity)
        }
    
    def _detect_construction(self, img, image_path):
        """
        Detect construction/infrastructure issues
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Look for rectangular/geometric patterns (construction equipment, barriers)
        potential_issues = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 200:
                approx = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
                if len(approx) >= 4:  # Rectangular shapes
                    potential_issues.append({'area': area})
        
        num_detections = len(potential_issues)
        
        if num_detections == 0:
            return self._create_response(False, 0.2, "No construction/infrastructure issues detected", "Construction")
        
        confidence = min(0.95, 0.35 + (num_detections * 0.12))
        total_area = sum(p['area'] for p in potential_issues)
        severity = self._calculate_severity(total_area, img.shape[0] * img.shape[1])
        priority = self._determine_priority(confidence, severity, total_area)
        
        return {
            'detected': True,
            'issueType': 'Construction/Infrastructure',
            'confidence': round(confidence, 2),
            'severity': severity,
            'priority': priority,
            'num_detections': num_detections,
            'total_area': int(total_area),
            'recommendation': self._get_recommendation('Construction', priority, severity)
        }
    
    def _detect_water_issue(self, img, image_path):
        """
        Detect water/drainage issues
        """
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Detect water-like colors (blues, darker regions)
        lower_blue = np.array([100, 50, 50])
        upper_blue = np.array([130, 255, 255])
        mask = cv2.inRange(hsv, lower_blue, upper_blue)
        
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        potential_issues = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 300:
                potential_issues.append({'area': area})
        
        num_detections = len(potential_issues)
        
        if num_detections == 0:
            return self._create_response(False, 0.2, "No water/drainage issues detected", "Water/Drainage")
        
        confidence = min(0.95, 0.3 + (num_detections * 0.15))
        total_area = sum(p['area'] for p in potential_issues)
        severity = self._calculate_severity(total_area, img.shape[0] * img.shape[1])
        priority = self._determine_priority(confidence, severity, total_area)
        
        return {
            'detected': True,
            'issueType': 'Water/Drainage',
            'confidence': round(confidence, 2),
            'severity': severity,
            'priority': priority,
            'num_detections': num_detections,
            'total_area': int(total_area),
            'recommendation': self._get_recommendation('Water/Drainage', priority, severity)
        }
    
    def _detect_streetlight_issue(self, img, image_path):
        """
        Detect streetlight issues
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect bright spots (light sources)
        _, bright = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
        
        contours, _ = cv2.findContours(bright, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        potential_issues = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if 50 < area < 2000:  # Light source size
                potential_issues.append({'area': area})
        
        num_detections = len(potential_issues)
        
        if num_detections == 0:
            return self._create_response(False, 0.2, "No streetlight issues detected", "Streetlight")
        
        confidence = min(0.95, 0.4 + (num_detections * 0.08))
        total_area = sum(p['area'] for p in potential_issues)
        severity = self._calculate_severity(total_area, img.shape[0] * img.shape[1])
        priority = self._determine_priority(confidence, severity, total_area)
        
        return {
            'detected': True,
            'issueType': 'Streetlight',
            'confidence': round(confidence, 2),
            'severity': severity,
            'priority': priority,
            'num_detections': num_detections,
            'total_area': int(total_area),
            'recommendation': self._get_recommendation('Streetlight', priority, severity)
        }
    
    def _detect_generic_issue(self, img, image_path):
        """
        Generic detection for unknown categories
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        potential_issues = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 150:
                potential_issues.append({'area': area})
        
        num_detections = len(potential_issues)
        
        if num_detections == 0:
            return self._create_response(False, 0.15, f"No {self.category} issues detected", self.category.title())
        
        confidence = min(0.9, 0.3 + (num_detections * 0.1))
        total_area = sum(p['area'] for p in potential_issues)
        severity = self._calculate_severity(total_area, img.shape[0] * img.shape[1])
        priority = self._determine_priority(confidence, severity, total_area)
        
        return {
            'detected': True,
            'issueType': self.category.title(),
            'confidence': round(confidence, 2),
            'severity': severity,
            'priority': priority,
            'num_detections': num_detections,
            'total_area': int(total_area),
            'recommendation': self._get_recommendation(self.category.title(), priority, severity)
        }
    
    def detect_potholes(self, image_path):
        """
        Legacy method for backward compatibility
        """
        img = cv2.imread(image_path)
        if img is None:
            return self._create_response(False, 0.0, "Failed to read image", "Pothole")
        return self._detect_potholes(img, image_path)
    
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
    
    def _get_recommendation(self, issue_type, priority, severity):
        """
        Generate recommendation based on issue type, priority and severity
        """
        if priority == 'Urgent':
            return f'Immediate attention required. Multiple severe {issue_type.lower()} issues detected.'
        elif priority == 'High':
            return f'High priority action needed. Significant {issue_type.lower()} issues detected.'
        elif priority == 'Medium':
            return f'Action recommended. Moderate {issue_type.lower()} issues detected.'
        else:
            return f'Low priority. Minor {issue_type.lower()} issues detected.'
    
    def _create_response(self, detected, confidence, message, issue_type='Issue'):
        """
        Create a standardized response
        """
        return {
            'detected': detected,
            'issueType': issue_type,
            'confidence': confidence,
            'severity': 'Low' if not detected else 'N/A',
            'priority': 'Low',
            'num_detections': 0,
            'total_area': 0,
            'recommendation': message
        }


# Flask-like simple HTTP server function for integration
def analyze_image_for_potholes(image_path, category='road'):
    """
    Analyze an image for issues and return results (backward compatible)
    
    Args:
        image_path: Path to the image file
        category: Category of issue (road, garbage, construction, etc.)
        
    Returns:
        dict: Analysis results
    """
    detector = IssueDetector(category)
    return detector.detect_issue(image_path)


if __name__ == '__main__':
    # Handle command-line arguments
    # Usage: python service.py --analyze <image_path> [--category <category>]
    if len(sys.argv) >= 3 and sys.argv[1] == '--analyze':
        image_path = sys.argv[2]
        category = 'road'  # Default category
        
        # Check for category argument
        if len(sys.argv) >= 5 and sys.argv[3] == '--category':
            category = sys.argv[4]
        
        if not os.path.exists(image_path):
            result = {
                'detected': False,
                'issueType': category.title(),
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
            detector = IssueDetector(category)
            result = detector.detect_issue(image_path)
            # Output JSON for Node.js to parse
            print(json.dumps(result))
        except Exception as e:
            result = {
                'detected': False,
                'issueType': category.title(),
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
        detector = IssueDetector()
        print("Issue Detection Service initialized")


