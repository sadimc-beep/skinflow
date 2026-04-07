"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    format, parseISO, startOfWeek, addDays, isSameDay,
    addWeeks, subWeeks, parseISO as parse
} from 'date-fns';
import { appointmentsApi } from '@/lib/services/appointments';
import { clinicalApi } from '@/lib/services/clinical';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft, ChevronRight, Plus, Info,
    Pencil, X, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment } from '@/types/models';
import { IntakeModal } from './IntakeModal';
import { ArrivedModal } from './ArrivedModal';

/* ─── helpers ─────────────────────────────────────────────────── */
function toDateInputValue(d: Date) { return format(d, 'yyyy-MM-dd'); }

const STATUS_LABELS: Record<string, string> = {
    SCHEDULED: 'Scheduled', ARRIVED: 'Arrived', READY_FOR_CONSULT: 'Ready',
    IN_CONSULTATION: 'Consulting', COMPLETED: 'Completed',
    CANCELLED: 'Cancelled', NO_SHOW: 'No Show',
};

/* ─── Appointment Card ────────────────────────────────────────── */
function ApptCard({ appt, onCancel }: { appt: Appointment; onCancel: () => void }) {
    const startTime = format(parseISO(appt.date_time), 'HH:mm');
    // default duration 30 min if no end time
    const endTime = appt.end_time ? format(parseISO(appt.end_time), 'HH:mm') : '';
    const name = `${appt.patient_details?.first_name ?? ''} ${appt.patient_details?.last_name ?? ''}`.trim() || '—';
    const label = STATUS_LABELS[appt.status] ?? appt.status;

    return (
        <div className="relative group rounded-2xl bg-[#F7F3ED] text-[#1C1917] p-2.5 mb-1.5 min-h-[70px] flex flex-col justify-between hover:bg-[#E8E1D6] transition cursor-pointer select-none shadow-sm border border-[#E8E1D6]">
            {/* Top row: label + action icons */}
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-[#C4A882] uppercase tracking-wide">{label}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button className="p-0.5 rounded hover:bg-[#E8E1D6] text-[#A0978D] hover:text-[#1C1917] transition">
                        <Pencil className="w-3 h-3" />
                    </button>
                    <button className="p-0.5 rounded hover:bg-[#E8E1D6] text-[#A0978D] hover:text-[#C4705A] transition" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>
            {/* Patient name */}
            <p className="text-xs font-bold leading-tight line-clamp-2">{name}</p>
            {/* Time row */}
            <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[#A0978D] font-medium">{startTime}{endTime ? ` - ${endTime}` : ''}</span>
                <button className="p-0.5 rounded hover:bg-[#E8E1D6] text-[#D9D0C5] hover:text-[#1C1917] transition">
                    <Info className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

/* ─── Day View Sidebar ────────────────────────────────────────── */
function DayViewSidebar({ appointments, date }: { appointments: Appointment[]; date: Date }) {
    const dateStr = toDateInputValue(date);
    const dayAppts = appointments.filter(a => a.date_time.startsWith(dateStr));

    return (
        <div className="w-64 shrink-0 border-l border-[#E8E1D6] pl-5">
            <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-[#1C1917] text-sm">Day View</p>
                <div className="flex items-center gap-1.5 text-xs text-[#A0978D]">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(date, 'MM/dd/yyyy')}
                </div>
            </div>
            {dayAppts.length === 0 ? (
                <p className="text-xs text-[#A0978D]">No appointments for this day.</p>
            ) : (
                <div className="space-y-3">
                    {dayAppts.map(a => (
                        <div key={a.id} className="flex items-center justify-between group">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#1C1917] truncate">
                                    {a.patient_details?.first_name} {a.patient_details?.last_name}
                                </p>
                                <p className="text-xs text-[#A0978D]">
                                    {format(parseISO(a.date_time), 'hh:mm aa')}
                                    {a.end_time ? ` - ${format(parseISO(a.end_time), 'hh:mm aa')}` : ''}
                                </p>
                                <p className="text-[10px] text-[#C4A882] font-medium">{STATUS_LABELS[a.status] || a.status}</p>
                            </div>
                            <button className="ml-2 shrink-0 w-6 h-6 rounded-full border border-[#E8E1D6] flex items-center justify-center text-[#D9D0C5] hover:text-[#C4A882] hover:border-[#C4A882] transition opacity-0 group-hover:opacity-100">
                                <Info className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Weekly Calendar ─────────────────────────────────────────── */
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–18pm

function WeekCalendar({
    weekStart, appointments, onCancel
}: {
    weekStart: Date;
    appointments: Appointment[];
    onCancel: (id: number) => void;
}) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    function getAppts(d: Date) {
        const ds = toDateInputValue(d);
        return appointments.filter(a => a.date_time.startsWith(ds));
    }

    return (
        <div className="overflow-x-auto -mx-1">
            <div className="min-w-[720px]">
                {/* Header row */}
                <div className="grid grid-cols-[48px_repeat(7,1fr)] mb-1">
                    <div />
                    {days.map(d => {
                        const isToday = isSameDay(d, new Date());
                        return (
                            <div key={d.toISOString()} className="text-center pb-2">
                                <p className="text-[10px] font-bold text-[#A0978D] uppercase tracking-wider">
                                    {format(d, 'EEE')}
                                </p>
                                <p className={`text-sm font-bold ${isToday ? 'text-[#C4A882]' : 'text-[#78706A]'}`}>
                                    {format(d, 'd')}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Time grid */}
                {HOURS.map(h => (
                    <div key={h} className="grid grid-cols-[48px_repeat(7,1fr)] min-h-[70px]">
                        {/* Hour label */}
                        <div className="text-[10px] text-[#D9D0C5] font-semibold pt-1 text-right pr-2 select-none">
                            {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                        </div>
                        {/* Day columns */}
                        {days.map(d => {
                            const dayAppts = getAppts(d).filter(a => {
                                const apptHour = parseISO(a.date_time).getHours();
                                return apptHour === h;
                            });
                            return (
                                <div key={d.toISOString()} className="border-t border-[#E8E1D6] px-1 pt-1">
                                    {dayAppts.map(a => (
                                        <ApptCard key={a.id} appt={a} onCancel={() => onCancel(a.id)} />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Main Component ──────────────────────────────────────────── */
type Props = {
    initialData: Appointment[];
    patientView?: boolean;
};

export function AppointmentsListClient({ initialData, patientView = false }: Props) {
    const router = useRouter();
    const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [appointments, setAppointments] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'future' | 'past'>('future');
    const [arrivedApptId, setArrivedApptId] = useState<number | null>(null);
    const [intakeApptId, setIntakeApptId] = useState<number | null>(null);

    // Load appointments for the displayed week range
    useEffect(() => {
        if (patientView) return;
        setIsLoading(true);
        const dateStr = toDateInputValue(currentWeek);
        appointmentsApi.list({ date: dateStr }).then(res => {
            setAppointments(res.results || []);
        }).catch(() => {
            toast.error("Failed to load appointments");
        }).finally(() => setIsLoading(false));
    }, [currentWeek, patientView]);

    const handleCancel = async (id: number) => {
        try {
            await appointmentsApi.updateStatus(id, 'CANCELLED');
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
            toast.success("Appointment cancelled");
        } catch {
            toast.error("Failed to cancel appointment");
        }
    };

    const handleArrivedSuccess = async (id: number, fee: number) => {
        try {
            const res = await appointmentsApi.checkIn(id, fee);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'ARRIVED' } : a));
            toast.success("Patient Marked Arrived");
            setArrivedApptId(null);
            if (res.invoice_id) router.push(`/billing/${res.invoice_id}`);
        } catch (e: any) {
            toast.error(e.message || "Failed to mark arrived");
        }
    };

    const handleIntakeSuccess = async (id: number) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'READY_FOR_CONSULT' } : a));
    };

    // If patientView, fall back to a simple list
    if (patientView) {
        const sorted = [...appointments].sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
        return (
            <div className="space-y-2">
                {sorted.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No appointment history found.</p>
                ) : sorted.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-2xl bg-[#F7F3ED] border border-[#E8E1D6] px-4 py-3 hover:bg-[#E8E1D6] transition">
                        <div>
                            <p className="text-xs font-bold text-[#C4A882]">{format(parseISO(a.date_time), 'MMM d, yyyy · hh:mm aaa')}</p>
                            <p className="text-sm font-semibold text-[#1C1917] mt-0.5">{STATUS_LABELS[a.status] || a.status}</p>
                            <p className="text-xs text-[#A0978D]">{a.notes || 'No notes'}</p>
                        </div>
                        <button className="w-7 h-7 rounded-full border border-[#E8E1D6] flex items-center justify-center text-[#D9D0C5] hover:text-[#C4A882] hover:border-[#C4A882] transition">
                            <Info className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Tab Row */}
            <div className="flex items-center gap-6 border-b border-[#E8E1D6] pb-0">
                <button
                    onClick={() => setActiveTab('future')}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 -mb-px ${activeTab === 'future' ? 'border-[#1C1917] text-[#1C1917]' : 'border-transparent text-[#A0978D] hover:text-[#78706A]'}`}
                >
                    Future Appointments
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 -mb-px ${activeTab === 'past' ? 'border-[#1C1917] text-[#1C1917]' : 'border-transparent text-[#A0978D] hover:text-[#78706A]'}`}
                >
                    Past Consultations
                </button>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    {/* Week nav */}
                    <button
                        onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                        className="w-7 h-7 rounded-full border border-[#E8E1D6] flex items-center justify-center text-[#A0978D] hover:text-[#1C1917] hover:border-[#C4A882] transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-[#1C1917] select-none min-w-[100px]">
                        {format(currentWeek, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                        className="w-7 h-7 rounded-full border border-[#E8E1D6] flex items-center justify-center text-[#A0978D] hover:text-[#1C1917] hover:border-[#C4A882] transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 })); setSelectedDay(new Date()); }}
                        className="px-3.5 py-1.5 rounded-full text-sm font-semibold border border-[#D9D0C5] text-[#78706A] hover:border-[#C4A882] hover:text-[#1C1917] transition"
                    >
                        Today
                    </button>
                    <Button asChild className="rounded-full bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] text-sm font-semibold px-4 py-2 h-auto gap-1.5">
                        <Link href="/appointments/new">
                            <Plus className="w-4 h-4" /> Add Appointment
                        </Link>
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-sm text-[#A0978D] animate-pulse">Loading schedule…</div>
            ) : (
                <div className="flex gap-6">
                    <div className="flex-1 min-w-0">
                        <WeekCalendar weekStart={currentWeek} appointments={appointments} onCancel={handleCancel} />
                    </div>
                    <DayViewSidebar appointments={appointments} date={selectedDay} />
                </div>
            )}

            <ArrivedModal
                appointmentId={arrivedApptId}
                open={arrivedApptId !== null}
                onClose={() => setArrivedApptId(null)}
                onSuccess={handleArrivedSuccess}
            />
            <IntakeModal
                appointmentId={intakeApptId}
                open={intakeApptId !== null}
                onClose={() => setIntakeApptId(null)}
                onSuccess={handleIntakeSuccess}
            />
        </div>
    );
}
