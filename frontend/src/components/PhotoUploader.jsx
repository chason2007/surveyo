import { useRef, useState } from 'react';
import { Camera, X, Loader, Image, Upload } from 'lucide-react';
import api from '../api/axios';

export default function PhotoUploader({ photos = [], onChange }) {
    const [uploading, setUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const cameraRef = useRef();
    const galleryRef = useRef();

    const uploadFiles = async (files) => {
        if (!files.length) return;
        setUploading(true);
        setUploadError(null);
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
            setUploadError('Upload failed. Check your connection and try again.');
        } finally {
            setUploading(false);
            if (cameraRef.current) cameraRef.current.value = '';
            if (galleryRef.current) galleryRef.current.value = '';
        }
    };

    const handleFiles = (e) => uploadFiles(Array.from(e.target.files));

    const removePhoto = (e, idx) => {
        e.stopPropagation();
        onChange(photos.filter((_, i) => i !== idx));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) {
            uploadFiles(Array.from(e.dataTransfer.files));
        }
    };

    return (
        <div className="premium-uploader">
            {uploadError && (
                <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⚠</span> {uploadError}
                </div>
            )}
            {/* Miniature Previews Grid */}
            {photos.length > 0 && (
                <div className="uploader-preview-grid">
                    {photos.map((url, i) => (
                        <div key={i} className="uploader-thumb-card">
                            <img src={url} alt={`photo-${i}`} />
                            <button
                                type="button"
                                className="delete-thumb-btn"
                                onClick={(e) => removePhoto(e, i)}
                                title="Delete image"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Drag & Drop Main Zone */}
            <div 
                className={`drag-drop-zone ${isDragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => galleryRef.current?.click()}
            >
                {uploading ? (
                    <div className="uploading-state">
                        <Loader size={20} className="spinning-icon" />
                        <span>Uploading files...</span>
                    </div>
                ) : (
                    <div className="uploader-prompt">
                        <Upload size={18} className="upload-icon" />
                        <div className="prompt-text">
                            <span className="bold-prompt">Drag & drop files here</span> or <span className="browse-link">browse</span>
                        </div>
                        <span className="sub-prompt">Supports PNG, JPG, JPEG</span>
                    </div>
                )}
            </div>

            {/* Mobile / Direct Camera Capture Bar */}
            <div className="uploader-actions-bar">
                <button
                    type="button"
                    className="action-btn-compact"
                    onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
                    disabled={uploading}
                >
                    <Camera size={13} />
                    <span>Camera Capture</span>
                </button>
                <button
                    type="button"
                    className="action-btn-compact secondary"
                    onClick={(e) => { e.stopPropagation(); galleryRef.current?.click(); }}
                    disabled={uploading}
                >
                    <Image size={13} />
                    <span>Photo Gallery</span>
                </button>
            </div>

            {/* Hidden native input triggers */}
            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFiles}
            />
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
