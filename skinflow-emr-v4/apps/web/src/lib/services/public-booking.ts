/**
 * Public booking API — no JWT required.
 * All calls are scoped to a clinic via its org slug.
 */

const BASE = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || 'http://127.0.0.1:8000';

async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${BASE}/api/public${path}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Request failed (${res.status})`);
    }
    return res.json();
}

export interface ClinicInfo {
    clinic_name: string;
    clinic_phone: string;
    clinic_address: string;
    providers: { id: number; name: string; type: string; specialization: string }[];
    slot_duration_mins: number;
    working_days: string[];
    advance_booking_days: number;
}

export interface BookingResult {
    appointment_id: number;
    reference: string;
    provider_name: string;
    date_time: string;
    patient_name: string;
    clinic_name: string;
    clinic_phone: string;
    clinic_address: string;
}

export const publicBookingApi = {
    getInfo: (slug: string) =>
        publicFetch<ClinicInfo>(`/${slug}/info/`),

    getSlots: (slug: string, providerId: number, date: string) =>
        publicFetch<{ slots: string[] }>(`/${slug}/slots/?provider_id=${providerId}&date=${date}`),

    lookupPatient: (slug: string, phone: string) =>
        publicFetch<{ found: boolean; first_name: string | null }>(`/${slug}/lookup-patient/`, {
            method: 'POST',
            body: JSON.stringify({ phone }),
        }),

    book: (slug: string, data: {
        phone: string;
        first_name: string;
        last_name: string;
        provider_id: number;
        date_time: string;
    }) =>
        publicFetch<BookingResult>(`/${slug}/book/`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
