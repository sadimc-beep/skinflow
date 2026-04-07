import { notFound } from 'next/navigation';
import Link from 'next/link';
import { patientsApi } from '@/lib/services/patients';
import { appointmentsApi } from '@/lib/services/appointments';
import { clinicalApi } from '@/lib/services/clinical';
import { billingApi } from '@/lib/services/billing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Edit, Phone, Activity, Calendar, Stethoscope,
    Receipt, PieChartIcon, User
} from 'lucide-react';
import { PatientEntitlements } from '@/components/patients/PatientEntitlements';
import { PatientStatsBar } from '@/components/patients/PatientStatsBar';
import { AppointmentsListClient } from '@/components/appointments/AppointmentsListClient';
import { ConsultationsListClient } from '@/components/consultations/ConsultationsListClient';
import { InvoicesListClient } from '@/components/billing/InvoicesListClient';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const patientId = parseInt(resolvedParams.id);

    let patient;
    try {
        patient = await patientsApi.get(resolvedParams.id);
    } catch {
        notFound();
    }

    // Fetch per-patient data in parallel for the tabs
    const [appointmentsRes, consultationsRes, invoicesRes] = await Promise.allSettled([
        appointmentsApi.list({ patient: patientId } as any),
        clinicalApi.consultations.list({ patient: patientId }),
        billingApi.invoices.list({ patient: patientId }),
    ]);

    const appointments = appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value.results || []) : [];
    const consultations = consultationsRes.status === 'fulfilled' ? (consultationsRes.value.results || []) : [];
    const invoices = invoicesRes.status === 'fulfilled' ? (invoicesRes.value.results || []) : [];

    // Derive stats
    const outstandingBalance = invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || '0'), 0);
    const lifetimeSpend = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const lastVisitDate = appointments.length > 0
        ? appointments.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())[0]?.date_time ?? null
        : null;

    const stats = {
        totalAppointments: appointments.length,
        outstandingBalance,
        lifetimeSpend,
        lastVisitDate,
    };

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-5">
                    <div className="flex-shrink-0 h-24 w-24 rounded-full bg-[#E8E1D6] flex items-center justify-center border-4 border-white shadow-sm overflow-hidden text-[#A0978D]">
                        {/* Provision for actual patient photo */}
                        <User className="h-10 w-10 text-[#78706A]" />
                    </div>
                    <div>
                        <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">
                            {patient.first_name} {patient.last_name}
                        </h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3.5 w-3.5" />
                            {patient.phone_primary}
                            <span className="text-slate-300 mx-1">·</span>
                            ID #{patient.id}
                        </p>
                    </div>
                </div>
                <Button asChild className="h-12 rounded-xl text-base font-bold bg-[#1C1917] hover:bg-[#3E3832] text-white">
                    <Link href={`/patients/${patient.id}/edit`}>
                        <Edit className="mr-2 h-5 w-5" />
                        Edit Profile
                    </Link>
                </Button>
            </div>

            {/* ── KPI Stats Bar ── */}
            <PatientStatsBar stats={stats} />

            {/* ── 360° Tabbed Card ── */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="h-12 rounded-full bg-[#E8E1D6] p-1 gap-1 w-full sm:w-auto grid grid-cols-5 sm:flex">
                    <TabsTrigger value="overview" className="rounded-full text-xs sm:text-sm px-4">
                        <User className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline font-bold">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="rounded-full text-xs sm:text-sm px-4">
                        <Calendar className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline font-bold">Appointments</span>
                        {appointments.length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-white text-[#1C1917]">{appointments.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="consultations" className="rounded-full text-xs sm:text-sm px-4">
                        <Stethoscope className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline font-bold">Consults</span>
                        {consultations.length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-white text-[#1C1917]">{consultations.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="rounded-full text-xs sm:text-sm px-4">
                        <Receipt className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline font-bold">Invoices</span>
                        {invoices.length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-white text-[#1C1917]">{invoices.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="packages" className="rounded-full text-xs sm:text-sm px-4">
                        <PieChartIcon className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline font-bold">Packages</span>
                    </TabsTrigger>
                </TabsList>

                {/* ── OVERVIEW TAB ── */}
                <TabsContent value="overview" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="font-display text-2xl text-[#1C1917] tracking-tight">Demographics</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-[#F7F3ED] rounded-xl p-5 border border-[#E8E1D6] shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[#A0978D] mb-1">Gender</p>
                                    <p className="text-lg font-bold text-[#1C1917] capitalize">{patient.gender?.toLowerCase() || '—'}</p>
                                </div>
                                <div className="bg-[#F7F3ED] rounded-xl p-5 border border-[#E8E1D6] shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[#A0978D] mb-1">Date of Birth</p>
                                    <p className="text-lg font-bold text-[#1C1917]">{patient.date_of_birth || '—'}</p>
                                </div>
                                <div className="bg-[#F7F3ED] rounded-xl p-5 border border-[#E8E1D6] shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[#A0978D] mb-1">Primary Phone</p>
                                    <p className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-[#C4A882]" />
                                        {patient.phone_primary}
                                    </p>
                                </div>
                                <div className="bg-[#F7F3ED] rounded-xl p-5 border border-[#E8E1D6] shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[#A0978D] mb-1">Email</p>
                                    <p className="text-lg font-bold text-[#1C1917] truncate">{patient.email || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-display text-2xl text-[#1C1917] tracking-tight flex items-center gap-2">
                                <Activity className="h-5 w-5 text-[#C4A882]" />
                                Medical Profile
                            </h3>
                            <div className="bg-[#1C1917] rounded-xl p-6 border border-[#3E3832] text-white shadow-md">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#78706A] mb-4">Conditions & Allergies</p>
                                <div className="flex flex-col gap-3">
                                    {patient.has_chronic_conditions ? (
                                        <div className="flex items-center gap-3 text-[#C4705A] font-bold bg-[#C4705A]/10 px-4 py-2.5 rounded-lg border border-[#C4705A]/20">
                                            <span>⚠</span> Chronic Conditions
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-[#7A9E8A] font-medium bg-[#7A9E8A]/10 px-4 py-2.5 rounded-lg border border-[#7A9E8A]/20">
                                            <span>✓</span> No Chronic Conditions
                                        </div>
                                    )}
                                    {patient.has_known_allergies ? (
                                        <div className="flex items-center gap-3 text-[#C4A882] font-bold bg-[#C4A882]/10 px-4 py-2.5 rounded-lg border border-[#C4A882]/20">
                                            <span>⚠</span> Known Allergies
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-[#7A9E8A] font-medium bg-[#7A9E8A]/10 px-4 py-2.5 rounded-lg border border-[#7A9E8A]/20">
                                            <span>✓</span> No Known Allergies
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-5 border-t border-[#3E3832]">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[#78706A] mb-1">Blood Group</p>
                                    <p className="text-3xl font-display text-[#F7F3ED]">{patient.blood_group === 'UNKNOWN' ? '—' : patient.blood_group}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ── APPOINTMENTS TAB ── */}
                <TabsContent value="appointments" className="mt-6">
                    <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                All Appointments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AppointmentsListClient initialData={appointments} patientView />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── CONSULTATIONS TAB ── */}
                <TabsContent value="consultations" className="mt-6">
                    <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Stethoscope className="h-5 w-5" />
                                Consultation History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ConsultationsListClient initialData={consultations} patientView />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── INVOICES TAB ── */}
                <TabsContent value="invoices" className="mt-6">
                    <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Invoice Ledger
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InvoicesListClient initialData={invoices} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── PACKAGES TAB ── */}
                <TabsContent value="packages" className="mt-6">
                    <PatientEntitlements patientId={patient.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
