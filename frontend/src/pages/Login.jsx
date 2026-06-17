import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setToken } from '../api/axios';

export default function Login() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!password || submitting) return;
        setSubmitting(true);
        setError('');
        try {
            const { data } = await api.post('/api/auth/login', { password });
            setToken(data.token);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.status === 401 ? 'Incorrect password.' : 'Could not sign in. Check your connection and try again.');
            setSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <form onSubmit={submit} className="card" style={{ width: '100%', maxWidth: 360, padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="5" y="4" width="14" height="17" rx="1.5" fill="#16a34a" />
                        <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M8 11.5L11 14.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)' }}>Surveyo</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Sign in to continue.</p>

                <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoFocus
                    autoComplete="current-password"
                    style={{ width: '100%', marginBottom: error ? 8 : 20 }}
                />

                {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 16px' }}>{error}</p>}

                <button type="submit" className="btn btn-primary" disabled={submitting || !password} style={{ width: '100%' }}>
                    {submitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </div>
    );
}
