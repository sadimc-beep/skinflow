'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, CreditCard, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';
import { saasApi, SaaSOrganization, Plan } from '@/lib/services/saas';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    return (
        <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
            <p className="text-3xl font-display text-[#1C1917] tracking-tight">{value}</p>
            <p className="text-sm text-[#A0978D] mt-1">{label}</p>
        </div>
    );
}

export default function SuperAdminDashboard() {
    const [orgs, setOrgs] = useState<SaaSOrganization[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([saasApi.listOrganizations(), saasApi.listPlans()])
            .then(([o, p]) => { setOrgs(o); setPlans(p); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const activeOrgs = orgs.filter(o => o.is_active);
    const totalUsers = orgs.reduce((sum, o) => sum + o.active_users, 0);
    const withSubscription = orgs.filter(o => o.plan_name).length;

    if (loading) {
        return <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading dashboard…</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Super Admin</h1>
                <p className="text-[#78706A] text-sm mt-1">Platform overview and management.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Clinics" value={orgs.length} icon={Building2} color="#1C1917" />
                <StatCard label="Active Clinics" value={activeOrgs.length} icon={TrendingUp} color="#7A9E8A" />
                <StatCard label="Total Users" value={totalUsers} icon={Users} color="#C4A882" />
                <StatCard label="With Subscription" value={withSubscription} icon={CreditCard} color="#C4705A" />
            </div>

            {/* Recent Organizations */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-[#E8E1D6]">
                    <h2 className="font-display text-xl text-[#1C1917]">Organizations</h2>
                    <Link
                        href="/superadmin/organizations"
                        className="text-sm text-[#C4A882] hover:text-[#1C1917] font-semibold flex items-center gap-1 transition"
                    >
                        View All <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                <div className="divide-y divide-[#E8E1D6]">
                    {orgs.length === 0 ? (
                        <div className="p-8 text-center text-[#A0978D]">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#D9D0C5]" />
                            <p className="text-sm">No organizations yet. Create your first clinic.</p>
                        </div>
                    ) : orgs.slice(0, 5).map(org => (
                        <Link key={org.id} href={`/superadmin/organizations/${org.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-[#F7F3ED] transition">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#E8E1D6] flex items-center justify-center">
                                    <span className="text-sm font-bold text-[#1C1917]">{org.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#1C1917]">{org.name}</p>
                                    <p className="text-xs text-[#A0978D]">{org.slug}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-xs">
                                <div className="text-right">
                                    <p className="font-semibold text-[#1C1917]">{org.active_users} users</p>
                                    <p className="text-[#A0978D]">{org.branch_count} branches</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${org.subscription_status === 'Active' ? 'bg-[#7A9E8A]/15 text-[#7A9E8A]' :
                                        org.subscription_status === 'Trial' ? 'bg-[#C4A882]/15 text-[#C4A882]' :
                                            org.subscription_status === 'Past Due' ? 'bg-[#C4705A]/15 text-[#C4705A]' :
                                                'bg-[#E8E1D6] text-[#78706A]'
                                    }`}>
                                    {org.plan_name || 'No Plan'} · {org.subscription_status}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
