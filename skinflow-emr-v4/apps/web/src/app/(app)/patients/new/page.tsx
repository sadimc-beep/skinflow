import { PatientForm } from '@/components/patients/PatientForm';

export default function NewPatientPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Add New Patient</h2>
                <p className="text-muted-foreground">Enter the patient's demographics and contact information.</p>
            </div>

            <PatientForm />
        </div>
    );
}
