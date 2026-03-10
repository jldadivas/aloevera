const axios = require('axios');
const asyncHandler = require('../utils/controllerWrapper');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MAPSCO_URL = 'https://geocode.maps.co/search';
const MAP_TIMEOUT_MS = 12000;

const toNominatimRow = (row = {}) => ({
  place_id: row.place_id || `${row.lat || ''}-${row.lon || ''}-${row.display_name || ''}`,
  lat: row.lat,
  lon: row.lon,
  display_name: row.display_name || row.name || '',
  class: row.class,
  type: row.type
});

const toMapsCoRow = (row = {}) => ({
  place_id: row.place_id || row.osm_id || `${row.lat || ''}-${row.lon || ''}-${row.display_name || ''}`,
  lat: row.lat,
  lon: row.lon,
  display_name: row.display_name || row.name || '',
  class: row.class,
  type: row.type
});

const parseLimit = (value, defaultValue = 15) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return defaultValue;
  return Math.min(Math.floor(n), 50);
};

const callNominatim = async (params) => {
  const response = await axios.get(NOMINATIM_URL, {
    params,
    timeout: MAP_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'VeraAloeMap/1.0 (student-project@local.test)'
    }
  });
  return Array.isArray(response.data) ? response.data.map(toNominatimRow) : [];
};

const callMapsCo = async ({ q, limit }) => {
  const response = await axios.get(MAPSCO_URL, {
    params: { q, limit },
    timeout: MAP_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'VeraAloeMap/1.0 (student-project@local.test)'
    }
  });
  return Array.isArray(response.data) ? response.data.map(toMapsCoRow) : [];
};

// @desc    Proxy geocoding/place search to avoid browser CORS issues
// @route   GET /api/v1/map/search
// @access  Public
exports.searchPlaces = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: q'
    });
  }

  const limit = parseLimit(req.query.limit, 15);
  const bounded = String(req.query.bounded || '1') === '1';
  const viewbox = String(req.query.viewbox || '').trim();
  const countrycodes = String(req.query.countrycodes || '').trim();

  const nominatimParams = {
    format: 'jsonv2',
    q,
    limit,
    addressdetails: 1,
    email: 'student-project@local.test'
  };

  if (bounded && viewbox) {
    nominatimParams.bounded = 1;
    nominatimParams.viewbox = viewbox;
  }
  if (countrycodes) {
    nominatimParams.countrycodes = countrycodes;
  }

  let rows = [];
  let source = 'nominatim';
  let usedFallback = false;

  try {
    rows = await callNominatim(nominatimParams);
  } catch (_) {
    rows = [];
  }

  if (!rows.length) {
    try {
      const relaxedParams = { ...nominatimParams };
      delete relaxedParams.bounded;
      delete relaxedParams.viewbox;
      rows = await callNominatim(relaxedParams);
    } catch (_) {
      rows = [];
    }
  }

  if (!rows.length) {
    try {
      rows = await callMapsCo({ q, limit });
      source = 'maps.co';
      usedFallback = true;
    } catch (_) {
      rows = [];
    }
  }

  return res.status(200).json({
    success: true,
    data: { rows },
    meta: {
      source,
      used_fallback: usedFallback
    }
  });
});

