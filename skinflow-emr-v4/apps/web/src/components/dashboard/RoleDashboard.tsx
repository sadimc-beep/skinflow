'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import {
    Calendar, FileText, Package, Activity,
    ShoppingCart, BookOpen, TrendingUp, Clock, AlertTriangle,
    CheckCircle, Stethoscope, ClipboardList, DollarSign, BarChart3,
    UserPlus, Loader2, ArrowRight, Users
} from 'lucide-react';

// ─── Image Module Card ───────────────────────────────────────────────────────
// Styled exactly like the Radiant product cards: photo fills the card,
// dark bottom scrim, white text label and stat badge overlay.
function ModuleCard({
    title, stat, statLabel, href, image, description
}: {
    title: string; stat: string | number; statLabel: string;
    href: string; image: string; description: string;
}) {
    return (
        <Link href={href} className="group block relative overflow-hidden rounded-2xl aspect-[4/5]">
            {/* Full-bleed image */}
            <Image
                src={image}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 33vw"
            />
            {/* Bottom scrim overlay */}
            <div className="absolute inset-0 card-scrim" />

            {/* Stat badge — like the $49 price badge in Radiant */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="bg-[#1C1917] rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-[#F7F3ED] font-display text-2xl font-normal leading-none stat-number">
                            {stat}
                        </p>
                        <p className="text-[#A0978D] text-xs mt-1">{statLabel}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[#F7F3ED] text-sm font-semibold">{title}</p>
                        <p className="text-[#78706A] text-xs mt-0.5">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#C4A882] ml-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </Link>
    );
}

// ─── Simple stat strip ───────────────────────────────────────────────────────
function StatStrip({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col gap-1 px-5 py-4 bg-[#1C1917]/5 rounded-xl">
            <p className="font-display text-3xl text-[#1C1917] stat-number leading-none">{value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78706A]">{label}</p>
        </div>
    );
}

// ─── Quick action pill — like "Get started now →" in Radiant ─────────────────
function QuickAction({ label, href, icon: Icon }: { label: string; href: string; icon: any }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 pl-4 pr-3 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition-all duration-200"
        >
            {label}
            <span className="w-6 h-6 rounded-full bg-[#F7F3ED]/10 flex items-center justify-center">
                <Icon className="w-3 h-3 text-[#C4A882]" />
            </span>
        </Link>
    );
}

// ─── Role Dashboards ─────────────────────────────────────────────────────────
function AdminDashboard({ s }: { s: Record<string, any> }) {
    return (
        <>
            {/* Image module cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <ModuleCard
                    title="Clinical"
                    stat={s.appointments_today ?? 0}
                    statLabel="appointments today"
                    href="/clinical"
                    image="/card-clinical.jpg"
                    description="Appointments · Sessions"
                />
                <ModuleCard
                    title="Patients"
                    stat={s.total_patients ?? 0}
                    statLabel="total registered"
                    href="/patients"
                    image="/card-patients.jpg"
                    description="Records · History"
                />
                <ModuleCard
                    title="Finance"
                    stat={`৳${(s.revenue_this_month ?? 0).toLocaleString()}`}
                    statLabel="revenue this month"
                    href="/finance"
                    image="/card-finance.jpg"
                    description="Billing · Accounting"
                />
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatStrip label="Waiting Now" value={s.patients_waiting ?? 0} />
                <StatStrip label="Consultations Today" value={s.consultations_today ?? 0} />
                <StatStrip label="Sessions Today" value={s.sessions_today ?? 0} />
                <StatStrip label="Unpaid Invoices" value={s.unpaid_invoices ?? 0} />
            </div>

            {/* Low stock alert */}
            {s.low_stock_items > 0 && (
                <div className="flex items-center justify-between bg-[#F7F3ED] border border-[#D9D0C5] rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-[#C4705A] shrink-0" />
                        <span className="text-sm font-semibold text-[#1C1917]">{s.low_stock_items} inventory items running low</span>
                    </div>
                    <Link href="/inventory/stock" className="text-sm font-semibold text-[#C4A882] hover:text-[#1C1917] flex items-center gap-1 transition">
                        Review <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}

            {/* Quick actions */}
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2.5">
                    <QuickAction label="New Appointment" href="/appointments/new" icon={Calendar} />
                    <QuickAction label="Register Patient" href="/patients/new" icon={UserPlus} />
                    <QuickAction label="View Billing" href="/billing" icon={FileText} />
                    <QuickAction label="Accounting" href="/accounting/chart" icon={BookOpen} />
                </div>
            </div>
        </>
    );
}

function FrontDeskDashboard({ s }: { s: Record<string, any> }) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ModuleCard title="Clinical" stat={s.appointments_today ?? 0} statLabel="appointments today" href="/clinical" image="/card-clinical.jpg" description="Appointments · Sessions" />
                <ModuleCard title="Patients" stat={s.total_patients ?? 0} statLabel="registered patients" href="/patients" image="/card-patients.jpg" description="Records · History" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatStrip label="Waiting" value={s.patients_waiting ?? 0} />
                <StatStrip label="Sessions Today" value={s.sessions_today ?? 0} />
                <StatStrip label="New Today" value={s.new_patients_today ?? 0} />
                <StatStrip label="Unpaid Invoices" value={s.unpaid_invoices ?? 0} />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2.5">
                    <QuickAction label="New Appointment" href="/appointments/new" icon={Calendar} />
                    <QuickAction label="Register Patient" href="/patients/new" icon={UserPlus} />
                    <QuickAction label="Point of Sale" href="/pos" icon={ShoppingCart} />
                    <QuickAction label="View Billing" href="/billing" icon={FileText} />
                </div>
            </div>
        </>
    );
}

function ConsultantDashboard({ s }: { s: Record<string, any> }) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ModuleCard title="Appointments" stat={s.appointments_today ?? 0} statLabel="today's schedule" href="/appointments" image="/card-clinical.jpg" description="View your queue" />
                <ModuleCard title="Patients" stat={s.consultations_today ?? 0} statLabel="consultations today" href="/consultations" image="/card-patients.jpg" description="Clinical notes" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatStrip label="Ready for Consult" value={s.patients_waiting ?? 0} />
                <StatStrip label="Chart Drafts" value={s.pending_chart_notes ?? 0} />
                <StatStrip label="This Month" value={s.consultations_this_month ?? 0} />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2.5">
                    <QuickAction label="Start Consultation" href="/consultations" icon={Stethoscope} />
                    <QuickAction label="Today's Schedule" href="/appointments" icon={Calendar} />
                    <QuickAction label="Patient Records" href="/patients" icon={Users} />
                </div>
            </div>
        </>
    );
}

function TherapistDashboard({ s }: { s: Record<string, any> }) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ModuleCard title="Sessions" stat={s.sessions_today ?? 0} statLabel="sessions today" href="/sessions" image="/card-clinical.jpg" description="Your treatment queue" />
                <ModuleCard title="Inventory" stat={s.total_products ?? 0} statLabel="products stocked" href="/store" image="/card-inventory.jpg" description="Skincare · Products" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatStrip label="In Progress" value={s.sessions_in_progress ?? 0} />
                <StatStrip label="Completed" value={s.sessions_completed_today ?? 0} />
                <StatStrip label="Pending" value={s.sessions_pending ?? 0} />
                <StatStrip label="This Month" value={s.sessions_this_month ?? 0} />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2.5">
                    <QuickAction label="Session Queue" href="/sessions" icon={Activity} />
                    <QuickAction label="Patient Records" href="/patients" icon={Users} />
                </div>
            </div>
        </>
    );
}

function StoreDashboard({ s }: { s: Record<string, any> }) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ModuleCard title="Inventory" stat={s.total_products ?? 0} statLabel="products in catalog" href="/store" image="/card-inventory.jpg" description="Catalog · Stock · POs" />
                <ModuleCard title="Finance" stat={`৳${(s.revenue_today ?? 0).toLocaleString()}`} statLabel="revenue today" href="/finance" image="/card-finance.jpg" description="Billing · Reports" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatStrip label="Low Stock" value={s.low_stock_items ?? 0} />
                <StatStrip label="Pending POs" value={s.pending_purchase_orders ?? 0} />
                <StatStrip label="This Month" value={`৳${(s.revenue_this_month ?? 0).toLocaleString()}`} />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2.5">
                    <QuickAction label="Stock Levels" href="/inventory/stock" icon={Package} />
                    <QuickAction label="Purchase Orders" href="/inventory/purchase-orders" icon={ClipboardList} />
                    <QuickAction label="Receive Goods" href="/inventory/grn" icon={CheckCircle} />
                </div>
            </div>
        </>
    );
}

function AccountantDashboard({ s }: { s: Record<string, any> }) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ModuleCard title="Finance" stat={`৳${(s.revenue_this_month ?? 0).toLocaleString()}`} statLabel="revenue this month" href="/finance" image="/card-finance.jpg" description="Billing · Accounting" />
                <ModuleCard title="Billing" stat={s.unpaid_invoices ?? 0} statLabel="unpaid invoices" href="/billing" image="/card-patients.jpg" description="Collections · AR" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatStrip label="Revenue Today" value={`৳${(s.revenue_today ?? 0).toLocaleString()}`} />
                <StatStrip label="AR Outstanding" value={`৳${(s.total_ar ?? 0).toLocaleString()}`} />
                <StatStrip label="Journal Entries" value={s.journal_entries_this_month ?? 0} />
                <StatStrip label="Unpaid This Month" value={s.unpaid_invoices ?? 0} />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2.5">
                    <QuickAction label="Unpaid Invoices" href="/billing" icon={FileText} />
                    <QuickAction label="Journal Entries" href="/accounting/journals" icon={BookOpen} />
                    <QuickAction label="Banking" href="/accounting/banking" icon={DollarSign} />
                    <QuickAction label="Reports" href="/accounting/reports" icon={BarChart3} />
                </div>
            </div>
        </>
    );
}

// ─── Dashboard Switcher ──────────────────────────────────────────────────────
function resolveRoleDashboard(roleName: string): React.FC<{ s: any }> {
    const n = roleName.toLowerCase();
    if (n.includes('front') || n.includes('desk') || n.includes('reception')) return FrontDeskDashboard;
    if (n.includes('consult') || n.includes('doctor') || n.includes('physician')) return ConsultantDashboard;
    if (n.includes('therapist') || n.includes('therapy') || n.includes('aesthetician')) return TherapistDashboard;
    if (n.includes('store') || n.includes('inventory') || n.includes('pharmacist')) return StoreDashboard;
    if (n.includes('account') || n.includes('finance') || n.includes('book')) return AccountantDashboard;
    return AdminDashboard;
}

export function RoleDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);
    const roleName = user?.role?.name || 'Admin';

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';
    const firstName = user?.name?.split(' ')[0] || 'there';

    useEffect(() => {
        fetchApi<{ role: string; stats: Record<string, any> }>('core/dashboard/role-stats/')
            .then(res => setStats(res.stats))
            .catch(() => setStats({}))
            .finally(() => setLoading(false));
    }, []);

    const Dashboard = resolveRoleDashboard(roleName);

    return (
        <div className="space-y-8">
            {/* Editorial header — DM Serif Display for the name */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm text-[#A0978D] font-semibold tracking-wide mb-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <h1 className="font-display text-5xl text-[#1C1917] leading-[1.05] tracking-tight">
                        {greeting}<br />
                        <span className="italic">{firstName}</span>
                    </h1>
                    <p className="text-[#A0978D] text-sm mt-2">{roleName}</p>
                </div>
                {/* Decorative geometric mark — echoes the Radiant logo star */}
                <div className="hidden lg:block opacity-20">
                    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
                        <path d="M40 5L75 40L40 75L5 40L40 5Z" stroke="#1C1917" strokeWidth="1.5" />
                        <path d="M40 20L60 40L40 60L20 40L40 20Z" stroke="#1C1917" strokeWidth="1.5" />
                        <circle cx="40" cy="40" r="4" fill="#1C1917" />
                    </svg>
                </div>
            </div>

            {/* Dashboard content */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-[#C4A882]" />
                        <p className="text-xs font-semibold text-[#A0978D] tracking-widest uppercase">Loading</p>
                    </div>
                </div>
            ) : (
                <Dashboard s={stats || {}} />
            )}
        </div>
    );
}
