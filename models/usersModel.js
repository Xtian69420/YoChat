const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'LGBTQIA++', 'Others'], 
    required: true 
  },
  cribIds: { type: [String], default: [] },
  interactionsId: { type: [String], default: [] },
  pfpLink: { type: String, default: 'https://drive.google.com/thumbnail?id=1z1GP6qBTsl8uLLEqAjexZwTa1KPSEnRS&sz=w1920-h1080' }
}, {
  collection: 'users_tb',
  timestamps: true
});

module.exports = mongoose.model('users', usersSchema);