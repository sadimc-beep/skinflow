import { PatientsListClient } from '@/components/patients/PatientsListClient';

export default function PatientsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Patients</h2>
                <p className="text-muted-foreground">Manage your clinic's patient records and medical history.</p>
            </div>

            <PatientsListClient />
        </div>
    );
}
