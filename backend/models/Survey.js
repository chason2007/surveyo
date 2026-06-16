const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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
    client: { type: String, default: '' },
    date: { type: Date, default: Date.now }
  },
  sections: [SectionSchema],
  globalPhotos: [String],
  status: { type: String, enum: ['Draft', 'Completed'], default: 'Draft' }
}, { timestamps: true });

const MongooseSurvey = mongoose.model('Survey', SurveySchema);

// JSON Fallback DB Implementation
const DATA_FILE = path.join(__dirname, '..', 'data', 'surveys.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readData() {
  ensureDataFile();
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading JSON fallback database:', err);
    return [];
  }
}

let writeQueue = Promise.resolve();

function writeData(data) {
  ensureDataFile();
  writeQueue = writeQueue.then(() =>
    fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  ).catch(err => console.error('Error writing JSON fallback database:', err));
  return writeQueue;
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

class SurveyFallbackQuery {
  constructor(data) {
    this.data = data;
  }
  select(fields) {
    // Simple filter simulating select
    return this;
  }
  sort(criteria) {
    this.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return this;
  }
  async exec() {
    return this.data;
  }
  then(onResolve, onReject) {
    return Promise.resolve(this.data).then(onResolve, onReject);
  }
}

class SurveyMock {
  constructor(data) {
    this._id = data._id || 'mock_' + Math.random().toString(36).substr(2, 9);
    this.propertyDetails = {
      unitNumber: '',
      buildingName: '',
      address: '',
      propertyType: '',
      inspector: '',
      client: '',
      date: new Date(),
      ...data.propertyDetails
    };
    this.sections = data.sections || [];
    this.globalPhotos = data.globalPhotos || [];
    this.status = data.status || 'Draft';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  async save() {
    const surveys = readData();
    const index = surveys.findIndex(s => s._id === this._id);
    this.updatedAt = new Date().toISOString();
    
    const plainSurvey = {
      _id: this._id,
      propertyDetails: this.propertyDetails,
      sections: this.sections,
      globalPhotos: this.globalPhotos,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    
    if (index >= 0) {
      surveys[index] = plainSurvey;
    } else {
      surveys.push(plainSurvey);
    }
    writeData(surveys);
    return this;
  }
}

// Proxy wrapper for the Mongoose Model
const SurveyProxy = {
  find: function(...args) {
    if (isMongoConnected()) {
      return MongooseSurvey.find(...args);
    }
    const data = readData();
    return new SurveyFallbackQuery(data);
  },
  findById: async function(id) {
    if (isMongoConnected()) {
      return MongooseSurvey.findById(id);
    }
    const data = readData();
    const item = data.find(s => s._id === id);
    if (!item) return null;
    return new SurveyMock(item);
  },
  findByIdAndUpdate: async function(id, update, options) {
    if (isMongoConnected()) {
      return MongooseSurvey.findByIdAndUpdate(id, update, options);
    }
    const data = readData();
    const index = data.findIndex(s => s._id === id);
    if (index < 0) return null;

    // Routes call this as findByIdAndUpdate(id, { $set: {...} }, opts) — unwrap the
    // $set operator so fields actually apply instead of nesting under a stray "$set" key.
    const fields = (update && update.$set) ? update.$set : (update || {});

    const updatedItem = {
      ...data[index],
      ...fields,
      propertyDetails: {
        ...data[index].propertyDetails,
        ...(fields.propertyDetails || {})
      },
      updatedAt: new Date().toISOString()
    };

    data[index] = updatedItem;
    writeData(data);
    return new SurveyMock(updatedItem);
  },
  findByIdAndDelete: async function(id) {
    if (isMongoConnected()) {
      return MongooseSurvey.findByIdAndDelete(id);
    }
    const data = readData();
    const index = data.findIndex(s => s._id === id);
    if (index < 0) return null;
    const deleted = data.splice(index, 1)[0];
    writeData(data);
    return new SurveyMock(deleted);
  },
  create: async function(data) {
    const inst = new SurveyMock(data);
    await inst.save();
    return inst;
  }
};

const SurveyModule = function(data) {
  if (isMongoConnected()) {
    return new MongooseSurvey(data);
  }
  return new SurveyMock(data);
};

Object.assign(SurveyModule, SurveyProxy);

module.exports = SurveyModule;