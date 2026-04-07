'use client';

import { useEffect, useState } from 'react';
import { Plus, Megaphone, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { saasApi, Announcement } from '@/lib/services/saas';
import { toast } from 'sonner';

const severityConfig = {
    INFO: { icon: Info, bg: 'bg-[#C4A882]/10', text: 'text-[#C4A882]', border: 'border-[#C4A882]' },
    WARNING: { icon: AlertTriangle, bg: 'bg-[#E8A838]/10', text: 'text-[#E8A838]', border: 'border-[#E8A838]' },
    CRITICAL: { icon: AlertCircle, bg: 'bg-[#C4705A]/10', text: 'text-[#C4705A]', border: 'border-[#C4705A]' },
};

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', body: '', severity: 'INFO' as Announcement['severity'], target: 'ALL' as Announcement['target'] });

    useEffect(() => {
        saasApi.listAnnouncements().then(setAnnouncements).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        try {
            const now = new Date().toISOString();
            const announcement = await saasApi.createAnnouncement({ ...form, published_at: now, target_organizations: [] });
            setAnnouncements([announcement, ...announcements]);
            setShowForm(false);
            setForm({ title: '', body: '', severity: 'INFO', target: 'ALL' });
            toast.success('Announcement published');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await saasApi.deleteAnnouncement(id);
            setAnnouncements(announcements.filter(a => a.id !== id));
            toast.success('Announcement deleted');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    if (loading) return <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading…</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Announcements</h1>
                    <p className="text-sm text-[#78706A] mt-1">Broadcast messages to clinics.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition">
                    <Plus className="w-4 h-4" /> New Announcement
                </button>
            </div>

            {showForm && (
                <div className="rounded-2xl border border-[#C4A882] bg-white p-6 shadow-sm space-y-4">
                    <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D6] text-sm focus:outline-none focus:border-[#C4A882]" />
                    <textarea placeholder="Message body…" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D6] text-sm focus:outline-none focus:border-[#C4A882] resize-none" />
                    <div className="flex items-center gap-3">
                        <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as Announcement['severity'] })} className="px-4 py-2 rounded-xl border border-[#E8E1D6] text-sm bg-white focus:outline-none focus:border-[#C4A882]">
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                        <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value as Announcement['target'] })} className="px-4 py-2 rounded-xl border border-[#E8E1D6] text-sm bg-white focus:outline-none focus:border-[#C4A882]">
                            <option value="ALL">All Organizations</option>
                            <option value="SPECIFIC">Specific</option>
                        </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">Cancel</button>
                        <button onClick={handleCreate} className="px-4 py-2 bg-[#1C1917] text-[#F7F3ED] rounded-full text-sm font-semibold hover:bg-[#2E2A25] transition">Publish</button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {announcements.map(a => {
                    const cfg = severityConfig[a.severity];
                    const Icon = cfg.icon;
                    return (
                        <div key={a.id} className={`rounded-2xl border ${cfg.border}/30 ${cfg.bg} p-5 flex items-start gap-4`}>
                            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.text}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-[#1C1917]">{a.title}</h3>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{a.severity}</span>
                                    <span className="text-[10px] text-[#A0978D]">· {a.target === 'ALL' ? 'All clinics' : 'Specific'}</span>
                                </div>
                                <p className="text-sm text-[#78706A]">{a.body}</p>
                                <p className="text-[10px] text-[#A0978D] mt-2">{a.published_at ? new Date(a.published_at).toLocaleString() : 'Draft'}</p>
                            </div>
                            <button onClick={() => handleDelete(a.id)} className="text-xs text-[#C4705A] hover:text-[#C4705A]/80 font-semibold shrink-0">Delete</button>
                        </div>
                    );
                })}
                {announcements.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#D9D0C5] p-12 text-center text-sm text-[#A0978D]">
                        <Megaphone className="w-8 h-8 mx-auto mb-2 text-[#D9D0C5]" />
                        No announcements yet.
                    </div>
                )}
            </div>
        </div>
    );
}
