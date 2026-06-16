import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, User, MapPin, Trash2, ChevronRight, Plus, Search, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [toast, setToast] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [duplicatingId, setDuplicatingId] = useState(null);
    const navigate = useNavigate();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        api.get('/api/surveys')
            .then(({ data }) => setSurveys(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = surveys.filter(s => {
        if (activeTab !== 'All' && s.status !== activeTab) return false;
        if (!searchTerm.trim()) return true;
        const t = searchTerm.toLowerCase();
        return (
            s.propertyDetails?.unitNumber?.toLowerCase().includes(t) ||
            s.propertyDetails?.buildingName?.toLowerCase().includes(t) ||
            s.propertyDetails?.address?.toLowerCase().includes(t) ||
            s.propertyDetails?.inspector?.toLowerCase().includes(t)
        );
    });

    const confirmDeleteSurvey = async () => {
        const id = confirmDelete;
        setConfirmDelete(null);
        try {
            await api.delete(`/api/surveys/${id}`);
            setSurveys(s => s.filter(x => x._id !== id));
            showToast('Survey deleted');
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const duplicateSurvey = async (id) => {
        if (duplicatingId) return;
        setDuplicatingId(id);
        try {
            const { data } = await api.post(`/api/surveys/${id}/duplicate`);
            navigate(`/surveys/${data._id}/edit`);
        } catch {
            showToast('Failed to duplicate', 'error');
            setDuplicatingId(null);
        }
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Surveys</h1>
                    <button className="btn btn-primary" onClick={() => navigate('/surveys/new')}>
                        <Plus size={15} /> New Survey
                    </button>
                </div>

                {loading ? (
                    <div className="loading-screen"><div className="spinner" /><span>Loading...</span></div>
                ) : (
                    <>
                        {/* Controls */}
                        <div className="dashboard-controls">
                            <div className="search-wrapper">
                                <Search className="search-icon" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search by unit, building, address..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-tabs">
                                {['All', 'Draft', 'Completed'].map(tab => (
                                    <button key={tab} className={`filter-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="survey-grid">
                            {filtered.length === 0 ? (
                                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                    <p style={{ fontSize: 15, marginBottom: 16 }}>
                                        {surveys.length === 0 ? 'No surveys yet.' : 'No results.'}
                                    </p>
                                    {surveys.length === 0 && (
                                        <button className="btn btn-primary" onClick={() => navigate('/surveys/new')}>
                                            <Plus size={15} /> New Survey
                                        </button>
                                    )}
                                </div>
                            ) : filtered.map(s => {
                                const pct = (() => {
                                    const items = s.sections?.flatMap(sec => sec.items) || [];
                                    if (!items.length) return 0;
                                    return Math.round((items.filter(i => i.status).length / items.length) * 100);
                                })();

                                return (
                                    <div
                                        key={s._id}
                                        className={`card survey-card ${s.status === 'Completed' ? 'survey-card--completed' : ''}`}
                                        onClick={() => navigate(`/surveys/${s._id}/edit`)}
                                    >
                                        <div className="survey-card-header">
                                            <div>
                                                <div className="survey-card-title">{s.propertyDetails?.unitNumber || '—'}</div>
                                                <div className="survey-card-sub">
                                                    <Building2 size={12} />
                                                    {s.propertyDetails?.buildingName || 'No building'}
                                                </div>
                                            </div>
                                            <span className={`badge badge-${s.status === 'Completed' ? 'completed' : 'draft'}`}>{s.status}</span>
                                        </div>

                                        <div className="survey-card-meta">
                                            {s.propertyDetails?.inspector && (
                                                <div className="meta-chip"><User size={12} />{s.propertyDetails.inspector}</div>
                                            )}
                                            <div className="meta-chip"><Calendar size={12} />{formatDate(s.propertyDetails?.date)}</div>
                                            {s.propertyDetails?.address && (
                                                <div className="meta-chip"><MapPin size={12} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.propertyDetails.address}</span></div>
                                            )}
                                        </div>

                                        {pct > 0 && (
                                            <div className="survey-progress">
                                                <div className="survey-progress-bar" style={{ width: `${pct}%` }} />
                                                <span className="survey-progress-label">{pct}%</span>
                                            </div>
                                        )}

                                        <div className="card-actions">
                                            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                                                onClick={e => { e.stopPropagation(); navigate(`/surveys/${s._id}/edit`); }}>
                                                Edit <ChevronRight size={13} />
                                            </button>
                                            <button className="btn btn-secondary btn-sm"
                                                onClick={e => { e.stopPropagation(); navigate(`/surveys/${s._id}/report`); }}>
                                                Report
                                            </button>
                                            <button className="btn btn-secondary btn-sm btn-icon"
                                                title="Duplicate for another unit" aria-label="Duplicate survey"
                                                disabled={duplicatingId === s._id}
                                                onClick={e => { e.stopPropagation(); duplicateSurvey(s._id); }}>
                                                <Copy size={13} />
                                            </button>
                                            <button className="btn btn-danger btn-sm btn-icon"
                                                title="Delete" aria-label="Delete survey"
                                                onClick={e => { e.stopPropagation(); setConfirmDelete(s._id); }}>
                                                <Trash2 size={13} />
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
                    message="Delete this survey? This cannot be undone."
                    onConfirm={confirmDeleteSurvey}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                    <span>{toast.msg}</span>
                </div>
            )}
        </div>
    );
}
