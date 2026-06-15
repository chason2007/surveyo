import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Calendar, User, MapPin, Trash2,
    ClipboardList, ChevronRight, Plus, Search,
    CheckCircle, AlertTriangle, Layers
} from 'lucide-react';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard() {
    const [surveys, setSurveys] = useState([]);
    const [filteredSurveys, setFilteredSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [toast, setToast] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // survey id to delete
    const navigate = useNavigate();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async () => {
        try {
            const { data } = await api.get('/api/surveys');
            setSurveys(data);
            setFilteredSurveys(data);
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { load(); }, []);

    // Filter logic
    useEffect(() => {
        let result = surveys;

        // Apply tab filter
        if (activeTab !== 'All') {
            result = result.filter(s => s.status === activeTab);
        }

        // Apply search filter
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(s => 
                (s.propertyDetails?.unitNumber?.toLowerCase().includes(term)) ||
                (s.propertyDetails?.buildingName?.toLowerCase().includes(term)) ||
                (s.propertyDetails?.address?.toLowerCase().includes(term)) ||
                (s.propertyDetails?.inspector?.toLowerCase().includes(term))
            );
        }

        setFilteredSurveys(result);
    }, [searchTerm, activeTab, surveys]);

    const deleteSurvey = (e, id) => {
        e.stopPropagation();
        setConfirmDelete(id);
    };

    const confirmDeleteSurvey = async () => {
        const id = confirmDelete;
        setConfirmDelete(null);
        try {
            await api.delete(`/api/surveys/${id}`);
            setSurveys(s => s.filter(x => x._id !== id));
            showToast('Survey deleted successfully');
        } catch {
            showToast('Failed to delete survey', 'error');
        }
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    // Stats calculations
    const totalSurveys = surveys.length;
    const completedSurveys = surveys.filter(s => s.status === 'Completed').length;
    const draftSurveys = surveys.filter(s => s.status === 'Draft').length;
    
    // Total items and defects across all surveys
    let totalItemsChecked = 0;
    let totalDefectsFound = 0;
    surveys.forEach(s => {
        const items = s.sections?.flatMap(sec => sec.items) || [];
        totalItemsChecked += items.length;
        totalDefectsFound += items.filter(i => i.status === 'Need Action').length;
    });

    return (
        <div className="page-wrapper">
            {/* Hero */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-eyebrow">
                        <ClipboardList size={12} />
                        PROPERTY INTELLIGENCE SYSTEM
                    </div>
                    <h1>Survey Dashboard</h1>
                    <p>Track inspections, evaluate conditions, upload site photos, and publish professional executive reports.</p>
                    <div className="hero-actions">
                        <button className="btn btn-primary" onClick={() => navigate('/surveys/new')}>
                            <Plus size={16} />
                            New Inspection Survey
                        </button>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="container" style={{ paddingBottom: 80 }}>
                {loading ? (
                    <div className="loading-screen">
                        <div className="spinner" />
                        <span>Loading property records...</span>
                    </div>
                ) : (
                    <>
                        {/* Stats Dashboard Row */}
                        <div className="stats-grid">
                            <div className="card stat-card card-glow">
                                <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                                    <Layers size={22} />
                                </div>
                                <div className="stat-card-details">
                                    <span className="stat-card-value">{totalSurveys}</span>
                                    <span className="stat-card-label">Total Properties</span>
                                </div>
                            </div>
                            
                            <div className="card stat-card card-glow">
                                <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--good)' }}>
                                    <CheckCircle size={22} />
                                </div>
                                <div className="stat-card-details">
                                    <span className="stat-card-value">{completedSurveys}</span>
                                    <span className="stat-card-label">Completed</span>
                                </div>
                            </div>

                            <div className="card stat-card card-glow">
                                <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--need-action)' }}>
                                    <Calendar size={22} />
                                </div>
                                <div className="stat-card-details">
                                    <span className="stat-card-value">{draftSurveys}</span>
                                    <span className="stat-card-label">In Draft</span>
                                </div>
                            </div>

                            <div className="card stat-card card-glow">
                                <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                    <AlertTriangle size={22} />
                                </div>
                                <div className="stat-card-details">
                                    <span className="stat-card-value">{totalDefectsFound}</span>
                                    <span className="stat-card-label">Active Defects</span>
                                </div>
                            </div>
                        </div>

                        {/* Search & Tab Control Panel */}
                        <div className="dashboard-controls">
                            <div className="search-wrapper">
                                <Search className="search-icon" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search property name, address, inspector..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="filter-tabs">
                                {['All', 'Draft', 'Completed'].map(tab => (
                                    <button 
                                        key={tab}
                                        className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab === 'All' ? 'All Surveys' : tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Surveys Grid */}
                        <div className="survey-grid">
                            {filteredSurveys.length === 0 ? (
                                <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '80px 20px' }}>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%',
                                        background: 'rgba(99, 102, 241, 0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 24px', boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)'
                                    }}>
                                        <Building2 size={40} color="var(--accent-primary)" />
                                    </div>
                                    <h3 style={{ fontSize: 24, marginBottom: 8, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700 }}>No surveys found</h3>
                                    <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
                                        {surveys.length === 0 ? 'Start your first professional inspection today.' : 'Try adjusting your search query or active filter tab.'}
                                    </p>
                                    {surveys.length === 0 && (
                                        <button
                                            className="btn btn-primary"
                                            style={{ marginTop: 24, display: 'inline-flex', padding: '12px 28px', fontSize: 15 }}
                                            onClick={() => navigate('/surveys/new')}
                                        >
                                            <Plus size={18} /> New Survey
                                        </button>
                                    )}
                                </div>
                            ) : filteredSurveys.map(s => {
                                const allItems = s.sections?.flatMap(sec => sec.items) || [];
                                const filled = allItems.filter(i => i.status).length;
                                const total = allItems.length;
                                const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
                                const completed = s.status === 'Completed';

                                return (
                                    <div
                                        key={s._id}
                                        className={`card card-glow survey-card ${completed ? 'survey-card--completed' : ''}`}
                                        onClick={() => navigate(`/surveys/${s._id}/edit`)}
                                    >
                                        <div className="survey-card-header">
                                            <div>
                                                <div className="survey-card-title">
                                                    {s.propertyDetails?.unitNumber || 'Unit —'}
                                                </div>
                                                <div className="survey-card-sub">
                                                    <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
                                                    {s.propertyDetails?.buildingName || 'No building specified'}
                                                </div>
                                            </div>
                                            <span className={`badge badge-${completed ? 'completed' : 'draft'}`}>
                                                {s.status}
                                            </span>
                                        </div>

                                        <div className="survey-card-meta">
                                            {s.propertyDetails?.inspector && (
                                                <div className="meta-chip">
                                                    <User size={13} /> <span>{s.propertyDetails.inspector}</span>
                                                </div>
                                            )}
                                            <div className="meta-chip">
                                                <Calendar size={13} /> <span>{formatDate(s.propertyDetails?.date)}</span>
                                            </div>
                                            {s.propertyDetails?.address && (
                                                <div className="meta-chip">
                                                    <MapPin size={13} /> <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.propertyDetails.address}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress bar */}
                                        {total > 0 && (
                                            <div className="survey-progress">
                                                <div className="survey-progress-bar" style={{ width: `${pct}%` }} />
                                                <span className="survey-progress-label">{pct}% Complete</span>
                                            </div>
                                        )}

                                        <div className="card-actions">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ flex: 1 }}
                                                onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${s._id}/edit`); }}
                                            >
                                                Inspect <ChevronRight size={14} />
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${s._id}/report`); }}
                                            >
                                                Report
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm btn-icon"
                                                onClick={(e) => deleteSurvey(e, s._id)}
                                                title="Delete record"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
            {confirmDelete && (
                <ConfirmModal
                    message="Delete this survey? This action cannot be undone."
                    onConfirm={confirmDeleteSurvey}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === 'success'
                        ? <CheckCircle size={16} color="var(--good)" />
                        : <AlertTriangle size={16} color="#ef4444" />}
                    <span>{toast.msg}</span>
                </div>
            )}
        </div>
    );
}
