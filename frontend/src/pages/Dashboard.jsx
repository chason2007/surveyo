import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Calendar, User, MapPin, Trash2,
    ClipboardList, ChevronRight, Plus
} from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const load = async () => {
        try {
            const { data } = await api.get('/api/surveys');
            setSurveys(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const deleteSurvey = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Delete this survey?')) return;
        await api.delete(`/api/surveys/${id}`);
        setSurveys(s => s.filter(x => x._id !== id));
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="page-wrapper">
            {/* Hero */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-eyebrow">
                        <ClipboardList size={12} />
                        PROPERTY SURVEYS
                    </div>
                    <h1>Survey Dashboard</h1>
                    <p>Manage your property inspections, upload photos, and generate professional reports in one place.</p>
                    <div className="hero-actions">
                        <button className="btn btn-primary" onClick={() => navigate('/surveys/new')}>
                            <Plus size={16} />
                            New Survey
                        </button>
                    </div>
                </div>
            </section>

            {/* Content */}
            <div className="container">
                {loading ? (
                    <div className="loading-screen">
                        <div className="spinner" />
                        <span>Loading surveys…</span>
                    </div>
                ) : (
                    <div className="survey-grid">
                        {surveys.length === 0 ? (
                            <div className="empty-state">
                                <Building2 size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                                <h3>No surveys yet</h3>
                                <p>Create your first property survey to get started.</p>
                                <button
                                    className="btn btn-primary"
                                    style={{ marginTop: 20, display: 'inline-flex' }}
                                    onClick={() => navigate('/surveys/new')}
                                >
                                    <Plus size={16} /> New Survey
                                </button>
                            </div>
                        ) : surveys.map(s => (
                            <div
                                key={s._id}
                                className="card card-glow survey-card"
                                onClick={() => navigate(`/surveys/${s._id}/edit`)}
                            >
                                <div className="survey-card-header">
                                    <div>
                                        <div className="survey-card-title">
                                            {s.propertyDetails?.unitNumber || 'Untitled Unit'}
                                        </div>
                                        <div className="survey-card-sub">
                                            {s.propertyDetails?.buildingName || 'No building name'}
                                        </div>
                                    </div>
                                    <span className={`badge badge-${s.status === 'Completed' ? 'completed' : 'draft'}`}>
                                        {s.status}
                                    </span>
                                </div>

                                <div className="survey-card-meta">
                                    {s.propertyDetails?.inspector && (
                                        <div className="meta-chip">
                                            <User size={13} /> {s.propertyDetails.inspector}
                                        </div>
                                    )}
                                    <div className="meta-chip">
                                        <Calendar size={13} /> {formatDate(s.propertyDetails?.date)}
                                    </div>
                                    {s.propertyDetails?.address && (
                                        <div className="meta-chip">
                                            <MapPin size={13} /> {s.propertyDetails.address}
                                        </div>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={(e) => { e.stopPropagation(); navigate(`/surveys/${s._id}/edit`); }}
                                    >
                                        Open Editor <ChevronRight size={14} />
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
                                        title="Delete survey"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Progress bar */}
                                {(() => {
                                    const allItems = s.sections?.flatMap(sec => sec.items) || [];
                                    const filled = allItems.filter(i => i.status).length;
                                    const total = allItems.length;
                                    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
                                    if (total === 0) return null;
                                    return (
                                        <div className="survey-progress">
                                            <div className="survey-progress-bar" style={{ width: `${pct}%` }} />
                                            <span className="survey-progress-label">{filled}/{total} filled</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
