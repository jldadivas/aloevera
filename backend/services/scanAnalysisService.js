const Scan = require('../models/scan');
const mlService = require('./mlService');
const { uploadImage } = require('./imageService');

/**
 * Process scan image and generate analysis
 * @param {String} scanId - Scan ID
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Updated scan with analysis
 */
async function processScanAnalysis(scanId, imageBuffer) {
  try {
    // Get scan
    const scan = await Scan.findById(scanId);
    if (!scan) {
      throw new Error('Scan not found');
    }

    // Call ML service for analysis
    const mlResults = await mlService.analyzeImage(imageBuffer, {
      filename: `scan_${scanId}.jpg`
    });

    // Generate comprehensive analysis result
    const analysisResult = mlService.generateAnalysisResult(mlResults);

    // Update scan with ML results
    scan.yolo_predictions = mlResults.yolo_predictions || [];
    scan.visual_features = mlResults.visual_features || {};
    scan.analysis_result = analysisResult;
    scan.recommendations = analysisResult.recommendations || {};
    scan.scan_metadata.processing_time_ms = mlResults.processing_time_ms || 0;
    scan.scan_metadata.model_version = process.env.MODEL_VERSION || '1.0.0';

    // Check if low confidence - flag for validation
    if (mlResults.confidence_score < 0.7) {
      scan.self_learning_status.requires_validation = true;
    }

    await scan.save();

    return scan;
  } catch (error) {
    console.error('Error processing scan analysis:', error);
    throw error;
  }
}

/**
 * Process scan asynchronously (for background jobs)
 * @param {String} scanId - Scan ID
 */
async function processScanAsync(scanId) {
  try {
    const scan = await Scan.findById(scanId).populate('plant_id');
    if (!scan) {
      throw new Error('Scan not found');
    }

    // Fetch image from Cloudinary URL
    const axios = require('axios');
    const response = await axios.get(scan.image_data.original_url, {
      responseType: 'arraybuffer'
    });
    const imageBuffer = Buffer.from(response.data);

    // Process analysis
    await processScanAnalysis(scanId, imageBuffer);
  } catch (error) {
    console.error('Error in async scan processing:', error);
    // Update scan with error status
    const scan = await Scan.findById(scanId);
    if (scan) {
      scan.scan_metadata.processing_time_ms = -1; // Error indicator
      await scan.save();
    }
  }
}

module.exports = {
  processScanAnalysis,
  processScanAsync
};

