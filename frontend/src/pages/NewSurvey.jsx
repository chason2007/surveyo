import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, MapPin, Home, Plus, X, CheckCircle, ChevronRight } from 'lucide-react';
import api from '../api/axios';

const DEFAULT_SECTIONS = [
    'Entry / Foyer', 'Living Room', 'Dining Room', 'Kitchen',
    'Bedroom 1', 'Bedroom 2', 'Master Bedroom', 'Bathroom 1',
    'Bathroom 2', 'Balcony', 'Parking', 'Store Room'
];

const DEFAULT_ITEMS = {
    'Kitchen': ['Ceiling', 'Walls', 'Floor', 'Cabinets', 'Countertop', 'Sink', 'Appliances', 'Windows', 'Electrical Points'],
    'Living Room': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Curtain Rails', 'Electrical Points', 'AC Unit'],
    'Bedroom 1': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Curtain Rails', 'Electrical Points', 'AC Unit', 'Wardrobe'],
    'Bedroom 2': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Curtain Rails', 'Electrical Points', 'AC Unit', 'Wardrobe'],
    'Master Bedroom': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Curtain Rails', 'Electrical Points', 'AC Unit', 'Wardrobe'],
    'Bathroom 1': ['Ceiling', 'Walls', 'Floor', 'Shower/Bath', 'Toilet', 'Basin', 'Mirror', 'Exhaust Fan'],
    'Bathroom 2': ['Ceiling', 'Walls', 'Floor', 'Shower/Bath', 'Toilet', 'Basin', 'Mirror', 'Exhaust Fan'],
    'Balcony': ['Ceiling', 'Walls', 'Floor', 'Railings', 'Drainage'],
    'Entry / Foyer': ['Ceiling', 'Walls', 'Floor', 'Main Door', 'Intercom', 'Electrical Points'],
    'Dining Room': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Electrical Points'],
    'Parking': ['Floor', 'Walls', 'Ceiling', 'Shutter/Door', 'Lighting'],
    'Store Room': ['Ceiling', 'Walls', 'Floor', 'Door'],
};

const getDefaultItems = (sectionName) => {
    const items = DEFAULT_ITEMS[sectionName] || ['Ceiling', 'Walls', 'Floor', 'Windows', 'Electrical Points'];
    return items.map(label => ({ label, status: '', photos: [], comments: '' }));
};

export default function NewSurvey() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    const [details, setDetails] = useState({
        unitNumber: '', buildingName: '', address: '',
        propertyType: '', inspector: '', date: new Date().toISOString().split('T')[0]
    });

    const [sections, setSections] = useState([]);
    const [customSection, setCustomSection] = useState('');

    const setDetail = (k, v) => setDetails(d => ({ ...d, [k]: v }));

    const toggleSection = (name) => {
        setSections(prev => {
            const exists = prev.find(s => s.roomName === name);
            if (exists) return prev.filter(s => s.roomName !== name);
            return [...prev, { roomName: name, items: getDefaultItems(name) }];
        });
    };

    const addCustomSection = () => {
        const name = customSection.trim();
        if (!name || sections.find(s => s.roomName === name)) return;
        setSections(prev => [...prev, { roomName: name, items: getDefaultItems(name) }]);
        setCustomSection('');
    };

    const removeSection = (name) => setSections(s => s.filter(x => x.roomName !== name));

    const handleCreate = async () => {
        if (!details.unitNumber) return alert('Please enter a unit/property number.');
        if (sections.length === 0) return alert('Please add at least one section/room.');
        setSaving(true);
        try {
            const { data } = await api.post('/api/surveys', {
                propertyDetails: {
                    ...details,
                    date: details.date ? new Date(details.date) : new Date()
                },
                sections,
                status: 'Draft'
            });
            navigate(`/surveys/${data._id}/edit`);
        } catch (e) {
            console.error(e);
            alert('Failed to create survey. Check console.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-wrapper">
            {/* Hero */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-eyebrow"><Home size={12} /> NEW SURVEY</div>
                    <h1>Create Property Survey</h1>
                    <p>Enter property details and select the rooms/sections to inspect.</p>
                </div>
            </section>

            <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
                {/* Steps */}
                <div className="steps">
                    <div className={`step-item ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                        <div className="step-num">{step > 1 ? <CheckCircle size={14} /> : '1'}</div>
                        Property Details
                    </div>
                    <div className="step-divider" />
                    <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-num">2</div>
                        Select Sections
                    </div>
                </div>

                {step === 1 && (
                    <div className="card" style={{ padding: 28, maxWidth: 720 }}>
                        <div className="section-title">Property Details</div>
                        <div className="form-grid" style={{ gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Unit / Property No. *</label>
                                <input value={details.unitNumber} onChange={e => setDetail('unitNumber', e.target.value)} placeholder="e.g. Unit 4B" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Building / Complex Name</label>
                                <input value={details.buildingName} onChange={e => setDetail('buildingName', e.target.value)} placeholder="e.g. Sunridge Apartments" />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label"><MapPin size={13} style={{ marginRight: 4 }} /> Address</label>
                                <input value={details.address} onChange={e => setDetail('address', e.target.value)} placeholder="Full property address" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Property Type</label>
                                <select value={details.propertyType} onChange={e => setDetail('propertyType', e.target.value)}>
                                    <option value="">Select type…</option>
                                    <option>Apartment</option>
                                    <option>Villa</option>
                                    <option>Townhouse</option>
                                    <option>Office</option>
                                    <option>Retail</option>
                                    <option>Warehouse</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label"><User size={13} style={{ marginRight: 4 }} /> Inspector Name</label>
                                <input value={details.inspector} onChange={e => setDetail('inspector', e.target.value)} placeholder="Full name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Inspection Date</label>
                                <input type="date" value={details.date} onChange={e => setDetail('date', e.target.value)} />
                            </div>
                        </div>
                        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (!details.unitNumber.trim()) return alert('Please enter a unit/property number.');
                                    setStep(2);
                                }}
                            >
                                Next: Select Sections <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ maxWidth: 800 }}>
                        <div className="card" style={{ padding: 28 }}>
                            <div className="section-title">Select Rooms / Sections</div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                                Click to toggle sections. Each section gets default inspection items which you can edit later.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 }}>
                                {DEFAULT_SECTIONS.map(name => {
                                    const active = !!sections.find(s => s.roomName === name);
                                    return (
                                        <button
                                            key={name}
                                            className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{ justifyContent: 'center' }}
                                            onClick={() => toggleSection(name)}
                                        >
                                            {active && <CheckCircle size={14} />}
                                            {name}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom section */}
                            <div className="divider" />
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <input
                                    value={customSection}
                                    onChange={e => setCustomSection(e.target.value)}
                                    placeholder="Add custom room/section…"
                                    onKeyDown={e => e.key === 'Enter' && addCustomSection()}
                                    style={{ flex: 1 }}
                                />
                                <button className="btn btn-secondary" onClick={addCustomSection}>
                                    <Plus size={15} /> Add
                                </button>
                            </div>

                            {/* Selected sections chips */}
                            {sections.length > 0 && (
                                <>
                                    <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                                        SELECTED ({sections.length})
                                    </div>
                                    <div className="section-tags">
                                        {sections.map(s => (
                                            <div key={s.roomName} className="section-tag">
                                                {s.roomName}
                                                <span className="remove-tag" onClick={() => removeSection(s.roomName)}><X size={12} /></span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreate}
                                disabled={saving || sections.length === 0}
                            >
                                {saving ? 'Creating…' : `Create Survey & Open Editor`}
                                {!saving && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
