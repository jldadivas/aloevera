# Analytics Fix Summary

## Issue
The analytics page was only showing "Healthy" count even though there were scans with diseases like rust and fungal_disease affecting Aloe Vera plants.

## Root Causes Identified
1. **Missing disease types**: The `mlService.js` file only included specific disease classes in the `diseaseClasses` array but was missing 'rust' and 'fungal_disease'.

2. **Missing schema fields**: The Scan model did not have `detected_conditions` and `detected_pests` fields defined in the `analysis_result` schema.

3. **Incomplete condition distribution objects**: The analytics controller's condition_distribution objects didn't include entries for 'fungal_disease' and 'rust'.

## Changes Made

### 1. Updated [services/mlService.js](services/mlService.js#L176-L186)
- Added 'fungal_disease' and 'rust' to the `diseaseClasses` array
- Added plural forms ('aloe_rusts', 'leaf_spots', 'sunburns') to handle different prediction formats
- Added logic to normalize plural disease names (e.g., 'scale_insects' → 'scale_insect')
- Also expanded pestClasses to include 'scale_insect' and 'scale_insects'

**Before:**
```javascript
const diseaseClasses = ['leaf_spot', 'root_rot', 'sunburn', 'aloe_rust', 'bacterial_soft_rot', 'anthracnose'];
```

**After:**
```javascript
const diseaseClasses = ['leaf_spot', 'root_rot', 'sunburn', 'aloe_rust', 'aloe_rusts', 'bacterial_soft_rot', 'anthracnose', 'fungal_disease', 'rust', 'leaf_spots', 'sunburns'];
```

### 2. Updated [models/scan.js](models/scan.js#L65-L97)
- Added `detected_conditions: [String]` field to analysis_result
- Added `detected_pests: [String]` field to analysis_result  
- Added `plant_health_score` field as an alias for health_score

This allows the analysis results to properly store the list of detected conditions and pests.

### 3. Updated [controllers/analyticsController.js](controllers/analyticsController.js)
- Added 'fungal_disease' and 'rust' entries to `conditionDistribution` objects in all analytics methods:
  - Daily analytics (getDailyAnalytics)
  - Weekly analytics (getWeeklyAnalytics)
  - Monthly analytics (getMonthlyAnalytics)
  - User analytics (getUserAnalytics)

**Before:**
```javascript
const conditionDistribution = {
  healthy: 0,
  leaf_spot: 0,
  root_rot: 0,
  sunburn: 0,
  aloe_rust: 0,
  bacterial_soft_rot: 0,
  anthracnose: 0,
  scale_insect: 0
};
```

**After:**
```javascript
const conditionDistribution = {
  healthy: 0,
  leaf_spot: 0,
  root_rot: 0,
  sunburn: 0,
  aloe_rust: 0,
  bacterial_soft_rot: 0,
  anthracnose: 0,
  scale_insect: 0,
  fungal_disease: 0,
  rust: 0
};
```

## How It Works Now

1. When the ML model detects diseases like 'rust' or 'fungal_disease', they are now included in the `diseaseClasses` filter
2. These detected conditions are extracted from yolo_predictions and stored in `analysis_result.detected_conditions`
3. The analytics controller now has entries for 'fungal_disease' and 'rust' in the condition_distribution
4. When processing scans, these detected conditions are properly counted and displayed in the analytics dashboard

## Test Data
Created test data with:
- 15 healthy scans
- 1 aloe_rust scan  
- 1 rust scan
- 1 fungal_disease scan

The analytics now correctly shows:
- Healthy: 15
- Aloe Rust: 1
- Rust: 1  
- Fungal Disease: 1

## Frontend Changes
No changes needed to the frontend - it already correctly references `detected_conditions` in the analysis_result. The fix ensures that the backend API now provides the correct detected_conditions data.
