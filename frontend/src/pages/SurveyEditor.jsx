import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Save, Plus, Trash2, FileText, ArrowLeft,
    ChevronDown, ChevronUp, CheckCircle
} from 'lucide-react';
import api from '../api/axios';
import PhotoUploader from '../components/PhotoUploader';

function ItemRow({ item, onChange, onDelete }) {
    const [expanded, setExpanded] = useState(false);

    const setStatus = (s) => onChange({ ...item, status: s });
    const setField = (k, v) => onChange({ ...item, [k]: v });

    const statusKey = item.status === 'Good' ? 'good'
        : item.status === 'Need Action' ? 'need-action'
            : item.status === 'N/A' ? 'na' : '';

    return (
        <div className={`item-row${statusKey ? ` item-row--${statusKey}` : ''}`}>
            <div className="item-row-header">
                <input
                    className="item-label-input"
                    value={item.label}
                    onChange={e => setField('label', e.target.value)}
                    placeholder="Item name (e.g. Ceiling)"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, padding: '4px 0' }}
                />

                <div className="status-group">
                    {['Good', 'Need Action', 'N/A'].map(s => (
                        <button
                            key={s}
                            className={`status-btn ${s === 'Good' ? 'good' : s === 'Need Action' ? 'need-action' : 'na'} ${item.status === s ? 'active' : ''}`}
                            onClick={() => setStatus(item.status === s ? '' : s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => setExpanded(e => !e)}
                    title="Expand"
                >
                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                <button className="btn btn-danger btn-icon" onClick={onDelete} title="Remove item">
                    <Trash2 size={14} />
                </button>
            </div>

            <div className={`item-expand${expanded ? ' item-expand--open' : ''}`}>
                <div style={{ paddingLeft: 4, paddingTop: 12 }}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">Comments</label>
                        <textarea
                            rows={2}
                            value={item.comments}
                            onChange={e => setField('comments', e.target.value)}
                            placeholder="Add notes or observations…"
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Photos</label>
                        <PhotoUploader
                            photos={item.photos}
                            onChange={urls => setField('photos', urls)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

const DEFAULT_ITEM = { label: '', status: '', photos: [], comments: '' };

export default function SurveyEditor() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [survey, setSurvey] = useState(null);
    const [activeSection, setActive] = useState(0);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const saveTimer = useRef(null);

    useEffect(() => {
        api.get(`/api/surveys/${id}`)
            .then(({ data }) => { setSurvey(data); })
            .catch(() => navigate('/'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const scheduleSave = useCallback((updatedSurvey) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                await api.put(`/api/surveys/${id}`, updatedSurvey);
                showToast('Saved automatically');
            } catch { showToast('Auto-save failed', 'error'); }
        }, 1500);
    }, [id]);

    const updateSurvey = (updated) => {
        setSurvey(updated);
        scheduleSave(updated);
    };

    const saveNow = async () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setSaving(true);
        try {
            await api.put(`/api/surveys/${id}`, survey);
            showToast('Survey saved!');
        } catch { showToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const updateSection = (secIdx, updated) => {
        const sections = [...survey.sections];
        sections[secIdx] = updated;
        updateSurvey({ ...survey, sections });
    };

    const addItem = () => {
        const sections = [...survey.sections];
        sections[activeSection] = {
            ...sections[activeSection],
            items: [...sections[activeSection].items, { ...DEFAULT_ITEM }]
        };
        updateSurvey({ ...survey, sections });
    };

    const updateItem = (itemIdx, updated) => {
        const sections = [...survey.sections];
        const items = [...sections[activeSection].items];
        items[itemIdx] = updated;
        sections[activeSection] = { ...sections[activeSection], items };
        updateSurvey({ ...survey, sections });
    };

    const deleteItem = (itemIdx) => {
        const sections = [...survey.sections];
        sections[activeSection] = {
            ...sections[activeSection],
            items: sections[activeSection].items.filter((_, i) => i !== itemIdx)
        };
        updateSurvey({ ...survey, sections });
    };

    const addSection = () => {
        const name = prompt('Enter new section/room name:')?.trim();
        if (!name) return;
        const sections = [...survey.sections, { roomName: name, items: [] }];
        updateSurvey({ ...survey, sections });
        setActive(sections.length - 1);
    };

    const deleteSection = (secIdx) => {
        if (!confirm('Remove this section?')) return;
        const sections = survey.sections.filter((_, i) => i !== secIdx);
        updateSurvey({ ...survey, sections });
        if (activeSection >= sections.length) setActive(Math.max(0, sections.length - 1));
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner" />
            <span>Loading survey…</span>
        </div>
    );

    if (!survey) return null;

    const section = survey.sections[activeSection];
    const pd = survey.propertyDetails;

    const sectionSummary = (items) => {
        const good = items.filter(i => i.status === 'Good').length;
        const action = items.filter(i => i.status === 'Need Action').length;
        return { good, action, total: items.length };
    };

    return (
        <div className="page-wrapper">
            {/* Top bar */}
            <div style={{
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border)',
                padding: '14px 0'
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 17 }}>
                            {pd.unitNumber || 'Survey'} — {pd.buildingName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Inspector: {pd.inspector || '—'} &nbsp;|&nbsp; {pd.address || ''}
                        </div>
                    </div>

                    <select
                        value={survey.status}
                        onChange={e => updateSurvey({ ...survey, status: e.target.value })}
                        style={{ width: 'auto', padding: '8px 14px' }}
                    >
                        <option>Draft</option>
                        <option>Completed</option>
                    </select>

                    <button className="btn btn-secondary" onClick={() => navigate(`/surveys/${id}/report`)}>
                        <FileText size={15} /> View Report
                    </button>
                    <button className="btn btn-primary" onClick={saveNow} disabled={saving}>
                        <Save size={15} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="container">
                <div className="editor-layout">
                    {/* Sidebar */}
                    <aside className="sidebar">
                        <div className="sidebar-header">SECTIONS ({survey.sections.length})</div>
                        {survey.sections.map((sec, i) => {
                            const { good, action, total } = sectionSummary(sec.items);
                            return (
                                <div
                                    key={i}
                                    className={`sidebar-item ${i === activeSection ? 'active' : ''}`}
                                    onClick={() => setActive(i)}
                                >
                                    <div>
                                        <div style={{ fontSize: 14 }}>{sec.roomName}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {total} items
                                            {good > 0 && <span style={{ color: 'var(--good)', marginLeft: 6 }}>✓{good}</span>}
                                            {action > 0 && <span style={{ color: 'var(--need-action)', marginLeft: 6 }}>⚑{action}</span>}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        style={{ padding: 4, opacity: 0.5 }}
                                        onClick={(e) => { e.stopPropagation(); deleteSection(i); }}
                                        title="Remove section"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            className="btn btn-ghost"
                            style={{ width: '100%', padding: '12px 16px', borderTop: '1px solid var(--border)', borderRadius: 0, justifyContent: 'flex-start', gap: 8, color: 'var(--text-muted)' }}
                            onClick={addSection}
                        >
                            <Plus size={14} /> Add Section
                        </button>
                    </aside>

                    {/* Main panel */}
                    <main>
                        {!section ? (
                            <div className="empty-state">
                                <h3>No sections yet</h3>
                                <p>Use the sidebar to add sections/rooms.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <div className="section-title" style={{ marginBottom: 0 }}>
                                        {section.roomName}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            value={section.roomName}
                                            onChange={e => updateSection(activeSection, { ...section, roomName: e.target.value })}
                                            placeholder="Section name"
                                            style={{ width: 180, padding: '7px 12px', fontSize: 13 }}
                                        />
                                        <button className="btn btn-secondary btn-sm" onClick={addItem}>
                                            <Plus size={14} /> Add Item
                                        </button>
                                    </div>
                                </div>

                                {section.items.length === 0 ? (
                                    <div className="empty-state" style={{ padding: 40, gridColumn: 'unset' }}>
                                        <h3>No items in this section</h3>
                                        <button className="btn btn-primary" style={{ marginTop: 12, display: 'inline-flex' }} onClick={addItem}>
                                            <Plus size={15} /> Add First Item
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {section.items.map((item, idx) => (
                                            <ItemRow
                                                key={idx}
                                                item={item}
                                                onChange={(updated) => updateItem(idx, updated)}
                                                onDelete={() => deleteItem(idx)}
                                            />
                                        ))}
                                        <button className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={addItem}>
                                            <Plus size={14} /> Add Item
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} color="var(--good)" /> : null}
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
