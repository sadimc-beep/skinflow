import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { coreApi } from '@/lib/services/appointments';
import { patientsApi } from '@/lib/services/patients';
import type { Provider, Patient } from '@/types/models';

export const dynamic = 'force-dynamic';

export default async function NewAppointmentPage() {
    let providers: Provider[] = [];
    let patients: Patient[] = [];

    try {
        const [provRes, patRes] = await Promise.all([
            coreApi.providers.list({ is_active: true }),
            patientsApi.list({ limit: 100 }) // In real app, we'd use async select instead of passing full list
        ]);
        providers = provRes.results || [];
        patients = patRes.results || [];
    } catch (error) {
        console.error("Failed to load appointment dependencies:", error);
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Book Appointment</h2>
                <p className="text-muted-foreground">Schedule a new visit for an existing patient.</p>
            </div>

            <AppointmentForm providers={providers} patients={patients} />
        </div>
    )
}
