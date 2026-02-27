import { useRef, useState } from 'react';
import { Camera, X, Loader, Image } from 'lucide-react';
import api from '../api/axios';

export default function PhotoUploader({ photos = [], onChange }) {
    const [uploading, setUploading] = useState(false);
    const cameraRef = useRef();
    const galleryRef = useRef();

    const uploadFiles = async (files) => {
        if (!files.length) return;
        setUploading(true);
        try {
            const uploaded = await Promise.all(
                files.map(async (file) => {
                    const form = new FormData();
                    form.append('photo', file);
                    const res = await api.post('/api/upload', form, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    return res.data.url;
                })
            );
            onChange([...photos, ...uploaded]);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
            if (cameraRef.current) cameraRef.current.value = '';
            if (galleryRef.current) galleryRef.current.value = '';
        }
    };

    const handleFiles = (e) => uploadFiles(Array.from(e.target.files));

    const removePhoto = (idx) => {
        onChange(photos.filter((_, i) => i !== idx));
    };

    return (
        <div className="photo-grid">
            {photos.map((url, i) => (
                <div key={i} className="photo-thumb">
                    <img src={url} alt={`photo-${i}`} />
                    <button
                        className="remove-photo"
                        onClick={() => removePhoto(i)}
                        title="Remove photo"
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}

            {uploading && (
                <div className="uploading-spinner">
                    <Loader size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                </div>
            )}

            {/* Camera button — opens native camera on mobile */}
            <button
                className="photo-upload-btn"
                onClick={() => cameraRef.current?.click()}
                disabled={uploading}
                title="Take photo"
            >
                <Camera size={20} />
                <span>Camera</span>
            </button>

            {/* Gallery button — pick from library */}
            <button
                className="photo-upload-btn"
                onClick={() => galleryRef.current?.click()}
                disabled={uploading}
                title="Choose from gallery"
            >
                <Image size={20} />
                <span>Gallery</span>
            </button>

            {/* Camera capture input */}
            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFiles}
            />

            {/* Gallery / file picker input */}
            <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFiles}
            />
        </div>
    );
}
