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

                        {/* Status */}
                        <div style={{ marginBottom: 24 }}>
                            <span style={{
                                display: 'inline-block',
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
