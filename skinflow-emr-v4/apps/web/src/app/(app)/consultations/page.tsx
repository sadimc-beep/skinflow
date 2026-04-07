import { ConsultationsListClient } from '@/components/consultations/ConsultationsListClient';
import { clinicalApi } from '@/lib/services/clinical';
import type { Consultation } from '@/types/models';

export const dynamic = 'force-dynamic';

export default async function ConsultationsPage() {
    let consultations: Consultation[] = [];

    try {
        const res = await clinicalApi.consultations.list({ limit: 50 });
        consultations = res.results || [];
    } catch (error) {
        console.error('Failed to fetch consultations:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Consultations</h2>
                    <p className="text-[#78706A] hidden sm:block text-sm mt-1">Clinical encounters and patient history.</p>
                </div>
                <a href="/consultations/new" className="inline-flex items-center gap-2 pl-4 pr-3 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition-all duration-200">
                    + New Walk-in
                    <span className="w-6 h-6 rounded-full bg-[#F7F3ED]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#C4A882]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
                </a>
            </div>

            <ConsultationsListClient initialData={consultations} />
        </div>
    )
}
