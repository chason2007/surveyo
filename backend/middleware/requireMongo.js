const mongoose = require('mongoose');

// Writes must hit the real database. When Mongo is unreachable the JSON
// fallback is read-only — accepting writes there would silently diverge from
// (and later be clobbered by) the real data once Mongo reconnects. Fail loud
// with 503 so the client can retry or stash the change locally instead.
module.exports = function requireMongo(req, res, next) {
    if (mongoose.connection.readyState === 1) return next();
    res.status(503).json({ error: 'Database temporarily unavailable. Please retry in a moment.' });
};
