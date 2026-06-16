import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

const DEFAULT_ROOMS = [
    'Entry / Foyer', 'Living Room', 'Dining Room', 'Kitchen',
    'Master Bedroom', 'Bedroom 2', 'Bedroom 3',
    'Bathroom 1', 'Bathroom 2', 'Balcony', 'Parking', 'Store Room', 'General Comments'
];

const DEFAULT_ITEMS = {
    'Kitchen': ['Ceiling', 'Walls', 'Floor', 'Cabinets', 'Countertop', 'Sink', 'Appliances', 'Windows', 'Electrical Points'],
    'Living Room': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Curtain Rails', 'Electrical Points', 'AC Unit'],
    'Master Bedroom': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Curtain Rails', 'Electrical Points', 'AC Unit', 'Wardrobe'],
    'Bedroom 2': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Curtain Rails', 'Electrical Points', 'AC Unit', 'Wardrobe'],
    'Bedroom 3': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Curtain Rails', 'Electrical Points', 'AC Unit', 'Wardrobe'],
    'Bathroom 1': ['Ceiling', 'Walls', 'Floor', 'Shower/Bath', 'Toilet', 'Basin', 'Mirror', 'Exhaust Fan'],
    'Bathroom 2': ['Ceiling', 'Walls', 'Floor', 'Shower/Bath', 'Toilet', 'Basin', 'Mirror', 'Exhaust Fan'],
    'Balcony': ['Ceiling', 'Walls', 'Floor', 'Railings', 'Drainage'],
    'Entry / Foyer': ['Ceiling', 'Walls', 'Floor', 'Main Door', 'Intercom', 'Electrical Points'],
    'Dining Room': ['Ceiling', 'Walls', 'Floor', 'Windows', 'Electrical Points'],
    'Parking': ['Floor', 'Walls', 'Ceiling', 'Shutter/Door', 'Lighting'],
    'Store Room': ['Ceiling', 'Walls', 'Floor', 'Door'],
    'General Comments': [
        'Property deeply cleaned?', 'Internal walls in good condition?',
        'All light fixtures working?', 'Windows and doors functioning?',
        'Free of pest infestation?', 'Appliances in working order?', 'Free of water damage or leaks?',
    ],
};

const makeItems = (name) =>
    (DEFAULT_ITEMS[name] || ['Ceiling', 'Walls', 'Floor']).map(label => ({ label, status: '', photos: [], comments: '' }));

export default function NewSurvey() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [customRoom, setCustomRoom] = useState('');
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [prefillItems, setPrefillItems] = useState(true);

    const [details, setDetails] = useState({
        unitNumber: '', buildingName: '', address: '',
        propertyType: '', inspector: '', client: '',
        date: new Date().toISOString().split('T')[0]
    });

    const set = (k, v) => setDetails(d => ({ ...d, [k]: v }));

    const toggleRoom = (name) => {
        setSelectedRooms(prev =>
            prev.includes(name) ? prev.filter(r => r !== name) : [...prev, name]
        );
    };

    const addCustomRoom = () => {
        const name = customRoom.trim();
        if (!name || selectedRooms.includes(name)) return;
        setSelectedRooms(prev => [...prev, name]);
        setCustomRoom('');
    };

    const handleCreate = async () => {
        if (!details.unitNumber.trim()) { setError('Unit / property number is required.'); return; }
        if (selectedRooms.length === 0) { setError('Select at least one room.'); return; }
        setError('');
        setSaving(true);
        try {
            const { data } = await api.post('/api/surveys', {
                propertyDetails: { ...details, date: details.date ? new Date(details.date) : new Date() },
                sections: selectedRooms.map(name => ({ roomName: name, items: prefillItems ? makeItems(name) : [] })),
                status: 'Draft'
            });
            navigate(`/surveys/${data._id}/edit`);
        } catch {
            setError('Failed to create survey. Check your connection.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 720 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate('/')}>
                        <ArrowLeft size={15} />
                    </button>
                    <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>New Survey</h1>
                </div>

                {/* Property Details */}
                <div className="card" style={{ padding: '4px 24px', marginBottom: 16 }}>
                    <div className="field-row">
                        <span className="field-label">Unit / Property *</span>
                        <input className="field-input" value={details.unitNumber} onChange={e => set('unitNumber', e.target.value)} placeholder="Unit 302" autoFocus />
                    </div>
                    <div className="field-row">
                        <span className="field-label">Building</span>
                        <input className="field-input" value={details.buildingName} onChange={e => set('buildingName', e.target.value)} placeholder="Sky Tower" />
                    </div>
                    <div className="field-row">
                        <span className="field-label">Address</span>
                        <input className="field-input" value={details.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
                    </div>
                    <div className="field-row">
                        <span className="field-label">Type</span>
                        <select className="field-select" value={details.propertyType} onChange={e => set('propertyType', e.target.value)}>
                            <option value="">—</option>
                            <option>Apartment</option>
                            <option>Villa</option>
                            <option>Townhouse</option>
                            <option>Office Space</option>
                            <option>Retail Store</option>
                            <option>Warehouse</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="field-row">
                        <span className="field-label">Inspector</span>
                        <input className="field-input" value={details.inspector} onChange={e => set('inspector', e.target.value)} placeholder="Name" />
                    </div>
                    <div className="field-row">
                        <span className="field-label">Client</span>
                        <input className="field-input" value={details.client} onChange={e => set('client', e.target.value)} placeholder="Company or person" />
                    </div>
                    <div className="field-row">
                        <span className="field-label">Date</span>
                        <input className="field-input" type="date" value={details.date} onChange={e => set('date', e.target.value)} />
                    </div>
                </div>

                {/* Room Selection */}
                <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                        Rooms &amp; Sections
                        {selectedRooms.length > 0 && <span style={{ fontWeight: 400, color: 'var(--accent)', marginLeft: 8 }}>{selectedRooms.length} selected</span>}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {DEFAULT_ROOMS.map(name => (
                            <button
                                key={name}
                                onClick={() => toggleRoom(name)}
                                style={{
                                    padding: '6px 12px', borderRadius: 4, fontSize: 13, fontWeight: 500,
                                    border: '1px solid',
                                    borderColor: selectedRooms.includes(name) ? 'var(--accent)' : 'var(--border)',
                                    background: selectedRooms.includes(name) ? 'var(--good-bg)' : 'var(--bg)',
                                    color: selectedRooms.includes(name) ? 'var(--good-text)' : 'var(--text)',
                                    transition: 'all 0.15s',
                                    cursor: 'pointer',
                                }}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            value={customRoom}
                            onChange={e => setCustomRoom(e.target.value)}
                            placeholder="Add custom room..."
                            onKeyDown={e => e.key === 'Enter' && addCustomRoom()}
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-secondary btn-sm" onClick={addCustomRoom}>
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    {selectedRooms.filter(r => !DEFAULT_ROOMS.includes(r)).map(name => (
                        <div key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, marginRight: 6, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--accent)', background: 'var(--good-bg)', fontSize: 13, color: 'var(--good-text)' }}>
                            {name}
                            <button onClick={() => toggleRoom(name)} style={{ display: 'flex', color: 'var(--good-text)', cursor: 'pointer' }}><X size={12} /></button>
                        </div>
                    ))}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={prefillItems}
                        onChange={e => setPrefillItems(e.target.checked)}
                        style={{ width: 'auto', accentColor: 'var(--accent)' }}
                    />
                    Prefill rooms with standard checklist items
                </label>

                {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                        {saving ? 'Creating...' : 'Create Survey'}
                    </button>
                </div>
            </div>
        </div>
    );
}
