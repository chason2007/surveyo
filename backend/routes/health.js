const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const READY_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

function buildStatus() {
    const readyState = mongoose.connection.readyState;
    const mongoConnected = readyState === 1;
    return {
        status: mongoConnected ? 'ok' : 'degraded',
        storage: mongoConnected ? 'mongodb' : 'json-fallback',
        mongoConnected,
        mongoState: READY_STATES[readyState] || 'unknown',
        timestamp: new Date().toISOString()
    };
}

function renderHtml(data) {
    const ok = data.mongoConnected;
    const color = ok ? '#16a34a' : '#d97706';
    const bg = ok ? '#f0fdf4' : '#fefce8';
    const border = ok ? '#bbf7d0' : '#fde68a';
    const headline = ok ? 'All systems operational' : 'Running in degraded mode';
    const sub = ok
        ? 'Connected to MongoDB. Changes are being saved permanently.'
        : 'MongoDB is unreachable. Surveyo is temporarily writing to local fallback storage — changes made right now may not persist permanently.';

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="refresh" content="30" />
<title>Surveyo — System Status</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #fafafa;
    color: #18181b;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 440px;
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    overflow: hidden;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e5e5;
    font-weight: 700;
    font-size: 15px;
  }
  .brand .dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; }
  .status-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 24px;
    background: ${bg};
    border-bottom: 1px solid ${border};
  }
  .pulse {
    width: 11px; height: 11px; border-radius: 50%;
    background: ${color};
    box-shadow: 0 0 0 4px ${color}22;
    flex-shrink: 0;
  }
  .status-row h1 { font-size: 16px; font-weight: 700; color: ${color}; }
  .body { padding: 20px 24px; }
  .body p { font-size: 13px; line-height: 1.6; color: #52525b; margin-bottom: 18px; }
  .row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #f0f0f0; font-size: 12.5px; }
  .row:last-child { border-bottom: none; }
  .row span:first-child { color: #888; }
  .row span:last-child { font-weight: 600; }
  .footer { padding: 12px 24px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #f0f0f0; }
  .footer a { color: #888; text-decoration: underline; }
</style>
</head>
<body>
  <div class="card">
    <div class="brand"><div class="dot"></div><span>Surveyo</span></div>
    <div class="status-row">
      <div class="pulse"></div>
      <h1>${headline}</h1>
    </div>
    <div class="body">
      <p>${sub}</p>
      <div class="row"><span>Database</span><span>${ok ? 'Connected' : 'Disconnected'}</span></div>
      <div class="row"><span>Connection state</span><span>${data.mongoState}</span></div>
      <div class="row"><span>Storage backend</span><span>${data.storage}</span></div>
      <div class="row"><span>Checked at</span><span>${new Date(data.timestamp).toLocaleString()}</span></div>
    </div>
    <div class="footer">Auto-refreshes every 30s &middot; <a href="/api/health?format=json">View as JSON</a></div>
  </div>
</body>
</html>`;
}

// GET /api/health — browsers visiting directly get a human-readable status
// page; the app's own banner (which sends Accept: application/json) and
// ?format=json both get the raw JSON.
router.get('/', (req, res) => {
    const data = buildStatus();
    const wantsHtml = req.query.format !== 'json' && req.accepts(['html', 'json']) === 'html';

    if (wantsHtml) {
        return res.type('html').send(renderHtml(data));
    }
    res.json(data);
});

module.exports = router;
