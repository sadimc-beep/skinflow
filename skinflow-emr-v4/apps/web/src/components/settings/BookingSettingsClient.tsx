'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS: Record<string, string> = {
    MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
    FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};

interface BookingSettingsData {
    id?: number;
    organization?: number;
    is_booking_enabled: boolean;
    slot_duration_mins: number;
    working_days: string[];
    start_time: string;
    end_time: string;
    advance_booking_days: number;
}

export function BookingSettingsClient() {
    const [data, setData] = useState<BookingSettingsData>({
        is_booking_enabled: true,
        slot_duration_mins: 30,
        working_days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        start_time: '09:00:00',
        end_time: '18:00:00',
        advance_booking_days: 30,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [slug, setSlug] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetchApi<BookingSettingsData>('core/booking-settings/'),
            fetchApi<{ slug: string; name: string }>('core/settings/'),
        ]).then(([settings, coreSettings]) => {
            setData(settings as BookingSettingsData);
            setSlug((coreSettings as any).organization_slug ?? null);
        }).catch(() => {
            toast.error('Failed to load booking settings');
        }).finally(() => setLoading(false));
    }, []);

    const handleToggleDay = (day: string) => {
        const current = data.working_days;
        const next = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day];
        // Keep ordering consistent
        setData({ ...data, working_days: DAYS.filter(d => next.includes(d)) });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await fetchApi<BookingSettingsData>('core/booking-settings/', {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            setData(updated);
            toast.success('Booking settings saved');
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const bookingUrl = slug
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${slug}`
        : null;

    const handleCopyUrl = () => {
        if (!bookingUrl) return;
        navigator.clipboard.writeText(bookingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-[#A0978D]" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl space-y-8">
            <div>
                <h2 className="text-xl font-bold text-[#1C1917] mb-1">Online Booking</h2>
                <p className="text-sm text-[#78706A]">Configure the public booking page that patients use to self-schedule appointments.</p>
            </div>

            {/* Booking URL */}
            {bookingUrl && (
                <div>
                    <label className="text-sm font-bold text-[#1C1917] block mb-2">Your Booking Link</label>
                    <div className="flex gap-2 items-center bg-[#F7F3ED] border border-[#D9D0C5] rounded-xl px-4 py-3">
                        <span className="text-sm text-[#78706A] flex-1 truncate font-mono">{bookingUrl}</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCopyUrl}
                            className="h-8 px-2 text-xs text-[#78706A] hover:text-[#1C1917]"
                        >
                            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-[#A0978D] mt-1">Share this link with patients. No login required.</p>
                </div>
            )}

            {/* Enable toggle */}
            <div className="flex items-center justify-between py-4 border-y border-[#E8E1D6]">
                <div>
                    <div className="text-sm font-bold text-[#1C1917]">Enable Online Booking</div>
                    <div className="text-xs text-[#78706A]">When disabled, the booking page shows "not available".</div>
                </div>
                <button
                    onClick={() => setData({ ...data, is_booking_enabled: !data.is_booking_enabled })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${data.is_booking_enabled ? 'bg-[#1C1917]' : 'bg-[#D9D0C5]'}`}
                >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.is_booking_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Working days */}
            <div>
                <label className="text-sm font-bold text-[#1C1917] block mb-3">Working Days</label>
                <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => handleToggleDay(day)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all
                                ${data.working_days.includes(day)
                                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                                    : 'bg-white text-[#78706A] border-[#D9D0C5] hover:bg-[#F7F3ED]'}`}
                        >
                            {DAY_LABELS[day].slice(0, 3)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hours + slot duration */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-bold text-[#1C1917] block mb-2">Opening Time</label>
                    <Input
                        type="time"
                        value={data.start_time.slice(0, 5)}
                        onChange={e => setData({ ...data, start_time: e.target.value + ':00' })}
                        className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm"
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-[#1C1917] block mb-2">Closing Time</label>
                    <Input
                        type="time"
                        value={data.end_time.slice(0, 5)}
                        onChange={e => setData({ ...data, end_time: e.target.value + ':00' })}
                        className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm"
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-[#1C1917] block mb-2">Slot Duration (mins)</label>
                    <Input
                        type="number"
                        min={10}
                        max={120}
                        step={5}
                        value={data.slot_duration_mins}
                        onChange={e => setData({ ...data, slot_duration_mins: Number(e.target.value) })}
                        className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm"
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-[#1C1917] block mb-2">Advance Booking (days)</label>
                    <Input
                        type="number"
                        min={1}
                        max={180}
                        value={data.advance_booking_days}
                        onChange={e => setData({ ...data, advance_booking_days: Number(e.target.value) })}
                        className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm"
                    />
                </div>
            </div>

            <Button
                onClick={handleSave}
                disabled={saving}
                className="h-12 px-8 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]"
            >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Settings
            </Button>
        </div>
    );
}
