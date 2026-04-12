import { AppointmentForm } from '@/components/appointments/AppointmentForm';

export default function NewAppointmentPage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Book Appointment</h2>
                <p className="text-muted-foreground">Schedule a new visit for an existing patient.</p>
            </div>
            <AppointmentForm />
        </div>
    );
}
