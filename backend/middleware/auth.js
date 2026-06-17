const jwt = require('jsonwebtoken');

// Gate for every data route. Checks the Bearer token minted by
// POST /api/auth/login. /api/health and /api/auth stay public so the status
// banner can poll and users can actually log in.
module.exports = function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Session expired or invalid' });
    }
};
