const mongoose = require('mongoose');

const cribSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  key: { type: String, required: true },
  membersId: { type: [String], default: [] },
  messages: [
    {
        userId: { type: String },
        message: { type: String },
        dateTime: { type: Date }
    }
  ]
}, {
  collection: 'crib_tb',
  timestamps: true
});

module.exports = mongoose.model('crib', cribSchema);