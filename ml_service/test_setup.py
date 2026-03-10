#!/usr/bin/env python
"""
Test script to verify ML service can start
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.getcwd())

print("Testing ML Service Setup...")
print("=" * 50)

# Test imports
try:
    from services.disease_detector import DiseaseDetector
    print("✓ DiseaseDetector imported successfully")
except ImportError as e:
    print(f"✗ Failed to import DiseaseDetector: {e}")
    sys.exit(1)

try:
    from services.age_estimator import AgeEstimator
    print("✓ AgeEstimator imported successfully")
except ImportError as e:
    print(f"✗ Failed to import AgeEstimator: {e}")
    sys.exit(1)

# Test module initialization
try:
    detector = DiseaseDetector()
    print("✓ DiseaseDetector initialized successfully")
except Exception as e:
    print(f"✗ Failed to initialize DiseaseDetector: {e}")
    sys.exit(1)

try:
    estimator = AgeEstimator()
    print("✓ AgeEstimator initialized successfully")
except Exception as e:
    print(f"✗ Failed to initialize AgeEstimator: {e}")
    sys.exit(1)

# Test FastAPI
try:
    from fastapi import FastAPI
    print("✓ FastAPI imported successfully")
except ImportError as e:
    print(f"✗ Failed to import FastAPI: {e}")
    sys.exit(1)

print("=" * 50)
print("✓ All tests passed! ML Service is ready.")
print("\nTo start the server, run:")
print("  python main.py")
