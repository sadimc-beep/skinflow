import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { appointmentsApi } from '@/lib/services/appointments';
import { clinicalApi } from '@/lib/services/clinical';
import { Plus, ArrowRight, Clock, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClinicalDashboardPage() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

    let appointmentsToday = 0;
    let consultationsToday: any[] = [];
    let sessionsToday: any[] = [];

    try { const r = await appointmentsApi.list({ date: todayStr }); appointmentsToday = r.count ?? (r.results?.length ?? 0); } catch { }
    try { const r = await clinicalApi.consultations.list({ limit: 100 }); consultationsToday = r.results || []; } catch { }
    try { const r = await clinicalApi.sessions.list({ date: todayStr }); sessionsToday = r.results || []; } catch { }

    const finalized = consultationsToday.filter((c: any) => c.status === 'FINALIZED').length;
    const drafts = consultationsToday.filter((c: any) => c.status === 'DRAFT').length;
    const completedSessions = sessionsToday.filter((s: any) => s.status === 'COMPLETED').length;
    const plannedSessions = sessionsToday.filter((s: any) => s.status === 'PLANNED').length;
    const inProgressSessions = sessionsToday.filter((s: any) => s.status === 'STARTED').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm text-[#A0978D] font-semibold tracking-wide mb-1">{todayFormatted}</p>
                    <h1 className="font-display text-4xl text-[#1C1917] leading-tight tracking-tight">Clinical</h1>
                    <p className="text-[#A0978D] text-sm mt-1">Appointments, consultations & treatment sessions</p>
                </div>
                <Link
                    href="/appointments/new"
                    className="inline-flex items-center gap-2 pl-5 pr-4 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition-all duration-200"
                >
                    <Plus className="h-4 w-4" />
                    Book Appointment
                    <span className="w-6 h-6 rounded-full bg-[#F7F3ED]/10 flex items-center justify-center ml-1">
                        <ArrowRight className="w-3 w-3 text-[#C4A882]" />
                    </span>
                </Link>
            </div>

            {/* Image module cards — same pattern as main dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <ModuleImageCard
                    title="Appointments"
                    stat={appointmentsToday}
                    statLabel="today's queue"
                    description="Schedule & manage"
                    href="/appointments"
                    image="/card-clinical.jpg"
                />
                <ModuleImageCard
                    title="Consultations"
                    stat={consultationsToday.length}
                    statLabel="total consultations"
                    description="Clinical notes & Rx"
                    href="/consultations"
                    image="/card-patients.jpg"
                />
                <ModuleImageCard
                    title="Sessions"
                    stat={sessionsToday.length}
                    statLabel="sessions today"
                    description="Procedure charting"
                    href="/sessions"
                    image="/card-inventory.jpg"
                />
            </div>

            {/* Secondary stat strips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatStrip label="Planned" value={plannedSessions} />
                <StatStrip label="In Progress" value={inProgressSessions} />
                <StatStrip label="Completed" value={completedSessions} />
                <StatStrip label="Finalized" value={finalized} />
            </div>

            {/* Status detail panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[#F7F3ED] rounded-2xl border border-[#E8E1D6] p-6">
                    <h3 className="font-semibold text-[#1C1917] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Clock className="h-4 w-4 text-[#C4A882]" /> Today's Session Status
                    </h3>
                    <div className="space-y-3">
                        <StatusRow label="Planned" value={plannedSessions} dot="#D9D0C5" />
                        <StatusRow label="In Progress" value={inProgressSessions} dot="#C4A882" />
                        <StatusRow label="Completed" value={completedSessions} dot="#7A9E8A" />
                    </div>
                </div>

                <div className="bg-[#F7F3ED] rounded-2xl border border-[#E8E1D6] p-6">
                    <h3 className="font-semibold text-[#1C1917] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Users className="h-4 w-4 text-[#C4A882]" /> Consultation Summary
                    </h3>
                    <div className="space-y-3">
                        <StatusRow label="Draft" value={drafts} dot="#C4A882" />
                        <StatusRow label="Finalized" value={finalized} dot="#7A9E8A" />
                        <StatusRow label="Total" value={consultationsToday.length} dot="#A0978D" />
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2.5">
                    <QuickAction label="New Appointment" href="/appointments/new" />
                    <QuickAction label="Walk-in Consultation" href="/consultations" />
                    <QuickAction label="View Sessions" href="/sessions" />
                </div>
            </div>
        </div>
    );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ModuleImageCard({ title, stat, statLabel, description, href, image }: {
    title: string; stat: string | number; statLabel: string; description: string; href: string; image: string;
}) {
    return (
        <Link href={href} className="group block relative overflow-hidden rounded-2xl aspect-[4/5]">
            <Image src={image} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="33vw" />
            <div className="absolute inset-0 card-scrim" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="bg-[#1C1917] rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                    <div>
                        <p className="text-[#F7F3ED] font-display text-2xl font-normal leading-none stat-number">{stat}</p>
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

function StatusRow({ label, value, dot }: { label: string; value: number; dot: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-[#78706A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: dot }} />
                {label}
            </span>
            <span className="font-bold text-[#1C1917]">{value}</span>
        </div>
    );
}

function QuickAction({ label, href }: { label: string; href: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 pl-4 pr-3 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition-all duration-200"
        >
            {label}
            <span className="w-6 h-6 rounded-full bg-[#F7F3ED]/10 flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-[#C4A882]" />
            </span>
        </Link>
    );
}
