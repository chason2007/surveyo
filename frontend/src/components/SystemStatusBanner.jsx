import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '../api/axios';

const CHECK_INTERVAL = 60000;

export default function SystemStatusBanner() {
    const [degraded, setDegraded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const check = () => {
            api.get('/api/health')
                .then(({ data }) => { if (!cancelled) setDegraded(!data.mongoConnected); })
                .catch(() => { /* backend unreachable is surfaced elsewhere; not this banner's job */ });
        };

        check();
        const interval = setInterval(check, CHECK_INTERVAL);
        return () => { cancelled = true; clearInterval(interval); };
    }, []);

    if (!degraded) return null;

    return (
        <div className="status-banner">
            <AlertTriangle size={14} />
            <span>Database unavailable — running on temporary storage. Changes may not be saved permanently.</span>
        </div>
    );
}
