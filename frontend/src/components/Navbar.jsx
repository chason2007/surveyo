import { Link, useLocation } from 'react-router-dom';
import { Building2, ClipboardList } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <Building2 size={22} color="var(--accent-blue)" />
                    <span>Surveyo</span>
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
