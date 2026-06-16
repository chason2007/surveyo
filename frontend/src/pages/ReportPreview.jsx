import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react';
import api from '../api/axios';

const statusClass = (s) => {
    if (s === 'Good') return 'report-status-good';
    if (s === 'Need Action') return 'report-status-need-action';
    return 'report-status-na';
};

export default function ReportPreview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        api.get(`/api/surveys/${id}`)
            .then(({ data }) => setSurvey(data))
            .catch(() => navigate('/'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const downloadPDF = useCallback(async () => {
        setDownloading(true);
        try {
            const response = await api.get(`/api/surveys/${id}/report`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `condition-survey-${survey?.propertyDetails?.unitNumber || id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Failed to generate PDF report. Ensure the backend server is active.');
        } finally {
            setDownloading(false);
        }
    }, [id, survey]);

    if (loading) return (
        <div className="loading-screen" style={{ minHeight: '100vh' }}>
            <div className="spinner" />
            <span>Loading report…</span>
        </div>
    );

    if (!survey) return null;

    const pd = survey.propertyDetails;
    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

    return (
        <div className="page-wrapper" style={{ paddingBottom: 80 }}>
            {/* Executive Sticky Toolbar */}
            <div style={{
                background: 'var(--bg-surface)',
                borderBottom: '1.5px solid var(--border)',
                padding: '12px 0',
                position: 'sticky',
                top: 60,
                zIndex: 100
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/surveys/${id}/edit`)}>
                        <ArrowLeft size={16} /> Edit
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        <FileText size={15} style={{ color: 'var(--accent)' }} />
                        <span>{pd.unitNumber} {pd.buildingName && `· ${pd.buildingName}`}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                            <Printer size={15} /> Print
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={downloadPDF} disabled={downloading}>
                            <Download size={15} /> {downloading ? 'Generating…' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Backdrop */}
            <div style={{ padding: '0 24px', background: 'transparent' }}>
                <div className="report-container">
                    {/* Professional Header Block */}
                    <div className="report-header">
                        <h1>Property Condition Report</h1>
                        <p style={{ marginTop: 4 }}>{pd.buildingName || ''}{pd.address ? ` · ${pd.address}` : ''}</p>
                    </div>

                    <div className="report-body">
                        {/* Executive Property Specs */}
                        <div className="report-details-grid">
                            {[
                                ['Unit / Property No.', pd.unitNumber],
                                ['Property Type', pd.propertyType],
                                ['Building / Complex', pd.buildingName],
                                ['Client Name', pd.client],
                                ['Inspector Name', pd.inspector],
                                ['Property Address', pd.address],
                                ['Inspection Date', formatDate(pd.date)],
                            ].map(([label, val]) => (
                                <div className="report-detail" key={label}>
                                    <dt>{label}</dt>
                                    <dd>{val || '—'}</dd>
                                </div>
                            ))}
                        </div>

                        {/* Summary line */}
                        {(() => {
                            const allItems = survey.sections.flatMap(s => s.items);
                            const total = allItems.length;
                            const good = allItems.filter(i => i.status === 'Good').length;
                            const flagged = allItems.filter(i => i.status === 'Need Action').length;
                            const na = allItems.filter(i => i.status === 'N/A').length;
                            return (
                                <div className="report-summary-line">
                                    <span>{total} item{total === 1 ? '' : 's'}</span>
                                    <span className="sep">·</span>
                                    <span className="good">{good} good</span>
                                    <span className="sep">·</span>
                                    <span className="flagged">{flagged} need action</span>
                                    {na > 0 && <><span className="sep">·</span><span>{na} N/A</span></>}
                                    <span className={`status-tag ${survey.status === 'Completed' ? 'completed' : 'draft'}`}>
                                        {survey.status.toUpperCase()}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Checklists Room by Room */}
                        {(() => {
                            let photoCounter = 0;
                            return survey.sections.map((section, si) => (
                                <div className="report-section" key={si}>
                                    <div className="report-section-header">{section.roomName}</div>
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '35%' }}>Inspection Asset / Item</th>
                                                <th style={{ width: '15%' }}>Condition</th>
                                                <th style={{ width: '25%' }}>Observations / Remarks</th>
                                                <th style={{ width: '25%' }}>Evidence Photos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.items.map((item, ii) => (
                                                <tr key={ii}>
                                                    <td data-label="Inspection Asset / Item" style={{ fontWeight: 700, color: '#1e293b' }}>{item.label}</td>
                                                    <td data-label="Condition">
                                                        <span className={`report-status-text ${statusClass(item.status)}`}>
                                                            {item.status || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td data-label="Observations / Remarks" style={{ fontSize: '13px', color: '#475569' }}>{item.comments || 'NIL'}</td>
                                                    <td data-label="Evidence Photos">
                                                        {item.photos && item.photos.length > 0 ? (
                                                            <div className="report-photos">
                                                                {item.photos.map((url) => {
                                                                    photoCounter += 1;
                                                                    const num = photoCounter;
                                                                    return (
                                                                        <div key={num} className="report-photo-wrap">
                                                                            <img src={url} alt={`Evidence ${num}`} className="report-photo" />
                                                                            <span className="report-photo-label">Photo #{num}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {section.items.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>
                                                        No checklist records exist for this section.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ));
                        })()}

                        {/* Global Additional Photos */}
                        {survey.globalPhotos && survey.globalPhotos.length > 0 && (
                            <div className="report-section" style={{ marginTop: 40 }}>
                                <div className="report-section-header">Additional Photos</div>
                                <div className="report-photos" style={{ gap: 16 }}>
                                    {survey.globalPhotos.map((url, i) => {
                                        let globalPhotoNum = 0;
                                        survey.sections.forEach(s => s.items.forEach(item => { if (item.photos) globalPhotoNum += item.photos.length; }));
                                        const num = globalPhotoNum + i + 1;

                                        return (
                                            <div key={i} className="report-photo-wrap" style={{ display: 'inline-flex' }}>
                                                <img src={url} alt={`Global Site ${num}`} className="report-photo" style={{ width: 140, height: 105 }} />
                                                <span className="report-photo-label" style={{ marginTop: 4 }}>Site Photo #{num}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #e5e5e5', fontSize: 12, color: '#aaa' }}>
                            Report generated on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
