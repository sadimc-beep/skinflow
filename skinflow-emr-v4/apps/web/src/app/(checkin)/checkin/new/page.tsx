'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { kioskApi, type KioskRegisterData } from '@/lib/services/kiosk';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

type Step = 'form' | 'success';

const GENDERS = [
    { value: 'FEMALE', label: 'Female' },
    { value: 'MALE', label: 'Male' },
    { value: 'OTHER', label: 'Other / Prefer not to say' },
] as const;

export default function NewPatientCheckinPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('form');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState<KioskRegisterData>({
        first_name: '',
        last_name: '',
        phone_primary: '',
        date_of_birth: '',
        gender: 'FEMALE',
    });

    const set = (field: keyof KioskRegisterData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.first_name.trim() || !form.last_name.trim() || !form.phone_primary.trim()) {
            setError('Name and phone number are required.');
            return;
        }

        setSubmitting(true);
        try {
            await kioskApi.registerPatient({
                ...form,
                date_of_birth: form.date_of_birth || undefined,
            });
            setStep('success');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please see the front desk.');
        } finally {
            setSubmitting(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-8 text-center">
                <CheckCircle2 className="w-20 h-20 text-green-600" />
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-[#1C1917]">Registration Complete!</h1>
                    <p className="text-xl text-[#78716C]">
                        Welcome, {form.first_name}. Please see the front desk to complete your visit.
                    </p>
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

    return (
        <div className="min-h-screen flex flex-col px-6 py-10 max-w-lg mx-auto">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-[#78716C] mb-8 text-lg"
            >
                <ChevronLeft className="w-5 h-5" /> Back
            </button>

            <h1 className="text-4xl font-bold text-[#1C1917] mb-2">New Patient</h1>
            <p className="text-[#78716C] mb-10">Please fill in your basic information.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* First name */}
                <Field label="First Name *">
                    <input
                        type="text"
                        value={form.first_name}
                        onChange={set('first_name')}
                        placeholder="e.g. Ayesha"
                        className={inputClass}
                        autoComplete="given-name"
                    />
                </Field>

                {/* Last name */}
                <Field label="Last Name *">
                    <input
                        type="text"
                        value={form.last_name}
                        onChange={set('last_name')}
                        placeholder="e.g. Rahman"
                        className={inputClass}
                        autoComplete="family-name"
                    />
                </Field>

                {/* Phone */}
                <Field label="Phone Number *">
                    <input
                        type="tel"
                        value={form.phone_primary}
                        onChange={set('phone_primary')}
                        placeholder="e.g. 01711-234567"
                        className={inputClass}
                        autoComplete="tel"
                        inputMode="tel"
                    />
                </Field>

                {/* Date of birth */}
                <Field label="Date of Birth">
                    <input
                        type="date"
                        value={form.date_of_birth}
                        onChange={set('date_of_birth')}
                        className={inputClass}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </Field>

                {/* Gender */}
                <Field label="Gender">
                    <select value={form.gender} onChange={set('gender')} className={inputClass}>
                        {GENDERS.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                </Field>

                {error && (
                    <p className="text-red-600 text-base bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-5 mt-2 rounded-2xl bg-[#1C1917] text-white text-xl font-semibold disabled:opacity-50 active:scale-95 transition-transform"
                >
                    {submitting ? 'Registering…' : 'Register'}
                </button>
            </form>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-lg font-medium text-[#1C1917]">{label}</label>
            {children}
        </div>
    );
}

const inputClass =
    'w-full px-5 py-4 text-xl rounded-xl border-2 border-[#D9D0C5] bg-white text-[#1C1917] focus:outline-none focus:border-[#1C1917]';
