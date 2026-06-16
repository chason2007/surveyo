import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);

    useEffect(() => {
        const prevFocus = document.activeElement;
        // Focus Cancel by default — this dialog guards destructive actions, so
        // a stray Enter should not confirm.
        cancelRef.current?.focus();

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

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onCancel}>
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Confirm action" style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '28px 32px', maxWidth: 400, width: '90%',
                boxShadow: '0 16px 40px rgba(0,0,0,0.18)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <AlertTriangle size={20} color="#f59e0b" />
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Confirm Action</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button ref={cancelRef} onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
                    <button onClick={onConfirm} className="btn btn-danger btn-sm">Confirm</button>
                </div>
            </div>
        </div>
    );
}
