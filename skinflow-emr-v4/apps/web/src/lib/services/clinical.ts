import { fetchApi, resolveMediaUrl } from '../api';

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || 'http://127.0.0.1:8000';

async function downloadPdfBlob(endpoint: string, filename: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('skinflow_access_token') : null;
    const headers: Record<string, string> = { Accept: 'application/pdf' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${DJANGO_BASE_URL}/api/${endpoint}`, { headers });
    if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
import type {
    Consultation, ConsultationFormData,
    ClinicalIntake, Prescription, PrescriptionProcedure,
    PrescriptionProduct, PrescriptionMedication, PaginatedResponse,
    ProcedureSession
} from '@/types/models';

export const clinicalApi = {
    consultations: {
        list: (params?: { patient?: number; provider?: number; status?: string; limit?: number }) =>
            fetchApi<PaginatedResponse<Consultation>>('clinical/consultations', { params }),

        get: (id: number | string) =>
            fetchApi<Consultation>(`clinical/consultations/${id}`),

        create: (data: ConsultationFormData) =>
            fetchApi<Consultation>('clinical/consultations', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        update: (id: number | string, data: ConsultationFormData) =>
            fetchApi<Consultation>(`clinical/consultations/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),

        finalize: (id: number | string) =>
            fetchApi<{ status: string }>(`clinical/consultations/${id}/finalize`, {
                method: 'POST',
            }),

        downloadPdf: (id: number | string) =>
            downloadPdfBlob(`clinical/consultations/${id}/pdf/`, `prescription_${id}.pdf`),
    },

    intake: {
        getByAppointment: (appointmentId: number | string) =>
            fetchApi<PaginatedResponse<ClinicalIntake>>(`clinical/intakes`, { params: { appointment: appointmentId } })
                .then(res => res.results ?? []),

        create: (data: Partial<ClinicalIntake>) =>
            fetchApi<ClinicalIntake>('clinical/intakes', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        update: (id: number | string, data: Partial<ClinicalIntake>) =>
            fetchApi<ClinicalIntake>(`clinical/intakes/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
    },

    prescriptions: {
        create: (consultationId: number | string) =>
            fetchApi<Prescription>('clinical/prescriptions', {
                method: 'POST',
                body: JSON.stringify({ consultation: consultationId }),
            }),
        addMedication: (data: Partial<PrescriptionMedication> & Record<string, unknown>) =>
            fetchApi<PrescriptionMedication>('clinical/prescription-medications', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        deleteMedication: (id: number) =>
            fetchApi<void>(`clinical/prescription-medications/${id}`, { method: 'DELETE' }),
        addProcedure: (data: Partial<PrescriptionProcedure>) =>
            fetchApi<PrescriptionProcedure>('clinical/prescription-procedures', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        deleteProcedure: (id: number) =>
            fetchApi<void>(`clinical/prescription-procedures/${id}`, { method: 'DELETE' }),
        addProduct: (data: Partial<PrescriptionProduct>) =>
            fetchApi<PrescriptionProduct>('clinical/prescription-products', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        deleteProduct: (id: number) =>
            fetchApi<void>(`clinical/prescription-products/${id}`, { method: 'DELETE' }),
    },
    treatmentPlans: {
        create: (data: Partial<any>) =>
            fetchApi<any>('clinical/treatment-plans', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        listByPatient: (patientId: number | string) =>
            fetchApi<PaginatedResponse<any>>('clinical/treatment-plans', {
                params: { patient: patientId }
            }),
        deleteItem: (planId: number) =>
            fetchApi<void>(`clinical/treatment-plans/${planId}`, { method: 'DELETE' }),
    },
    sessions: {
        list: (params?: { date?: string; provider?: number; status?: string; patient?: number }) =>
            fetchApi<PaginatedResponse<ProcedureSession>>('clinical/procedure-sessions', { params }),

        get: (id: number | string) =>
            fetchApi<ProcedureSession>(`clinical/procedure-sessions/${id}`),

        create: (data: Partial<ProcedureSession>) =>
            fetchApi<ProcedureSession>('clinical/procedure-sessions', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        update: (id: number | string, data: Partial<ProcedureSession>) =>
            fetchApi<ProcedureSession>(`clinical/procedure-sessions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),

        start: (id: number | string) =>
            fetchApi<{ status: string }>((`clinical/procedure-sessions/${id}/start_session`), {
                method: 'POST',
            }),

        uploadConsent: (id: number | string, data: { signed_by: string; signature: Blob }) => {
            const form = new FormData();
            form.append('signed_by', data.signed_by);
            form.append('signature', data.signature, 'signature.png');
            return fetchApi<{ id: number; signed_by: string; signed_at: string }>(
                `clinical/procedure-sessions/${id}/upload_consent`,
                { method: 'POST', body: form },
            );
        },

        listConsentTemplates: () =>
            fetchApi<{ results: Array<{ id: number; name: string; content: string }> }>(
                'clinical/consent-templates',
            ),

        uploadPhoto: async (id: number | string, file: File, description = '') => {
            const form = new FormData();
            form.append('photo', file);
            form.append('category', 'PRE_SESSION');
            if (description) form.append('description', description);
            const res = await fetchApi<{ id: number; photo_url: string }>(
                `clinical/procedure-sessions/${id}/upload_photo`,
                { method: 'POST', body: form },
            );
            return { ...res, photo_url: resolveMediaUrl(res.photo_url) ?? res.photo_url };
        }
    },

    photos: {
        list: async (params?: { patient?: number; category?: string; limit?: number }) => {
            const res = await fetchApi<{ count: number; results: Array<{ id: number; photo: string; photo_url: string; category: string; taken_at: string | null; description: string }> }>('clinical/photos', { params });
            return {
                ...res,
                results: res.results.map(p => ({ ...p, photo_url: resolveMediaUrl(p.photo_url) ?? p.photo_url })),
            };
        },

        get: async (id: number | string) => {
            const res = await fetchApi<{ id: number; photo_url: string; photo: string }>(`clinical/photos/${id}`);
            return { ...res, photo_url: resolveMediaUrl(res.photo_url) ?? res.photo_url };
        },
    },
};
