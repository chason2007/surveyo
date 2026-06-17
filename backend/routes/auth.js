const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Timing-safe comparison so the password check can't leak the password's
// length or contents through response-time differences. Both inputs are hashed
// to fixed-length buffers first because timingSafeEqual throws on length
// mismatch (which would itself be a length oracle).
function safeEqual(a, b) {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

// POST /api/auth/login — exchange the shared password for a signed token.
router.post('/login', (req, res) => {
    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password is required' });
    }
    if (!safeEqual(password, process.env.APP_PASSWORD)) {
        return res.status(401).json({ error: 'Incorrect password' });
    }
    const token = jwt.sign({ role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
});

module.exports = router;
