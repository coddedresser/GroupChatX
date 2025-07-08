// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true
  },
  sender: {
    username: String,
    userId: mongoose.Schema.Types.ObjectId
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
