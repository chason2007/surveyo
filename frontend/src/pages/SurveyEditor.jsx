import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Plus, Trash2, FileText, ArrowLeft,
    ChevronDown, Check, AlertTriangle, EyeOff, CheckCircle
} from 'lucide-react';
import api from '../api/axios';
import PhotoUploader from '../components/PhotoUploader';
import ConfirmModal from '../components/ConfirmModal';
import InputModal from '../components/InputModal';

const LOCAL_KEY = (id) => `surveyo_draft_${id}`;

function newItemId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
}

function ItemRow({ item, onChange, onDelete }) {
    const setStatus = (s) => onChange({ ...item, status: s });
    const setField = (k, v) => onChange({ ...item, [k]: v });

    const statusClass = item.status === 'Good' ? 'good'
        : item.status === 'Need Action' ? 'action'
            : item.status === 'N/A' ? 'na' : '';

    return (
        <div className={`dense-item-card ${statusClass}`}>
            <div className="dense-item-header">
                <input
                    className="dense-item-label-input"
                    value={item.label}
                    onChange={e => setField('label', e.target.value)}
                    placeholder="Checklist Item (e.g., Walls, Ceiling)..."
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="dense-btn-group">
                        <button
                            type="button"
                            className={`dense-toggle-btn good ${item.status === 'Good' ? 'active' : ''}`}
                            onClick={() => setStatus(item.status === 'Good' ? '' : 'Good')}
                        >
                            <Check size={10} />
                            <span>Good</span>
                        </button>
                        
                        <button
                            type="button"
                            className={`dense-toggle-btn action ${item.status === 'Need Action' ? 'active' : ''}`}
                            onClick={() => setStatus(item.status === 'Need Action' ? '' : 'Need Action')}
                        >
                            <AlertTriangle size={10} />
                            <span>Action</span>
                        </button>

                        <button
                            type="button"
                            className={`dense-toggle-btn na ${item.status === 'N/A' ? 'active' : ''}`}
                            onClick={() => setStatus(item.status === 'N/A' ? '' : 'N/A')}
                        >
                            <EyeOff size={10} />
                            <span>N/A</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        className="dense-delete-item-btn"
                        onClick={onDelete}
                        title="Delete checklist item"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            <div className="dense-details-area">
                <textarea
                    className="dense-textarea"
                    rows={1}
                    value={item.comments || ''}
                    onChange={e => setField('comments', e.target.value)}
                    placeholder="Remarks / Defect feedback..."
                    style={{ minHeight: '32px' }}
                />
                
                <PhotoUploader
                    photos={item.photos || []}
                    onChange={urls => setField('photos', urls)}
                />
            </div>
        </div>
    );
}

const DEFAULT_ITEM = () => ({ _itemId: newItemId(), label: '', status: '', photos: [], comments: '' });

export default function SurveyEditor() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [survey, setSurvey] = useState(null);
    const [expandedSection, setExpandedSection] = useState(0);
    const [goingToReport, setGoingToReport] = useState(false);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }
    const [inputModal, setInputModal] = useState(null);     // { title, placeholder, onConfirm }
    const saveTimer = useRef(null);
    const isMounted = useRef(true);
    const surveyRef = useRef(null);

    useEffect(() => { surveyRef.current = survey; }, [survey]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        isMounted.current = true;
        api.get(`/api/surveys/${id}`)
            .then(({ data }) => {
                if (!isMounted.current) return;
                // A previous save attempt may have failed, leaving a newer draft
                // sitting in localStorage (see scheduleSave/flushSave/unmount below)
                // while the server still has the older copy. Restore the local one
                // instead of silently discarding it, then retry saving it.
                let restored = null;
                try {
                    const raw = localStorage.getItem(LOCAL_KEY(id));
                    if (raw) restored = JSON.parse(raw);
                } catch {
                    localStorage.removeItem(LOCAL_KEY(id));
                }
                if (restored) {
                    setSurvey(restored);
                    showToast('Restored unsaved changes from your last session');
                    api.put(`/api/surveys/${id}`, restored)
                        .then(() => localStorage.removeItem(LOCAL_KEY(id)))
                        .catch(() => {});
                } else {
                    setSurvey(data);
                }
            })
            .catch(() => { if (isMounted.current) navigate('/'); })
            .finally(() => { if (isMounted.current) setLoading(false); });
        return () => {
            isMounted.current = false;
            // A pending debounced save must not be silently dropped when navigating
            // away — fire it immediately (fire-and-forget; component is unmounting).
            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
                saveTimer.current = null;
                if (surveyRef.current) {
                    api.put(`/api/surveys/${id}`, surveyRef.current).catch(() => {
                        try { localStorage.setItem(LOCAL_KEY(id), JSON.stringify(surveyRef.current)); } catch {}
                    });
                }
            }
        };
    }, [id, navigate]);

    const scheduleSave = useCallback((updatedSurvey) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            if (!isMounted.current) return;
            try {
                await api.put(`/api/surveys/${id}`, updatedSurvey);
                localStorage.removeItem(LOCAL_KEY(id));
                if (isMounted.current) showToast('Auto-saved');
            } catch {
                // Save to localStorage as a real fallback
                try { localStorage.setItem(LOCAL_KEY(id), JSON.stringify(updatedSurvey)); } catch {}
                if (isMounted.current) showToast('Server unreachable — saved locally', 'error');
            }
        }, 1500);
    }, [id]);

    const updateSurvey = (updated) => {
        setSurvey(updated);
        scheduleSave(updated);
    };

    // Bypasses the debounce and saves the latest state right now. Used before
    // navigating to the report so it never reads stale data out of the DB.
    const flushSave = useCallback(async () => {
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
            saveTimer.current = null;
        }
        if (!surveyRef.current) return true;
        try {
            await api.put(`/api/surveys/${id}`, surveyRef.current);
            localStorage.removeItem(LOCAL_KEY(id));
            return true;
        } catch {
            try { localStorage.setItem(LOCAL_KEY(id), JSON.stringify(surveyRef.current)); } catch {}
            return false;
        }
    }, [id]);

    const handleGenerateReport = async () => {
        setGoingToReport(true);
        const ok = await flushSave();
        if (!isMounted.current) return;
        setGoingToReport(false);
        if (!ok) {
            showToast('Could not save your latest changes — check your connection and try again', 'error');
            return;
        }
        navigate(`/surveys/${id}/report`);
    };

    const updatePropertyDetails = (key, value) => {
        const pd = { ...survey.propertyDetails, [key]: value };
        updateSurvey({ ...survey, propertyDetails: pd });
    };

    const addItem = (secIdx) => {
        const sections = [...survey.sections];
        sections[secIdx] = {
            ...sections[secIdx],
            items: [...sections[secIdx].items, DEFAULT_ITEM()]
        };
        updateSurvey({ ...survey, sections });
    };

    const updateItem = (secIdx, itemIdx, updated) => {
        const sections = [...survey.sections];
        const items = [...sections[secIdx].items];
        items[itemIdx] = updated;
        sections[secIdx] = { ...sections[secIdx], items };
        updateSurvey({ ...survey, sections });
    };

    const deleteItem = (secIdx, itemIdx) => {
        const sections = [...survey.sections];
        sections[secIdx] = {
            ...sections[secIdx],
            items: sections[secIdx].items.filter((_, i) => i !== itemIdx)
        };
        updateSurvey({ ...survey, sections });
    };

    const addSection = () => {
        setInputModal({
            title: 'New Room Section',
            placeholder: 'e.g. Living Room, Kitchen...',
            onConfirm: (name) => {
                setInputModal(null);
                const sections = [...survey.sections, { roomName: name, items: [] }];
                updateSurvey({ ...survey, sections });
                setExpandedSection(sections.length - 1);
            }
        });
    };

    const deleteSection = (secIdx) => {
        setConfirmModal({
            message: `Remove the "${survey.sections[secIdx].roomName}" section and all its items?`,
            onConfirm: () => {
                setConfirmModal(null);
                const sections = survey.sections.filter((_, i) => i !== secIdx);
                updateSurvey({ ...survey, sections });
                if (expandedSection >= sections.length) {
                    setExpandedSection(Math.max(0, sections.length - 1));
                }
            }
        });
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner" />
            <span>Loading property workspace...</span>
        </div>
    );

    if (!survey) return null;

    const pd = survey.propertyDetails || {};

    const sectionSummary = (items = []) => {
        const good = items.filter(i => i.status === 'Good').length;
        const action = items.filter(i => i.status === 'Need Action').length;
        const na = items.filter(i => i.status === 'N/A').length;
        return { good, action, na, total: items.length };
    };

    return (
        <div className="page-wrapper">
            {/* Anchored Top Header Bar */}
            <div style={{
                background: 'var(--bg-surface)',
                borderBottom: '1.5px solid var(--border)',
                padding: '10px 0',
                position: 'sticky',
                top: 60,
                zIndex: 90
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ padding: '8px 12px' }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{pd.unitNumber || 'Property Workspace'}</span>
                                <span style={{ color: '#ccc' }}>·</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 400 }}>{pd.buildingName || 'Condition Survey'}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>STATUS:</span>
                            <select
                                value={survey.status}
                                onChange={e => updateSurvey({ ...survey, status: e.target.value })}
                                style={{ width: 'auto', padding: '6px 24px 6px 12px', fontSize: '12px', background: 'rgba(3, 7, 18, 0.4)' }}
                            >
                                <option>Draft</option>
                                <option>Completed</option>
                            </select>
                        </div>

                        <button className="btn btn-primary btn-sm" onClick={handleGenerateReport} disabled={goingToReport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={14} />
                            <span>{goingToReport ? 'Saving...' : 'Generate PDF Report'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="container" style={{ paddingBottom: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20, maxWidth: 860 }}>

                        {/* Property Details */}
                        <div className="card" style={{ padding: '4px 24px' }}>
                            <div className="field-row">
                                <span className="field-label">Unit / Property</span>
                                <input className="field-input" value={pd.unitNumber} onChange={e => updatePropertyDetails('unitNumber', e.target.value)} placeholder="Unit 302" />
                            </div>
                            <div className="field-row">
                                <span className="field-label">Building</span>
                                <input className="field-input" value={pd.buildingName} onChange={e => updatePropertyDetails('buildingName', e.target.value)} placeholder="Sky Tower" />
                            </div>
                            <div className="field-row">
                                <span className="field-label">Address</span>
                                <input className="field-input" value={pd.address} onChange={e => updatePropertyDetails('address', e.target.value)} placeholder="Full address" />
                            </div>
                            <div className="field-row">
                                <span className="field-label">Type</span>
                                <select className="field-select" value={pd.propertyType} onChange={e => updatePropertyDetails('propertyType', e.target.value)}>
                                    <option value="">—</option>
                                    <option>Apartment</option>
                                    <option>Villa</option>
                                    <option>Townhouse</option>
                                    <option>Office Space</option>
                                    <option>Retail Store</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Inspector</span>
                                <input className="field-input" value={pd.inspector} onChange={e => updatePropertyDetails('inspector', e.target.value)} placeholder="Name" />
                            </div>
                            <div className="field-row">
                                <span className="field-label">Client</span>
                                <input className="field-input" value={pd.client || ''} onChange={e => updatePropertyDetails('client', e.target.value)} placeholder="Company or person" />
                            </div>
                            <div className="field-row">
                                <span className="field-label">Date</span>
                                <input className="field-input" type="date" value={pd.date ? pd.date.split('T')[0] : ''} onChange={e => updatePropertyDetails('date', e.target.value)} />
                            </div>
                        </div>

                        {/* Inspection Sections */}
                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sections</p>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addSection}>
                                    <Plus size={12} /> Add Section
                                </button>
                            </div>

                            {survey.sections?.length === 0 && (
                                <div className="empty-state" style={{ padding: '30px 10px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No inspection sections added yet.</p>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={addSection}
                                        style={{ marginTop: '8px', fontSize: '11px' }}
                                    >
                                        Create First Section
                                    </button>
                                </div>
                            )}

                            <div className="accordion-wrapper">
                                {survey.sections?.map((sec, secIdx) => {
                                    const { good, action, na, total } = sectionSummary(sec.items);
                                    const isComplete = total > 0 && (good + action + na === total);
                                    const hasPhotos = sec.items.some(i => i.photos && i.photos.length > 0);
                                    const isActive = expandedSection === secIdx;

                                    return (
                                        <div key={secIdx} className={`accordion-item ${isActive ? 'active' : ''}`}>
                                            <div className="accordion-header" onClick={() => setExpandedSection(isActive ? null : secIdx)}>
                                                <div className="accordion-header-left">
                                                    <ChevronDown size={14} className="accordion-chevron" />
                                                    <span className="accordion-title">{sec.roomName}</span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>({total})</span>
                                                </div>

                                                <div className="accordion-header-right">
                                                    {isComplete ? (
                                                        <span className="accordion-badge complete">✓ Complete</span>
                                                    ) : total > 0 ? (
                                                        <span className="accordion-badge incomplete">{good + action + na}/{total} Checked</span>
                                                    ) : null}

                                                    {hasPhotos && (
                                                        <span className="accordion-badge images">📷 Media</span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="accordion-delete-btn"
                                                        onClick={(e) => { e.stopPropagation(); deleteSection(secIdx); }}
                                                        title="Delete Section"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>

                                            {isActive && (
                                                <div className="accordion-body">
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                            <label style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rename:</label>
                                                            <input
                                                                value={sec.roomName}
                                                                onChange={e => {
                                                                    const sections = [...survey.sections];
                                                                    sections[secIdx] = { ...sec, roomName: e.target.value };
                                                                    updateSurvey({ ...survey, sections });
                                                                }}
                                                                placeholder="Section Name"
                                                                style={{ padding: '4px 8px', fontSize: '12px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: '4px', width: '130px', color: '#fff' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => addItem(secIdx)}
                                                            style={{ padding: '5px 10px', fontSize: '11px' }}
                                                        >
                                                            <Plus size={12} /> Add Item
                                                        </button>
                                                    </div>

                                                    {sec.items.length === 0 ? (
                                                        <div className="empty-state" style={{ padding: '20px 10px', textAlign: 'center' }}>
                                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No checklist items in this section.</p>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => addItem(secIdx)}
                                                                style={{ marginTop: '8px', fontSize: '11px' }}
                                                            >
                                                                Add Checklist Item
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="dense-checklist">
                                                            {sec.items.map((item, itemIdx) => (
                                                                <ItemRow
                                                                    key={item._itemId || itemIdx}
                                                                    item={item}
                                                                    onChange={(updated) => updateItem(secIdx, itemIdx, updated)}
                                                                    onDelete={() => deleteItem(secIdx, itemIdx)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Additional Photos */}
                                <div className={`accordion-item ${expandedSection === 'global' ? 'active' : ''}`}>
                                    <div className="accordion-header" onClick={() => setExpandedSection(expandedSection === 'global' ? null : 'global')}>
                                        <div className="accordion-header-left">
                                            <ChevronDown size={14} className="accordion-chevron" />
                                            <span className="accordion-title">Additional Photos</span>
                                        </div>
                                        {survey.globalPhotos?.length > 0 && (
                                            <div className="accordion-header-right">
                                                <span className="accordion-badge images">{survey.globalPhotos.length}</span>
                                            </div>
                                        )}
                                    </div>
                                    {expandedSection === 'global' && (
                                        <div className="accordion-body">
                                            <PhotoUploader
                                                photos={survey.globalPhotos || []}
                                                onChange={urls => updateSurvey({ ...survey, globalPhotos: urls })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                </div>
            </div>

            {/* Modals */}
            {confirmModal && (
                <ConfirmModal
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                />
            )}
            {inputModal && (
                <InputModal
                    title={inputModal.title}
                    placeholder={inputModal.placeholder}
                    onConfirm={inputModal.onConfirm}
                    onCancel={() => setInputModal(null)}
                />
            )}

            {/* Auto Save Feedback Toasts */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} color="var(--good)" /> : <AlertTriangle size={16} color="#ef4444" />}
                    <span>{toast.msg}</span>
                </div>
            )}
        </div>
    );
}
