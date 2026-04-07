import { notFound } from 'next/navigation';
import { PatientForm } from '@/components/patients/PatientForm';
import { patientsApi } from '@/lib/services/patients';

export const dynamic = 'force-dynamic';

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    let patient;
    try {
        patient = await patientsApi.get(resolvedParams.id);
    } catch (error) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Edit Patient Profile</h2>
                <p className="text-muted-foreground">Updating records for {patient.first_name} {patient.last_name}</p>
            </div>

            <PatientForm initialData={patient} />
        </div>
    );
}
