import { PatientsListClient } from '@/components/patients/PatientsListClient';
import { patientsApi } from '@/lib/services/patients';
import type { Patient } from '@/types/models';

// Force dynamic to always fetch the latest patients from backend instead of statically compiling
export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
    let patients: Patient[] = [];
    try {
        const response = await patientsApi.list({ limit: 50 });
        patients = response.results || [];
    } catch (error) {
        console.error('Failed to fetch patients:', error);
        // Graceful degrade to empty list on network failure
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Patients</h2>
                <p className="text-muted-foreground">Manage your clinic's patient records and medical history.</p>
            </div>

            <PatientsListClient initialPatients={patients} />
        </div>
    );
}
