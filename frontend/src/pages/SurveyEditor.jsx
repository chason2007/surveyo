import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Save, Plus, Trash2, FileText, ArrowLeft,
    ChevronDown, Check, AlertTriangle, EyeOff, Sparkles, CheckCircle
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
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }
    const [inputModal, setInputModal] = useState(null);     // { title, placeholder, onConfirm }
    const saveTimer = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        api.get(`/api/surveys/${id}`)
            .then(({ data }) => { if (isMounted.current) setSurvey(data); })
            .catch(() => { if (isMounted.current) navigate('/'); })
            .finally(() => { if (isMounted.current) setLoading(false); });
        return () => {
            isMounted.current = false;
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [id, navigate]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

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

    // Live statistics computation
    const allItems = survey.sections?.flatMap(s => s.items) || [];
    const totalItems = allItems.length;
    const goodItems = allItems.filter(i => i.status === 'Good').length;
    const actionItems = allItems.filter(i => i.status === 'Need Action').length;

    const sectionSummary = (items = []) => {
        const good = items.filter(i => i.status === 'Good').length;
        const action = items.filter(i => i.status === 'Need Action').length;
        const na = items.filter(i => i.status === 'N/A').length;
        return { good, action, na, total: items.length };
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="page-wrapper">
            {/* Anchored Top SaaS Header Bar */}
            <div style={{
                background: 'rgba(11, 15, 25, 0.85)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border)',
                padding: '12px 0',
                position: 'sticky',
                top: 72,
                zIndex: 90
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ padding: '8px 12px' }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{pd.unitNumber || 'Property Workspace'}</span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>·</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{pd.buildingName || 'Condition Survey'}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS:</span>
                            <select
                                value={survey.status}
                                onChange={e => updateSurvey({ ...survey, status: e.target.value })}
                                style={{ width: 'auto', padding: '6px 24px 6px 12px', fontSize: '12px', background: 'rgba(3, 7, 18, 0.4)' }}
                            >
                                <option>Draft</option>
                                <option>Completed</option>
                            </select>
                        </div>

                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/surveys/${id}/report`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={14} />
                            <span>Generate PDF Report</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Split Workspace Layout */}
            <div className="container">
                <div className="split-workspace">
                    
                    {/* Left Pane: Configuration and Data Entry */}
                    <div className="input-pane">
                        
                        {/* 1. Property Metadata Panel */}
                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border)' }}>
                            <div className="section-title" style={{ fontSize: '15px', marginBottom: '16px' }}>Property Specifications</div>
                            
                            <div className="form-grid" style={{ gap: '12px 16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '10.5px' }}>Property / Unit No. *</label>
                                    <input 
                                        value={pd.unitNumber} 
                                        onChange={e => updatePropertyDetails('unitNumber', e.target.value)} 
                                        placeholder="e.g. Unit 302" 
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '10.5px' }}>Building / Complex</label>
                                    <input 
                                        value={pd.buildingName} 
                                        onChange={e => updatePropertyDetails('buildingName', e.target.value)} 
                                        placeholder="e.g. Sky Tower" 
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '10.5px' }}>Property Type</label>
                                    <select 
                                        value={pd.propertyType} 
                                        onChange={e => updatePropertyDetails('propertyType', e.target.value)}
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                    >
                                        <option value="">Select...</option>
                                        <option>Apartment</option>
                                        <option>Villa</option>
                                        <option>Townhouse</option>
                                        <option>Office Space</option>
                                        <option>Retail Store</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '10.5px' }}>Client Name</label>
                                    <input 
                                        value={pd.client || ''} 
                                        onChange={e => updatePropertyDetails('client', e.target.value)} 
                                        placeholder="Company / Client Name" 
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label" style={{ fontSize: '10.5px' }}>Full Site Address</label>
                                    <input 
                                        value={pd.address} 
                                        onChange={e => updatePropertyDetails('address', e.target.value)} 
                                        placeholder="Site physical address" 
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '10.5px' }}>Lead Inspector</label>
                                    <input 
                                        value={pd.inspector} 
                                        onChange={e => updatePropertyDetails('inspector', e.target.value)} 
                                        placeholder="Inspector's name" 
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '10.5px' }}>Inspection Date</label>
                                    <input 
                                        type="date" 
                                        value={pd.date ? pd.date.split('T')[0] : ''} 
                                        onChange={e => updatePropertyDetails('date', e.target.value)} 
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Room Categorized Accordion Panels */}
                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="section-title" style={{ fontSize: '15px', marginBottom: 0 }}>Inspection Records</div>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={addSection}
                                    style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', border: '1px dashed var(--border)' }}
                                >
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

                                {/* Special Collapsible Additional Media Section */}
                                <div className={`accordion-item ${expandedSection === 'global' ? 'active' : ''}`}>
                                    <div className="accordion-header" onClick={() => setExpandedSection(expandedSection === 'global' ? null : 'global')}>
                                        <div className="accordion-header-left">
                                            <ChevronDown size={14} className="accordion-chevron" />
                                            <span className="accordion-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Sparkles size={11} style={{ color: 'var(--accent-secondary)' }} />
                                                <span>Additional Photography</span>
                                            </span>
                                        </div>

                                        <div className="accordion-header-right">
                                            {survey.globalPhotos?.length > 0 && (
                                                <span className="accordion-badge images">{survey.globalPhotos.length} Global</span>
                                            )}
                                        </div>
                                    </div>

                                    {expandedSection === 'global' && (
                                        <div className="accordion-body">
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                                Attach master site photos, structural blueprints, or external building facade evidence here.
                                            </p>
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

                    {/* Right Pane: Live PDF paper sheet simulator */}
                    <div className="preview-pane">
                        <div style={{ 
                            padding: '8px 12px', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            color: 'var(--accent-secondary)', 
                            letterSpacing: '0.08em', 
                            textTransform: 'uppercase',
                            borderBottom: '1px solid var(--border)',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Sparkles size={12} />
                            <span>PDF Document Live Canvas</span>
                        </div>
                        
                        <div className="pdf-paper-sheet">
                            {/* Header */}
                            <div className="pdf-paper-header">
                                <h2>PROPERTY SURVEY SHEET</h2>
                                <p>EXECUTIVE CONDITION INSPECTION RECORD</p>
                            </div>

                            {/* Property Details Grid */}
                            <div className="pdf-paper-grid">
                                <div className="pdf-paper-detail">
                                    <dt>Unit / Property No.</dt>
                                    <dd>{pd.unitNumber || '—'}</dd>
                                </div>
                                <div className="pdf-paper-detail">
                                    <dt>Complex / Building</dt>
                                    <dd>{pd.buildingName || '—'}</dd>
                                </div>
                                <div className="pdf-paper-detail">
                                    <dt>Client Name</dt>
                                    <dd>{pd.client || '—'}</dd>
                                </div>
                                <div className="pdf-paper-detail">
                                    <dt>Survey Date</dt>
                                    <dd>{formatDate(pd.date)}</dd>
                                </div>
                                <div className="pdf-paper-detail" style={{ gridColumn: '1 / -1' }}>
                                    <dt>Full Location Address</dt>
                                    <dd style={{ fontSize: '11px', lineHeight: '1.4' }}>{pd.address || '—'}</dd>
                                </div>
                                <div className="pdf-paper-detail" style={{ gridColumn: '1 / -1' }}>
                                    <dt>Lead Inspector</dt>
                                    <dd>{pd.inspector || '—'}</dd>
                                </div>
                            </div>

                            {/* Dynamic Stat Summary Indicators */}
                            <div className="pdf-paper-stats">
                                <div className="pdf-paper-stat-pill">
                                    <span className="pdf-paper-stat-num">{totalItems}</span>
                                    <span className="pdf-paper-stat-label">Total Items</span>
                                </div>
                                <div className="pdf-paper-stat-pill good">
                                    <span className="pdf-paper-stat-num">{goodItems}</span>
                                    <span className="pdf-paper-stat-label">✓ Good</span>
                                </div>
                                <div className="pdf-paper-stat-pill flagged">
                                    <span className="pdf-paper-stat-num">{actionItems}</span>
                                    <span className="pdf-paper-stat-label">⚑ Defective</span>
                                </div>
                            </div>

                            {/* Categories Render */}
                            {survey.sections?.length === 0 ? (
                                <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                    No rooms or structures added to this survey record.
                                </p>
                            ) : (
                                survey.sections.map((sec, si) => (
                                    <div key={si} className="pdf-paper-section">
                                        <div className="pdf-paper-section-title">{sec.roomName}</div>
                                        {sec.items.length === 0 ? (
                                            <p style={{ fontSize: '11px', color: '#94a3b8', padding: '4px' }}>No entries checklist.</p>
                                        ) : (
                                            <table className="pdf-paper-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '40%' }}>Check Item</th>
                                                        <th style={{ width: '20%' }}>Condition</th>
                                                        <th style={{ width: '40%' }}>Inspector Comments</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sec.items.map((item, ii) => (
                                                        <tr key={ii}>
                                                            <td style={{ fontWeight: 600, color: '#1e293b' }}>
                                                                {item.label || 'Unnamed Asset'}
                                                                {item.photos && item.photos.length > 0 && (
                                                                    <div className="pdf-paper-thumb-grid">
                                                                        {item.photos.map((u, ui) => (
                                                                            <img key={ui} src={u} alt="thumbnail" className="pdf-paper-thumb" />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {item.status === 'Good' && <span className="pdf-paper-badge-good">Good</span>}
                                                                {item.status === 'Need Action' && <span className="pdf-paper-badge-need-action">Action</span>}
                                                                {item.status === 'N/A' && <span className="pdf-paper-badge-na">N/A</span>}
                                                                {!item.status && <span style={{ color: '#94a3b8', fontSize: '9px' }}>—</span>}
                                                            </td>
                                                            <td style={{ color: '#475569', fontSize: '11px', lineHeight: '1.3' }}>
                                                                {item.comments || '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                ))
                            )}

                            {/* Additional Photos */}
                            {survey.globalPhotos && survey.globalPhotos.length > 0 && (
                                <div className="pdf-paper-section" style={{ marginTop: '20px' }}>
                                    <div className="pdf-paper-section-title">Additional Site Photography</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 0' }}>
                                        {survey.globalPhotos.map((url, i) => (
                                            <img key={i} src={url} alt="global thumbnail" style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #e2e8f0' }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Certification disclaimer */}
                            <div style={{ marginTop: '30px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#94a3b8', lineHeight: '1.4' }}>
                                <p style={{ fontWeight: 700 }}>CERTIFICATION DISCLAIMER</p>
                                <p>This property condition checklist certifies verified evidence captured at the date and time logged. All media attachments remain permanent records of property assessment.</p>
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
