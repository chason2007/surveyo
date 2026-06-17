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
                        <rect x="5" y="4" width="14" height="17" rx="1.5" fill="#16a34a"/>
                        <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M8 11.5L11 14.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Surveyo</span>
                </Link>
                <div className="navbar-links">
                    <Link to="/">Dashboard</Link>
                    <Link to="/surveys/new" className="btn btn-primary btn-sm">
                        <Plus size={14} /> New Survey
                    </Link>
                    <button onClick={logout} aria-label="Log out" title="Log out">
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
