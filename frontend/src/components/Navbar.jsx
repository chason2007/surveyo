import { Link, useLocation } from 'react-router-dom';
import { Building2, ClipboardList } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <img src="/logo.png" alt="Surveyo Logo" style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <span className="text-gradient" style={{ fontSize: '20px', letterSpacing: '-0.02em' }}>Surveyo</span>
                    <div className="brand-dot" />
                </Link>
                <div className="navbar-links">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        Dashboard
                    </Link>
                    <Link to="/surveys/new" className="btn btn-primary btn-sm">
                        <ClipboardList size={15} />
                        New Survey
                    </Link>
                </div>
            </div>
        </nav>
    );
}
