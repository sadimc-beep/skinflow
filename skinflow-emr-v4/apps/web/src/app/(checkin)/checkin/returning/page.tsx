'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { kioskApi, type KioskAppointment } from '@/lib/services/kiosk';
import { ChevronLeft, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

type Step = 'phone' | 'appointments' | 'success';

export default function ReturningPatientPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [appointments, setAppointments] = useState<KioskAppointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkedInAppt, setCheckedInAppt] = useState<KioskAppointment | null>(null);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!phone.trim()) return;

        setLoading(true);
        try {
            const appts = await kioskApi.getAppointments(phone.trim());
            setAppointments(appts);
            setStep('appointments');
        } catch (err: any) {
            setError(err.message || 'Could not find appointments. Please see the front desk.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckin = async (appt: KioskAppointment) => {
        setError('');
        setLoading(true);
        try {
            await kioskApi.checkIn(appt.id);
            setCheckedInAppt(appt);
            setStep('success');
        } catch (err: any) {
            setError(err.message || 'Check-in failed. Please see the front desk.');
        } finally {
            setLoading(false);
        }
    };

    // ── Success screen ─────────────────────────────────────────────────────────
    if (step === 'success' && checkedInAppt) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-8 text-center">
                <CheckCircle2 className="w-20 h-20 text-green-600" />
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold text-[#1C1917]">You're Checked In!</h1>
                    <p className="text-xl text-[#78716C]">
                        {checkedInAppt.provider_name
                            ? `Your appointment with ${checkedInAppt.provider_name} has been confirmed.`
                            : 'Your appointment has been confirmed.'}
                    </p>
                    <p className="text-lg text-[#A8A29E]">Please take a seat. We'll call you shortly.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="mt-6 px-10 py-4 rounded-xl bg-[#1C1917] text-white text-lg font-semibold active:scale-95 transition-transform"
                >
                    Done
                </button>
            </div>
        );
    }

    // ── Appointments list ──────────────────────────────────────────────────────
    if (step === 'appointments') {
        return (
            <div className="min-h-screen flex flex-col px-6 py-10 max-w-lg mx-auto">
                <button
                    onClick={() => { setStep('phone'); setError(''); }}
                    className="flex items-center gap-1 text-[#78716C] mb-8 text-lg"
                >
                    <ChevronLeft className="w-5 h-5" /> Back
                </button>

                <h1 className="text-4xl font-bold text-[#1C1917] mb-2">Your Appointments</h1>
                <p className="text-[#78716C] mb-8">Tap your appointment to check in.</p>

                {appointments.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <p className="text-2xl text-[#78716C]">No appointments found for today.</p>
                        <p className="text-lg text-[#A8A29E]">Please see the front desk.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {appointments.map(appt => (
                            <button
                                key={appt.id}
                                onClick={() => handleCheckin(appt)}
                                disabled={loading}
                                className="w-full text-left p-6 rounded-2xl bg-white border-2 border-[#D9D0C5] shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-[#78716C]" />
                                    <span className="text-xl font-semibold text-[#1C1917]">
                                        {format(new Date(appt.date_time), 'h:mm a')}
                                    </span>
                                </div>
                                {appt.provider_name && (
                                    <p className="text-base text-[#78716C] ml-8">with {appt.provider_name}</p>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <p className="mt-6 text-red-600 text-base bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    // ── Phone entry ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col px-6 py-10 max-w-lg mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-[#78716C] mb-8 text-lg"
            >
                <ChevronLeft className="w-5 h-5" /> Back
            </button>

            <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-[#1C1917]" />
                <h1 className="text-4xl font-bold text-[#1C1917]">Check In</h1>
            </div>
            <p className="text-[#78716C] mb-10">Enter your phone number to find your appointment.</p>

            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-lg font-medium text-[#1C1917]">Phone Number</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 01711-234567"
                        className="w-full px-5 py-5 text-2xl rounded-xl border-2 border-[#D9D0C5] bg-white text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
                        autoComplete="tel"
                        inputMode="tel"
                        autoFocus
                    />
                </div>

                {error && (
                    <p className="text-red-600 text-base bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || !phone.trim()}
                    className="w-full py-5 mt-2 rounded-2xl bg-[#1C1917] text-white text-xl font-semibold disabled:opacity-50 active:scale-95 transition-transform"
                >
                    {loading ? 'Searching…' : 'Find My Appointment'}
                </button>
            </form>
        </div>
    );
}
