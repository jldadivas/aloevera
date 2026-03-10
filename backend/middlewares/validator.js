const validator = require('validator');

// Email validation
exports.validateEmail = (email) => {
  return validator.isEmail(email);
};

// Password validation
exports.validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Phone validation
exports.validatePhone = (phone) => {
  return validator.isMobilePhone(phone, 'any', { strictMode: false });
};

// Sanitize input
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return validator.escape(input.trim());
};

// Validate coordinates
exports.validateCoordinates = (lat, lng) => {
  return (
    validator.isFloat(lat.toString(), { min: -90, max: 90 }) &&
    validator.isFloat(lng.toString(), { min: -180, max: 180 })
  );
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  sanitizeInput,
  validateCoordinates
};

