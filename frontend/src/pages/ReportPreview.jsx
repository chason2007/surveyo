import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
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
            a.download = `survey-${survey?.propertyDetails?.unitNumber || id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Failed to generate PDF. Make sure the backend is running and Cloudinary photos are accessible.');
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
        <div className="page-wrapper" style={{ paddingBottom: 60 }}>
            {/* Toolbar */}
            <div style={{
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border)',
                padding: '14px 0',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-ghost" onClick={() => navigate(`/surveys/${id}/edit`)}>
                        <ArrowLeft size={16} /> Back to Editor
                    </button>
                    <div style={{ flex: 1, fontWeight: 700 }}>
                        Report Preview — {pd.unitNumber} {pd.buildingName && `· ${pd.buildingName}`}
                    </div>
                    <button className="btn btn-secondary" onClick={() => window.print()}>
                        <Printer size={15} /> Print
                    </button>
                    <button className="btn btn-primary" onClick={downloadPDF} disabled={downloading}>
                        <Download size={15} /> {downloading ? 'Generating PDF…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {/* Report document */}
            <div style={{ background: 'var(--bg-base)', padding: '0 24px' }}>
                <div className="report-container">
                    {/* Header */}
                    <div className="report-header">
                        <h1>PROPERTY CONDITION SURVEY</h1>
                        <p>Professional Property Inspection Report</p>
                    </div>

                    <div className="report-body">
                        {/* Property details */}
                        <div className="report-details-grid">
                            {[
                                ['Unit / Property No.', pd.unitNumber],
                                ['Property Type', pd.propertyType],
                                ['Building / Complex', pd.buildingName],
                                ['Inspector', pd.inspector],
                                ['Address', pd.address],
                                ['Inspection Date', formatDate(pd.date)],
                            ].map(([label, val]) => (
                                <div className="report-detail" key={label}>
                                    <dt>{label}</dt>
                                    <dd>{val || '—'}</dd>
                                </div>
                            ))}
                        </div>

                        {/* Summary stats */}
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
                                        <span className="report-stat-label">✓ Good</span>
                                    </div>
                                    <div className="report-stat report-stat--flagged">
                                        <span className="report-stat-num">{flagged}</span>
                                        <span className="report-stat-label">⚑ Need Action</span>
                                    </div>
                                    <div className="report-stat report-stat--na">
                                        <span className="report-stat-num">{na}</span>
                                        <span className="report-stat-label">N/A</span>
                                    </div>
                                    <span style={{
                                        marginLeft: 'auto',
                                        padding: '4px 14px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        background: survey.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                                        color: survey.status === 'Completed' ? '#15803d' : '#b45309'
                                    }}>
                                        {survey.status.toUpperCase()}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Flagged Items panel */}
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
                                        ⚑ Flagged Items
                                        <span className="report-flagged-count">{flaggedItems.length} flagged</span>
                                    </div>
                                    {flaggedItems.map(({ section, item }, fi) => (
                                        <div key={fi} className="report-flagged-item">
                                            <div className="report-flagged-breadcrumb">Inspection / {section}</div>
                                            <div className="report-flagged-question">{item.label}</div>
                                            {item.comments && (
                                                <div className="report-flagged-comment">{item.comments}</div>
                                            )}
                                            {item.photos && item.photos.length > 0 && (
                                                <div className="report-photos" style={{ marginTop: 8 }}>
                                                    {item.photos.map((url, pi) => (
                                                        <div key={pi} className="report-photo-wrap">
                                                            <img src={url} alt={`Photo`} className="report-photo" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}


                        {/* Sections — global photo counter */}
                        {(() => {
                            let photoCounter = 0;
                            return survey.sections.map((section, si) => (
                                <div className="report-section" key={si}>
                                    <div className="report-section-header">{section.roomName.toUpperCase()}</div>
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '33%' }}>Item</th>
                                                <th style={{ width: '15%' }}>Status</th>
                                                <th style={{ width: '28%' }}>Comments</th>
                                                <th style={{ width: '24%' }}>Photos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.items.map((item, ii) => (
                                                <tr key={ii}>
                                                    <td data-label="ITEM" style={{ fontWeight: 600 }}>{item.label}</td>
                                                    <td data-label="STATUS">
                                                        <span className={statusClass(item.status)}>
                                                            {item.status || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td data-label="COMMENTS">{item.comments || '—'}</td>
                                                    <td data-label="PHOTOS">
                                                        {item.photos && item.photos.length > 0 ? (
                                                            <div className="report-photos">
                                                                {item.photos.map((url) => {
                                                                    photoCounter += 1;
                                                                    const num = photoCounter;
                                                                    return (
                                                                        <div key={num} className="report-photo-wrap">
                                                                            <img src={url} alt={`Photo ${num}`} className="report-photo" />
                                                                            <span className="report-photo-label">Photo {num}</span>
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
                                                    <td colSpan={4} style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                                        No items in this section.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ));
                        })()}

                        {/* Global Photos */}
                        {survey.globalPhotos && survey.globalPhotos.length > 0 && (
                            <div className="report-section" style={{ marginTop: 24 }}>
                                <div className="report-section-header">ADDITIONAL PHOTOS</div>
                                <div className="report-photos" style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', gap: 12 }}>
                                    {survey.globalPhotos.map((url, i) => {
                                        // Calculate starting photo number for global photos
                                        let globalPhotoNum = 0;
                                        survey.sections.forEach(s => s.items.forEach(item => { if (item.photos) globalPhotoNum += item.photos.length; }));
                                        const num = globalPhotoNum + i + 1;

                                        return (
                                            <div key={i} className="report-photo-wrap" style={{ display: 'inline-flex' }}>
                                                <img src={url} alt={`Additional Photo ${num}`} className="report-photo" style={{ width: 120, height: 120 }} />
                                                <span className="report-photo-label">Photo {num}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Footer note */}
                        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8' }}>
                            <p>This report was generated automatically based on the inspection data recorded. All photos are evidence of the property condition at the time of inspection.</p>
                            <p style={{ marginTop: 6 }}>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
