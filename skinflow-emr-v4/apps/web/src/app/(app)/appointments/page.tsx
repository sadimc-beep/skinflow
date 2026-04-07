import { format } from 'date-fns';
import { AppointmentsListClient } from '@/components/appointments/AppointmentsListClient';
import { appointmentsApi } from '@/lib/services/appointments';
import type { Appointment } from '@/types/models';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
    let appointments: Appointment[] = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
        const res = await appointmentsApi.list({ date: todayStr });
        appointments = res.results || [];
    } catch (error) {
        console.error('Failed to fetch appointments:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Appointments</h2>
                <p className="text-muted-foreground hidden sm:block">Manage today's schedule and clinical queue.</p>
            </div>

            <AppointmentsListClient initialData={appointments} />
        </div>
    )
}
