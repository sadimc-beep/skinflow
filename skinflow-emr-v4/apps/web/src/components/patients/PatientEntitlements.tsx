"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { billingApi } from '@/lib/services/billing';
import { clinicalApi } from '@/lib/services/clinical';
import { coreApi } from '@/lib/services/appointments';
import { mastersApi } from '@/lib/services/masters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { Provider } from '@/types/models';

interface ScheduleDialogState {
    entitlementId: number;
    procedureName: string;
    date: string;
    time: string;
    providerId: string;
    roomId: string;
}

export function PatientEntitlements({ patientId, consultationId }: { patientId: number, consultationId?: number }) {
    const router = useRouter();
    const [entitlements, setEntitlements] = useState<any[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [rooms, setRooms] = useState<{ id: number; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scheduleDialog, setScheduleDialog] = useState<ScheduleDialogState | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);

    const todayDate = format(new Date(), 'yyyy-MM-dd');
    const nowTime = format(new Date(), 'HH:mm');

    useEffect(() => {
        let mounted = true;
        Promise.allSettled([
            billingApi.entitlements.list({ patient: patientId }),
            coreApi.providers.list({ is_active: true }),
            mastersApi.procedureRooms.list(),
        ]).then(([entRes, provRes, roomRes]) => {
            if (!mounted) return;
            if (entRes.status === 'fulfilled') setEntitlements(entRes.value.results || []);
            if (provRes.status === 'fulfilled') setProviders(provRes.value.results || []);
            if (roomRes.status === 'fulfilled') setRooms((roomRes.value.results || []).filter((r: any) => r.is_active));
        }).finally(() => {
            if (mounted) setIsLoading(false);
        });
        return () => { mounted = false; };
    }, [patientId]);

    const openScheduleDialog = (en: any) => {
        setScheduleDialog({
            entitlementId: en.id,
            procedureName: en.procedure_name || 'Procedure',
            date: todayDate,
            time: nowTime,
            providerId: '',
            roomId: '',
        });
    };

    const handleScheduleSession = async () => {
        if (!scheduleDialog) return;
        setIsScheduling(true);
        try {
            const scheduledAt = `${scheduleDialog.date}T${scheduleDialog.time}:00`;
            const payload: any = {
                entitlement: scheduleDialog.entitlementId,
                status: 'PLANNED',
                scheduled_at: scheduledAt,
            };
            if (scheduleDialog.providerId) {
                payload.provider = parseInt(scheduleDialog.providerId);
            }
            if (scheduleDialog.roomId) {
                payload.room = parseInt(scheduleDialog.roomId);
            }
            if (consultationId) {
                payload.consultation = consultationId;
            }
            const newSession = await clinicalApi.sessions.create(payload);
            toast.success("Session scheduled. Redirecting to session workspace…");
            setScheduleDialog(null);
            router.push(`/sessions/${newSession.id}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to schedule session.");
        } finally {
            setIsScheduling(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" /> Entitlements & Sessions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-10 bg-slate-100 rounded w-full"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const activeEntitlements = entitlements.filter(e => e.is_active);
    const inactiveEntitlements = entitlements.filter(e => !e.is_active);

    return (
        <>
            <Card className="mt-6 border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-[#F7F3ED] rounded-t-2xl pb-4 border-b border-[#E8E1D6]">
                    <CardTitle className="flex items-center gap-2 text-[#1C1917]">
                        <PieChart className="h-5 w-5 text-[#C4A882]" /> Entitlements & Sessions
                    </CardTitle>
                    <p className="text-sm text-[#78706A]">
                        Pre-paid procedure packages. Schedule a session against any active entitlement.
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    {activeEntitlements.length === 0 ? (
                        <div className="text-center py-6 text-[#A0978D] border-2 border-dashed border-[#E8E1D6] rounded-xl bg-[#F7F3ED]/50">
                            No active pre-paid procedure packages found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeEntitlements.map((en) => (
                                <div key={en.id} className="border border-[#E8E1D6] rounded-xl p-5 flex flex-col justify-between bg-white relative overflow-hidden shadow-sm">
                                    <div className="absolute top-0 right-0 h-full w-2 bg-[#C4A882] rounded-r-xl"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-[#1C1917] text-lg">
                                                {en.procedure_name || (en.procedure_type ? 'Procedure' : 'Package')}
                                            </h4>
                                            <p className="text-sm text-[#A0978D] mt-1 font-medium italic">
                                                Purchased: {format(new Date(en.created_at), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="bg-[#F7F3ED] text-[#C4A882] border-[#C4A882]/30 px-3 py-1">
                                            {en.remaining_qty} Sessions Left
                                        </Badge>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-[#E8E1D6] grid grid-cols-3 text-center divide-x divide-[#E8E1D6]">
                                        <div>
                                            <div className="text-xs text-[#78706A] mb-1 font-semibold uppercase tracking-wider">Total</div>
                                            <div className="font-bold text-[#1C1917] text-lg">{en.total_qty}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[#78706A] mb-1 font-semibold uppercase tracking-wider">Used</div>
                                            <div className="font-bold text-[#C4705A] text-lg">{en.used_qty}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[#78706A] mb-1 font-semibold uppercase tracking-wider">Remaining</div>
                                            <div className="font-bold text-[#7A9E8A] text-lg">{en.remaining_qty}</div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Button
                                            className="w-full bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-xl h-11 font-bold transition-transform active:scale-95"
                                            disabled={en.remaining_qty <= 0}
                                            onClick={() => openScheduleDialog(en)}
                                        >
                                            <CalendarPlus className="mr-2 h-5 w-5" />
                                            Schedule Session
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Used / expired entitlements */}
                    {inactiveEntitlements.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#A0978D] mb-3">Expired / Fully Used</p>
                            <div className="space-y-2">
                                {inactiveEntitlements.map((en) => (
                                    <div key={en.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#F7F3ED]/60 border border-[#E8E1D6]">
                                        <span className="text-sm text-[#78706A] font-medium">
                                            {en.procedure_name || 'Procedure'}
                                        </span>
                                        <Badge variant="secondary">{en.used_qty} / {en.total_qty} used</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Schedule Session Dialog */}
            <Dialog open={!!scheduleDialog} onOpenChange={(open) => { if (!open) setScheduleDialog(null); }}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Schedule Session</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            {scheduleDialog?.procedureName}
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="sched-date">Date</Label>
                                <Input
                                    id="sched-date"
                                    type="date"
                                    value={scheduleDialog?.date ?? todayDate}
                                    onChange={(e) => setScheduleDialog(prev => prev ? { ...prev, date: e.target.value } : prev)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sched-time">Time</Label>
                                <Input
                                    id="sched-time"
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
                                <SelectTrigger>
                                    <SelectValue placeholder="Assign later…" />
                                </SelectTrigger>
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
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assign later…" />
                                    </SelectTrigger>
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
                        <Button onClick={handleScheduleSession} disabled={isScheduling}>
                            {isScheduling ? 'Scheduling…' : 'Schedule Session'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
