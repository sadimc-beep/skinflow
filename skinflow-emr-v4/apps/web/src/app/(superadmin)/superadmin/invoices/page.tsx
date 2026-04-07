'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Filter } from 'lucide-react';
import { saasApi, Subscription } from '@/lib/services/saas';
import { fetchApi } from '@/lib/api';

interface SaaSInvoice {
    id: number;
    subscription: number;
    invoice_number: string;
    period_start: string;
    period_end: string;
    subtotal: string;
    discount: string;
    tax: string;
    total: string;
    status: string;
    due_date: string;
    paid_at: string | null;
    created_at: string;
}

export default function InvoicesLedgerPage() {
    const [invoices, setInvoices] = useState<SaaSInvoice[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        Promise.all([
            fetchApi<SaaSInvoice[]>('/saas/subscriptions/'),
            saasApi.listSubscriptions(),
        ]).catch(() => { });

        // Fetch invoices from each subscription
        saasApi.listSubscriptions()
            .then(async (subs) => {
                setSubscriptions(subs);
                // For now, just show subscriptions as placeholder since we don't have a global invoices endpoint yet
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const statusColors: Record<string, string> = {
        DRAFT: 'bg-[#E8E1D6] text-[#78706A]',
        SENT: 'bg-[#C4A882]/15 text-[#C4A882]',
        PAID: 'bg-[#7A9E8A]/15 text-[#7A9E8A]',
        OVERDUE: 'bg-[#C4705A]/15 text-[#C4705A]',
        VOID: 'bg-[#E8E1D6] text-[#A0978D]',
    };

    if (loading) return <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading…</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">SaaS Invoices</h1>
                    <p className="text-sm text-[#78706A] mt-1">Subscription billing history across all clinics.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#A0978D]" />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-[#E8E1D6] text-sm bg-white focus:outline-none focus:border-[#C4A882]">
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="PAID">Paid</option>
                        <option value="OVERDUE">Overdue</option>
                        <option value="VOID">Void</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-sm">
                    <p className="text-xs text-[#A0978D] uppercase tracking-wider font-bold mb-1">Active Subscriptions</p>
                    <p className="text-2xl font-display text-[#1C1917]">{subscriptions.filter(s => s.status === 'ACTIVE').length}</p>
                </div>
                <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-sm">
                    <p className="text-xs text-[#A0978D] uppercase tracking-wider font-bold mb-1">Monthly Revenue</p>
                    <p className="text-2xl font-display text-[#1C1917]">৳{subscriptions.reduce((s, sub) => s + Number(sub.monthly_amount), 0).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-sm">
                    <p className="text-xs text-[#A0978D] uppercase tracking-wider font-bold mb-1">Past Due</p>
                    <p className="text-2xl font-display text-[#C4705A]">{subscriptions.filter(s => s.status === 'PAST_DUE').length}</p>
                </div>
            </div>

            {/* Subscriptions Table (acts as invoice proxy until invoices are generated) */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#E8E1D6]">
                    <h3 className="font-semibold text-[#1C1917]">Subscription Ledger</h3>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#E8E1D6] text-left">
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Organization</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Plan</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Cycle</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Amount</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Period End</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E1D6]">
                        {subscriptions.map(sub => (
                            <tr key={sub.id} className="hover:bg-[#F7F3ED] transition">
                                <td className="px-5 py-4 text-sm font-semibold text-[#1C1917]">{sub.organization_name}</td>
                                <td className="px-5 py-4 text-sm text-[#78706A]">{sub.plan_name}</td>
                                <td className="px-5 py-4 text-sm text-[#78706A]">{sub.billing_cycle}</td>
                                <td className="px-5 py-4 text-sm font-semibold text-[#1C1917]">৳{Number(sub.monthly_amount).toLocaleString()}/mo</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.status === 'ACTIVE' ? 'bg-[#7A9E8A]/15 text-[#7A9E8A]' :
                                            sub.status === 'TRIAL' ? 'bg-[#C4A882]/15 text-[#C4A882]' :
                                                sub.status === 'PAST_DUE' ? 'bg-[#C4705A]/15 text-[#C4705A]' :
                                                    sub.status === 'SUSPENDED' ? 'bg-[#C4705A]/15 text-[#C4705A]' :
                                                        'bg-[#E8E1D6] text-[#78706A]'
                                        }`}>
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-xs text-[#A0978D]">{new Date(sub.current_period_end).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {subscriptions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center">
                                    <FileText className="w-8 h-8 mx-auto mb-2 text-[#D9D0C5]" />
                                    <p className="text-sm text-[#A0978D]">No subscriptions yet. Assign plans to organizations first.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
