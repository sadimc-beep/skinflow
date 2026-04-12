'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { appointmentsApi } from '@/lib/services/appointments';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Appointment } from '@/types/models';

export default function EditAppointmentPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        appointmentsApi.get(id)
            .then(setAppointment)
            .catch(() => router.replace('/appointments'))
            .finally(() => setIsLoading(false));
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#A0978D]" />
            </div>
        );
    }

    if (!appointment) return null;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/appointments" className="hover:text-primary transition-colors">Appointments</Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <Link href={`/appointments/${id}`} className="hover:text-primary transition-colors">
                    Appointment #{id}
                </Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-foreground font-medium">Edit</span>
            </div>

            <div>
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Edit Appointment</h2>
                <p className="text-muted-foreground">Update the details for this appointment.</p>
            </div>

            <AppointmentForm appointment={appointment} />
        </div>
    );
}
