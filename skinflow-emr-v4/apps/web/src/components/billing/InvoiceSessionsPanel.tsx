"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { billingApi } from '@/lib/services/billing';
import { clinicalApi } from '@/lib/services/clinical';
import { coreApi } from '@/lib/services/appointments';
import { mastersApi } from '@/lib/services/masters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarPlus, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Provider } from '@/types/models';

interface ScheduleState {
    entitlementId: number;
    procedureName: string;
    date: string;
    time: string;
    providerId: string;
    roomId: string;
}

interface Props {
    invoiceId: number;
    patientId: number;
}

export function InvoiceSessionsPanel({ invoiceId, patientId }: Props) {
    const router = useRouter();
    const [entitlements, setEntitlements] = useState<any[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [rooms, setRooms] = useState<{ id: number; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scheduleDialog, setScheduleDialog] = useState<ScheduleState | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);

    const todayDate = format(new Date(), 'yyyy-MM-dd');
    const nowTime = format(new Date(), 'HH:mm');

    useEffect(() => {
        let mounted = true;
        Promise.allSettled([
            billingApi.entitlements.list({ invoice: invoiceId, is_active: true }),
            coreApi.providers.list({ is_active: true }),
            mastersApi.procedureRooms.list(),
        ]).then(([entRes, provRes, roomRes]) => {
            if (!mounted) return;
            if (entRes.status === 'fulfilled') setEntitlements(entRes.value.results || []);
            if (provRes.status === 'fulfilled') setProviders(provRes.value.results || []);
            if (roomRes.status === 'fulfilled') setRooms((roomRes.value.results || []).filter((r: any) => r.is_active));
        }).finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, [invoiceId]); // eslint-disable-line react-hooks/exhaustive-deps

    const openDialog = (en: any) => {
        setScheduleDialog({
            entitlementId: en.id,
            procedureName: en.procedure_name || 'Procedure',
            date: todayDate,
            time: nowTime,
            providerId: '',
            roomId: '',
        });
    };

    const handleSchedule = async () => {
        if (!scheduleDialog) return;
        setIsScheduling(true);
        try {
            const payload: any = {
                entitlement: scheduleDialog.entitlementId,
                status: 'PLANNED',
                scheduled_at: `${scheduleDialog.date}T${scheduleDialog.time}:00`,
            };
            if (scheduleDialog.providerId) payload.provider = parseInt(scheduleDialog.providerId);
            if (scheduleDialog.roomId) payload.room = parseInt(scheduleDialog.roomId);

            const newSession = await clinicalApi.sessions.create(payload);
            toast.success("Session scheduled. Opening workspace…");
            setScheduleDialog(null);
            router.push(`/sessions/${newSession.id}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to schedule session.");
        } finally {
            setIsScheduling(false);
        }
    };

    // Don't render at all if loading or no entitlements on this invoice
    if (isLoading || entitlements.length === 0) return null;

    const schedulable = entitlements.filter(e => e.remaining_qty > 0);
    const fullyScheduled = entitlements.filter(e => e.remaining_qty === 0);

    return (
        <>
            <div className="bg-[#F0F7F4] border border-[#7A9E8A]/30 rounded-xl p-5 print:hidden">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarCheck className="h-5 w-5 text-[#7A9E8A]" />
                    <h3 className="font-semibold text-[#1C1917]">Sessions to Schedule</h3>
                    <Badge variant="outline" className="ml-auto text-xs bg-white border-[#7A9E8A]/40 text-[#7A9E8A]">
                        {schedulable.length} ready
                    </Badge>
                </div>
                <p className="text-sm text-[#78706A] mb-4">
                    This invoice created procedure entitlements. Schedule the sessions below.
                </p>
                <div className="space-y-3">
                    {schedulable.map(en => (
                        <div key={en.id} className="flex items-center justify-between bg-white rounded-lg border border-[#E8E1D6] px-4 py-3">
                            <div>
                                <p className="font-medium text-[#1C1917] text-sm">{en.procedure_name || 'Procedure'}</p>
                                <p className="text-xs text-[#A0978D] mt-0.5">
                                    {en.remaining_qty} of {en.total_qty} sessions remaining
                                </p>
                            </div>
                            <Button
                                size="sm"
                                className="h-9 bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-lg"
                                onClick={() => openDialog(en)}
                            >
                                <CalendarPlus className="h-4 w-4 mr-1.5" />
                                Schedule
                            </Button>
                        </div>
                    ))}
                    {fullyScheduled.map(en => (
                        <div key={en.id} className="flex items-center justify-between bg-white/60 rounded-lg border border-[#E8E1D6] px-4 py-3 opacity-60">
                            <div>
                                <p className="font-medium text-[#78706A] text-sm">{en.procedure_name || 'Procedure'}</p>
                                <p className="text-xs text-[#A0978D] mt-0.5">All sessions scheduled</p>
                            </div>
                            <Badge variant="success" className="text-xs">Done</Badge>
                        </div>
                    ))}
                </div>
            </div>

            {/* Schedule Dialog */}
            <Dialog open={!!scheduleDialog} onOpenChange={(open) => { if (!open) setScheduleDialog(null); }}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Schedule Session</DialogTitle>
                        <p className="text-sm text-muted-foreground">{scheduleDialog?.procedureName}</p>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-sched-date">Date</Label>
                                <Input
                                    id="inv-sched-date"
                                    type="date"
                                    value={scheduleDialog?.date ?? todayDate}
                                    onChange={(e) => setScheduleDialog(prev => prev ? { ...prev, date: e.target.value } : prev)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-sched-time">Time</Label>
                                <Input
                                    id="inv-sched-time"
                                    type="time"
                                    value={scheduleDialog?.time ?? nowTime}
                                    onChange={(e) => setScheduleDialog(prev => prev ? { ...prev, time: e.target.value } : prev)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Therapist / Provider <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Select
                                value={scheduleDialog?.providerId ?? ''}
                                onValueChange={(val) => setScheduleDialog(prev => prev ? { ...prev, providerId: val } : prev)}
                            >
                                <SelectTrigger><SelectValue placeholder="Assign later…" /></SelectTrigger>
                                <SelectContent>
                                    {providers.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.user_details.first_name} {p.user_details.last_name}
                                            {p.provider_type === 'THERAPIST' && <span className="text-muted-foreground ml-1">· Therapist</span>}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {rooms.length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Treatment Room <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                <Select
                                    value={scheduleDialog?.roomId ?? ''}
                                    onValueChange={(val) => setScheduleDialog(prev => prev ? { ...prev, roomId: val } : prev)}
                                >
                                    <SelectTrigger><SelectValue placeholder="Assign later…" /></SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(r => (
                                            <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleDialog(null)}>Cancel</Button>
                        <Button onClick={handleSchedule} disabled={isScheduling}>
                            {isScheduling ? 'Scheduling…' : 'Schedule Session'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
