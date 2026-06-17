import { Link, useNavigate } from 'react-router-dom';
import { Plus, LogOut } from 'lucide-react';
import { clearToken } from '../api/axios';

export default function Navbar() {
    const navigate = useNavigate();
    const logout = () => {
        clearToken();
        navigate('/login', { replace: true });
    };

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="5" y="4" width="14" height="17" rx="1.5" stroke="white" strokeWidth="1.8"/>
                        <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M8 11.5L11 14.5L16 9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.25" strokeLinecap="round"/>
                        <line x1="8" y1="19.5" x2="12.5" y2="19.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.25" strokeLinecap="round"/>
                    </svg>
                    <span>Surveyo</span>
                </Link>
                <div className="navbar-links">
                    <Link to="/" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: 'rgba(245,240,232,0.7)' }}>
                        Dashboard
                    </Link>
                    <Link to="/surveys/new" className="btn btn-primary btn-sm">
                        <Plus size={14} /> New Survey
                    </Link>
                    <button
                        onClick={logout}
                        aria-label="Log out"
                        title="Log out"
                        style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', color: 'rgba(245,240,232,0.7)', cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
