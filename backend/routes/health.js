const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const READY_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

// GET /api/health — reports whether the DB is actually connected, or whether
// requests are silently landing on the JSON-file fallback (see models/Survey.js).
router.get('/', (req, res) => {
    const readyState = mongoose.connection.readyState;
    const mongoConnected = readyState === 1;

    res.json({
        status: mongoConnected ? 'ok' : 'degraded',
        storage: mongoConnected ? 'mongodb' : 'json-fallback',
        mongoConnected,
        mongoState: READY_STATES[readyState] || 'unknown',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
