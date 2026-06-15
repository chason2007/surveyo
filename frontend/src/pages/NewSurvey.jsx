import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, User, MapPin, Home, Plus, X, CheckCircle, ChevronRight, 
    Tv, ChefHat, Bed, Bath, Compass, Car, Trash2, MessageSquare, Clipboard, ArrowLeft
} from 'lucide-react';
import api from '../api/axios';

const DEFAULT_SECTIONS = [
    'Entry / Foyer', 'Living Room', 'Dining Room', 'Kitchen',
    'Bedroom 1', 'Bedroom 2', 'Master Bedroom', 'Bathroom 1',
    'Bathroom 2', 'Balcony', 'Parking', 'Store Room', 'General Comments'
];

const SECTION_ICONS = {
    'Entry / Foyer': Home,
    'Living Room': Tv,
    'Dining Room': Home,
    'Kitchen': ChefHat,
    'Bedroom 1': Bed,
    'Bedroom 2': Bed,
    'Master Bedroom': Bed,
    'Bathroom 1': Bath,
    'Bathroom 2': Bath,
    'Balcony': Compass,
    'Parking': Car,
    'Store Room': Trash2,
    'General Comments': MessageSquare
};

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
    'General Comments': [
        'Property is deeply cleaned?',
        'Are all internal walls in good condition (don\'t need painting)?',
        'Are all light fixtures working?',
        'Are all windows and doors functioning properly?',
        'Is the property free of pest infestation?',
        'Are all appliances in working order?',
        'Is the property free of any water damage or leaks?',
    ],
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
        propertyType: '', inspector: '', client: '', date: new Date().toISOString().split('T')[0]
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
            alert('Failed to create survey.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-wrapper">
            {/* Hero */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-eyebrow"><Clipboard size={12} /> CONFIGURATION WIZARD</div>
                    <h1>Create Property Survey</h1>
                    <p>Enter the property specifications and designate specific rooms or exterior structures for inspection.</p>
                </div>
            </section>

            <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
                {/* Step Indicators */}
                <div className="steps" style={{ maxWidth: 800, margin: '0 auto 40px' }}>
                    <div 
                        className={`step-item ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}
                        onClick={() => step > 1 && setStep(1)}
                        style={{ cursor: step > 1 ? 'pointer' : 'default' }}
                    >
                        <div className="step-num">{step > 1 ? <CheckCircle size={15} /> : '1'}</div>
                        <span>Property Details</span>
                    </div>
                    <div className="step-divider" />
                    <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-num">2</div>
                        <span>Select Inspection Rooms</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="card" style={{ padding: 36, maxWidth: 800, margin: '0 auto' }}>
                        <div className="section-title">Property Details</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Unit / Property No. *</label>
                                <input 
                                    value={details.unitNumber} 
                                    onChange={e => setDetail('unitNumber', e.target.value)} 
                                    placeholder="e.g. Suite 402, Unit 12B" 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Building / Complex Name</label>
                                <input 
                                    value={details.buildingName} 
                                    onChange={e => setDetail('buildingName', e.target.value)} 
                                    placeholder="e.g. Oakridge Residencies" 
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Property Address</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                                    <input 
                                        value={details.address} 
                                        onChange={e => setDetail('address', e.target.value)} 
                                        placeholder="Full address of the property" 
                                        style={{ paddingLeft: 42 }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Property Classification</label>
                                <select value={details.propertyType} onChange={e => setDetail('propertyType', e.target.value)}>
                                    <option value="">Select Class...</option>
                                    <option>Apartment</option>
                                    <option>Villa</option>
                                    <option>Townhouse</option>
                                    <option>Office Space</option>
                                    <option>Retail Store</option>
                                    <option>Warehouse</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Inspector Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                                    <input 
                                        value={details.inspector} 
                                        onChange={e => setDetail('inspector', e.target.value)} 
                                        placeholder="Inspector's full name" 
                                        style={{ paddingLeft: 42 }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Client Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                                    <input 
                                        value={details.client} 
                                        onChange={e => setDetail('client', e.target.value)} 
                                        placeholder="Client or Company Name" 
                                        style={{ paddingLeft: 42 }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Inspection Date</label>
                                <input type="date" value={details.date} onChange={e => setDetail('date', e.target.value)} />
                            </div>
                        </div>
                        
                        <div style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => navigate('/')}>
                                <ArrowLeft size={16} /> Back to Dashboard
                            </button>
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
                    <div style={{ maxWidth: 840, margin: '0 auto' }}>
                        <div className="card" style={{ padding: 36 }}>
                            <div className="section-title">Designate Rooms & Structures</div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                                Choose which rooms, spaces, and sections require inspection. Each section is automatically configured with recommended checklists.
                            </p>
                            
                            <div className="rooms-grid">
                                {DEFAULT_SECTIONS.map(name => {
                                    const active = !!sections.find(s => s.roomName === name);
                                    const IconComponent = SECTION_ICONS[name] || Home;
                                    return (
                                        <button
                                            key={name}
                                            className={`room-selection-card ${active ? 'active' : ''}`}
                                            onClick={() => toggleSection(name)}
                                        >
                                            <IconComponent size={20} />
                                            <span>{name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Section Form */}
                            <div className="divider" />
                            <div className="form-group">
                                <label className="form-label">Need custom rooms?</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <input
                                        value={customSection}
                                        onChange={e => setCustomSection(e.target.value)}
                                        placeholder="Enter custom room name (e.g. Attic, Sunroom)..."
                                        onKeyDown={e => e.key === 'Enter' && addCustomSection()}
                                        style={{ flex: 1 }}
                                    />
                                    <button className="btn btn-secondary" onClick={addCustomSection}>
                                        <Plus size={16} /> Add Room
                                    </button>
                                </div>
                            </div>

                            {/* Selected Counter & Chips */}
                            {sections.length > 0 && (
                                <>
                                    <div style={{ marginTop: 32, fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>
                                        SELECTED RECORD AREAS ({sections.length})
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreate}
                                disabled={saving || sections.length === 0}
                            >
                                {saving ? 'Creating Survey...' : `Confirm & Open Inspector`}
                                {!saving && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
