import { useEffect, useRef, useState } from 'react';

export default function InputModal({ title, placeholder, onConfirm, onCancel }) {
    const [value, setValue] = useState('');
    const dialogRef = useRef(null);
    const inputRef = useRef();

    useEffect(() => {
        const prevFocus = document.activeElement;
        inputRef.current?.focus();

        const handleKey = (e) => {
            if (e.key === 'Escape') { onCancel(); return; }
            if (e.key === 'Tab') {
                const f = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (!f || f.length === 0) return;
                const first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => {
            window.removeEventListener('keydown', handleKey);
            if (prevFocus && prevFocus.focus) prevFocus.focus();
        };
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
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '28px 32px', maxWidth: 400, width: '90%',
                boxShadow: '0 16px 40px rgba(0,0,0,0.18)'
            }} onClick={e => e.stopPropagation()}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 16 }}>{title}</p>
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
