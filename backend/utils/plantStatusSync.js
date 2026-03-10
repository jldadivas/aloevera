const Plant = require('../models/plant');
const Scan = require('../models/scan');

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeKey = (value = '') => String(value).toLowerCase().trim().replace(/[-\s]+/g, '_');

const isHealthyMarker = (value = '') => {
  const normalized = normalizeKey(value);
  return !normalized || ['none', 'healthy', 'normal', 'no_disease', 'no_issue', 'clear'].includes(normalized);
};

const hasDiseaseInAnalysis = (analysis = {}) => {
  if (!analysis) return false;
  if (analysis.disease_detected === true) return true;
  if (!isHealthyMarker(analysis.disease_severity)) return true;
  if (Array.isArray(analysis.detected_conditions)) {
    const hasFlagged = analysis.detected_conditions.some((item) => !isHealthyMarker(item));
    if (hasFlagged) return true;
  }
  return !isHealthyMarker(analysis.disease_name);
};

const resolvePrimaryCondition = (analysis = {}) => {
  if (Array.isArray(analysis.detected_conditions)) {
    const flagged = analysis.detected_conditions
      .map((item) => normalizeKey(item))
      .find((item) => !isHealthyMarker(item));
    if (flagged) return flagged;
  }

  const fromName = normalizeKey(analysis.disease_name);
  if (!isHealthyMarker(fromName)) return fromName;
  if (hasDiseaseInAnalysis(analysis)) return 'unknown';
  return 'healthy';
};

async function syncPlantStatusFromLatestScan(plantId, options = {}) {
  if (!plantId) return;
  const { deletePlantIfNoScans = false } = options;

  const latestScan = await Scan.findOne({ plant_id: plantId })
    .sort({ createdAt: -1 })
    .select('analysis_result createdAt')
    .lean();

  if (!latestScan || !latestScan.analysis_result) {
    if (deletePlantIfNoScans) {
      await Plant.findByIdAndDelete(plantId);
      return;
    }

    await Plant.findByIdAndUpdate(plantId, {
      $set: {
        'current_status.last_scan_date': null,
        'current_status.health_score': 100,
        'current_status.harvest_ready': false,
        'current_status.primary_condition': 'healthy',
        'current_status.disease_severity': 'none',
        'current_status.estimated_days_to_harvest': null
      }
    });
    return;
  }

  const analysis = latestScan.analysis_result || {};
  const diseaseDetected = hasDiseaseInAnalysis(analysis);
  const healthScore = asNumber(analysis.health_score ?? analysis.plant_health_score, 95);
  const primaryCondition = resolvePrimaryCondition(analysis);
  const diseaseSeverity = analysis.disease_severity || (diseaseDetected ? 'low' : 'none');

  await Plant.findByIdAndUpdate(plantId, {
    $set: {
      'current_status.last_scan_date': latestScan.createdAt || new Date(),
      'current_status.health_score': healthScore,
      'current_status.harvest_ready': Boolean(analysis.harvest_ready),
      'current_status.primary_condition': primaryCondition,
      'current_status.disease_severity': diseaseSeverity,
      'current_status.estimated_days_to_harvest': analysis.estimated_days_to_harvest ?? null
    }
  });
}

module.exports = {
  syncPlantStatusFromLatestScan
};
