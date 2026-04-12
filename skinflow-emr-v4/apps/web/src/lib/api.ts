const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Ensures a media URL is absolute and points to the API server.
 * Handles two cases the backend can produce in production:
 *   - Relative path (/media/...)          → prepend DJANGO_BASE_URL
 *   - Internal absolute (http://127.../)  → already caught by startsWith check;
 *     if the backend ever returns the correct external URL it passes through unchanged.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${DJANGO_BASE_URL}${url}`;
}

type ApiOptions = RequestInit & {
    params?: Record<string, string | number | boolean>;
};

export async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { params, headers, ...restOptions } = options;

    let url = `${DJANGO_BASE_URL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Ensure trailing slash for Django
    if (!url.includes('?') && !url.endsWith('/')) {
        url += '/';
    }

    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        const qs = searchParams.toString();
        if (qs) {
            url = url.endsWith('/') ? `${url}?${qs}` : `${url}/?${qs}`;
        }
    }

    const defaultHeaders: Record<string, string> = {
        'Accept': 'application/json',
    };
    // Only set Content-Type for non-FormData bodies; let the browser set it for multipart
    if (!(restOptions.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    // JWT Auth: attach Bearer token from localStorage if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('skinflow_access_token');
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        // Superadmin Impersonation Headers
        const impersonateOrg = localStorage.getItem('skinflow_impersonate_org');
        if (impersonateOrg) {
            defaultHeaders['X-Impersonate-Org'] = impersonateOrg;
        }
    }

    const response = await fetch(url, {
        headers: { ...defaultHeaders, ...(headers as Record<string, string>) },
        ...restOptions,
    });

    // On 401, clear stored auth and redirect to login
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('skinflow_access_token');
            localStorage.removeItem('skinflow_user');
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        throw new Error('Unauthorized. Please log in again.');
    }

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { detail: response.statusText };
        }

        let errorMessage = errorData.detail || errorData.error;
        if (!errorMessage && typeof errorData === 'object') {
            const firstKey = Object.keys(errorData)[0];
            if (firstKey && Array.isArray(errorData[firstKey])) {
                errorMessage = `${firstKey}: ${errorData[firstKey][0]}`;
            } else {
                errorMessage = JSON.stringify(errorData);
            }
        }

        throw new Error(errorMessage || `API Error: ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}
