'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Filter } from 'lucide-react';
import { saasApi, AuditLogEntry } from '@/lib/services/saas';

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => {
        const params: Record<string, string> = {};
        if (actionFilter) params['action'] = actionFilter;
        saasApi.listAuditLogs(params).then(setLogs).catch(() => { }).finally(() => setLoading(false));
    }, [actionFilter]);

    // Extract unique actions for filter
    const uniqueActions = [...new Set(logs.map(l => l.action))].sort();

    if (loading) return <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading…</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Audit Log</h1>
                    <p className="text-sm text-[#78706A] mt-1">Global platform activity trail.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#A0978D]" />
                    <select
                        value={actionFilter}
                        onChange={e => setActionFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-[#E8E1D6] text-sm bg-white focus:outline-none focus:border-[#C4A882]"
                    >
                        <option value="">All Actions</option>
                        {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            <div className="rounded-2xl border border-[#E8E1D6] bg-white shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#E8E1D6] text-left">
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Action</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Resource</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">User</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Organization</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E1D6]">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-[#F7F3ED] transition">
                                <td className="px-5 py-3">
                                    <span className="text-xs font-bold text-[#C4A882] bg-[#C4A882]/10 px-2.5 py-1 rounded-full">{log.action}</span>
                                </td>
                                <td className="px-5 py-3 text-sm text-[#1C1917]">
                                    {log.resource_type} <span className="text-[#A0978D]">#{log.resource_id}</span>
                                </td>
                                <td className="px-5 py-3 text-sm text-[#78706A]">
                                    {log.user_display}
                                    {log.impersonated_by && (
                                        <span className="ml-1 text-[10px] bg-[#C4705A]/10 text-[#C4705A] px-1.5 py-0.5 rounded-full">impersonated</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-sm text-[#78706A]">{log.organization_name || '—'}</td>
                                <td className="px-5 py-3 text-xs text-[#A0978D]">{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center">
                                    <ScrollText className="w-8 h-8 mx-auto mb-2 text-[#D9D0C5]" />
                                    <p className="text-sm text-[#A0978D]">No audit entries yet.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
