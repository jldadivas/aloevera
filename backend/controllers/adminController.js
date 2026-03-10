const User = require('../models/user');
const Scan = require('../models/scan');
const Plant = require('../models/plant');
const CommunityPost = require('../models/communityPost');
const CommunityReport = require('../models/communityReport');
const SupportTicket = require('../models/supportTicket');
const controllerWrapper = require('../utils/controllerWrapper');
const { syncPlantStatusFromLatestScan } = require('../utils/plantStatusSync');
const axios = require('axios');

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

const crcTable = (() => {
  const table = new Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const toDosDateTime = (date = new Date()) => {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = ((hours & 0x1f) << 11) | ((minutes & 0x3f) << 5) | (seconds & 0x1f);
  const dosDate = (((year - 1980) & 0x7f) << 9) | ((month & 0x0f) << 5) | (day & 0x1f);
  return { dosTime, dosDate };
};

const extFromContentType = (contentType = '') => {
  const normalized = String(contentType).toLowerCase();
  if (normalized.includes('image/jpeg') || normalized.includes('image/jpg')) return '.jpg';
  if (normalized.includes('image/png')) return '.png';
  if (normalized.includes('image/webp')) return '.webp';
  if (normalized.includes('image/gif')) return '.gif';
  if (normalized.includes('image/bmp')) return '.bmp';
  return '.jpg';
};

const sanitizeName = (value = '') => String(value).replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '');

const createZipBuffer = (entries) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach((entry) => {
    const fileNameBuffer = Buffer.from(entry.name, 'utf8');
    const data = entry.data;
    const { dosTime, dosDate } = toDosDateTime(entry.date);
    const crc = crc32(data);
    const size = data.length;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(size, 18);
    localHeader.writeUInt32LE(size, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, fileNameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(size, 20);
    centralHeader.writeUInt32LE(size, 24);
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, fileNameBuffer);

    offset += localHeader.length + fileNameBuffer.length + size;
  });

  const centralDir = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDir.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, endRecord]);
};

const buildScanQuery = async ({
  startDate,
  endDate,
  disease,
  minConfidence,
  plantSpecies
}) => {
  const query = {};

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (disease && disease !== 'all') {
    if (disease === 'healthy') {
      query['analysis_result.disease_detected'] = false;
    } else {
      query.$or = [
        { 'analysis_result.disease_name': new RegExp(disease, 'i') },
        { 'analysis_result.detected_conditions': { $elemMatch: { $regex: disease, $options: 'i' } } }
      ];
    }
  }

  if (minConfidence !== undefined && minConfidence !== '') {
    const threshold = parseFloat(minConfidence);
    if (!Number.isNaN(threshold)) {
      query.$or = [
        ...(query.$or || []),
        { 'analysis_result.confidence_score': { $gte: threshold } },
        { 'analysis_result.confidence': { $gte: threshold } }
      ];
    }
  }

  if (plantSpecies) {
    const matchingPlants = await Plant.find({
      species: { $regex: plantSpecies, $options: 'i' }
    }).select('_id');
    const plantIds = matchingPlants.map((p) => p._id);
    query.plant_id = { $in: plantIds };
  }

  return query;
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

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = controllerWrapper(async (req, res, next) => {
  const users = await User.find().select('-password_hash').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
exports.getUser = controllerWrapper(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password_hash');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
exports.updateUser = controllerWrapper(async (req, res, next) => {
  const fieldsToUpdate = {};

  if (req.body.full_name !== undefined) fieldsToUpdate.full_name = req.body.full_name;
  if (req.body.role !== undefined) fieldsToUpdate.role = req.body.role;
  if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone;
  if (req.body.preferences !== undefined) fieldsToUpdate.preferences = req.body.preferences;

  if (req.body.is_active !== undefined) {
    const isActive = Boolean(req.body.is_active);
    fieldsToUpdate.is_active = isActive;

    if (!isActive) {
      const reason = (req.body.deactivation_reason || '').trim();
      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Deactivation reason is required'
        });
      }
      fieldsToUpdate.deactivation_reason = reason;
      fieldsToUpdate.deactivated_at = new Date();
    } else {
      fieldsToUpdate.deactivation_reason = '';
      fieldsToUpdate.deactivated_at = null;
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-password_hash');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
exports.deleteUser = controllerWrapper(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Create admin user
// @route   POST /api/v1/admin/create-admin
// @access  Private/Admin
exports.createAdmin = controllerWrapper(async (req, res, next) => {
  const { email, password, full_name, phone } = req.body;

  // Validate required fields
  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email, password, and full_name'
    });
  }

  // Check if admin already exists
  const adminExists = await User.findOne({ email: email.toLowerCase() });
  if (adminExists) {
    return res.status(400).json({
      success: false,
      error: 'Admin already exists with this email'
    });
  }

  // Create admin user
  const admin = await User.create({
    email: email.toLowerCase(),
    password_hash: password, // Will be hashed by pre-save hook
    full_name,
    phone,
    role: 'admin',
    is_active: true
  });

  res.status(201).json({
    success: true,
    data: {
      id: admin._id,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
      message: 'Admin user created successfully'
    }
  });
});

// @desc    Get scans across all users (admin oversight)
// @route   GET /api/v1/admin/scans
// @access  Private/Admin
exports.getAllScans = controllerWrapper(async (req, res) => {
  const {
    startDate,
    endDate,
    disease,
    minConfidence,
    plantSpecies,
    page = 1,
    limit = 20
  } = req.query;

  const query = await buildScanQuery({ startDate, endDate, disease, minConfidence, plantSpecies });

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const scans = await Scan.find(query)
    .populate('user_id', 'email full_name')
    .populate('plant_id', 'plant_id common_name species location current_status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const total = await Scan.countDocuments(query);

  res.status(200).json({
    success: true,
    count: scans.length,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    data: scans
  });
});

// @desc    Export scanned plant images as ZIP (admin)
// @route   GET /api/v1/admin/scans/images/zip
// @access  Private/Admin
exports.exportScanImagesZip = controllerWrapper(async (req, res) => {
  const { startDate, endDate, disease, minConfidence, plantSpecies } = req.query;
  const query = await buildScanQuery({ startDate, endDate, disease, minConfidence, plantSpecies });

  const scans = await Scan.find(query)
    .populate('user_id', 'email full_name')
    .populate('plant_id', 'plant_id')
    .sort({ createdAt: -1 })
    .select('scan_id createdAt analysis_result image_data user_id plant_id')
    .lean();

  if (!scans.length) {
    return res.status(404).json({
      success: false,
      error: 'No scans matched filters.'
    });
  }

  const zipEntries = [];

  for (let i = 0; i < scans.length; i += 1) {
    const scan = scans[i];
    const sourceUrl =
      scan.image_data?.original_url ||
      scan.image_data?.annotated_url ||
      scan.image_data?.thumbnail_url;

    if (!sourceUrl) continue;

    try {
      const response = await axios.get(sourceUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      const data = Buffer.from(response.data);
      if (!data.length) continue;

      let ext = '.jpg';
      try {
        const pathname = new URL(sourceUrl).pathname || '';
        const dotIndex = pathname.lastIndexOf('.');
        if (dotIndex !== -1) {
          const candidate = pathname.substring(dotIndex).toLowerCase();
          if (candidate.length <= 6) ext = candidate;
        } else {
          ext = extFromContentType(response.headers?.['content-type']);
        }
      } catch (_) {
        ext = extFromContentType(response.headers?.['content-type']);
      }

      const diseaseName = sanitizeName(scan.analysis_result?.disease_name || 'healthy');
      const userName = sanitizeName(scan.user_id?.full_name || scan.user_id?.email || 'user');
      const plantId = sanitizeName(scan.plant_id?.plant_id || 'plant');
      const scanId = sanitizeName(scan.scan_id || `scan_${i + 1}`);
      const fileName = `${String(i + 1).padStart(4, '0')}_${scanId}_${plantId}_${userName}_${diseaseName}${ext}`;

      zipEntries.push({
        name: fileName,
        data,
        date: scan.createdAt ? new Date(scan.createdAt) : new Date()
      });
    } catch (_) {
      // Skip images that cannot be fetched externally
    }
  }

  if (!zipEntries.length) {
    return res.status(404).json({
      success: false,
      error: 'No downloadable scan images were found.'
    });
  }

  const zipBuffer = createZipBuffer(zipEntries);
  const filename = `scanned_plant_images_${new Date().toISOString().slice(0, 10)}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', zipBuffer.length);
  res.status(200).send(zipBuffer);
});

// @desc    Flag/unflag scan for review
// @route   PUT /api/v1/admin/scans/:id/flag
// @access  Private/Admin
exports.flagScan = controllerWrapper(async (req, res) => {
  const { flagged = true } = req.body;

  const scan = await Scan.findById(req.params.id);

  if (!scan) {
    return res.status(404).json({
      success: false,
      error: 'Scan not found'
    });
  }

  scan.self_learning_status = {
    ...(scan.self_learning_status || {}),
    requires_validation: Boolean(flagged),
    added_to_dataset: false,
    validated_by: flagged ? undefined : req.user.id,
    validation_date: flagged ? undefined : new Date()
  };

  await scan.save();

  res.status(200).json({
    success: true,
    data: scan,
    message: flagged ? 'Scan flagged for review' : 'Scan unflagged'
  });
});

// @desc    Delete any scan (admin)
// @route   DELETE /api/v1/admin/scans/:id
// @access  Private/Admin
exports.deleteAnyScan = controllerWrapper(async (req, res) => {
  const scan = await Scan.findById(req.params.id);

  if (!scan) {
    return res.status(404).json({
      success: false,
      error: 'Scan not found'
    });
  }

  const plantId = scan.plant_id;
  await scan.deleteOne();

  if (plantId) {
    try {
      await syncPlantStatusFromLatestScan(plantId, { deletePlantIfNoScans: true });
    } catch (syncError) {
      console.warn(`[ADMIN] Failed to sync plant status after scan delete (${String(plantId)}):`, syncError.message);
    }
  }

  res.status(200).json({
    success: true,
    data: {},
    message: 'Scan deleted successfully'
  });
});

// @desc    Get all plants with oversight filters
// @route   GET /api/v1/admin/plants
// @access  Private/Admin
exports.getAllPlants = controllerWrapper(async (req, res) => {
  const { userId, location, healthStatus, repeatedOnly, plantSpecies, page = 1, limit = 20 } = req.query;

  const query = {};

  if (userId) query.owner_id = userId;

  if (plantSpecies) {
    query.species = { $regex: plantSpecies, $options: 'i' };
  }

  if (location) {
    query.$or = [
      { 'location.farm_name': new RegExp(location, 'i') },
      { 'location.plot_number': new RegExp(location, 'i') }
    ];
  }

  if (healthStatus && healthStatus !== 'all') {
    if (healthStatus === 'healthy') {
      query['current_status.disease_severity'] = 'none';
    } else {
      query['current_status.disease_severity'] = { $ne: 'none' };
    }
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const plants = await Plant.find(query)
    .populate('owner_id', 'email full_name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  const plantIds = plants.map((p) => p._id);

  const scans = await Scan.find({ plant_id: { $in: plantIds } })
    .select('plant_id analysis_result createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const scansByPlant = {};
  scans.forEach((scan) => {
    const key = scan.plant_id.toString();
    if (!scansByPlant[key]) scansByPlant[key] = [];
    scansByPlant[key].push(scan);
  });

  const hydratedPlants = plants.map((plant) => {
    const plantScans = scansByPlant[plant._id.toString()] || [];
    const diseaseEvents = plantScans.filter((scan) => hasDiseaseInScan(scan.analysis_result || {}));

    return {
      ...plant,
      total_scans: plantScans.length,
      disease_events: diseaseEvents.length,
      repeated_disease: diseaseEvents.length >= 2,
      latest_scan: plantScans[0] || null
    };
  });

  const filtered = repeatedOnly === 'true'
    ? hydratedPlants.filter((plant) => plant.repeated_disease)
    : hydratedPlants;

  const total = await Plant.countDocuments(query);

  res.status(200).json({
    success: true,
    count: filtered.length,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    data: filtered
  });
});

// @desc    Get admin global analytics and trends
// @route   GET /api/v1/admin/analytics
// @access  Private/Admin
exports.getAdminAnalytics = controllerWrapper(async (req, res) => {
  const { period = 'monthly' } = req.query;

  const [totalUsers, totalScans, totalPlants] = await Promise.all([
    User.countDocuments(),
    Scan.countDocuments(),
    Plant.countDocuments()
  ]);

  const allScans = await Scan.find({}).select('analysis_result createdAt').lean();
  const diseasedScans = allScans.filter((scan) => hasDiseaseInScan(scan.analysis_result || {})).length;
  const healthyScans = totalScans - diseasedScans;

  const bucketFormat =
    period === 'daily' ? '%Y-%m-%d' :
    period === 'weekly' ? '%Y-%U' :
    '%Y-%m';

  const trendRaw = await Scan.aggregate([
    {
      $project: {
        createdAt: 1,
        hasDisease: {
          $or: [
            { $eq: ['$analysis_result.disease_detected', true] },
            {
              $and: [
                { $ne: ['$analysis_result.disease_severity', null] },
                { $ne: ['$analysis_result.disease_severity', 'none'] }
              ]
            },
            { $gt: [{ $size: { $ifNull: ['$analysis_result.detected_conditions', []] } }, 0] }
          ]
        }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: bucketFormat, date: '$createdAt' } },
        total_scans: { $sum: 1 },
        diseased_scans: {
          $sum: { $cond: ['$hasDisease', 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const trends = trendRaw.map((row) => ({
    label: row._id,
    total_scans: row.total_scans,
    diseased_scans: row.diseased_scans,
    healthy_scans: row.total_scans - row.diseased_scans,
    disease_rate: row.total_scans > 0 ? Number(((row.diseased_scans / row.total_scans) * 100).toFixed(2)) : 0
  }));

  const diseaseNames = {};
  allScans.forEach((scan) => {
    const diseaseName = scan.analysis_result?.disease_name;
    if (diseaseName) {
      const key = normalizeKey(diseaseName);
      diseaseNames[key] = (diseaseNames[key] || 0) + 1;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        total_users: totalUsers,
        total_plants: totalPlants,
        total_scans: totalScans,
        diseased_scans: diseasedScans,
        healthy_scans: healthyScans,
        disease_rate: totalScans > 0 ? Number(((diseasedScans / totalScans) * 100).toFixed(2)) : 0,
        healthy_rate: totalScans > 0 ? Number(((healthyScans / totalScans) * 100).toFixed(2)) : 0
      },
      top_diseases: Object.entries(diseaseNames)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      trends
    }
  });
});

// @desc    Get support tickets (admin)
// @route   GET /api/v1/admin/tickets
// @access  Private/Admin
exports.getSupportTickets = controllerWrapper(async (req, res) => {
  const {
    status = 'all',
    priority = 'all',
    assignee = 'all',
    search = '',
    page = 1,
    limit = 30
  } = req.query;

  const query = {};
  if (status !== 'all') query.status = status;
  if (priority !== 'all') query.priority = priority;
  if (assignee === 'unassigned') {
    query.assigned_to = null;
  } else if (assignee !== 'all') {
    query.assigned_to = assignee;
  }
  if (search && search.trim()) {
    const rx = new RegExp(search.trim(), 'i');
    query.$or = [
      { ticket_number: rx },
      { subject: rx },
      { description: rx }
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const tickets = await SupportTicket.find(query)
    .populate('user_id', 'full_name email')
    .populate('assigned_to', 'full_name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const total = await SupportTicket.countDocuments(query);

  res.status(200).json({
    success: true,
    count: tickets.length,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    data: tickets
  });
});

// @desc    Create support ticket (admin)
// @route   POST /api/v1/admin/tickets
// @access  Private/Admin
exports.createSupportTicket = controllerWrapper(async (req, res) => {
  const {
    user_id,
    subject,
    description,
    category = 'other',
    priority = 'medium',
    channel = 'app',
    assigned_to
  } = req.body;

  if (!user_id || !subject || !description) {
    return res.status(400).json({
      success: false,
      error: 'user_id, subject, and description are required'
    });
  }

  const reporter = await User.findById(user_id).select('full_name email');
  if (!reporter) {
    return res.status(404).json({
      success: false,
      error: 'Ticket reporter user not found'
    });
  }

  const ticket = await SupportTicket.create({
    user_id,
    subject,
    description,
    reporter_name: reporter.full_name || 'Unknown User',
    reporter_email: reporter.email || '',
    device_model: req.body.device_model || req.body.mobile_unit || 'Not specified',
    os_version: req.body.os_version || 'Not specified',
    category,
    priority,
    channel,
    assigned_to: assigned_to || undefined,
    timeline: [{
      action: 'ticket_created',
      note: 'Ticket created by admin',
      by_admin: req.user.id
    }]
  });

  const populated = await SupportTicket.findById(ticket._id)
    .populate('user_id', 'full_name email')
    .populate('assigned_to', 'full_name email');

  res.status(201).json({
    success: true,
    data: populated
  });
});

// @desc    Update support ticket (admin)
// @route   PUT /api/v1/admin/tickets/:id
// @access  Private/Admin
exports.updateSupportTicket = controllerWrapper(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: 'Ticket not found'
    });
  }

  const {
    status,
    priority,
    assigned_to,
    internal_notes,
    resolution_notes
  } = req.body;

  if (status !== undefined) {
    const current = ticket.status;
    const target = status;
    const transitions = {
      open: ['in_progress'],
      in_progress: ['resolved'],
      resolved: ['closed'],
      closed: []
    };

    const allowed = transitions[current] || [];
    if (target !== current && !allowed.includes(target)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition: ${current} -> ${target}`
      });
    }
    ticket.status = target;
  }

  if (priority !== undefined) ticket.priority = priority;
  if (assigned_to !== undefined) ticket.assigned_to = assigned_to || undefined;
  if (internal_notes !== undefined) ticket.internal_notes = internal_notes;
  if (resolution_notes !== undefined) ticket.resolution_notes = resolution_notes;

  if (status === 'in_progress') {
    ticket.last_response_at = new Date();
  }
  if (status === 'resolved') {
    ticket.resolved_at = new Date();
  }
  if (status === 'closed') {
    ticket.closed_at = new Date();
  }

  ticket.timeline.push({
    action: 'ticket_updated',
    note: `Updated fields: ${Object.keys(req.body).join(', ') || 'none'}`,
    by_admin: req.user.id
  });

  await ticket.save();

  const populated = await SupportTicket.findById(ticket._id)
    .populate('user_id', 'full_name email')
    .populate('assigned_to', 'full_name email');

  res.status(200).json({
    success: true,
    data: populated
  });
});

// @desc    Get community posts/comments for moderation
// @route   GET /api/v1/admin/community/posts
// @access  Private/Admin
exports.getCommunityPosts = controllerWrapper(async (req, res) => {
  const { flagged, hidden, page = 1, limit = 20 } = req.query;
  const query = {};

  if (flagged !== undefined) query.flagged_for_review = flagged === 'true';
  if (hidden !== undefined) query.is_hidden = hidden === 'true';

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const posts = await CommunityPost.find(query)
    .populate('user_id', 'full_name email profile_picture')
    .populate('comments.user_id', 'full_name email profile_picture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const total = await CommunityPost.countDocuments(query);

  res.status(200).json({
    success: true,
    count: posts.length,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    data: posts.map((p) => ({
      ...p.toObject(),
      likes_count: p.likes.length,
      comments_count: p.comments.length
    }))
  });
});

// @desc    Moderate post (hide/unhide/flag/unflag/delete)
// @route   PUT /api/v1/admin/community/posts/:id/moderate
// @access  Private/Admin
exports.moderateCommunityPost = controllerWrapper(async (req, res) => {
  const { action, note = '' } = req.body;
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }

  if (action === 'hide') post.is_hidden = true;
  if (action === 'unhide') post.is_hidden = false;
  if (action === 'flag') post.flagged_for_review = true;
  if (action === 'unflag') post.flagged_for_review = false;
  if (action === 'delete') {
    await post.deleteOne();
    return res.status(200).json({ success: true, message: 'Post deleted', data: {} });
  }

  if (note) post.moderation_notes = note;
  await post.save();

  res.status(200).json({
    success: true,
    message: `Post ${action} successful`,
    data: post
  });
});

// @desc    Moderate comment (hide/unhide/delete/flag/unflag)
// @route   PUT /api/v1/admin/community/posts/:postId/comments/:commentId/moderate
// @access  Private/Admin
exports.moderateCommunityComment = controllerWrapper(async (req, res) => {
  const { action } = req.body;
  const { postId, commentId } = req.params;

  const post = await CommunityPost.findById(postId);
  if (!post) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    return res.status(404).json({ success: false, error: 'Comment not found' });
  }

  if (action === 'delete') {
    comment.deleteOne();
  } else if (action === 'hide') {
    comment.is_hidden = true;
  } else if (action === 'unhide') {
    comment.is_hidden = false;
  } else if (action === 'flag') {
    comment.flagged_for_review = true;
    post.flagged_for_review = true;
  } else if (action === 'unflag') {
    comment.flagged_for_review = false;
  }

  await post.save();

  res.status(200).json({
    success: true,
    message: `Comment ${action} successful`,
    data: post
  });
});

// @desc    Get community reports queue
// @route   GET /api/v1/admin/community/reports
// @access  Private/Admin
exports.getCommunityReports = controllerWrapper(async (req, res) => {
  const { status = 'open', page = 1, limit = 30 } = req.query;
  const query = {};
  if (status !== 'all') query.status = status;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const reports = await CommunityReport.find(query)
    .populate('reporter_id', 'full_name email')
    .populate('target_user_id', 'full_name email')
    .populate('post_id', 'caption image_url is_hidden flagged_for_review')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const total = await CommunityReport.countDocuments(query);

  res.status(200).json({
    success: true,
    count: reports.length,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    data: reports
  });
});

// @desc    Resolve report (dismiss/warn/remove)
// @route   PUT /api/v1/admin/community/reports/:id/resolve
// @access  Private/Admin
exports.resolveCommunityReport = controllerWrapper(async (req, res) => {
  const { action, notes = '' } = req.body; // dismiss | warn | remove
  const report = await CommunityReport.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }

  if (report.status !== 'open') {
    return res.status(400).json({ success: false, error: 'Report already resolved' });
  }

  const post = await CommunityPost.findById(report.post_id);

  if (action === 'remove' && post) {
    if (report.target_type === 'post') {
      post.is_hidden = true;
    } else if (report.target_type === 'comment' && report.comment_id) {
      const c = post.comments.id(report.comment_id);
      if (c) c.is_hidden = true;
    }
    await post.save();
    report.status = 'removed';
  } else if (action === 'warn') {
    report.status = 'warned';
    if (report.target_user_id) {
      await User.findByIdAndUpdate(report.target_user_id, {
        $push: {
          moderation_history: {
            action: 'warn',
            reason: notes || report.reason,
            by_admin: req.user.id
          }
        }
      });
    }
  } else {
    report.status = 'dismissed';
  }

  report.resolved_by = req.user.id;
  report.resolution_notes = notes;
  report.resolved_at = new Date();
  await report.save();

  res.status(200).json({
    success: true,
    message: `Report ${report.status}`,
    data: report
  });
});

// @desc    Mute user from community for a period
// @route   PUT /api/v1/admin/community/users/:id/mute
// @access  Private/Admin
exports.muteCommunityUser = controllerWrapper(async (req, res) => {
  const { minutes = 60, reason = 'Community policy violation' } = req.body;
  const muteUntil = new Date(Date.now() + parseInt(minutes, 10) * 60 * 1000);

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      community_mute_until: muteUntil,
      $push: {
        moderation_history: {
          action: 'mute',
          reason,
          by_admin: req.user.id
        }
      }
    },
    { new: true }
  ).select('-password_hash');

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  res.status(200).json({
    success: true,
    message: `User muted until ${muteUntil.toISOString()}`,
    data: user
  });
});

// @desc    Get community moderation analytics
// @route   GET /api/v1/admin/community/analytics
// @access  Private/Admin
exports.getCommunityModerationAnalytics = controllerWrapper(async (req, res) => {
  const { period = 'monthly' } = req.query;

  const [totalPosts, totalReports] = await Promise.all([
    CommunityPost.countDocuments(),
    CommunityReport.countDocuments()
  ]);

  const posts = await CommunityPost.find({})
    .select('user_id disease_name likes comments createdAt')
    .lean();

  const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

  const contributorMap = {};
  const diseaseMap = {};

  posts.forEach((post) => {
    const key = post.user_id?.toString();
    if (key) contributorMap[key] = (contributorMap[key] || 0) + 1;

    const d = normalizeKey(post.disease_name || 'healthy');
    diseaseMap[d] = (diseaseMap[d] || 0) + 1;
  });

  const topContributorIds = Object.entries(contributorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  const topUsers = await User.find({ _id: { $in: topContributorIds } }).select('full_name email');
  const topUserMap = {};
  topUsers.forEach((u) => {
    topUserMap[u._id.toString()] = u;
  });

  const topContributors = Object.entries(contributorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({
      user_id: id,
      full_name: topUserMap[id]?.full_name || 'Unknown',
      email: topUserMap[id]?.email || '',
      posts: count
    }));

  const bucketFormat =
    period === 'daily' ? '%Y-%m-%d' :
    period === 'weekly' ? '%Y-%U' :
    '%Y-%m';

  const reportTrend = await CommunityReport.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: bucketFormat, date: '$createdAt' } },
        total_reports: { $sum: 1 },
        open_reports: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        removed_reports: { $sum: { $cond: [{ $eq: ['$status', 'removed'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const repeatOffenders = await User.find({
    moderation_history: { $exists: true, $not: { $size: 0 } }
  })
    .select('full_name email moderation_history is_active community_mute_until')
    .lean();

  const offenders = repeatOffenders
    .map((u) => ({
      user_id: u._id,
      full_name: u.full_name,
      email: u.email,
      offense_count: (u.moderation_history || []).length,
      is_active: u.is_active,
      community_mute_until: u.community_mute_until
    }))
    .filter((u) => u.offense_count >= 2)
    .sort((a, b) => b.offense_count - a.offense_count);

  res.status(200).json({
    success: true,
    data: {
      totals: {
        total_posts: totalPosts,
        total_comments: totalComments,
        total_likes: totalLikes,
        total_reports: totalReports
      },
      top_contributors: topContributors,
      most_discussed_diseases: Object.entries(diseaseMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([disease, count]) => ({ disease, count })),
      report_trend: reportTrend.map((r) => ({
        label: r._id,
        total_reports: r.total_reports,
        open_reports: r.open_reports,
        removed_reports: r.removed_reports
      })),
      repeat_offenders: offenders
    }
  });
});
