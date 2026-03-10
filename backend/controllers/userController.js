const User = require('../models/user');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/controllerWrapper');
const { uploadImage } = require('../services/imageService');
const { getFirebaseAdmin } = require('../config/firebaseAdmin');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { email, password, full_name, role, phone, farm_details } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Profile picture is required'
    });
  }

  // Check if user exists
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return res.status(400).json({
      success: false,
      error: 'User already exists with this email'
    });
  }

  // Upload profile picture
  const profileUpload = await uploadImage(req.file.buffer, 'aloe-vera-profiles');

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    password_hash: password, // Will be hashed by pre-save hook
    full_name,
    role: role || 'grower',
    phone,
    farm_details,
    profile_picture: {
      url: profileUpload.secure_url,
      public_id: profileUpload.public_id
    }
  });

  // Update last login
  user.last_login = new Date();
  await user.save();

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        farm_details: user.farm_details,
        profile_picture: user.profile_picture
      },
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      error: 'Account is inactive. Please contact administrator'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Update last login
  user.last_login = new Date();
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        farm_details: user.farm_details,
        preferences: user.preferences,
        profile_picture: user.profile_picture
      },
      token
    }
  });
});

// @desc    Sign in with Google (Firebase)
// @route   POST /api/v1/auth/google
// @access  Public
exports.googleSignIn = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      error: 'Firebase ID token is required'
    });
  }

  let decodedToken;
  try {
    const firebaseAdmin = getFirebaseAdmin();
    decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch (err) {
    if (String(err?.message || '').includes('not configured')) {
      return res.status(500).json({
        success: false,
        error: 'Google sign-in is not configured on the server'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid Google token'
    });
  }

  const email = String(decodedToken.email || '').toLowerCase();
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Google account email is required'
    });
  }

  if (decodedToken.email_verified === false) {
    return res.status(401).json({
      success: false,
      error: 'Google email is not verified'
    });
  }

  const fullName = decodedToken.name || email.split('@')[0];
  const photoUrl = decodedToken.picture || '';
  const firebaseUid = decodedToken.uid;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      full_name: fullName,
      role: 'grower',
      auth_provider: 'google',
      firebase_uid: firebaseUid,
      profile_picture: photoUrl ? { url: photoUrl, public_id: '' } : undefined
    });
  } else {
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is inactive. Please contact administrator'
      });
    }

    user.full_name = user.full_name || fullName;
    if (!user.firebase_uid) user.firebase_uid = firebaseUid;
    if (user.auth_provider !== 'google') user.auth_provider = 'local';
    if (photoUrl && (!user.profile_picture || !user.profile_picture.url)) {
      user.profile_picture = { url: photoUrl, public_id: '' };
    }
  }

  user.last_login = new Date();
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        farm_details: user.farm_details,
        preferences: user.preferences,
        profile_picture: user.profile_picture
      },
      token
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    full_name: req.body.full_name,
    phone: req.body.phone,
    farm_details: req.body.farm_details,
    preferences: req.body.preferences
  };

  if (req.file) {
    const profileUpload = await uploadImage(req.file.buffer, 'aloe-vera-profiles');
    fieldsToUpdate.profile_picture = {
      url: profileUpload.secure_url,
      public_id: profileUpload.public_id
    };
  }

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Please provide current and new password'
    });
  }

  const user = await User.findById(req.user.id).select('+password_hash');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  user.password_hash = newPassword; // Will be hashed by pre-save hook
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      token
    },
    message: 'Password updated successfully'
  });
});

// @desc    Logout user / clear cookie
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

