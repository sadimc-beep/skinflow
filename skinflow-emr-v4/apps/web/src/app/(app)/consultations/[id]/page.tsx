'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConsultationEditorClient } from '@/components/consultations/ConsultationEditorClient';
import { clinicalApi } from '@/lib/services/clinical';
import type { Consultation, ClinicalIntake } from '@/types/models';

export default function ConsultationEditorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [intake, setIntake] = useState<ClinicalIntake | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        clinicalApi.consultations.get(id)
            .then(async (data) => {
                setConsultation(data);
                if (data.appointment) {
                    try {
                        const intakes = await clinicalApi.intake.getByAppointment(data.appointment);
                        if (intakes?.length > 0) setIntake(intakes[0]);
                    } catch {
                        // non-fatal — intake section will just be empty
                    }
                }
            })
            .catch(() => router.replace('/consultations'))
            .finally(() => setIsLoading(false));
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                Loading consultation…
            </div>
        );
    }

    if (!consultation) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Encounter Details</h2>
            </div>

            <ConsultationEditorClient consultation={consultation} intake={intake} />
        </div>
    );
}
