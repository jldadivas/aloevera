const Analytics = require('../models/analytics');
const Scan = require('../models/scan');
const Plant = require('../models/plant');
const asyncHandler = require('../utils/controllerWrapper');

const normalizeKey = (value = '') => value.toLowerCase().trim().replace(/\s+/g, '_');
const toBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return false;
};

const isHealthyMarker = (value = '') => {
  const normalized = normalizeKey(value || '');
  return !normalized || ['none', 'healthy', 'normal', 'no_disease', 'no_issue', 'clear'].includes(normalized);
};

const conditionAliases = {
  leaf_spots: 'leaf_spot',
  sunburns: 'sunburn',
  scale_insects: 'scale_insect',
  scale_insects: 'scale_insect'
};

const hasDiseaseInScan = (analysis = {}) => {
  if (!analysis) return false;
  if (toBoolean(analysis.disease_detected)) return true;
  if (!isHealthyMarker(analysis.disease_severity)) return true;
  if (Array.isArray(analysis.detected_conditions)) {
    const flagged = analysis.detected_conditions.some((condition) => !isHealthyMarker(condition));
    if (flagged) return true;
  }
  return !isHealthyMarker(analysis.disease_name);
};

const resolveConditionKey = (conditionName = '') => {
  const key = normalizeKey(conditionName);
  return conditionAliases[key] || key;
};

const knownPests = new Set(['mealybug', 'spider_mite']);

const resolvePestKey = (pestName = '') => {
  const raw = String(pestName || '').toLowerCase().trim().replace(/-/g, ' ');
  let key = normalizeKey(raw);
  if (!key) return '';

  if (knownPests.has(key)) return key;
  if (key === 'mealybugs' || key === 'mealy_bug' || key === 'mealy_bugs') return 'mealybug';
  if (key === 'spidermite' || key === 'spidermites' || key === 'spider_mites') return 'spider_mite';
  if (key.includes('mealy') && key.includes('bug')) return 'mealybug';
  if (key.includes('spider') && key.includes('mite')) return 'spider_mite';

  return key;
};

const collectPestsFromScan = (scan = {}) => {
  const analysis = scan.analysis_result || {};
  const pests = new Set();

  if (Array.isArray(analysis.detected_pests)) {
    analysis.detected_pests.forEach((pest) => {
      const key = resolvePestKey(pest);
      if (knownPests.has(key)) pests.add(key);
    });
  }

  if (pests.size === 0 && analysis.disease_name) {
    const diseaseAsPest = resolvePestKey(analysis.disease_name);
    if (knownPests.has(diseaseAsPest)) pests.add(diseaseAsPest);
  }

  // Backward compatibility for scans where pests were not persisted in analysis_result.
  if (pests.size === 0 && Array.isArray(scan.yolo_predictions)) {
    scan.yolo_predictions.forEach((pred) => {
      const key = resolvePestKey(pred?.class || pred?.disease || '');
      const confidence = Number(pred?.confidence ?? 0);
      if (knownPests.has(key) && confidence >= 0.25) {
        pests.add(key);
      }
    });
  }

  return [...pests];
};

// @desc    Get analytics for date range
// @route   GET /api/v1/analytics
// @access  Private
exports.getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, period = 'daily' } = req.query;

  let start, end;
  
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    // Default to last 30 days
    end = new Date();
    start = new Date();
    start.setDate(start.getDate() - 30);
  }

  const query = {
    user_id: req.user.id,
    date: { $gte: start, $lte: end }
  };

  const analytics = await Analytics.find(query).sort({ date: 1 });

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: {
      analytics,
      period: {
        start,
        end
      }
    }
  });
});

// @desc    Get daily analytics
// @route   GET /api/v1/analytics/daily
// @access  Private
exports.getDailyAnalytics = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();

  // Set time range for the day
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Get all scans for this day
  const scansInDay = await Scan.find({
    user_id: req.user.id,
    createdAt: { $gte: dayStart, $lte: dayEnd }
  }).lean();

  // Get plants stats
  const totalPlants = await Plant.countDocuments({ owner_id: req.user.id });
  const harvestReadyPlants = await Plant.countDocuments({
    owner_id: req.user.id,
    'current_status.harvest_ready': true
  });

  // Count diseased plants based on MOST RECENT scan for each plant
  // Group scans by plant_id and get the latest scan for each
  const latestScanByPlant = {};
  scansInDay.forEach(scan => {
    const plantId = scan.plant_id.toString();
    if (!latestScanByPlant[plantId] || new Date(scan.createdAt) > new Date(latestScanByPlant[plantId].createdAt)) {
      latestScanByPlant[plantId] = scan;
    }
  });

  // Build diseased set only from latest scans
  const plantsWithDiseaseScans = new Set();
  Object.values(latestScanByPlant).forEach(scan => {
    if (scan.analysis_result && hasDiseaseInScan(scan.analysis_result) && scan.plant_id) {
      plantsWithDiseaseScans.add(scan.plant_id.toString());
    }
  });

  const diseasedPlants = plantsWithDiseaseScans.size;

  // Initialize distributions
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

  const pestDistribution = {
    mealybug: 0,
    spider_mite: 0
  };

  let totalHealthScore = 0;
  let totalConfidenceScore = 0;
  let validScans = 0;
  let scansWithConfidence = 0;

  // Process day scans
  scansInDay.forEach(scan => {
    const analysis = scan.analysis_result || {};
    const hasDisease = hasDiseaseInScan(analysis);
    const detectedConditions = Array.isArray(analysis.detected_conditions) ? analysis.detected_conditions : [];

    if (detectedConditions.length > 0) {
      detectedConditions.forEach(condition => {
        const conditionKey = resolveConditionKey(condition);
        if (conditionDistribution.hasOwnProperty(conditionKey)) {
          conditionDistribution[conditionKey]++;
        }
      });
    } else if (hasDisease) {
      const fallbackCondition = resolveConditionKey(analysis.disease_name || '');
      if (fallbackCondition && conditionDistribution.hasOwnProperty(fallbackCondition)) {
        conditionDistribution[fallbackCondition]++;
      }
    } else {
      conditionDistribution.healthy++;
    }

    collectPestsFromScan(scan).forEach((pestKey) => {
      if (pestDistribution.hasOwnProperty(pestKey)) {
        pestDistribution[pestKey]++;
      }
    });

    const scanHealthScore = analysis.health_score ?? analysis.plant_health_score;
    if (scanHealthScore !== undefined && scanHealthScore !== null) {
      totalHealthScore += Number(scanHealthScore);
      validScans++;
    }

    const confidenceScore = analysis.confidence_score ?? analysis.confidence;
    if (confidenceScore !== undefined && confidenceScore !== null) {
      totalConfidenceScore += Number(confidenceScore);
      scansWithConfidence++;
    }
  });

  const harvestRate = totalPlants > 0 ? ((harvestReadyPlants / totalPlants) * 100).toFixed(2) : 0;
  const diseaseRate = totalPlants > 0 ? ((diseasedPlants / totalPlants) * 100).toFixed(2) : 0;
  const averageHealthScore = validScans > 0 ? (totalHealthScore / validScans).toFixed(2) : 0;
  const averageConfidenceScore = scansWithConfidence > 0 ? (totalConfidenceScore / scansWithConfidence).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    data: {
      date: targetDate.toISOString().split('T')[0],
      timestamp: new Date(),
      analytics: {
        total_plants: totalPlants,
        total_scans: scansInDay.length,
        harvest_rate: `${harvestRate}%`,
        diseased_plants_count: diseasedPlants,
        disease_rate: `${diseaseRate}%`,
        healthy_plants_count: totalPlants - diseasedPlants,
        average_health_score: parseFloat(averageHealthScore),
        average_confidence_score: parseFloat(averageConfidenceScore),
        condition_distribution: conditionDistribution,
        pest_distribution: pestDistribution
      }
    }
  });
});

// @desc    Get weekly analytics
// @route   GET /api/v1/analytics/weekly
// @access  Private
exports.getWeeklyAnalytics = asyncHandler(async (req, res) => {
  const { weekStart } = req.query;
  
  let start = weekStart ? new Date(weekStart) : new Date();
  start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6); // End of week (Saturday)
  end.setHours(23, 59, 59, 999);

  // Get scans for the week
  const scansInWeek = await Scan.find({
    user_id: req.user.id,
    createdAt: { $gte: start, $lte: end }
  }).lean();

  // Get plants stats
  const totalPlants = await Plant.countDocuments({ owner_id: req.user.id });
  const harvestReadyPlants = await Plant.countDocuments({
    owner_id: req.user.id,
    'current_status.harvest_ready': true
  });

  // Count diseased plants based on MOST RECENT scan for each plant
  // Group scans by plant_id and get the latest scan for each
  const latestScanByPlant = {};
  scansInWeek.forEach(scan => {
    const plantId = scan.plant_id.toString();
    if (!latestScanByPlant[plantId] || new Date(scan.createdAt) > new Date(latestScanByPlant[plantId].createdAt)) {
      latestScanByPlant[plantId] = scan;
    }
  });

  // Build diseased set only from latest scans
  const plantsWithDiseaseScans = new Set();
  Object.values(latestScanByPlant).forEach(scan => {
    if (scan.analysis_result && hasDiseaseInScan(scan.analysis_result)) {
      plantsWithDiseaseScans.add(scan.plant_id.toString());
    }
  });

  const diseasedPlants = plantsWithDiseaseScans.size;

  // Initialize distributions
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

  const pestDistribution = {
    mealybug: 0,
    spider_mite: 0
  };

  let totalHealthScore = 0;
  let totalConfidenceScore = 0;
  let validScans = 0;
  let scansWithConfidence = 0;

  // Process week scans
  scansInWeek.forEach(scan => {
    const analysis = scan.analysis_result || {};
    const hasDisease = hasDiseaseInScan(analysis);
    const detectedConditions = Array.isArray(analysis.detected_conditions) ? analysis.detected_conditions : [];

    if (detectedConditions.length > 0) {
      detectedConditions.forEach(condition => {
        const conditionKey = resolveConditionKey(condition);
        if (conditionDistribution.hasOwnProperty(conditionKey)) {
          conditionDistribution[conditionKey]++;
        }
      });
    } else if (hasDisease) {
      const fallbackCondition = resolveConditionKey(analysis.disease_name || '');
      if (fallbackCondition && conditionDistribution.hasOwnProperty(fallbackCondition)) {
        conditionDistribution[fallbackCondition]++;
      }
    } else {
      conditionDistribution.healthy++;
    }

    collectPestsFromScan(scan).forEach((pestKey) => {
      if (pestDistribution.hasOwnProperty(pestKey)) {
        pestDistribution[pestKey]++;
      }
    });

    const scanHealthScore = analysis.health_score ?? analysis.plant_health_score;
    if (scanHealthScore !== undefined && scanHealthScore !== null) {
      totalHealthScore += Number(scanHealthScore);
      validScans++;
    }

    const confidenceScore = analysis.confidence_score ?? analysis.confidence;
    if (confidenceScore !== undefined && confidenceScore !== null) {
      totalConfidenceScore += Number(confidenceScore);
      scansWithConfidence++;
    }
  });

  const harvestRate = totalPlants > 0 ? ((harvestReadyPlants / totalPlants) * 100).toFixed(2) : 0;
  const diseaseRate = totalPlants > 0 ? ((diseasedPlants / totalPlants) * 100).toFixed(2) : 0;
  const averageHealthScore = validScans > 0 ? (totalHealthScore / validScans).toFixed(2) : 0;
  const averageConfidenceScore = scansWithConfidence > 0 ? (totalConfidenceScore / scansWithConfidence).toFixed(2) : 0;

  // Get unique plants monitored in the week
  const uniquePlantsInWeek = await Scan.find({
    user_id: req.user.id,
    createdAt: { $gte: start, $lte: end }
  }).distinct('plant_id');

  res.status(200).json({
    success: true,
    data: {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      timestamp: new Date(),
      analytics: {
        total_plants: totalPlants,
        total_scans: scansInWeek.length,
        plants_monitored_this_week: uniquePlantsInWeek.length,
        harvest_rate: `${harvestRate}%`,
        diseased_plants_count: diseasedPlants,
        disease_rate: `${diseaseRate}%`,
        healthy_plants_count: totalPlants - diseasedPlants,
        average_health_score: parseFloat(averageHealthScore),
        average_confidence_score: parseFloat(averageConfidenceScore),
        condition_distribution: conditionDistribution,
        pest_distribution: pestDistribution
      }
    }
  });
});

// @desc    Get monthly analytics
// @route   GET /api/v1/analytics/monthly
// @access  Private
exports.getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const start = new Date(targetYear, targetMonth, 1);
  const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  // Get scans for the month
  const scansInMonth = await Scan.find({
    user_id: req.user.id,
    createdAt: { $gte: start, $lte: end }
  }).lean();

  // Get plants stats
  const totalPlants = await Plant.countDocuments({ owner_id: req.user.id });
  const harvestReadyPlants = await Plant.countDocuments({
    owner_id: req.user.id,
    'current_status.harvest_ready': true
  });

  // Count diseased plants based on MOST RECENT scan for each plant
  // Group scans by plant_id and get the latest scan for each
  const latestScanByPlant = {};
  scansInMonth.forEach(scan => {
    const plantId = scan.plant_id.toString();
    if (!latestScanByPlant[plantId] || new Date(scan.createdAt) > new Date(latestScanByPlant[plantId].createdAt)) {
      latestScanByPlant[plantId] = scan;
    }
  });

  // Build diseased set only from latest scans
  const plantsWithDiseaseScans = new Set();
  Object.values(latestScanByPlant).forEach(scan => {
    if (scan.analysis_result && hasDiseaseInScan(scan.analysis_result)) {
      plantsWithDiseaseScans.add(scan.plant_id.toString());
    }
  });

  const diseasedPlants = plantsWithDiseaseScans.size;

  // Initialize distributions
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

  const pestDistribution = {
    mealybug: 0,
    spider_mite: 0
  };

  let totalHealthScore = 0;
  let totalConfidenceScore = 0;
  let validScans = 0;
  let scansWithConfidence = 0;

  // Process month scans
  scansInMonth.forEach(scan => {
    const analysis = scan.analysis_result || {};
    const hasDisease = hasDiseaseInScan(analysis);
    const detectedConditions = Array.isArray(analysis.detected_conditions) ? analysis.detected_conditions : [];

    if (detectedConditions.length > 0) {
      detectedConditions.forEach(condition => {
        const conditionKey = resolveConditionKey(condition);
        if (conditionDistribution.hasOwnProperty(conditionKey)) {
          conditionDistribution[conditionKey]++;
        }
      });
    } else if (hasDisease) {
      const fallbackCondition = resolveConditionKey(analysis.disease_name || '');
      if (fallbackCondition && conditionDistribution.hasOwnProperty(fallbackCondition)) {
        conditionDistribution[fallbackCondition]++;
      }
    } else {
      conditionDistribution.healthy++;
    }

    collectPestsFromScan(scan).forEach((pestKey) => {
      if (pestDistribution.hasOwnProperty(pestKey)) {
        pestDistribution[pestKey]++;
      }
    });

    const scanHealthScore = analysis.health_score ?? analysis.plant_health_score;
    if (scanHealthScore !== undefined && scanHealthScore !== null) {
      totalHealthScore += Number(scanHealthScore);
      validScans++;
    }

    const confidenceScore = analysis.confidence_score ?? analysis.confidence;
    if (confidenceScore !== undefined && confidenceScore !== null) {
      totalConfidenceScore += Number(confidenceScore);
      scansWithConfidence++;
    }
  });

  const harvestRate = totalPlants > 0 ? ((harvestReadyPlants / totalPlants) * 100).toFixed(2) : 0;
  const diseaseRate = totalPlants > 0 ? ((diseasedPlants / totalPlants) * 100).toFixed(2) : 0;
  const averageHealthScore = validScans > 0 ? (totalHealthScore / validScans).toFixed(2) : 0;
  const averageConfidenceScore = scansWithConfidence > 0 ? (totalConfidenceScore / scansWithConfidence).toFixed(2) : 0;

  // Get unique plants monitored in the month
  const uniquePlantsInMonth = await Scan.find({
    user_id: req.user.id,
    createdAt: { $gte: start, $lte: end }
  }).distinct('plant_id');

  res.status(200).json({
    success: true,
    data: {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        month: targetMonth + 1,
        year: targetYear
      },
      timestamp: new Date(),
      analytics: {
        total_plants: totalPlants,
        total_scans: scansInMonth.length,
        plants_monitored_this_month: uniquePlantsInMonth.length,
        harvest_rate: `${harvestRate}%`,
        diseased_plants_count: diseasedPlants,
        disease_rate: `${diseaseRate}%`,
        healthy_plants_count: totalPlants - diseasedPlants,
        average_health_score: parseFloat(averageHealthScore),
        average_confidence_score: parseFloat(averageConfidenceScore),
        condition_distribution: conditionDistribution,
        pest_distribution: pestDistribution
      }
    }
  });
});

// @desc    Get comprehensive user analytics
// @route   GET /api/v1/analytics/user
// @access  Private
exports.getUserAnalytics = asyncHandler(async (req, res) => {
  const { period = 'all' } = req.query;

  let startDate, endDate;

  // Determine date range based on period
  endDate = new Date();
  if (period === 'daily') {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'weekly') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    // All time - just set a far start date
    startDate = new Date('2020-01-01');
  }

  // Fetch plant data
  const totalPlants = await Plant.countDocuments({ owner_id: req.user.id });

  const dateRangeFilter = { createdAt: { $gte: startDate, $lte: endDate } };

  // Scans and plants within date range
  const scansInRange = await Scan.find({
    user_id: req.user.id,
    ...dateRangeFilter
  }).lean();
  const totalScans = scansInRange.length;

  console.log(`[Analytics] Found ${scansInRange.length} scans for user ${req.user.id} in range ${startDate} to ${endDate}`);
  
  // Log first scan for debugging
  if (scansInRange.length > 0) {
    console.log('[Analytics] Sample scan:', JSON.stringify({
      _id: scansInRange[0]._id,
      plant_id: scansInRange[0].plant_id,
      disease_detected: scansInRange[0].analysis_result?.disease_detected,
      disease_severity: scansInRange[0].analysis_result?.disease_severity,
      detected_conditions: scansInRange[0].analysis_result?.detected_conditions
    }));
  }

  // Plants with harvest ready status
  const harvestReadyPlants = await Plant.countDocuments({
    owner_id: req.user.id,
    'current_status.harvest_ready': true
  });

  // Calculate harvest rate
  const harvestRate = totalPlants > 0 ? ((harvestReadyPlants / totalPlants) * 100).toFixed(2) : 0;

  // Count healthy/diseased plants from latest scan per plant in the selected period.
  // This prevents unscanned plants from being counted as "healthy".
  const latestScanByPlant = {};
  scansInRange.forEach((scan) => {
    if (!scan.plant_id) return;
    const plantId = scan.plant_id.toString();
    if (!latestScanByPlant[plantId] || new Date(scan.createdAt) > new Date(latestScanByPlant[plantId].createdAt)) {
      latestScanByPlant[plantId] = scan;
    }
  });

  const scannedPlantsCount = Object.keys(latestScanByPlant).length;
  let diseasedPlants = 0;
  Object.values(latestScanByPlant).forEach((scan) => {
    if (hasDiseaseInScan(scan.analysis_result || {})) diseasedPlants++;
  });
  const healthyPlants = Math.max(0, scannedPlantsCount - diseasedPlants);

  // Disease rate based on scanned plants for the selected period.
  const diseaseRate = scannedPlantsCount > 0 ? ((diseasedPlants / scannedPlantsCount) * 100).toFixed(2) : 0;

  // Initialize condition and pest distributions
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

  const pestDistribution = {
    mealybug: 0,
    spider_mite: 0
  };

  let totalHealthScore = 0;
  let totalConfidenceScore = 0;
  let validScans = 0;
  let scansWithConfidence = 0;
  let diseasedScans = 0;

  // Process scans to aggregate stats
  scansInRange.forEach(scan => {
    const analysis = scan.analysis_result || {};
    const hasDisease = hasDiseaseInScan(analysis);
    if (hasDisease) {
      diseasedScans++;
    }
    const detectedConditions = Array.isArray(analysis.detected_conditions) ? analysis.detected_conditions : [];

    if (detectedConditions.length > 0) {
      detectedConditions.forEach(condition => {
        const conditionKey = resolveConditionKey(condition);
        if (conditionDistribution.hasOwnProperty(conditionKey)) {
          conditionDistribution[conditionKey]++;
        }
      });
    } else if (hasDisease) {
      const fallbackCondition = resolveConditionKey(analysis.disease_name || '');
      if (fallbackCondition && conditionDistribution.hasOwnProperty(fallbackCondition)) {
        conditionDistribution[fallbackCondition]++;
      }
    } else {
      conditionDistribution.healthy++;
    }

    collectPestsFromScan(scan).forEach((pestKey) => {
      if (pestDistribution.hasOwnProperty(pestKey)) {
        pestDistribution[pestKey]++;
      }
    });

    const scanHealthScore = analysis.health_score ?? analysis.plant_health_score;
    if (scanHealthScore !== undefined && scanHealthScore !== null) {
      totalHealthScore += scanHealthScore;
      validScans++;
    }

    const confidenceScore = analysis.confidence_score ?? analysis.confidence;
    if (confidenceScore !== undefined && confidenceScore !== null) {
      totalConfidenceScore += confidenceScore;
      scansWithConfidence++;
    }
  });

  // Calculate averages
  const averageHealthScore = validScans > 0 ? (totalHealthScore / validScans).toFixed(2) : 0;
  const averageConfidenceScore = scansWithConfidence > 0 ? (totalConfidenceScore / scansWithConfidence).toFixed(2) : 0;
  const healthyScans = Math.max(0, totalScans - diseasedScans);

  // Get recent scan activity for the selected period only
  const recentScans = await Scan.find({
    user_id: req.user.id,
    ...dateRangeFilter
  })
    .sort({ createdAt: -1 })
    .populate('plant_id', 'plant_id location')
    .select('plant_id analysis_result.health_score analysis_result.plant_health_score analysis_result.detected_conditions analysis_result.disease_detected analysis_result.disease_name analysis_result.disease_severity createdAt');

  res.status(200).json({
    success: true,
    data: {
      period,
      timestamp: new Date(),
      analytics: {
        total_plants: totalPlants,
        total_scans: totalScans,
        healthy_scans_count: healthyScans,
        diseased_scans_count: diseasedScans,
        harvest_rate: `${harvestRate}%`,
        diseased_plants_count: diseasedPlants,
        disease_rate: `${diseaseRate}%`,
        healthy_plants_count: healthyPlants,
        average_health_score: parseFloat(averageHealthScore),
        average_confidence_score: parseFloat(averageConfidenceScore),
        condition_distribution: conditionDistribution,
        pest_distribution: pestDistribution,
        recent_scan_activity: recentScans
      }
    }
  });
});

// @desc    Get summary statistics
// @route   GET /api/v1/analytics/summary
// @access  Private
exports.getSummary = asyncHandler(async (req, res) => {
  const totalScanEvents = await Scan.countDocuments({ user_id: req.user.id });

  // Compute diseased plants from each plant's latest scan for consistency
  // with scan history and analytics/user endpoint.
  const scans = await Scan.find({ user_id: req.user.id })
    .sort({ createdAt: -1 })
    .select('plant_id analysis_result createdAt')
    .lean();

  const latestScanByPlant = {};
  scans.forEach(scan => {
    if (!scan.plant_id) return;
    const plantId = scan.plant_id.toString();
    if (!latestScanByPlant[plantId]) {
      latestScanByPlant[plantId] = scan;
    }
  });

  const trackedPlantIds = Object.keys(latestScanByPlant);
  const totalScans = trackedPlantIds.length;
  const totalPlants = trackedPlantIds.length;

  const harvestReadyPlants = totalPlants > 0
    ? await Plant.countDocuments({
        owner_id: req.user.id,
        _id: { $in: trackedPlantIds },
        'current_status.harvest_ready': true
      })
    : 0;

  let diseasedPlants = 0;
  Object.values(latestScanByPlant).forEach(scan => {
    if (hasDiseaseInScan(scan.analysis_result || {})) {
      diseasedPlants++;
    }
  });

  const harvestRate = totalPlants > 0 ? ((harvestReadyPlants / totalPlants) * 100).toFixed(2) : 0;
  const diseaseRate = totalPlants > 0 ? ((diseasedPlants / totalPlants) * 100).toFixed(2) : 0;

  const recentScans = await Scan.find({ user_id: req.user.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('plant_id', 'plant_id location');

  const summary = {
    total_plants: totalPlants,
    total_scans: totalScans,
    total_scan_events: totalScanEvents,
    harvest_ready: harvestReadyPlants,
    harvest_rate: `${harvestRate}%`,
    diseased_plants: diseasedPlants,
    total_diseases: diseasedPlants,
    disease_rate: `${diseaseRate}%`,
    healthy_plants: totalPlants - diseasedPlants
  };

  res.status(200).json({
    success: true,
    data: {
      ...summary,
      summary,
      recent_scans: recentScans
    }
  });
});

