const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class MLService {
  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    this.timeout = parseInt(process.env.ML_SERVICE_TIMEOUT) || 30000;
  }

  /**
   * Process image for disease detection and age estimation
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeImage(imageBuffer, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: metadata.filename || 'scan.jpg',
        contentType: 'image/jpeg'
      });

      const response = await axios.post(
        `${this.baseURL}/predict`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'ML service error');
      }
    } catch (error) {
      console.error('ML Service Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('ML service is not available');
      }
      
      if (error.response) {
        throw new Error(error.response.data.error || 'ML service error');
      }
      
      throw error;
    }
  }

  /**
   * Process multiple images in batch
   * @param {Array<Buffer>} imageBuffers - Array of image buffers
   * @returns {Promise<Array>} Array of analysis results
   */
  async analyzeBatch(imageBuffers) {
    try {
      const formData = new FormData();
      
      imageBuffers.forEach((buffer, index) => {
        formData.append('images', buffer, {
          filename: `image_${index}.jpg`,
          contentType: 'image/jpeg'
        });
      });

      const response = await axios.post(
        `${this.baseURL}/predict/batch`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout * imageBuffers.length
        }
      );

      if (response.data.success) {
        return response.data.data.results;
      } else {
        throw new Error(response.data.error || 'ML service error');
      }
    } catch (error) {
      console.error('ML Service Batch Error:', error.message);
      throw error;
    }
  }

  /**
   * Check if ML service is healthy
   * @returns {Promise<Boolean>}
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate comprehensive analysis result from ML predictions
   * @param {Object} mlResults - Results from ML service
   * @param {Object} plant - Plant document
   * @returns {Object} Comprehensive analysis result
   */
  generateAnalysisResult(mlResults, plant = null) {
    const { yolo_predictions, visual_features, age_estimation, confidence_score } = mlResults;

    // Determine primary disease/condition
    const primaryPrediction = yolo_predictions && yolo_predictions.length > 0
      ? yolo_predictions[0]
      : { class: 'healthy', confidence: 0.5 };

    // Determine disease severity
    let diseaseSeverity = 'none';
    if (primaryPrediction.class !== 'healthy') {
      if (primaryPrediction.confidence >= 0.8) {
        diseaseSeverity = 'severe';
      } else if (primaryPrediction.confidence >= 0.6) {
        diseaseSeverity = 'moderate';
      } else {
        diseaseSeverity = 'mild';
      }
    }

    // Calculate health score (0-100)
    let healthScore = 100;
    if (primaryPrediction.class !== 'healthy') {
      healthScore = Math.max(0, 100 - (primaryPrediction.confidence * 50));
    }
    
    // Adjust based on visual features
    const colorIndex = visual_features?.leaf_color_index || 0.5;
    healthScore = healthScore * (0.7 + colorIndex * 0.3);

    // Determine harvest readiness (project rule: healthy + age >= 8 months)
    const ageMonths = age_estimation?.age_months;
    const isAgeReady = typeof ageMonths === 'number' && Number.isFinite(ageMonths) && ageMonths >= 8;
    const harvestReady = isAgeReady && diseaseSeverity === 'none';

    // Determine recommended action
    let recommendedAction = 'monitor_daily';
    if (harvestReady) {
      recommendedAction = 'harvest_now';
    } else if (age_estimation?.maturity_assessment === 'maturing' && diseaseSeverity === 'none') {
      recommendedAction = 'wait_2_weeks';
    } else if (diseaseSeverity !== 'none') {
      recommendedAction = 'treat_disease';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      primaryPrediction.class,
      diseaseSeverity,
      age_estimation
    );

    // Extract all detected conditions from predictions
    const detectedConditions = [];
    const detectedPests = [];
    const diseaseClasses = ['leaf_spot', 'root_rot', 'sunburn', 'aloe_rust', 'aloe_rusts', 'bacterial_soft_rot', 'anthracnose', 'fungal_disease', 'rust', 'leaf_spots', 'sunburns'];
    const pestClasses = ['mealybug', 'spider_mite', 'scale_insect', 'scale_insects'];

    if (yolo_predictions && yolo_predictions.length > 0) {
      yolo_predictions.forEach(pred => {
        if (pred.class !== 'healthy' && pred.confidence >= 0.5) {
          if (diseaseClasses.includes(pred.class)) {
            // Normalize the class name (e.g., 'aloe_rusts' -> 'aloe_rust')
            const normalizedClass = pred.class.replace(/_s$/, '');
            detectedConditions.push(normalizedClass);
          } else if (pestClasses.includes(pred.class)) {
            // Normalize the class name (e.g., 'scale_insects' -> 'scale_insect')
            const normalizedClass = pred.class.replace(/_s$/, '');
            detectedPests.push(normalizedClass);
          }
        }
      });
    }

    return {
      harvest_ready: harvestReady,
      maturity_assessment: age_estimation?.maturity_assessment || 'maturing',
      health_score: Math.round(healthScore),
      plant_health_score: Math.round(healthScore),
      disease_detected: primaryPrediction.class !== 'healthy',
      disease_name: primaryPrediction.class !== 'healthy' ? primaryPrediction.class.replace('_', ' ').toUpperCase() : 'Healthy',
      disease_severity: diseaseSeverity,
      recommended_action: recommendedAction,
      estimated_days_to_harvest: age_estimation?.estimated_days_to_harvest || 60,
      confidence_score: confidence_score || 0.5,
      detected_conditions: detectedConditions.length > 0 ? detectedConditions : ['healthy'],
      detected_pests: detectedPests.length > 0 ? detectedPests : []
    };
  }

  /**
   * Generate treatment recommendations
   * @param {String} diseaseClass - Disease class name
   * @param {String} severity - Disease severity
   * @param {Object} ageEstimation - Age estimation results
   * @returns {Object} Recommendations
   */
  generateRecommendations(diseaseClass, severity, ageEstimation) {
    const recommendations = {
      treatment_plan: [],
      preventive_measures: [],
      follow_up_required: false,
      next_scan_date: null
    };

    // Set follow-up based on condition
    if (diseaseClass !== 'healthy') {
      recommendations.follow_up_required = true;
      const nextScan = new Date();
      if (severity === 'severe') {
        nextScan.setDate(nextScan.getDate() + 3); // Check in 3 days
      } else if (severity === 'moderate') {
        nextScan.setDate(nextScan.getDate() + 7); // Check in 1 week
      } else {
        nextScan.setDate(nextScan.getDate() + 14); // Check in 2 weeks
      }
      recommendations.next_scan_date = nextScan;
    } else if (ageEstimation?.maturity_assessment === 'maturing') {
      recommendations.follow_up_required = true;
      const nextScan = new Date();
      nextScan.setDate(nextScan.getDate() + 14); // Check in 2 weeks
      recommendations.next_scan_date = nextScan;
    }

    // Add general recommendations
    if (diseaseClass !== 'healthy') {
      recommendations.treatment_plan.push(
        `Treat ${diseaseClass.replace('_', ' ')} with appropriate treatment`
      );
      recommendations.treatment_plan.push('Monitor plant closely for improvement');
    }

    if (ageEstimation?.maturity_assessment === 'optimal') {
      recommendations.treatment_plan.push('Plant is ready for harvest');
    }

    recommendations.preventive_measures.push('Maintain proper watering schedule');
    recommendations.preventive_measures.push('Ensure adequate sunlight');
    recommendations.preventive_measures.push('Regular monitoring and inspection');

    return recommendations;
  }
}

module.exports = new MLService();

