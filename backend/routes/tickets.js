const express = require('express');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { createTicket, getMyTickets } = require('../controllers/ticketController');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('issue_image'), createTicket);
router.get('/me', getMyTickets);

module.exports = router;
