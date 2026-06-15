import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onCancel}>
            <div style={{
                background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)',
                borderRadius: 12, padding: '28px 32px', maxWidth: 400, width: '90%',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <AlertTriangle size={20} color="#f59e0b" />
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Confirm Action</span>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
                    <button onClick={onConfirm} className="btn btn-danger btn-sm">Confirm</button>
                </div>
            </div>
        </div>
    );
}
