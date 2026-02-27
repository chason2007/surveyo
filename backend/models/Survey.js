const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  status: { type: String, enum: ['Good', 'Need Action', 'N/A', ''], default: '' },
  photos: [String],
  comments: { type: String, default: '' }
});

const SectionSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  items: [ItemSchema]
});

const SurveySchema = new mongoose.Schema({
  propertyDetails: {
    unitNumber: { type: String, default: '' },
    buildingName: { type: String, default: '' },
    address: { type: String, default: '' },
    propertyType: { type: String, default: '' },
    inspector: { type: String, default: '' },
    date: { type: Date, default: Date.now }
  },
  sections: [SectionSchema],
  globalPhotos: [String],
  status: { type: String, enum: ['Draft', 'Completed'], default: 'Draft' }
}, { timestamps: true });

module.exports = mongoose.model('Survey', SurveySchema);