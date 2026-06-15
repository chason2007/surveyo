import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span>Surveyo</span>
                    <div className="brand-dot" />
                </Link>
                <div className="navbar-links">
                    <Link to="/" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: 'rgba(245,240,232,0.7)' }}>
                        Dashboard
                    </Link>
                    <Link to="/surveys/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 3, fontSize: 13, fontWeight: 600,
                        background: 'rgba(255,255,255,0.1)', color: 'var(--bg-base)',
                        border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.18s ease'
                    }}>
                        <Plus size={14} /> New Survey
                    </Link>
                </div>
            </div>
        </nav>
    );
}
