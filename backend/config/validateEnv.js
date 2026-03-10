const PLACEHOLDER_PATTERNS = [
  /^your_/i,
  /your[-_ ]/i,
  /replace/i,
  /example/i
];

const isPlaceholder = (value = '') => {
  const normalized = String(value || '').trim();
  if (!normalized) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
};

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const strict = isProduction || process.env.STRICT_ENV_VALIDATION === 'true';
  const mongoUri = String(process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();
  const jwtSecret = String(process.env.JWT_SECRET || '').trim();

  const required = ['JWT_SECRET'];
  if (isProduction) {
    required.push(
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'ML_SERVICE_URL',
      'CORS_ORIGIN'
    );
  }

  const missing = required.filter((key) => !String(process.env[key] || '').trim());
  if (!mongoUri) {
    missing.unshift('MONGO_URI or MONGODB_URI');
  }
  const placeholder = required.filter((key) => isPlaceholder(process.env[key]));
  if (mongoUri && isPlaceholder(mongoUri)) {
    placeholder.unshift('MONGO_URI or MONGODB_URI');
  }
  const weakJwt = jwtSecret.length > 0 && jwtSecret.length < 32;

  if (strict && missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (strict && placeholder.length > 0) {
    throw new Error(`Placeholder values are not allowed in production for: ${placeholder.join(', ')}`);
  }

  if (strict && weakJwt) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }

  if (!strict && missing.length > 0) {
    console.warn(`[env] Missing variables (non-production): ${missing.join(', ')}`);
  }
}

module.exports = { validateEnv };
