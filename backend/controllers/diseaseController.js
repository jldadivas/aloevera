const DiseaseKnowledge = require('../models/diseaseKnowledge');
const asyncHandler = require('../utils/controllerWrapper');

// @desc    Get all diseases
// @route   GET /api/v1/diseases
// @access  Public
exports.getDiseases = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { disease_name: { $regex: search, $options: 'i' } },
      { display_name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const diseases = await DiseaseKnowledge.find(query)
    .sort({ display_name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await DiseaseKnowledge.countDocuments(query);

  res.status(200).json({
    success: true,
    count: diseases.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: {
      diseases
    }
  });
});

// @desc    Get single disease
// @route   GET /api/v1/diseases/:id
// @access  Public
exports.getDisease = asyncHandler(async (req, res) => {
  const disease = await DiseaseKnowledge.findById(req.params.id);

  if (!disease) {
    return res.status(404).json({
      success: false,
      error: 'Disease not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      disease
    }
  });
});

// @desc    Get disease by name
// @route   GET /api/v1/diseases/name/:name
// @access  Public
exports.getDiseaseByName = asyncHandler(async (req, res) => {
  const disease = await DiseaseKnowledge.findOne({
    disease_name: req.params.name
  });

  if (!disease) {
    return res.status(404).json({
      success: false,
      error: 'Disease not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      disease
    }
  });
});

// @desc    Get treatment recommendations
// @route   GET /api/v1/diseases/:name/treatment
// @access  Public
exports.getTreatment = asyncHandler(async (req, res) => {
  const { severity = 'moderate' } = req.query;
  const { name } = req.params;

  const treatment = await DiseaseKnowledge.getTreatment(name, severity);

  if (!treatment) {
    return res.status(404).json({
      success: false,
      error: 'Disease not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      treatment
    }
  });
});

// @desc    Create disease (Admin only)
// @route   POST /api/v1/diseases
// @access  Private/Admin
exports.createDisease = asyncHandler(async (req, res) => {
  const disease = await DiseaseKnowledge.create(req.body);

  res.status(201).json({
    success: true,
    data: {
      disease
    }
  });
});

// @desc    Update disease (Admin only)
// @route   PUT /api/v1/diseases/:id
// @access  Private/Admin
exports.updateDisease = asyncHandler(async (req, res) => {
  let disease = await DiseaseKnowledge.findById(req.params.id);

  if (!disease) {
    return res.status(404).json({
      success: false,
      error: 'Disease not found'
    });
  }

  disease = await DiseaseKnowledge.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: {
      disease
    }
  });
});

// @desc    Delete disease (Admin only)
// @route   DELETE /api/v1/diseases/:id
// @access  Private/Admin
exports.deleteDisease = asyncHandler(async (req, res) => {
  const disease = await DiseaseKnowledge.findById(req.params.id);

  if (!disease) {
    return res.status(404).json({
      success: false,
      error: 'Disease not found'
    });
  }

  await disease.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Disease deleted successfully'
  });
});

