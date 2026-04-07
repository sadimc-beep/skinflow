import Link from 'next/link';
import Image from 'next/image';
import { patientsApi } from '@/lib/services/patients';
import { ArrowRight, Phone, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PatientsDashboardPage() {
    let patients: any[] = [];
    try { const r = await patientsApi.list({ limit: 200 }); patients = r.results || []; } catch { }

    const recent = [...patients].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    const maleCount = patients.filter((p: any) => p.gender === 'Male' || p.gender === 'M').length;
    const femaleCount = patients.filter((p: any) => p.gender === 'Female' || p.gender === 'F').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm text-[#A0978D] font-semibold tracking-wide mb-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h1 className="font-display text-4xl text-[#1C1917] leading-tight tracking-tight">Patients</h1>
                    <p className="text-[#A0978D] text-sm mt-1">Patient records and clinical history</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/patients" className="inline-flex items-center gap-2 pl-5 pr-4 py-2.5 bg-[#E8E1D6] hover:bg-[#D9D0C5] text-[#1C1917] rounded-full text-sm font-semibold transition-all duration-200">
                        View All
                        <span className="w-6 h-6 rounded-full bg-[#1C1917]/10 flex items-center justify-center">
                            <ArrowRight className="w-3 h-3 text-[#78706A]" />
                        </span>
                    </Link>
                    <Link href="/patients/new" className="inline-flex items-center gap-2 pl-5 pr-4 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition-all duration-200">
                        <UserPlus className="h-4 w-4" />
                        New Patient
                        <span className="w-6 h-6 rounded-full bg-[#F7F3ED]/10 flex items-center justify-center ml-1">
                            <ArrowRight className="w-3 h-3 text-[#C4A882]" />
                        </span>
                    </Link>
                </div>
            </div>

            {/* Image module cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ModuleImageCard
                    title="All Patients"
                    stat={patients.length}
                    statLabel="registered patients"
                    description="Search & view records"
                    href="/patients"
                    image="/card-patients.jpg"
                />
                <ModuleImageCard
                    title="New Patient"
                    stat="+"
                    statLabel="register patient"
                    description="Create a new profile"
                    href="/patients/new"
                    image="/card-clinical.jpg"
                />
            </div>

            {/* Stat strips */}
            <div className="grid grid-cols-3 gap-4">
                <StatStrip label="Total Patients" value={patients.length} />
                <StatStrip label="Female" value={femaleCount} />
                <StatStrip label="Male" value={maleCount} />
            </div>

            {/* Recently Added */}
            <div className="bg-[#F7F3ED] rounded-2xl border border-[#E8E1D6] p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-[#1C1917] text-sm uppercase tracking-wider">Recently Added</h3>
                    <Link href="/patients" className="text-sm font-semibold text-[#C4A882] hover:text-[#1C1917] flex items-center gap-1 transition">
                        View all <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="space-y-1">
                    {recent.length === 0 && <p className="text-sm text-[#A0978D] text-center py-8">No patients yet.</p>}
                    {recent.map((p: any) => (
                        <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[#EDE7DC] transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#1C1917] flex items-center justify-center text-[#C4A882] text-xs font-bold shrink-0">
                                    {(p.first_name?.[0] || '?')}{(p.last_name?.[0] || '')}
                                </div>
                                <div>
                                    <p className="font-semibold text-[#1C1917] text-sm">{p.first_name} {p.last_name}</p>
                                    <p className="text-xs text-[#A0978D] flex items-center gap-1">
                                        <Phone className="h-3 w-3" />{p.phone_primary || '—'}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-[#D9D0C5] group-hover:text-[#C4A882] transition-colors" />
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
