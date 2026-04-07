import Link from 'next/link';
import Image from 'next/image';
import { billingApi } from '@/lib/services/billing';
import { ArrowRight, Receipt } from 'lucide-react';

export const dynamic = 'force-dynamic';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n);

export default async function FinanceDashboardPage() {
    let invoices: any[] = [];
    try { const r = await billingApi.invoices.list({ limit: 200 }); invoices = r.results || []; } catch { }

    const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + parseFloat(i.total || '0'), 0);
    const outstanding = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s, i) => s + parseFloat(i.balance_due || '0'), 0);
    const unpaidCount = invoices.filter(i => i.status === 'UNPAID').length;
    const partialCount = invoices.filter(i => i.status === 'PARTIALLY_PAID').length;
    const paidCount = invoices.filter(i => i.status === 'PAID').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm text-[#A0978D] font-semibold tracking-wide mb-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h1 className="font-display text-4xl text-[#1C1917] leading-tight tracking-tight">Finance</h1>
                    <p className="text-[#A0978D] text-sm mt-1">Revenue, billing, and accounting</p>
                </div>
                <Link
                    href="/billing"
                    className="inline-flex items-center gap-2 pl-5 pr-4 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition-all duration-200"
                >
                    <Receipt className="h-4 w-4" />
                    All Invoices
                    <span className="w-6 h-6 rounded-full bg-[#F7F3ED]/10 flex items-center justify-center ml-1">
                        <ArrowRight className="w-3 h-3 text-[#C4A882]" />
                    </span>
                </Link>
            </div>

            {/* Image module cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <ModuleImageCard
                    title="Revenue Reports"
                    stat={formatCurrency(totalRevenue)}
                    statLabel="total collected"
                    description={`${paidCount} paid invoices`}
                    href="/accounting/reports"
                    image="/card-finance.jpg"
                />
                <ModuleImageCard
                    title="Patient Billing"
                    stat={formatCurrency(outstanding)}
                    statLabel="balance due"
                    description={`${unpaidCount} unpaid · ${partialCount} partial`}
                    href="/billing"
                    image="/card-patients.jpg"
                />
                <ModuleImageCard
                    title="Banking & Recon"
                    stat="Cash & Bank"
                    statLabel="manage accounts"
                    description="Reconcile daily transactions"
                    href="/accounting/banking"
                    image="/card-inventory.jpg"
                />
            </div>

            {/* Secondary stat strips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatStrip label="Paid Invoices" value={paidCount} />
                <StatStrip label="Unpaid" value={unpaidCount} />
                <StatStrip label="Partial" value={partialCount} />
                <StatStrip label="Total" value={invoices.length} />
            </div>

            {/* Nav section — plain warm cards, no icon bubbles */}
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Navigate</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: 'Billing & Invoices', desc: 'Create and track patient invoices', href: '/billing' },
                        { title: 'Chart of Accounts', desc: 'Account structure and GL mapping', href: '/accounting/chart' },
                        { title: 'Journal Entries', desc: 'View and manage journal entries', href: '/accounting/journals' },
                        { title: 'Banking', desc: 'Bank accounts and reconciliation', href: '/accounting/banking' },
                        { title: 'Reports', desc: 'Financial summaries and P&L', href: '/accounting/reports' },
                    ].map(card => (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group flex items-center justify-between bg-[#F7F3ED] border border-[#E8E1D6] hover:border-[#D9D0C5] hover:bg-[#EDE7DC] rounded-2xl px-5 py-4 transition-all duration-200"
                        >
                            <div>
                                <p className="font-semibold text-[#1C1917] text-sm">{card.title}</p>
                                <p className="text-xs text-[#A0978D] mt-0.5">{card.desc}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-[#C4A882] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ModuleImageCard({ title, stat, statLabel, description, href, image }: {
    title: string; stat: string | number; statLabel: string; description: string; href: string; image: string;
}) {
    return (
        <Link href={href} className="group block relative overflow-hidden rounded-2xl" style={{ paddingBottom: '55%' }}>
            <Image src={image} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="50vw" />
            <div className="absolute inset-0 card-scrim" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="bg-[#1C1917] rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                    <div>
                        <p className="text-[#F7F3ED] font-display text-xl font-normal leading-none stat-number">{stat}</p>
                        <p className="text-[#A0978D] text-xs mt-1">{statLabel}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[#F7F3ED] text-sm font-semibold">{title}</p>
                        <p className="text-[#78706A] text-xs mt-0.5">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#C4A882] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </Link>
    );
}

function StatStrip({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col gap-1 px-5 py-4 bg-[#1C1917]/5 rounded-xl">
            <p className="font-display text-3xl text-[#1C1917] stat-number leading-none">{value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78706A]">{label}</p>
        </div>
    );
}
