import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, CheckCircle2, AlertOctagon, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
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
            <span>Assembling condition report document...</span>
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
                background: 'rgba(3, 7, 18, 0.85)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border)',
                padding: '16px 0',
                position: 'sticky',
                top: 72,
                zIndex: 100
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/surveys/${id}/edit`)}>
                        <ArrowLeft size={16} /> Edit Workspace
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '15px', fontWeight: 700 }}>
                        <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                        <span>Executive Summary — {pd.unitNumber} {pd.buildingName && `( ${pd.buildingName} )`}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                            <Printer size={15} /> Print Report
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={downloadPDF} disabled={downloading}>
                            <Download size={15} /> {downloading ? 'Compiling PDF...' : 'Download PDF Document'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Backdrop */}
            <div style={{ padding: '0 24px', background: 'transparent' }}>
                <div className="report-container">
                    {/* Professional Header Block */}
                    <div className="report-header">
                        <h1>PROPERTY CONDITION REPORT</h1>
                        <p style={{ marginTop: 4, letterSpacing: '0.04em', fontWeight: 600 }}>CONFIDENTIAL CONDITION SURVEY SHEET</p>
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

                        {/* Summary dynamic counters */}
                        {(() => {
                            const allItems = survey.sections.flatMap(s => s.items);
                            const total = allItems.length;
                            const good = allItems.filter(i => i.status === 'Good').length;
                            const flagged = allItems.filter(i => i.status === 'Need Action').length;
                            const na = allItems.filter(i => i.status === 'N/A').length;
                            return (
                                <div className="report-stats-bar">
                                    <div className="report-stat">
                                        <span className="report-stat-num">{total}</span>
                                        <span className="report-stat-label">Total Items</span>
                                    </div>
                                    <div className="report-stat report-stat--good">
                                        <span className="report-stat-num">{good}</span>
                                        <span className="report-stat-label">Good (OK)</span>
                                    </div>
                                    <div className="report-stat report-stat--flagged">
                                        <span className="report-stat-num">{flagged}</span>
                                        <span className="report-stat-label">Defects</span>
                                    </div>
                                    <div className="report-stat report-stat--na">
                                        <span className="report-stat-num">{na}</span>
                                        <span className="report-stat-label">N/A</span>
                                    </div>
                                    
                                    <span style={{
                                        marginLeft: 'auto',
                                        padding: '6px 16px',
                                        borderRadius: 30,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        letterSpacing: '0.05em',
                                        background: survey.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                                        color: survey.status === 'Completed' ? '#166534' : '#92400e',
                                        border: survey.status === 'Completed' ? '1px solid #bbf7d0' : '1px solid #fde68a'
                                    }}>
                                        {survey.status.toUpperCase()}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Defective Highlight Area */}
                        {(() => {
                            const flaggedItems = [];
                            survey.sections.forEach(section => {
                                section.items.forEach(item => {
                                    if (item.status === 'Need Action') {
                                        flaggedItems.push({ section: section.roomName, item });
                                    }
                                });
                            });
                            if (flaggedItems.length === 0) return null;
                            return (
                                <div className="report-flagged">
                                    <div className="report-flagged-header">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <AlertOctagon size={16} />
                                            <span>ACTION REQUIRED: DETECTED DEFECTS</span>
                                        </span>
                                        <span className="report-flagged-count">{flaggedItems.length} ACTION ITEMS</span>
                                    </div>
                                    {flaggedItems.map(({ section, item }, fi) => (
                                        <div key={fi} className="report-flagged-item">
                                            <div className="report-flagged-breadcrumb">{section} / Checklist</div>
                                            <div className="report-flagged-question">{item.label}</div>
                                            {item.comments && (
                                                <div className="report-flagged-comment">{item.comments}</div>
                                            )}
                                            {item.photos && item.photos.length > 0 && (
                                                <div className="report-photos" style={{ marginTop: 12 }}>
                                                    {item.photos.map((url, pi) => (
                                                        <div key={pi} className="report-photo-wrap">
                                                            <img src={url} alt={`Defect`} className="report-photo" style={{ width: 100, height: 75 }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Checklists Room by Room */}
                        {(() => {
                            let photoCounter = 0;
                            return survey.sections.map((section, si) => (
                                <div className="report-section" key={si}>
                                    <div className="report-section-header">{section.roomName.toUpperCase()} AREA CONDITION</div>
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
                                                        <span className={statusClass(item.status)}>
                                                            {item.status || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td data-label="Observations / Remarks" style={{ fontSize: '13px', color: '#475569' }}>{item.comments || 'No abnormalities detected.'}</td>
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
                                <div className="report-section-header">ADDITIONAL SITE PHOTOGRAPHY</div>
                                <div className="report-photos" style={{ padding: 24, background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none', gap: 16 }}>
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

                        {/* Premium Legal Footer / Sign-off */}
                        <div style={{ marginTop: 48, paddingTop: 28, borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                            <p style={{ fontWeight: 600, color: '#64748b' }}>LEGAL DISCLAIMER & CERTIFICATE</p>
                            <p style={{ marginTop: 6 }}>This certifies that the property detailed within this report has been duly inspected. All observations and assessments recorded correspond to the physical status of the surveyed areas at the exact date and timestamp of the inspection operation.</p>
                            <p style={{ marginTop: 12 }}>Report compiled on: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
