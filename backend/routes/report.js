const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');
const Survey = require('../models/Survey');

// Helper: download image from URL into a Buffer
function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

// Status colors (RGB)
const STATUS_COLORS = {
    'Good': [34, 197, 94],   // green
    'Need Action': [245, 158, 11],  // amber
    'N/A': [148, 163, 184], // slate
    '': [148, 163, 184]
};

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595; // A4

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

        // ── COVER / HEADER ──────────────────────────────────────────────────
        // Dark header bar
        doc.rect(0, 0, PAGE_WIDTH, 110).fill('#0f172a');

        doc.fillColor('#38bdf8').fontSize(22).font('Helvetica-Bold')
            .text('PROPERTY CONDITION SURVEY', PAGE_MARGIN, 28, { align: 'left' });

        doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
            .text('Professional Property Inspection Report', PAGE_MARGIN, 56);

        // Accent line
        doc.rect(0, 110, PAGE_WIDTH, 4).fill('#38bdf8');

        // ── PROPERTY DETAILS BOX ────────────────────────────────────────────
        let y = 130;

        doc.rect(PAGE_MARGIN, y, usableWidth, 120).fill('#f8fafc').stroke('#e2e8f0');
        y += 10;

        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
            .text('PROPERTY DETAILS', PAGE_MARGIN + 10, y);
        y += 18;

        const detailsLeft = [
            ['Unit / Property No.', pd.unitNumber || '—'],
            ['Building / Complex', pd.buildingName || '—'],
            ['Address', pd.address || '—'],
        ];
        const detailsRight = [
            ['Property Type', pd.propertyType || '—'],
            ['Inspector', pd.inspector || '—'],
            ['Date', pd.date ? new Date(pd.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
        ];

        const halfW = usableWidth / 2 - 10;
        detailsLeft.forEach(([label, val], i) => {
            const rowY = y + i * 22;
            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(label, PAGE_MARGIN + 10, rowY);
            doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(val, PAGE_MARGIN + 10, rowY + 9);
        });
        detailsRight.forEach(([label, val], i) => {
            const rowY = y + i * 22;
            const colX = PAGE_MARGIN + halfW + 20;
            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(label, colX, rowY);
            doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(val, colX, rowY + 9);
        });

        y += detailsLeft.length * 22 + 20;

        // ── SURVEY STATUS BADGE ─────────────────────────────────────────────
        const statusColor = survey.status === 'Completed' ? '#22c55e' : '#f59e0b';
        doc.roundedRect(PAGE_MARGIN, y, 100, 22, 4).fill(statusColor);
        doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold')
            .text(survey.status.toUpperCase(), PAGE_MARGIN, y + 7, { width: 100, align: 'center' });
        y += 35;

        // ── LEGEND ─────────────────────────────────────────────────────────
        const legendItems = [
            { label: 'Good', color: [34, 197, 94] },
            { label: 'Need Action', color: [245, 158, 11] },
            { label: 'N/A', color: [148, 163, 184] }
        ];
        doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('LEGEND:', PAGE_MARGIN, y);
        let lx = PAGE_MARGIN + 45;
        legendItems.forEach(({ label, color }) => {
            doc.roundedRect(lx, y - 1, 8, 8, 2).fill(`rgb(${color.join(',')})`);
            doc.fillColor('#334155').fontSize(8).font('Helvetica').text(label, lx + 11, y);
            lx += label.length * 6 + 22;
        });
        y += 20;

        // ── SECTIONS ────────────────────────────────────────────────────────
        for (const section of survey.sections) {
            // Section header
            y += 10;
            if (y > 700) { doc.addPage(); y = PAGE_MARGIN; }

            doc.rect(PAGE_MARGIN, y, usableWidth, 24).fill('#0f172a');
            doc.fillColor('#38bdf8').fontSize(12).font('Helvetica-Bold')
                .text(section.roomName.toUpperCase(), PAGE_MARGIN + 10, y + 7);
            y += 30;

            // Column headers
            doc.fillColor('#64748b').fontSize(8).font('Helvetica');
            doc.text('ITEM', PAGE_MARGIN, y);
            doc.text('STATUS', PAGE_MARGIN + 230, y);
            doc.text('COMMENTS', PAGE_MARGIN + 310, y);
            y += 14;
            doc.rect(PAGE_MARGIN, y, usableWidth, 1).fill('#e2e8f0');
            y += 6;

            for (const item of section.items) {
                if (y > 720) { doc.addPage(); y = PAGE_MARGIN; }

                const rowStartY = y;
                const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS[''];

                // Item label
                doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold')
                    .text(item.label, PAGE_MARGIN, y, { width: 220 });

                // Status pill
                doc.roundedRect(PAGE_MARGIN + 228, y - 2, 70, 14, 3)
                    .fill(`rgb(${statusColor.join(',')})`);
                doc.fillColor('#fff').fontSize(7.5).font('Helvetica-Bold')
                    .text(item.status || 'N/A', PAGE_MARGIN + 228, y + 2, { width: 70, align: 'center' });

                // Comments
                doc.fillColor('#475569').fontSize(8).font('Helvetica')
                    .text(item.comments || '—', PAGE_MARGIN + 308, y, { width: 175 });

                y += 18;

                // Photos — in a row, 3 per row, ~120px wide
                if (item.photos && item.photos.length > 0) {
                    const thumbW = 115;
                    const thumbH = 80;
                    const cols = 3;
                    let col = 0;

                    for (const photoUrl of item.photos) {
                        if (col === 0 && y + thumbH + 10 > 760) {
                            doc.addPage();
                            y = PAGE_MARGIN;
                        }

                        const thumbX = PAGE_MARGIN + col * (thumbW + 8);
                        try {
                            const imgBuf = await downloadImage(photoUrl);
                            doc.image(imgBuf, thumbX, y, { width: thumbW, height: thumbH, cover: [thumbW, thumbH] });
                            // subtle border
                            doc.rect(thumbX, y, thumbW, thumbH).stroke('#e2e8f0');
                        } catch {
                            // If image fails, draw a placeholder box
                            doc.rect(thumbX, y, thumbW, thumbH).fill('#f1f5f9').stroke('#e2e8f0');
                            doc.fillColor('#94a3b8').fontSize(7).text('Image unavailable', thumbX, y + thumbH / 2 - 5, { width: thumbW, align: 'center' });
                        }

                        col++;
                        if (col >= cols) {
                            col = 0;
                            y += thumbH + 6;
                        }
                    }
                    if (col !== 0) y += thumbH + 6;
                    y += 4;
                }

                // Divider
                doc.rect(PAGE_MARGIN, y, usableWidth, 0.5).fill('#f1f5f9');
                y += 6;
            }

            y += 6;
        }

        // ── FOOTER ──────────────────────────────────────────────────────────
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.rect(0, 820, PAGE_WIDTH, 22).fill('#0f172a');
            doc.fillColor('#64748b').fontSize(7).font('Helvetica')
                .text(
                    `Property Condition Survey  •  ${pd.buildingName || ''}  •  Page ${i + 1} of ${pageCount}`,
                    PAGE_MARGIN, 826, { align: 'center', width: usableWidth }
                );
        }

        doc.end();
    } catch (err) {
        console.error('PDF generation error:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

module.exports = router;
