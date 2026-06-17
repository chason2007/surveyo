const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');
const Survey = require('../models/Survey');

// Helper: download image from URL into a Buffer with a 10s timeout
function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Image download timed out'));
        });
    });
}

// Status shown as plain colored text rather than a filled badge.
const STATUS_COLORS = {
    'Good': '#16a34a',
    'Need Action': '#d97706',
    'N/A': '#828282',
    '': '#828282'
};

const INK = '#171717';
const MUTED = '#828282';
const RULE = '#e5e5e5';

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595; // A4

function drawImageOrPlaceholder(doc, buf, x, y, w, h) {
    if (buf) {
        doc.image(buf, x, y, { width: w, height: h, cover: [w, h] });
        doc.rect(x, y, w, h).strokeColor(RULE).lineWidth(1).stroke();
    } else {
        doc.rect(x, y, w, h).fillAndStroke('#fafafa', RULE);
        doc.fillColor(MUTED).fontSize(7).font('Helvetica')
            .text('Image unavailable', x, y + h / 2 - 5, { width: w, align: 'center' });
    }
}

// GET /api/surveys/:id/report
router.get('/:id/report', async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ error: 'Survey not found' });

        const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="survey-${survey.propertyDetails.unitNumber || survey._id}.pdf"`
        );
        doc.pipe(res);

        const pd = survey.propertyDetails;
        const usableWidth = PAGE_WIDTH - PAGE_MARGIN * 2;

        const rule = (yPos) => {
            doc.strokeColor(RULE).lineWidth(0.75)
                .moveTo(PAGE_MARGIN, yPos).lineTo(PAGE_WIDTH - PAGE_MARGIN, yPos).stroke();
        };

        // ── HEADER ───────────────────────────────────────────────────────
        let y = PAGE_MARGIN;
        doc.fillColor(INK).fontSize(19).font('Helvetica-Bold')
            .text('Property Condition Survey', PAGE_MARGIN, y);
        y += 25;

        const subtitle = [pd.unitNumber, pd.buildingName, pd.address].filter(Boolean).join('   ·   ');
        if (subtitle) {
            doc.fillColor(MUTED).fontSize(10).font('Helvetica').text(subtitle, PAGE_MARGIN, y);
            y += 16;
        }
        y += 8;
        rule(y);
        y += 20;

        // ── PROPERTY DETAILS ─────────────────────────────────────────────
        const details = [
            ['Inspector', pd.inspector || '—'],
            ['Client', pd.client || '—'],
            ['Property type', pd.propertyType || '—'],
            ['Date', pd.date ? new Date(pd.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
        ];
        const colW = usableWidth / 2;
        details.forEach(([label, val], i) => {
            const x = PAGE_MARGIN + (i % 2) * colW;
            const rowY = y + Math.floor(i / 2) * 34;
            doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(label.toUpperCase(), x, rowY, { characterSpacing: 0.4 });
            doc.fillColor(INK).fontSize(11).font('Helvetica-Bold').text(val, x, rowY + 11);
        });
        y += Math.ceil(details.length / 2) * 34 + 6;

        const statusColor = survey.status === 'Completed' ? '#16a34a' : '#d97706';
        doc.fillColor(statusColor).fontSize(9).font('Helvetica-Bold')
            .text(survey.status.toUpperCase(), PAGE_MARGIN, y, { characterSpacing: 0.4 });
        y += 24;
        rule(y);
        y += 26;

        // Bottom edge of the printable area. Page-break decisions compare
        // against this instead of hardcoded numbers so content never spills
        // past the margin (which would make PDFKit auto-add a page).
        const CONTENT_BOTTOM = doc.page.height - PAGE_MARGIN;

        // ── SECTIONS ────────────────────────────────────────────────────
        for (const section of survey.sections) {
            // Keep the section header with at least its first row, not stranded.
            if (y + 50 > CONTENT_BOTTOM) { doc.addPage(); y = PAGE_MARGIN; }

            doc.fillColor(INK).fontSize(12).font('Helvetica-Bold').text(section.roomName, PAGE_MARGIN, y);
            y += 17;
            rule(y);
            y += 16;

            for (const item of section.items) {
                const commentText = item.comments || 'NIL';
                doc.fontSize(9.5).font('Helvetica');
                const commentH = doc.heightOfString(commentText, { width: usableWidth });
                // Break before drawing if the label row + comment won't fit, so
                // PDFKit never auto-paginates the body text mid-item.
                if (y + 16 + commentH + 18 > CONTENT_BOTTOM) { doc.addPage(); y = PAGE_MARGIN; }

                const itemColor = STATUS_COLORS[item.status] || STATUS_COLORS[''];

                doc.fillColor(INK).fontSize(10.5).font('Helvetica-Bold')
                    .text(item.label, PAGE_MARGIN, y, { width: usableWidth - 100 });
                doc.fillColor(itemColor).fontSize(9).font('Helvetica-Bold')
                    .text((item.status || 'N/A').toUpperCase(), PAGE_MARGIN + usableWidth - 100, y + 1, { width: 100, align: 'right', characterSpacing: 0.3 });
                y += 16;

                doc.fillColor(MUTED).fontSize(9.5).font('Helvetica')
                    .text(commentText, PAGE_MARGIN, y, { width: usableWidth });
                y += commentH + 10;

                // Photos — 3 per row
                if (item.photos && item.photos.length > 0) {
                    const thumbW = 115, thumbH = 80, cols = 3;
                    let col = 0;
                    for (const photoUrl of item.photos) {
                        if (col === 0 && y + thumbH > CONTENT_BOTTOM) { doc.addPage(); y = PAGE_MARGIN; }
                        const thumbX = PAGE_MARGIN + col * (thumbW + 8);
                        let imgBuf = null;
                        try { imgBuf = await downloadImage(photoUrl); } catch { /* placeholder drawn below */ }
                        drawImageOrPlaceholder(doc, imgBuf, thumbX, y, thumbW, thumbH);

                        col++;
                        if (col >= cols) { col = 0; y += thumbH + 8; }
                    }
                    if (col !== 0) y += thumbH + 8;
                }

                y += 8;
                if (y < CONTENT_BOTTOM) rule(y - 4);
            }
            y += 14;
        }

        // ── GLOBAL PHOTOS ───────────────────────────────────────────────
        if (survey.globalPhotos && survey.globalPhotos.length > 0) {
            if (y + 60 > CONTENT_BOTTOM) { doc.addPage(); y = PAGE_MARGIN; }

            doc.fillColor(INK).fontSize(12).font('Helvetica-Bold').text('Additional Photos', PAGE_MARGIN, y);
            y += 17;
            rule(y);
            y += 18;

            const thumbW = 165, thumbH = 120, cols = 3;
            let col = 0;
            for (const photoUrl of survey.globalPhotos) {
                if (col === 0 && y + thumbH > CONTENT_BOTTOM) { doc.addPage(); y = PAGE_MARGIN; }
                const thumbX = PAGE_MARGIN + col * (thumbW + 15);
                let imgBuf = null;
                try { imgBuf = await downloadImage(photoUrl); } catch { /* placeholder drawn below */ }
                drawImageOrPlaceholder(doc, imgBuf, thumbX, y, thumbW, thumbH);

                col++;
                if (col >= cols) { col = 0; y += thumbH + 15; }
            }
        }

        // ── FOOTER ──────────────────────────────────────────────────────
        // Stamping text below the bottom margin makes PDFKit auto-insert a new
        // page (the cause of trailing blank pages). Temporarily drop the bottom
        // margin to 0 and disable line wrapping so the footer can't paginate.
        const pageRange = doc.bufferedPageRange();
        const pageCount = pageRange.count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(pageRange.start + i);
            const savedBottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(
                `${pd.unitNumber || 'Property Condition Survey'}   ·   Page ${i + 1} of ${pageCount}`,
                PAGE_MARGIN, doc.page.height - 35,
                { align: 'center', width: usableWidth, lineBreak: false }
            );
            doc.page.margins.bottom = savedBottom;
        }

        doc.end();
    } catch (err) {
        console.error('PDF generation error:', err);
        if (res.headersSent) return;
        if (err.name === 'CastError') return res.status(404).json({ error: 'Survey not found' });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
