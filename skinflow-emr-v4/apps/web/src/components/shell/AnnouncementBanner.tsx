'use client';

import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface Announcement {
    id: number;
    title: string;
    body: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

const severityConfig = {
    INFO: { icon: Info, bg: 'bg-[#C4A882]/10 border-[#C4A882]/20', text: 'text-[#C4A882]', bodyText: 'text-[#78706A]' },
    WARNING: { icon: AlertTriangle, bg: 'bg-[#E8A838]/10 border-[#E8A838]/20', text: 'text-[#E8A838]', bodyText: 'text-[#78706A]' },
    CRITICAL: { icon: AlertCircle, bg: 'bg-[#C4705A]/10 border-[#C4705A]/20', text: 'text-[#C4705A]', bodyText: 'text-[#78706A]' },
};

export function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        fetchApi<Announcement[]>('/saas/announcements/active/')
            .then(setAnnouncements)
            .catch(() => { });
    }, []);

    const handleDismiss = async (id: number) => {
        try {
            await fetchApi(`/saas/announcements/${id}/dismiss/`, { method: 'POST' });
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch {
            // If dismiss fails (e.g., CRITICAL), just ignore
        }
    };

    if (announcements.length === 0) return null;

    return (
        <div className="space-y-2 mb-4">
            {announcements.map(a => {
                const cfg = severityConfig[a.severity];
                const Icon = cfg.icon;
                return (
                    <div key={a.id} className={`rounded-xl border ${cfg.bg} px-4 py-3 flex items-start gap-3`}>
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.text}`} />
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${cfg.text}`}>{a.title}</p>
                            <p className={`text-xs mt-0.5 ${cfg.bodyText}`}>{a.body}</p>
                        </div>
                        {a.severity !== 'CRITICAL' && (
                            <button onClick={() => handleDismiss(a.id)} className="shrink-0 text-[#A0978D] hover:text-[#1C1917] transition">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
