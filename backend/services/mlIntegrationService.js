/**
 * ML Integration Service
 * Handles communication with the FastAPI ML service for disease detection and age estimation
 */

const axios = require('axios');

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || 30000);

// Initialize axios instance
const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_SERVICE_TIMEOUT,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

const normalizeLabel = (value = '') => String(value || '').toLowerCase().trim().replace(/[-\s]+/g, '_');
const knownPests = new Set(['mealybug', 'spider_mite']);

const resolvePestLabel = (value = '') => {
  const key = normalizeLabel(value);
  if (!key) return '';
  if (knownPests.has(key)) return key;
  if (key === 'mealybugs' || key === 'mealy_bug' || key === 'mealy_bugs') return 'mealybug';
  if (key === 'spidermite' || key === 'spidermites' || key === 'spider_mites') return 'spider_mite';
  if (key.includes('mealy') && key.includes('bug')) return 'mealybug';
  if (key.includes('spider') && key.includes('mite')) return 'spider_mite';
  return '';
};

/**
 * Check if ML service is healthy
 */
exports.healthCheck = async () => {
  try {
    const response = await mlClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('ML Service health check failed:', error.message);
    throw new Error('ML Service unavailable');
  }
};

/**
 * Get ML service info
 */
exports.getServiceInfo = async () => {
  try {
    const response = await mlClient.get('/info');
    return response.data;
  } catch (error) {
    console.error('Failed to get ML service info:', error.message);
    throw error;
  }
};

/**
 * Complete plant scan (disease detection + age estimation)
 * 
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {String} filename - Original filename
 * @returns {Object} Scan results
 */
exports.scanPlant = async (imageBuffer, filename) => {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imageBuffer, filename);

    const response = await mlClient.post('/scan', form, {
      headers: form.getHeaders()
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Scan failed');
    }

    return response.data;
  } catch (error) {
    const detailMessage =
      error?.response?.data?.detail ||
      error?.response?.data?.error ||
      error?.response?.data?.message;

    if (detailMessage) {
      console.error('Plant scan error:', detailMessage);
      throw new Error(String(detailMessage));
    }

    if (error?.code === 'ECONNREFUSED' || error?.code === 'ECONNABORTED') {
      console.error('Plant scan error: ML service unavailable');
      throw new Error('ML service unavailable');
    }

    console.error('Plant scan error:', error.message);
    throw new Error(error.message || 'Scan failed');
  }
};

/**
 * Detect disease in plant image
 * 
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {String} filename - Original filename
 * @param {Object} options - Optional settings
 * @param {Boolean} options.live - Enable live-preview mode in ML service
 * @returns {Object} Disease detection results
 */
exports.detectDisease = async (imageBuffer, filename, options = {}) => {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imageBuffer, filename);
    const { live = false } = options;

    const response = await mlClient.post('/detect-disease', form, {
      headers: form.getHeaders(),
      params: { live }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Disease detection failed');
    }

    return response.data;
  } catch (error) {
    console.error('Disease detection error:', error.message);
    throw error;
  }
};

/**
 * Estimate plant age
 * 
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {String} filename - Original filename
 * @returns {Object} Age estimation results
 */
exports.estimateAge = async (imageBuffer, filename) => {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imageBuffer, filename);

    const response = await mlClient.post('/estimate-age', form, {
      headers: form.getHeaders()
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Age estimation failed');
    }

    return response.data;
  } catch (error) {
    console.error('Age estimation error:', error.message);
    throw error;
  }
};

/**
 * Get disease recommendations
 * 
 * @param {String} disease - Disease name
 * @returns {Object} Disease info and recommendations
 */
exports.getRecommendations = async (disease) => {
  try {
    const response = await mlClient.get(`/recommendations/${disease}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get recommendations:', error.message);
    throw error;
  }
};

/**
 * Format ML scan results for database storage
 * 
 * @param {Object} mlResult - Raw ML service result
 * @param {Object} imageData - Image metadata
 * @returns {Object} Formatted scan data
 */
exports.formatScanResults = (mlResult, imageData = {}) => {
  if (!mlResult.success || !mlResult.scan_data) {
    throw new Error('Invalid ML result format');
  }

  const scanData = mlResult.scan_data;
  const detections = Array.isArray(scanData.detected_diseases) ? scanData.detected_diseases : [];

  const detectedPests = [...new Set(
    detections
      .map((d) => ({
        label: resolvePestLabel(d?.disease),
        confidence: Number(d?.confidence ?? 0)
      }))
      .filter((d) => d.label && d.confidence >= 0.25)
      .map((d) => d.label)
  )];

  const detectedConditions = [...new Set(
    detections
      .map((d) => normalizeLabel(d?.disease))
      .filter((label) => label && label !== 'healthy' && !resolvePestLabel(label))
  )];
  const fallbackCondition = normalizeLabel(scanData.health_status) === 'healthy'
    ? 'healthy'
    : (normalizeLabel(scanData.health_status) || 'unknown');

  const isHealthy = normalizeLabel(scanData.health_status) === 'healthy';
  const ageMonths = scanData.age_estimation?.age_months;
  const isAgeReady = typeof ageMonths === 'number' && Number.isFinite(ageMonths) && ageMonths >= 8;
  const harvestReady = isHealthy && isAgeReady;

  return {
    yolo_predictions: detections.map(detection => ({
      class: detection.disease,
      confidence: detection.confidence,
      bbox: detection.bbox
    })),
    visual_features: scanData.features || {},
    analysis_result: {
      health_status: scanData.health_status,
      disease_detected: scanData.health_status !== 'healthy',
      disease_severity: calculateSeverity(scanData.health_status, scanData.disease_confidence),
      disease_name: scanData.health_status,
      confidence: scanData.disease_confidence,
      confidence_score: scanData.disease_confidence,
      health_score: calculateHealthScore(scanData.health_status, scanData.disease_confidence),
      estimated_age_months: scanData.age_estimation?.age_months || null,
      estimated_age_formatted: scanData.age_estimation?.age_formatted || null,
      age_confidence: scanData.age_estimation?.confidence || 0,
      detected_conditions: detectedConditions.length > 0 ? detectedConditions : [fallbackCondition],
      detected_pests: detectedPests,
      harvest_ready: harvestReady,
      maturity_assessment: assessMaturity(ageMonths),
      estimated_days_to_harvest: estimateDaysToHarvest(ageMonths)
    },
    recommendations: scanData.recommendations || [],
    extracted_features: {
      image_size: scanData.image_analysis?.image_size,
      detected_features: scanData.image_analysis?.features
    },
    ml_metadata: {
      source: 'yolov8_ml_service',
      scan_version: '1.0.0',
      detection_model: 'YOLOv8',
      age_estimation_model: 'feature-based'
    }
  };
};

/**
 * Calculate disease severity
 */
function calculateSeverity(diseaseStatus, confidence) {
  if (diseaseStatus === 'healthy') {
    return 'none';
  } else if (confidence >= 0.8) {
    return 'high';
  } else if (confidence >= 0.6) {
    return 'moderate';
  } else {
    return 'low';
  }
}

/**
 * Calculate health score (0-100)
 */
function calculateHealthScore(diseaseStatus, confidence) {
  if (diseaseStatus === 'healthy') {
    return 95;
  }
  
  const severityScore = confidence * 100;
  const healthScore = 100 - severityScore;
  return Math.round(Math.max(20, healthScore));
}

/**
 * Assess plant maturity based on age
 */
function assessMaturity(ageMonths) {
  if (!ageMonths) return 'immature';
  if (ageMonths < 1) return 'immature';
  if (ageMonths < 6) return 'maturing';
  if (ageMonths < 8) return 'maturing';
  if (ageMonths < 24) return 'optimal';
  return 'over-mature';
}

/**
 * Estimate days to harvest
 */
function estimateDaysToHarvest(ageMonths) {
  if (!ageMonths) return null;

  // Project: mark harvest-ready starting at 8 months
  const harvestReadyAt = 8;
  const daysRemaining = Math.max(0, (harvestReadyAt - ageMonths) * 30);
  return Math.round(daysRemaining);
}

/**
 * Process scan asynchronously (call ML service in background)
 * This is called after initial scan creation
 */
exports.processScanAsync = async (scanId, imageBuffer, filename) => {
  try {
    const mlResult = await exports.scanPlant(imageBuffer, filename);
    
    // Return formatted data so caller can update the scan
    const formattedData = exports.formatScanResults(mlResult);
    
    return {
      success: true,
      scan_id: scanId,
      data: formattedData
    };
  } catch (error) {
    console.error(`Error processing scan ${scanId}:`, error.message);
    return {
      success: false,
      scan_id: scanId,
      error: error.message
    };
  }
};
