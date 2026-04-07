'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO, addDays } from 'date-fns';
import { ChevronLeft, Calendar, Clock, User, Phone, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { publicBookingApi, type ClinicInfo, type BookingResult } from '@/lib/services/public-booking';

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'SELECT' | 'CONFIRM' | 'SUCCESS';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSlotTime(iso: string) {
    return format(parseISO(iso), 'h:mm a');
}

function formatBookingDate(iso: string) {
    return format(parseISO(iso), 'EEEE, MMMM d, yyyy');
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PageHeader({ clinicName }: { clinicName: string }) {
    return (
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1C1917] mb-4">
                <Calendar className="h-6 w-6 text-[#C4A882]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1C1917]">{clinicName}</h1>
            <p className="text-sm text-[#78706A] mt-1">Online Appointment Booking</p>
        </div>
    );
}

function StepIndicator({ step }: { step: Step }) {
    const steps = [
        { key: 'SELECT', label: 'Choose Slot' },
        { key: 'CONFIRM', label: 'Your Details' },
        { key: 'SUCCESS', label: 'Confirmed' },
    ];
    const activeIndex = steps.findIndex(s => s.key === step);
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                        ${i < activeIndex ? 'bg-emerald-100 text-emerald-700' :
                          i === activeIndex ? 'bg-[#1C1917] text-white' :
                          'bg-[#E8E1D6] text-[#A0978D]'}`}>
                        {i < activeIndex ? <CheckCircle2 className="h-3 w-3" /> : <span>{i + 1}</span>}
                        {s.label}
                    </div>
                    {i < steps.length - 1 && <div className="w-4 h-px bg-[#D9D0C5]" />}
                </div>
            ))}
        </div>
    );
}

// ─── Step 1: Select provider, date, slot ─────────────────────────────────────

function SelectStep({
    info,
    onSelect,
}: {
    info: ClinicInfo;
    onSelect: (providerId: number, providerName: string, slot: string) => void;
}) {
    const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const { slug } = useParams<{ slug: string }>();

    const today = format(new Date(), 'yyyy-MM-dd');
    const maxDate = format(addDays(new Date(), info.advance_booking_days), 'yyyy-MM-dd');

    const loadSlots = useCallback(async () => {
        if (!selectedProvider || !selectedDate) return;
        setLoadingSlots(true);
        setSelectedSlot(null);
        try {
            const res = await publicBookingApi.getSlots(slug, selectedProvider, selectedDate);
            setSlots(res.slots);
        } catch {
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }, [slug, selectedProvider, selectedDate]);

    useEffect(() => {
        loadSlots();
    }, [loadSlots]);

    const providerName = info.providers.find(p => p.id === selectedProvider)?.name ?? '';

    return (
        <div className="space-y-6">
            {/* Provider selector */}
            <div>
                <label className="text-sm font-bold text-[#1C1917] block mb-2">Select Provider</label>
                <div className="grid gap-2">
                    {info.providers.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedProvider(p.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm
                                ${selectedProvider === p.id
                                    ? 'border-[#1C1917] bg-[#1C1917] text-white'
                                    : 'border-[#D9D0C5] bg-white text-[#1C1917] hover:bg-[#F7F3ED]'}`}
                        >
                            <div className="font-bold">{p.name}</div>
                            {p.specialization && <div className={`text-xs mt-0.5 ${selectedProvider === p.id ? 'text-[#C4A882]' : 'text-[#78706A]'}`}>{p.specialization}</div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date picker */}
            {selectedProvider && (
                <div>
                    <label className="text-sm font-bold text-[#1C1917] block mb-2">Select Date</label>
                    <input
                        type="date"
                        min={today}
                        max={maxDate}
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-[#D9D0C5] bg-white text-[#1C1917] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
                    />
                </div>
            )}

            {/* Slot grid */}
            {selectedProvider && selectedDate && (
                <div>
                    <label className="text-sm font-bold text-[#1C1917] block mb-2">
                        Available Times
                        <span className="ml-2 text-xs text-[#A0978D] font-normal">
                            {format(parseISO(selectedDate), 'EEE, MMM d')}
                        </span>
                    </label>

                    {loadingSlots ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-[#A0978D]" />
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="text-center py-8 text-sm text-[#A0978D] bg-[#F7F3ED] rounded-xl border border-[#E8E1D6]">
                            No available slots on this day.<br />
                            <span className="text-xs">Please try another date or provider.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {slots.map(slot => (
                                <button
                                    key={slot}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-2.5 rounded-xl border text-sm font-bold transition-all
                                        ${selectedSlot === slot
                                            ? 'border-[#1C1917] bg-[#1C1917] text-white'
                                            : 'border-[#D9D0C5] bg-white text-[#1C1917] hover:bg-[#F7F3ED]'}`}
                                >
                                    {formatSlotTime(slot)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Continue button */}
            <button
                disabled={!selectedSlot}
                onClick={() => selectedSlot && onSelect(selectedProvider!, providerName, selectedSlot)}
                className="w-full h-12 rounded-xl font-bold text-sm bg-[#1C1917] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3E3832] transition-colors"
            >
                Continue
            </button>
        </div>
    );
}

// ─── Step 2: Patient details + confirmation ───────────────────────────────────

function ConfirmStep({
    slug,
    providerName,
    slot,
    providerId,
    onBack,
    onSuccess,
}: {
    slug: string;
    providerName: string;
    slot: string;
    providerId: number;
    onBack: () => void;
    onSuccess: (result: BookingResult) => void;
}) {
    const [phone, setPhone] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [lookupDone, setLookupDone] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [isLooking, setIsLooking] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLookup = async () => {
        if (phone.length < 6) return;
        setIsLooking(true);
        setError(null);
        try {
            const res = await publicBookingApi.lookupPatient(slug, phone);
            setIsReturning(res.found);
            if (res.found && res.first_name) setFirstName(res.first_name);
            setLookupDone(true);
        } catch {
            setError('Could not check phone number. Please try again.');
        } finally {
            setIsLooking(false);
        }
    };

    const handleBook = async () => {
        setIsBooking(true);
        setError(null);
        try {
            const result = await publicBookingApi.book(slug, {
                phone,
                first_name: firstName,
                last_name: lastName,
                provider_id: providerId,
                date_time: slot,
            });
            onSuccess(result);
        } catch (e: any) {
            setError(e.message || 'Booking failed. Please try again.');
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Appointment summary */}
            <div className="bg-[#F7F3ED] border border-[#D9D0C5] rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#1C1917]">
                    <User className="h-4 w-4 text-[#A0978D]" />
                    <span className="font-bold">{providerName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1C1917]">
                    <Calendar className="h-4 w-4 text-[#A0978D]" />
                    <span>{formatBookingDate(slot)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1C1917]">
                    <Clock className="h-4 w-4 text-[#A0978D]" />
                    <span className="font-bold">{formatSlotTime(slot)}</span>
                </div>
            </div>

            {/* Phone entry */}
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-bold text-[#1C1917] block mb-2">Your Phone Number</label>
                    <div className="flex gap-2">
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => { setPhone(e.target.value); setLookupDone(false); setFirstName(''); setLastName(''); setIsReturning(false); }}
                            placeholder="e.g. 01712345678"
                            className="flex-1 h-12 px-4 rounded-xl border border-[#D9D0C5] bg-white text-[#1C1917] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
                        />
                        <button
                            onClick={handleLookup}
                            disabled={phone.length < 6 || isLooking}
                            className="h-12 px-4 rounded-xl font-bold text-sm bg-[#1C1917] text-white disabled:opacity-40 hover:bg-[#3E3832] transition-colors whitespace-nowrap"
                        >
                            {isLooking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Look Up'}
                        </button>
                    </div>
                </div>

                {/* Returning patient */}
                {lookupDone && isReturning && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Welcome back, {firstName}! We found your record.
                    </div>
                )}

                {/* New patient — collect name */}
                {lookupDone && !isReturning && (
                    <div className="space-y-3">
                        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                            New patient? No problem — we just need your name.
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-[#1C1917] block mb-1">First Name *</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    placeholder="e.g. Sadia"
                                    className="w-full h-11 px-3 rounded-xl border border-[#D9D0C5] bg-white text-[#1C1917] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#1C1917] block mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    placeholder="e.g. Islam"
                                    className="w-full h-11 px-3 rounded-xl border border-[#D9D0C5] bg-white text-[#1C1917] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 h-12 px-4 rounded-xl font-bold text-sm border border-[#D9D0C5] bg-white text-[#1C1917] hover:bg-[#F7F3ED] transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />Back
                </button>
                <button
                    disabled={!lookupDone || !firstName || isBooking}
                    onClick={handleBook}
                    className="flex-1 h-12 rounded-xl font-bold text-sm bg-[#1C1917] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3E3832] transition-colors"
                >
                    {isBooking ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm Appointment'}
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Success ──────────────────────────────────────────────────────────

function SuccessStep({ result }: { result: BookingResult }) {
    return (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-[#1C1917]">Appointment Confirmed!</h2>
                <p className="text-sm text-[#78706A] mt-1">
                    Please bring this reference number when you arrive.
                </p>
            </div>

            {/* Reference number — prominent */}
            <div className="bg-[#1C1917] rounded-2xl px-8 py-6 inline-block mx-auto">
                <div className="text-xs font-bold text-[#A0978D] uppercase tracking-widest mb-1">Booking Reference</div>
                <div className="text-4xl font-bold text-white tracking-widest font-mono">
                    {result.reference}
                </div>
            </div>

            {/* Appointment details */}
            <div className="bg-[#F7F3ED] border border-[#D9D0C5] rounded-2xl p-5 text-left space-y-3">
                <div className="flex items-start gap-3 text-sm">
                    <User className="h-4 w-4 text-[#A0978D] mt-0.5 shrink-0" />
                    <div>
                        <div className="text-xs text-[#A0978D] font-medium">Patient</div>
                        <div className="font-bold text-[#1C1917]">{result.patient_name}</div>
                    </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                    <User className="h-4 w-4 text-[#A0978D] mt-0.5 shrink-0" />
                    <div>
                        <div className="text-xs text-[#A0978D] font-medium">Provider</div>
                        <div className="font-bold text-[#1C1917]">{result.provider_name}</div>
                    </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-[#A0978D] mt-0.5 shrink-0" />
                    <div>
                        <div className="text-xs text-[#A0978D] font-medium">Date & Time</div>
                        <div className="font-bold text-[#1C1917]">{formatBookingDate(result.date_time)}</div>
                        <div className="text-[#78706A]">{formatSlotTime(result.date_time)}</div>
                    </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-[#A0978D] mt-0.5 shrink-0" />
                    <div>
                        <div className="text-xs text-[#A0978D] font-medium">Clinic</div>
                        <div className="font-bold text-[#1C1917]">{result.clinic_name}</div>
                        {result.clinic_phone && <div className="text-[#78706A]">{result.clinic_phone}</div>}
                        {result.clinic_address && <div className="text-[#78706A] text-xs mt-0.5">{result.clinic_address}</div>}
                    </div>
                </div>
            </div>

            <p className="text-xs text-[#A0978D]">
                Quote your reference number at reception. No login required.
            </p>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingPage() {
    const { slug } = useParams<{ slug: string }>();
    const [step, setStep] = useState<Step>('SELECT');
    const [info, setInfo] = useState<ClinicInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Booking state threaded between steps
    const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
    const [selectedProviderName, setSelectedProviderName] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

    useEffect(() => {
        publicBookingApi.getInfo(slug)
            .then(setInfo)
            .catch(e => setError(e.message || 'Unable to load booking page.'))
            .finally(() => setLoading(false));
    }, [slug]);

    const handleSelect = (providerId: number, providerName: string, slot: string) => {
        setSelectedProviderId(providerId);
        setSelectedProviderName(providerName);
        setSelectedSlot(slot);
        setStep('CONFIRM');
    };

    const handleSuccess = (result: BookingResult) => {
        setBookingResult(result);
        setStep('SUCCESS');
    };

    return (
        <div className="min-h-screen bg-[#F7F3ED] flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-md">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-[#A0978D]" />
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8E1D6] text-center">
                        <div className="text-red-600 font-bold mb-2">Booking Unavailable</div>
                        <div className="text-sm text-[#78706A]">{error}</div>
                    </div>
                ) : info ? (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8E1D6]">
                        <PageHeader clinicName={info.clinic_name} />
                        <StepIndicator step={step} />

                        {step === 'SELECT' && (
                            <SelectStep info={info} onSelect={handleSelect} />
                        )}
                        {step === 'CONFIRM' && selectedSlot && selectedProviderId && (
                            <ConfirmStep
                                slug={slug}
                                providerName={selectedProviderName}
                                slot={selectedSlot}
                                providerId={selectedProviderId}
                                onBack={() => setStep('SELECT')}
                                onSuccess={handleSuccess}
                            />
                        )}
                        {step === 'SUCCESS' && bookingResult && (
                            <SuccessStep result={bookingResult} />
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
