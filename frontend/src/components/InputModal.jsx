import { useEffect, useRef, useState } from 'react';

export default function InputModal({ title, placeholder, onConfirm, onCancel }) {
    const [value, setValue] = useState('');
    const inputRef = useRef();

    useEffect(() => {
        inputRef.current?.focus();
        const handler = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    const submit = () => {
        const trimmed = value.trim();
        if (trimmed) onConfirm(trimmed);
    };

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
                <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 16 }}>{title}</p>
                <input
                    ref={inputRef}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={placeholder}
                    onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                    style={{ width: '100%', marginBottom: 20 }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
                    <button onClick={submit} className="btn btn-primary btn-sm" disabled={!value.trim()}>Create</button>
                </div>
            </div>
        </div>
    );
}
