const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
  key: { type: String, required: true },
  short: { type: String, required: true },
  label: { type: String, required: true },
  count: { type: Number, default: 0 }
}, { _id: false });

const BatchCountSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  count: { type: Number, default: 0 }
}, { _id: false });

const BatchIndexSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  branches: { type: [BranchSchema], default: [] },
  years: { type: [Number], default: [] },
  batches: { type: [BatchCountSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.BatchIndex || mongoose.model('BatchIndex', BatchIndexSchema);
