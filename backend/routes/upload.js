const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage so we can pipe to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
});

// POST /api/upload — upload single image
router.post('/', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file provided' });

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'property-surveys', resource_type: 'image' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            const readable = new Readable();
            readable.push(req.file.buffer);
            readable.push(null);
            readable.pipe(stream);
        });

        res.json({ url: uploadResult.secure_url, publicId: uploadResult.public_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/upload — delete an image from Cloudinary
router.delete('/', async (req, res) => {
    try {
        const { publicId } = req.body;
        if (!publicId) return res.status(400).json({ error: 'No publicId provided' });
        await cloudinary.uploader.destroy(publicId);
        res.json({ message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
