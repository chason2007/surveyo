import { useRef, useState } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import api from '../api/axios';

export default function PhotoUploader({ photos = [], onChange }) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef();

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
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
            e.target.value = '';
        }
    };

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
                    <Loader size={18} className="spin-icon" style={{ animation: 'spin 0.8s linear infinite' }} />
                </div>
            )}

            <button
                className="photo-upload-btn"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                title="Upload photo"
            >
                <Camera size={18} />
                <span>Photo</span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
}
