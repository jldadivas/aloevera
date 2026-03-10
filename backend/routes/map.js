const express = require('express');
const { searchPlaces } = require('../controllers/mapController');

const router = express.Router();

router.get('/search', searchPlaces);

module.exports = router;

