'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CreditCard, Users, GitBranch, Package, ArrowRight,
    CheckCircle, AlertCircle, Clock, FileText
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface SubInfo {
    plan_name: string;
    status: string;
    billing_cycle: string;
    current_period_end: string;
    next_billing_date: string | null;
    monthly_amount: string;
    max_users: number;
    current_users: number;
    max_branches: number;
    current_branches: number;
    has_marketing_addon: boolean;
    extra_users: number;
    extra_branches: number;
}

interface OrgInfo {
    id: number;
    name: string;
    slug: string;
    subscription_status: string;
    plan_name: string | null;
    active_users: number;
    branch_count: number;
}

export default function AccountPage() {
    const [org, setOrg] = useState<OrgInfo | null>(null);
    const [sub, setSub] = useState<SubInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Try to get current org from staff profile
        // For now, use the first org as a proxy
        fetchApi<OrgInfo[]>('/saas/organizations/')
            .then(orgs => {
                if (orgs.length > 0) {
                    setOrg(orgs[0]);
                    return fetchApi<SubInfo>(`/saas/organizations/${orgs[0].id}/subscription/`);
                }
                return null;
            })
            .then(s => { if (s) setSub(s); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading…</div>;

    const statusIcon = sub?.status === 'ACTIVE' ? CheckCircle :
        sub?.status === 'PAST_DUE' ? AlertCircle : Clock;
    const StatusIcon = statusIcon;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Account & Subscription</h1>
                <p className="text-sm text-[#78706A] mt-1">Manage your clinic's plan, billing, and add-ons.</p>
            </div>

            {/* Plan Overview Card */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-white shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#1C1917] to-[#2E2A25] px-6 py-5 text-white flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#C4A882] uppercase tracking-wider font-bold mb-1">Current Plan</p>
                        <h2 className="font-display text-2xl">{sub?.plan_name || org?.plan_name || 'No Plan'}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusIcon className={`w-5 h-5 ${sub?.status === 'ACTIVE' ? 'text-[#7A9E8A]' :
                                sub?.status === 'PAST_DUE' ? 'text-[#C4705A]' : 'text-[#C4A882]'
                            }`} />
                        <span className="text-sm font-semibold">{sub?.status || 'No Subscription'}</span>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Monthly Amount */}
                        <div className="rounded-xl bg-[#F7F3ED] p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-[#C4A882]" />
                                <span className="text-xs text-[#A0978D] font-bold uppercase tracking-wider">Billing</span>
                            </div>
                            <p className="text-xl font-display text-[#1C1917]">
                                {sub ? `৳${Number(sub.monthly_amount).toLocaleString()}` : '—'}
                            </p>
                            <p className="text-[10px] text-[#A0978D] mt-0.5">
                                {sub ? `${sub.billing_cycle === 'MONTHLY' ? 'per month' : 'per year (annual)'}` : ''}
                            </p>
                        </div>

                        {/* Users */}
                        <div className="rounded-xl bg-[#F7F3ED] p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-[#C4A882]" />
                                <span className="text-xs text-[#A0978D] font-bold uppercase tracking-wider">Users</span>
                            </div>
                            <p className="text-xl font-display text-[#1C1917]">
                                {sub ? `${sub.current_users}/${sub.max_users}` : `${org?.active_users || 0}`}
                            </p>
                            <p className="text-[10px] text-[#A0978D] mt-0.5">
                                {sub?.extra_users ? `+${sub.extra_users} extra users` : 'included in plan'}
                            </p>
                        </div>

                        {/* Branches */}
                        <div className="rounded-xl bg-[#F7F3ED] p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <GitBranch className="w-4 h-4 text-[#C4A882]" />
                                <span className="text-xs text-[#A0978D] font-bold uppercase tracking-wider">Branches</span>
                            </div>
                            <p className="text-xl font-display text-[#1C1917]">
                                {sub ? `${sub.current_branches}/${sub.max_branches}` : `${org?.branch_count || 0}`}
                            </p>
                            <p className="text-[10px] text-[#A0978D] mt-0.5">
                                {sub?.extra_branches ? `+${sub.extra_branches} extra branches` : 'included in plan'}
                            </p>
                        </div>

                        {/* Next Billing */}
                        <div className="rounded-xl bg-[#F7F3ED] p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-[#C4A882]" />
                                <span className="text-xs text-[#A0978D] font-bold uppercase tracking-wider">Next Billing</span>
                            </div>
                            <p className="text-xl font-display text-[#1C1917]">
                                {sub?.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : '—'}
                            </p>
                            <p className="text-[10px] text-[#A0978D] mt-0.5">
                                {sub?.current_period_end ? `Period ends ${new Date(sub.current_period_end).toLocaleDateString()}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Add-ons */}
                    <div className="mt-6 pt-6 border-t border-[#E8E1D6]">
                        <h3 className="font-semibold text-sm text-[#1C1917] mb-3">Add-on Modules</h3>
                        <div className="flex gap-3">
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${sub?.has_marketing_addon ? 'border-[#7A9E8A] bg-[#7A9E8A]/5' : 'border-[#E8E1D6] bg-[#F7F3ED]'
                                }`}>
                                <Package className={`w-4 h-4 ${sub?.has_marketing_addon ? 'text-[#7A9E8A]' : 'text-[#D9D0C5]'}`} />
                                <div>
                                    <p className="text-sm font-semibold text-[#1C1917]">Marketing Module</p>
                                    <p className="text-[10px] text-[#A0978D]">
                                        {sub?.has_marketing_addon ? 'Active' : 'Not subscribed — contact support to add'}
                                    </p>
                                </div>
                                {sub?.has_marketing_addon && <CheckCircle className="w-4 h-4 text-[#7A9E8A]" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/account/invoices" className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-sm hover:border-[#C4A882] transition flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C4A882]/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#C4A882]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#1C1917]">Billing History</p>
                            <p className="text-xs text-[#A0978D]">View past invoices and payments</p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#D9D0C5] group-hover:text-[#C4A882] transition" />
                </Link>
                <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E8E1D6] flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#78706A]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#1C1917]">Need More Users?</p>
                            <p className="text-xs text-[#A0978D]">Contact Skinflow support to add extra seats</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
