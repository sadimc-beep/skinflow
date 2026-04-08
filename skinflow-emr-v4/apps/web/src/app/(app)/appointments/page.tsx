import { AppointmentsListClient } from '@/components/appointments/AppointmentsListClient';

export default function AppointmentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Appointments</h2>
                <p className="text-muted-foreground hidden sm:block">Manage today's schedule and clinical queue.</p>
            </div>

            <AppointmentsListClient initialData={[]} />
        </div>
    )
}
