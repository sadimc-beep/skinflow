/**
 * Kiosk API client
 *
 * All requests are authenticated with "Authorization: Kiosk <token>" instead
 * of the staff JWT. The token comes from the URL query param `?token=` and is
 * stored in sessionStorage for the duration of the browser session.
 */

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || 'http://127.0.0.1:8000';

export function getKioskToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('kiosk_token');
}

export function setKioskToken(token: string): void {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('kiosk_token', token);
    }
}

async function kioskFetch<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string> } = {},
): Promise<T> {
    const { params, headers, ...rest } = options;
    const token = getKioskToken();

    let url = `${DJANGO_BASE_URL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    if (!url.includes('?') && !url.endsWith('/')) url += '/';

    if (params) {
        const qs = new URLSearchParams(params).toString();
        if (qs) url = `${url}?${qs}`;
    }

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Kiosk ${token}` } : {}),
            ...(headers as Record<string, string>),
        },
        ...rest,
    });

    if (!response.ok) {
        let msg = `API Error: ${response.status}`;
        try {
            const data = await response.json();
            msg = data.error || data.detail || JSON.stringify(data);
        } catch { /* ignore */ }
        throw new Error(msg);
    }

    if (response.status === 204) return {} as T;
    return response.json();
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface KioskPatient {
    id: number;
    first_name: string;
    last_name: string;
    phone_primary: string;
}

export interface KioskRegisterData {
    first_name: string;
    last_name: string;
    phone_primary: string;
    date_of_birth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
}

export const kioskApi = {
    registerPatient(data: KioskRegisterData): Promise<KioskPatient> {
        return kioskFetch('/patients/kiosk/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    lookupPatient(phone: string): Promise<KioskPatient> {
        return kioskFetch('/patients/kiosk/lookup', {
            params: { phone },
        });
    },

    // ─── Appointments ─────────────────────────────────────────────────────────

    getAppointments(phone: string): Promise<KioskAppointment[]> {
        return kioskFetch('/clinical/kiosk/appointments', {
            params: { phone },
        });
    },

    checkIn(appointmentId: number): Promise<{ status: string; appointment_id: number }> {
        return kioskFetch(`/clinical/kiosk/appointments/${appointmentId}/checkin`, {
            method: 'POST',
        });
    },
};

export interface KioskAppointment {
    id: number;
    date_time: string;
    provider_name: string;
    status: string;
}
