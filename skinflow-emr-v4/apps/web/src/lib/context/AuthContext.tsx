'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchApi } from '@/lib/api';

interface UserRole {
    id: number | null;
    name: string | null;
    permissions: Record<string, string[]>;
}

interface AuthUser {
    id: number;
    username: string;
    name: string;
    email: string;
    role: UserRole | null;
    organization_id: number | null;
    organization_name: string | null;
    is_superuser: boolean;
    is_org_admin?: boolean;
    provider_id?: number | null;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Rehydrate user from localStorage on mount
        const stored = localStorage.getItem('skinflow_user');
        const token = localStorage.getItem('skinflow_access_token');
        if (stored && token) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('skinflow_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const res: any = await fetchApi('core/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('skinflow_access_token', res.access);
        localStorage.setItem('skinflow_user', JSON.stringify(res.user));
        // Set cookie for middleware route guarding (1-day expiry matches JWT)
        document.cookie = `skinflow_token=${res.access}; path=/; max-age=86400; SameSite=Lax`;
        setUser(res.user);
    };

    const logout = () => {
        localStorage.removeItem('skinflow_access_token');
        localStorage.removeItem('skinflow_user');
        // Clear the middleware cookie
        document.cookie = 'skinflow_token=; path=/; max-age=0';
        setUser(null);
        window.location.href = '/login';
    };

    /**
     * Check if the current user has a specific permission.
     * @param permission - Format 'domain.action', e.g. 'accounting.read' or '*' for any.
     */
    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        // Superusers and org admins bypass all permission checks
        if (user.is_superuser || user.is_org_admin) return true;
        if (permission === '*') return true;

        try {
            const [domain, action] = permission.split('.');
            const domainPerms = user.role?.permissions?.[domain] ?? [];
            return domainPerms.includes(action) || domainPerms.includes('*');
        } catch {
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
