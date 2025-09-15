const mongoose = require('mongoose');

const EditalSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Edital', EditalSchema);
