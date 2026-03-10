const TrainingDataset = require('../models/trainingDataset');
const Scan = require('../models/scan');
const asyncHandler = require('../utils/controllerWrapper');

// @desc    Get all training dataset entries
// @route   GET /api/v1/training
// @access  Private/Admin
exports.getTrainingDataset = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, validation_status, label } = req.query;

  const query = {};

  if (validation_status) {
    query.validation_status = validation_status;
  }

  if (label) {
    query.label = label;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const dataset = await TrainingDataset.find(query)
    .populate('source_scan_id', 'image_data analysis_result')
    .populate('validated_by', 'full_name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await TrainingDataset.countDocuments(query);

  res.status(200).json({
    success: true,
    count: dataset.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: {
      dataset
    }
  });
});

// @desc    Get pending validations
// @route   GET /api/v1/training/pending
// @access  Private/Admin
exports.getPendingValidations = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const pending = await TrainingDataset.getPendingValidations(parseInt(limit));

  res.status(200).json({
    success: true,
    count: pending.length,
    data: {
      pending
    }
  });
});

// @desc    Validate training dataset entry
// @route   PUT /api/v1/training/:id/validate
// @access  Private/Admin
exports.validateEntry = asyncHandler(async (req, res) => {
  const { label, notes, corrected_label } = req.body;

  let entry = await TrainingDataset.findById(req.params.id);

  if (!entry) {
    return res.status(404).json({
      success: false,
      error: 'Training dataset entry not found'
    });
  }

  const updateData = {
    validation_status: 'validated',
    validated_by: req.user.id,
    validation_date: new Date()
  };

  if (label) {
    updateData.label = label;
  }

  if (corrected_label) {
    updateData.metadata = {
      ...entry.metadata,
      original_prediction: entry.label,
      corrected_label: corrected_label
    };
    updateData.label = corrected_label;
  }

  if (notes) {
    updateData.validation_notes = notes;
  }

  entry = await TrainingDataset.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('validated_by', 'full_name email');

  res.status(200).json({
    success: true,
    data: {
      entry
    },
    message: 'Entry validated successfully'
  });
});

// @desc    Reject training dataset entry
// @route   PUT /api/v1/training/:id/reject
// @access  Private/Admin
exports.rejectEntry = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  let entry = await TrainingDataset.findById(req.params.id);

  if (!entry) {
    return res.status(404).json({
      success: false,
      error: 'Training dataset entry not found'
    });
  }

  const updateData = {
    validation_status: 'rejected',
    validated_by: req.user.id,
    validation_date: new Date()
  };

  if (notes) {
    updateData.validation_notes = notes;
  }

  entry = await TrainingDataset.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('validated_by', 'full_name email');

  res.status(200).json({
    success: true,
    data: {
      entry
    },
    message: 'Entry rejected'
  });
});

// @desc    Export training batch
// @route   POST /api/v1/training/export
// @access  Private/Admin
exports.exportBatch = asyncHandler(async (req, res) => {
  const { batchName } = req.body;

  if (!batchName) {
    return res.status(400).json({
      success: false,
      error: 'Batch name is required'
    });
  }

  const batch = await TrainingDataset.exportBatch(batchName);

  res.status(200).json({
    success: true,
    count: batch.length,
    data: {
      batch,
      batch_name: batchName
    },
    message: `Exported ${batch.length} images for training batch: ${batchName}`
  });
});

// @desc    Auto-flag low confidence predictions
// @route   POST /api/v1/training/auto-flag
// @access  Private/Admin
exports.autoFlagLowConfidence = asyncHandler(async (req, res) => {
  const { threshold = 0.7 } = req.query;

  const flagged = await TrainingDataset.autoFlagLowConfidence(parseFloat(threshold));

  res.status(200).json({
    success: true,
    count: flagged.length,
    data: {
      flagged
    },
    message: `Flagged ${flagged.length} low-confidence predictions for validation`
  });
});

// @desc    Get training statistics
// @route   GET /api/v1/training/stats
// @access  Private/Admin
exports.getStats = asyncHandler(async (req, res) => {
  const total = await TrainingDataset.countDocuments();
  const pending = await TrainingDataset.countDocuments({ validation_status: 'pending' });
  const validated = await TrainingDataset.countDocuments({ validation_status: 'validated' });
  const rejected = await TrainingDataset.countDocuments({ validation_status: 'rejected' });
  const inTraining = await TrainingDataset.countDocuments({ added_to_training: true });

  // Count by label
  const labelDistribution = await TrainingDataset.aggregate([
    {
      $group: {
        _id: '$label',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      pending,
      validated,
      rejected,
      in_training: inTraining,
      label_distribution: labelDistribution
    }
  });
});

