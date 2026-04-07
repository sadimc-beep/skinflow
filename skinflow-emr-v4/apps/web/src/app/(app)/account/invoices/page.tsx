'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface SaaSInvoice {
    id: number;
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

export default function AccountInvoicesPage() {
    const [invoices, setInvoices] = useState<SaaSInvoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Replace with clinic-scoped API when auth is wired
        // For now, this is a placeholder that would be populated via the subscription
        setLoading(false);
    }, []);

    const statusConfig: Record<string, { icon: any; bg: string; text: string }> = {
        DRAFT: { icon: Clock, bg: 'bg-[#E8E1D6]', text: 'text-[#78706A]' },
        SENT: { icon: Clock, bg: 'bg-[#C4A882]/15', text: 'text-[#C4A882]' },
        PAID: { icon: CheckCircle, bg: 'bg-[#7A9E8A]/15', text: 'text-[#7A9E8A]' },
        OVERDUE: { icon: AlertCircle, bg: 'bg-[#C4705A]/15', text: 'text-[#C4705A]' },
        VOID: { icon: Clock, bg: 'bg-[#E8E1D6]', text: 'text-[#A0978D]' },
    };

    if (loading) return <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading…</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/account" className="w-9 h-9 rounded-full bg-[#E8E1D6] flex items-center justify-center hover:bg-[#D9D0C5] transition">
                    <ArrowLeft className="w-4 h-4 text-[#1C1917]" />
                </Link>
                <div>
                    <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Billing History</h1>
                    <p className="text-sm text-[#78706A] mt-1">View your subscription invoices and payment history.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-[#E8E1D6] bg-white shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#E8E1D6] text-left">
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Invoice #</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Period</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Amount</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Due Date</th>
                            <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E1D6]">
                        {invoices.map(inv => {
                            const cfg = statusConfig[inv.status] || statusConfig.DRAFT;
                            const Icon = cfg.icon;
                            return (
                                <tr key={inv.id} className="hover:bg-[#F7F3ED] transition">
                                    <td className="px-5 py-4 text-sm font-semibold text-[#1C1917]">{inv.invoice_number}</td>
                                    <td className="px-5 py-4 text-sm text-[#78706A]">
                                        {new Date(inv.period_start).toLocaleDateString()} — {new Date(inv.period_end).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4 text-sm font-semibold text-[#1C1917]">৳{Number(inv.total).toLocaleString()}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                                            <Icon className="w-3 h-3" /> {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-[#A0978D]">{new Date(inv.due_date).toLocaleDateString()}</td>
                                    <td className="px-5 py-4">
                                        {(inv.status === 'SENT' || inv.status === 'OVERDUE') && (
                                            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-xs font-semibold transition">
                                                <ExternalLink className="w-3 h-3" /> Pay Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center">
                                    <FileText className="w-8 h-8 mx-auto mb-2 text-[#D9D0C5]" />
                                    <p className="text-sm text-[#A0978D]">No invoices yet. Invoices will appear here once your subscription is active.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
