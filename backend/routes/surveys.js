const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const requireMongo = require('../middleware/requireMongo');

// GET all surveys — returns a lightweight list. We pull `sections` only to
// compute a completion percentage, then strip it from the payload so the
// dashboard isn't shipped every item, photo, and comment.
router.get('/', async (req, res) => {
    try {
        const surveys = await Survey.find()
            .select('propertyDetails status createdAt sections')
            .sort({ createdAt: -1 });
        const list = surveys.map(s => {
            const items = (s.sections || []).flatMap(sec => sec.items || []);
            const checked = items.filter(i => i.status).length;
            return {
                _id: s._id,
                propertyDetails: s.propertyDetails,
                status: s.status,
                createdAt: s.createdAt,
                progress: items.length ? Math.round((checked / items.length) * 100) : 0
            };
        });
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new survey
router.post('/', requireMongo, async (req, res) => {
    try {
        const survey = new Survey(req.body);
        await survey.save();
        res.status(201).json(survey);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST duplicate a survey — copies the checklist structure (rooms + item
// labels) but clears unit-specific findings (status, photos, comments) so the
// copy is a fresh inspection for another unit. Reads properties directly so it
// works for both Mongoose docs and the JSON-fallback mock.
router.post('/:id/duplicate', requireMongo, async (req, res) => {
    try {
        const original = await Survey.findById(req.params.id);
        if (!original) return res.status(404).json({ error: 'Survey not found' });

        const pd = original.propertyDetails || {};
        const copy = new Survey({
            propertyDetails: {
                unitNumber: pd.unitNumber ? `${pd.unitNumber} (Copy)` : '',
                buildingName: pd.buildingName || '',
                address: pd.address || '',
                propertyType: pd.propertyType || '',
                inspector: pd.inspector || '',
                client: pd.client || '',
                date: new Date()
            },
            sections: (original.sections || []).map(s => ({
                roomName: s.roomName,
                items: (s.items || []).map(it => ({ label: it.label, status: '', photos: [], comments: '' }))
            })),
            globalPhotos: [],
            status: 'Draft'
        });
        await copy.save();
        res.status(201).json(copy);
    } catch (err) {
        if (err.name === 'CastError') return res.status(404).json({ error: 'Survey not found' });
        res.status(400).json({ error: err.message });
    }
});

// GET single survey
router.get('/:id', async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ error: 'Survey not found' });
        res.json(survey);
    } catch (err) {
        if (err.name === 'CastError') return res.status(404).json({ error: 'Survey not found' });
        res.status(500).json({ error: err.message });
    }
});

// PUT update survey — only allow known fields to prevent accidental overwrites
router.put('/:id', requireMongo, async (req, res) => {
    try {
        const { propertyDetails, sections, globalPhotos, status } = req.body;
        const update = {};
        if (propertyDetails !== undefined) update.propertyDetails = propertyDetails;
        if (sections !== undefined) update.sections = sections;
        if (globalPhotos !== undefined) update.globalPhotos = globalPhotos;
        if (status !== undefined) update.status = status;

        const survey = await Survey.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true }
        );
        if (!survey) return res.status(404).json({ error: 'Survey not found' });
        res.json(survey);
    } catch (err) {
        if (err.name === 'CastError') return res.status(404).json({ error: 'Survey not found' });
        res.status(400).json({ error: err.message });
    }
});

// DELETE survey
router.delete('/:id', requireMongo, async (req, res) => {
    try {
        const survey = await Survey.findByIdAndDelete(req.params.id);
        if (!survey) return res.status(404).json({ error: 'Survey not found' });
        res.json({ message: 'Survey deleted successfully' });
    } catch (err) {
        if (err.name === 'CastError') return res.status(404).json({ error: 'Survey not found' });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
