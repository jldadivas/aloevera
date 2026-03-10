const Scan = require('../models/scan');
const Plant = require('../models/plant');
const mongoose = require('mongoose');
const { uploadImage, generateThumbnail } = require('../services/imageService');
const { processScanAsync: processScanAsyncLegacy } = require('../services/scanAnalysisService');
const mlService = require('../services/mlIntegrationService');
const { syncPlantStatusFromLatestScan } = require('../utils/plantStatusSync');
const asyncHandler = require('../utils/controllerWrapper');

const isAloeSpecies = (species = '') => /aloe/i.test(String(species || ''));

// @desc    Create new scan
// @route   POST /api/v1/scans
// @access  Private
exports.createScan = asyncHandler(async (req, res) => {
  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload an image'
    });
  }

  try {
    let plant;
    let shouldAutoCreatePlant = false;
    const requestedPlantId = req.body.plant_id;

    if (requestedPlantId) {
      if (!mongoose.Types.ObjectId.isValid(requestedPlantId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plant ID'
        });
      }

      plant = await Plant.findOne({
        _id: requestedPlantId,
        owner_id: req.user.id
      });

      if (!plant) {
        return res.status(404).json({
          success: false,
          error: 'Plant not found'
        });
      }

      if (!isAloeSpecies(plant.species)) {
        return res.status(400).json({
          success: false,
          error: 'Only Aloe Vera plants can be scanned.'
        });
      }
    } else {
      // Default scan target: most recently updated Aloe plant of the user.
      // Auto-create only when user has no Aloe plant yet.
      plant = await Plant.findOne({
        owner_id: req.user.id,
        species: { $regex: 'aloe', $options: 'i' }
      }).sort({ updatedAt: -1, createdAt: -1 });

      if (!plant) {
        // Delay auto-create until after ML validation succeeds
        shouldAutoCreatePlant = true;
      }
    }

    // Upload image to Cloudinary
    let uploadResult;
    try {
      console.log(`[SCAN] Uploading image for user: ${req.user.id}, file: ${req.file.originalname}, size: ${req.file.size}`);
      uploadResult = await uploadImage(req.file.buffer, 'aloe-vera-scans');
      console.log(`[SCAN] Cloudinary upload success: ${uploadResult.public_id}`);
    } catch (uploadErr) {
      console.error('[SCAN] Cloudinary upload error for user:', req.user.id);
      console.error('[SCAN] Error details:', uploadErr.message);
      console.error('[SCAN] Error stack:', uploadErr.stack);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image to cloud storage: ' + uploadErr.message
      });
    }

    // Generate thumbnail
    const thumbnailUrl = await generateThumbnail(uploadResult.public_id);

    // Call ML service for analysis (required)
    let mlResult = null;
    let analysisResult = null;
    let yoloPredictions = [];
    let recommendations = [];
    let extractedFeatures = {};
    let mlMetadata = {};

    try {
      mlResult = await mlService.scanPlant(req.file.buffer, req.file.originalname);
      if (!mlResult?.success) {
        return res.status(502).json({
          success: false,
          error: 'ML analysis failed. Scan was not saved.'
        });
      }

      // Format ML results for storage
      const formatted = mlService.formatScanResults(mlResult);
      analysisResult = formatted.analysis_result;
      yoloPredictions = formatted.yolo_predictions;
      recommendations = formatted.recommendations;
      extractedFeatures = formatted.extracted_features;
      mlMetadata = formatted.ml_metadata;
    } catch (mlErr) {
      const errorMessage = String(mlErr?.message || '');
      const isAloeValidationError = /aloe vera plant not detected|invalid image/i.test(errorMessage);

      if (isAloeValidationError) {
        return res.status(400).json({
          success: false,
          error: 'Only Aloe Vera plants can be scanned. Please upload a clear Aloe Vera photo.'
        });
      }

      console.warn('ML Service processing failed (blocking):', mlErr.message);
      return res.status(503).json({
        success: false,
        error: 'ML service unavailable or analysis failed. Scan was not saved.'
      });
    }

    if (shouldAutoCreatePlant) {
      const aloeCount = await Plant.countDocuments({
        owner_id: req.user.id,
        species: { $regex: 'aloe', $options: 'i' }
      });

      const sequence = aloeCount + 1;
      plant = await Plant.create({
        owner_id: req.user.id,
        common_name: sequence === 1 ? 'Aloe Vera' : `Aloe Vera ${sequence}`,
        species: 'Aloe barbadensis',
        location: {
          farm_name: 'Home',
          plot_number: String(sequence)
        },
        current_status: {
          health_score: 100,
          harvest_ready: false,
          disease_severity: 'none'
        },
        planting_date: new Date()
      });
    }

    // Create scan record with ML analysis
    const scanData = {
      plant_id: plant._id,
      user_id: req.user.id,
      image_data: {
        original_url: uploadResult.secure_url,
        thumbnail_url: thumbnailUrl,
        file_size: req.file.size,
        dimensions: {
          width: uploadResult.width || 0,
          height: uploadResult.height || 0
        }
      },
      scan_metadata: {
        device_type: req.headers['user-agent'] || 'unknown',
        app_version: req.body.app_version || '1.0.0'
      },
      yolo_predictions: yoloPredictions,
      visual_features: extractedFeatures.detected_features || {},
      analysis_result: analysisResult,
      recommendations: recommendations,
      ml_metadata: mlMetadata
    };

    const scan = await Scan.create(scanData);

    // Keep plant status aligned with latest scan using shared resolver logic.
    await syncPlantStatusFromLatestScan(plant._id);

    res.status(201).json({
      success: true,
      data: {
        scan
      },
      message: 'Scan created successfully with AI analysis.'
    });
  } catch (error) {
    console.error('Scan creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create scan'
    });
  }
});

// @desc    Get all scans
// @route   GET /api/v1/scans
// @access  Private
exports.getScans = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, plant_id, disease_detected } = req.query;

  const aloePlants = await Plant.find(
    { owner_id: req.user.id, species: { $regex: 'aloe', $options: 'i' } },
    { _id: 1 }
  ).lean();
  const aloePlantIds = aloePlants.map((p) => p._id);

  if (aloePlantIds.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      total: 0,
      page: parseInt(page),
      pages: 0,
      data: { scans: [] }
    });
  }

  // Build query
  const query = { user_id: req.user.id, plant_id: { $in: aloePlantIds } };

  if (plant_id) {
    // Verify plant belongs to user
    const plant = await Plant.findOne({
      _id: plant_id,
      owner_id: req.user.id
    });

    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found'
      });
    }

    if (!isAloeSpecies(plant.species)) {
      return res.status(400).json({
        success: false,
        error: 'Only Aloe Vera scans are available in this module.'
      });
    }

    query.plant_id = plant_id;
  }

  if (disease_detected !== undefined) {
    query['analysis_result.disease_detected'] = disease_detected === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const scans = await Scan.find(query)
    .populate('plant_id', 'plant_id location')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Scan.countDocuments(query);

  res.status(200).json({
    success: true,
    count: scans.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: {
      scans
    }
  });
});

// @desc    Get single scan
// @route   GET /api/v1/scans/:id
// @access  Private
exports.getScan = asyncHandler(async (req, res) => {
  const scan = await Scan.findOne({
    _id: req.params.id,
    user_id: req.user.id
  }).populate('plant_id', 'plant_id location planting_date species');

  if (!scan || !isAloeSpecies(scan.plant_id?.species)) {
    return res.status(404).json({
      success: false,
      error: 'Scan not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      scan
    }
  });
});

// @desc    Update scan (for ML results)
// @route   PUT /api/v1/scans/:id
// @access  Private
exports.updateScan = asyncHandler(async (req, res) => {
  let scan = await Scan.findOne({
    _id: req.params.id,
    user_id: req.user.id
  });

  if (!scan) {
    return res.status(404).json({
      success: false,
      error: 'Scan not found'
    });
  }

  // Only allow updating analysis results and metadata
  const allowedFields = [
    'yolo_predictions',
    'visual_features',
    'analysis_result',
    'recommendations',
    'scan_metadata',
    'self_learning_status'
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  scan = await Scan.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('plant_id', 'plant_id location');

  // Update plant status based on latest scan using shared resolver logic.
  if (scan.analysis_result) {
    await syncPlantStatusFromLatestScan(scan.plant_id?._id || scan.plant_id);
  }

  res.status(200).json({
    success: true,
    data: {
      scan
    }
  });
});

// @desc    Delete scan
// @route   DELETE /api/v1/scans/:id
// @access  Private
exports.deleteScan = asyncHandler(async (req, res) => {
  const scan = await Scan.findOne({
    _id: req.params.id,
    user_id: req.user.id
  });

  if (!scan) {
    return res.status(404).json({
      success: false,
      error: 'Scan not found'
    });
  }

  // Delete image from Cloudinary if needed
  // (Implementation can be added later)

  const plantId = scan.plant_id;
  await scan.deleteOne();

  if (plantId) {
    try {
      await syncPlantStatusFromLatestScan(plantId, { deletePlantIfNoScans: true });
    } catch (syncError) {
      console.warn(`[SCAN] Failed to sync plant status after scan delete (${String(plantId)}):`, syncError.message);
    }
  }

  res.status(200).json({
    success: true,
    data: {},
    message: 'Scan deleted successfully'
  });
});

// @desc    Get scans by plant
// @route   GET /api/v1/scans/plant/:plantId
// @access  Private
exports.getScansByPlant = asyncHandler(async (req, res) => {
  const { plantId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Verify plant belongs to user
  const plant = await Plant.findOne({
    _id: plantId,
    owner_id: req.user.id
  });

  if (!plant) {
    return res.status(404).json({
      success: false,
      error: 'Plant not found'
    });
  }

  if (!isAloeSpecies(plant.species)) {
    return res.status(400).json({
      success: false,
      error: 'Only Aloe Vera scans are available in this module.'
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const scans = await Scan.find({
    plant_id: plantId,
    user_id: req.user.id
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Scan.countDocuments({
    plant_id: plantId,
    user_id: req.user.id
  });

  res.status(200).json({
    success: true,
    count: scans.length,
    total,
    data: {
      scans
    }
  });
});

