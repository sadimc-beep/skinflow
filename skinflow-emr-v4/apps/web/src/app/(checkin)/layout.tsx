'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { setKioskToken } from '@/lib/services/kiosk';
import { Suspense } from 'react';

function KioskTokenInit() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setKioskToken(token);
        }
    }, [searchParams]);

    return null;
}

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F7F3ED] font-sans">
            <Suspense fallback={null}>
                <KioskTokenInit />
            </Suspense>
            {children}
        </div>
    );
}
