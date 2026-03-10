const mongoose = require('mongoose');

const ticketCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  sequence: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TicketCounter', ticketCounterSchema);
