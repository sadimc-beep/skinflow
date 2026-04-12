'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { appointmentsApi } from '@/lib/services/appointments';
import { ArrivedModal } from '@/components/appointments/ArrivedModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Loader2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Appointment } from '@/types/models';

const STATUS_LABELS: Record<string, string> = {
    SCHEDULED: 'Scheduled', ARRIVED: 'Arrived', READY_FOR_CONSULT: 'Ready for Consult',
    IN_CONSULTATION: 'In Consultation', COMPLETED: 'Completed',
    CANCELLED: 'Cancelled', NO_SHOW: 'No Show',
};

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        SCHEDULED: 'bg-blue-100 text-blue-800',
        ARRIVED: 'bg-yellow-100 text-yellow-800',
        READY_FOR_CONSULT: 'bg-purple-100 text-purple-800',
        IN_CONSULTATION: 'bg-indigo-100 text-indigo-800',
        COMPLETED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-red-100 text-red-800',
        NO_SHOW: 'bg-gray-100 text-gray-600',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

export default function AppointmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [appt, setAppt] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showArrivedModal, setShowArrivedModal] = useState(false);

    useEffect(() => {
        appointmentsApi.get(id)
            .then(setAppt)
            .catch(() => router.replace('/appointments'))
            .finally(() => setIsLoading(false));
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleArrivedSuccess = async (apptId: number, fee: number) => {
        try {
            const res = await appointmentsApi.checkIn(apptId, fee);
            setAppt(prev => prev ? { ...prev, status: 'ARRIVED' } : prev);
            setShowArrivedModal(false);
            toast.success('Patient marked as arrived');
            if (res.invoice_id) router.push(`/billing/${res.invoice_id}`);
        } catch (e: any) {
            toast.error(e.message || 'Failed to mark arrived');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#A0978D]" />
            </div>
        );
    }

    if (!appt) return null;

    const patientName = `${appt.patient_details?.first_name ?? ''} ${appt.patient_details?.last_name ?? ''}`.trim() || '—';

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/appointments" className="hover:text-primary transition-colors">Appointments</Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-foreground font-medium">Appointment #{appt.id}</span>
            </div>

            {/* Title row */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">{patientName}</h2>
                    <p className="text-muted-foreground mt-1">
                        {format(parseISO(appt.date_time), 'EEEE, MMMM d yyyy · h:mm a')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={appt.status} />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/appointments/${appt.id}/edit`)}
                    >
                        <Pencil className="h-4 w-4 mr-1.5" /> Edit
                    </Button>
                </div>
            </div>

            {/* Details card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-0.5">Patient</p>
                        <p className="font-semibold text-[#1C1917]">{patientName}</p>
                        {appt.patient_details?.phone_primary && (
                            <p className="text-[#A0978D] text-xs">{appt.patient_details.phone_primary}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-0.5">Provider</p>
                        <p className="font-semibold text-[#1C1917]">
                            {appt.provider_details
                                ? `Dr. ${(appt.provider_details as any).name ?? '—'}`
                                : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-0.5">Date & Time</p>
                        <p className="font-semibold text-[#1C1917]">
                            {format(parseISO(appt.date_time), 'MMM d, yyyy')}
                        </p>
                        <p className="text-[#A0978D] text-xs">
                            {format(parseISO(appt.date_time), 'h:mm a')}
                            {appt.end_time ? ` – ${format(parseISO(appt.end_time), 'h:mm a')}` : ''}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-0.5">Status</p>
                        <StatusBadge status={appt.status} />
                    </div>
                    {appt.notes && (
                        <div className="col-span-2">
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-0.5">Notes</p>
                            <p className="text-[#1C1917]">{appt.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
                {appt.status === 'SCHEDULED' && (
                    <Button onClick={() => setShowArrivedModal(true)}>
                        Mark as Arrived
                    </Button>
                )}
                <Button variant="outline" onClick={() => router.push('/appointments')}>
                    Back to Calendar
                </Button>
            </div>

            <ArrivedModal
                appointmentId={showArrivedModal ? appt.id : null}
                open={showArrivedModal}
                onClose={() => setShowArrivedModal(false)}
                onSuccess={handleArrivedSuccess}
            />
        </div>
    );
}
