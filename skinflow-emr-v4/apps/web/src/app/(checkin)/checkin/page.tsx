'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function KioskLanding() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tokenParam = searchParams.get('token') ? `?token=${searchParams.get('token')}` : '';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 gap-10">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-5xl font-bold text-[#1C1917] tracking-tight">Welcome</h1>
                <p className="text-xl text-[#78716C]">Please select an option to get started.</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-5 w-full max-w-md">
                <button
                    onClick={() => router.push(`/checkin/new${tokenParam}`)}
                    className="w-full py-8 rounded-2xl bg-[#1C1917] text-white text-2xl font-semibold shadow-lg active:scale-95 transition-transform"
                >
                    New Patient
                    <p className="text-base font-normal text-[#A8A29E] mt-1">First visit? Register here.</p>
                </button>

                <button
                    onClick={() => router.push(`/checkin/returning${tokenParam}`)}
                    className="w-full py-8 rounded-2xl bg-white border-2 border-[#D9D0C5] text-[#1C1917] text-2xl font-semibold shadow-sm active:scale-95 transition-transform"
                >
                    I Have an Appointment
                    <p className="text-base font-normal text-[#78716C] mt-1">Check in for today's visit.</p>
                </button>
            </div>

            {/* Footer hint */}
            <p className="text-sm text-[#A8A29E] mt-4">
                Please see the front desk if you need assistance.
            </p>
        </div>
    );
}

export default function CheckinPage() {
    return (
        <Suspense fallback={null}>
            <KioskLanding />
        </Suspense>
    );
}
