const Plant = require('../models/plant');
const asyncHandler = require('../utils/controllerWrapper');

// @desc    Get all plants
// @route   GET /api/v1/plants
// @access  Private
exports.getPlants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, harvest_ready, health_status } = req.query;
  
  // Build query
  const query = { owner_id: req.user.id };
  
  if (search) {
    query.$or = [
      { plant_id: { $regex: search, $options: 'i' } },
      { 'location.farm_name': { $regex: search, $options: 'i' } },
      { 'location.plot_number': { $regex: search, $options: 'i' } }
    ];
  }
  
  if (harvest_ready !== undefined) {
    query['current_status.harvest_ready'] = harvest_ready === 'true';
  }
  
  if (health_status) {
    query['current_status.primary_condition'] = health_status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const plants = await Plant.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Plant.countDocuments(query);

  res.status(200).json({
    success: true,
    count: plants.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: {
      plants
    }
  });
});

// @desc    Get single plant
// @route   GET /api/v1/plants/:id
// @access  Private
exports.getPlant = asyncHandler(async (req, res) => {
  const plant = await Plant.findOne({
    _id: req.params.id,
    owner_id: req.user.id
  });

  if (!plant) {
    return res.status(404).json({
      success: false,
      error: 'Plant not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      plant
    }
  });
});

// @desc    Create new plant
// @route   POST /api/v1/plants
// @access  Private
exports.createPlant = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.owner_id = req.user.id;
  req.body.common_name = req.body.common_name || 'Aloe Vera';
  req.body.species = 'Aloe barbadensis';

  const plant = await Plant.create(req.body);

  res.status(201).json({
    success: true,
    data: {
      plant
    }
  });
});

// @desc    Update plant
// @route   PUT /api/v1/plants/:id
// @access  Private
exports.updatePlant = asyncHandler(async (req, res) => {
  let plant = await Plant.findOne({
    _id: req.params.id,
    owner_id: req.user.id
  });

  if (!plant) {
    return res.status(404).json({
      success: false,
      error: 'Plant not found'
    });
  }

  // Remove fields that shouldn't be updated
  delete req.body.plant_id;
  delete req.body.owner_id;
  delete req.body.species;

  plant = await Plant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: {
      plant
    }
  });
});

// @desc    Delete plant
// @route   DELETE /api/v1/plants/:id
// @access  Private
exports.deletePlant = asyncHandler(async (req, res) => {
  const plant = await Plant.findOne({
    _id: req.params.id,
    owner_id: req.user.id
  });

  if (!plant) {
    return res.status(404).json({
      success: false,
      error: 'Plant not found'
    });
  }

  await plant.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Plant deleted successfully'
  });
});

// @desc    Get plants by status
// @route   GET /api/v1/plants/status/:status
// @access  Private
exports.getPlantsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const query = {
    owner_id: req.user.id,
    'current_status.harvest_ready': status === 'harvest-ready'
  };

  if (status === 'diseased') {
    query['current_status.disease_severity'] = { $ne: 'none' };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const plants = await Plant.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Plant.countDocuments(query);

  res.status(200).json({
    success: true,
    count: plants.length,
    total,
    data: {
      plants
    }
  });
});

// @desc    Apply plant management action (harvest/treatment/isolation/rescan)
// @route   PUT /api/v1/plants/:id/action
// @access  Private
exports.applyPlantAction = asyncHandler(async (req, res) => {
  const { action, note = '', photo_url = '' } = req.body;
  const validActions = new Set([
    'isolate',
    'start_treatment',
    'rescan_3_days',
    'rescan_7_days',
    'mark_for_harvest',
    'harvest_completed',
    'log_yield',
    'remove_infected_leaves',
    'dispose_plant',
    'disinfect_area',
    'spot_check_nearby'
  ]);

  if (!action || !validActions.has(action)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid action'
    });
  }

  const plant = await Plant.findOne({
    _id: req.params.id,
    owner_id: req.user.id
  });

  if (!plant) {
    return res.status(404).json({
      success: false,
      error: 'Plant not found'
    });
  }

  const now = new Date();
  const setOps = {};

  if (action === 'isolate') {
    setOps['current_status.is_isolated'] = true;
    setOps['current_status.needs_treatment'] = true;
  }

  if (action === 'start_treatment') {
    setOps['current_status.needs_treatment'] = true;
    setOps['current_status.treatment_started_at'] = now;
    setOps['current_status.is_isolated'] = true;
    setOps['current_status.harvest_ready'] = false;
  }

  if (action === 'rescan_3_days') {
    setOps['current_status.next_rescan_date'] = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  }

  if (action === 'rescan_7_days') {
    setOps['current_status.next_rescan_date'] = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  if (action === 'mark_for_harvest') {
    setOps['current_status.harvest_ready'] = true;
    setOps['current_status.harvest_marked_at'] = now;
  }

  if (action === 'harvest_completed') {
    setOps['current_status.harvest_ready'] = false;
    setOps['current_status.harvest_completed_at'] = now;
    setOps['current_status.needs_treatment'] = false;
    setOps['current_status.is_isolated'] = false;
    setOps['current_status.next_rescan_date'] = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  }

  if (action === 'remove_infected_leaves') {
    setOps['current_status.needs_treatment'] = true;
    setOps['current_status.is_isolated'] = true;
  }

  if (action === 'dispose_plant') {
    const existing = plant.metadata?.notes ? `${plant.metadata.notes}\n` : '';
    setOps['metadata.notes'] = `${existing}[${now.toISOString()}] Plant disposal recommended/completed.`;
  }

  if (action === 'spot_check_nearby') {
    setOps['current_status.next_rescan_date'] = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  // Preserve compatibility by writing only targeted fields and appending one log entry.
  // This avoids full-document validation failures from legacy data on unrelated fields.
  const updatedPlant = await Plant.findOneAndUpdate(
    { _id: req.params.id, owner_id: req.user.id },
    {
      ...(Object.keys(setOps).length ? { $set: setOps } : {}),
      $push: {
        management_logs: {
          action,
          note: note || '',
          photo_url: photo_url || '',
          created_at: now
        }
      }
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: {
      plant: updatedPlant
    },
    message: `Action applied: ${action}`
  });
});

