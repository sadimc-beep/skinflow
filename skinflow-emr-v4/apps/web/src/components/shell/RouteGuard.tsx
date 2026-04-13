'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';

const routePermissions: Record<string, string> = {
    '/patients': 'patients.read',
    '/clinical': 'clinical.read',
    '/appointments': 'clinical.read',
    '/consultations': 'clinical.read',
    '/sessions': 'clinical.read',
    '/finance': 'accounting.read',
    '/billing': 'billing.read',
    '/accounting': 'accounting.read',
    '/inventory': 'inventory.read',
    '/store': 'inventory.read',
    '/pos': 'pos.read',
    '/settings': 'settings.read',
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { hasPermission, isLoading, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (isLoading || !user) return;

        // Find applicable permission rule for current path prefix
        const foundPrefix = Object.keys(routePermissions).find(prefix => pathname?.startsWith(prefix));

        if (foundPrefix) {
            const requiredPerm = routePermissions[foundPrefix];
            if (!hasPermission(requiredPerm)) {
                setAuthorized(false);
                return;
            }
        }

        setAuthorized(true);
    }, [pathname, hasPermission, isLoading, user]);

    if (isLoading || (!authorized && user)) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                {!authorized && user ? (
                    <div className="flex flex-col items-center max-w-sm text-center">
                        <div className="w-16 h-16 bg-[#C4705A]/10 text-[#C4705A] rounded-2xl flex items-center justify-center mb-6">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-display font-semibold text-[#1C1917] mb-2">Access Denied</h2>
                        <p className="text-[#78706A] mb-8">You do not have the necessary permissions to view this module. Please contact your clinic administrator.</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="bg-[#1C1917] text-[#F7F3ED] px-6 py-3 rounded-full font-semibold hover:bg-[#2E2A25] transition"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-[#A0978D]" />
                )}
            </div>
        );
    }

    return <>{children}</>;
}
