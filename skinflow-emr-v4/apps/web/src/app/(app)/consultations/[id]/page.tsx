import { notFound } from 'next/navigation';
import { ConsultationEditorClient } from '@/components/consultations/ConsultationEditorClient';
import { clinicalApi } from '@/lib/services/clinical';

export const dynamic = 'force-dynamic';

export default async function ConsultationEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    let consultation;
    let intake;

    try {
        consultation = await clinicalApi.consultations.get(resolvedParams.id);

        // Attempt to fetch vitals if tied to an appointment
        if (consultation.appointment) {
            const intakes = await clinicalApi.intake.getByAppointment(consultation.appointment);
            if (intakes && intakes.length > 0) {
                intake = intakes[0];
            }
        }
    } catch (error) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Encounter Details</h2>
            </div>

            <ConsultationEditorClient consultation={consultation} intake={intake} />
        </div>
    );
}
