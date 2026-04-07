"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { clinicalApi } from '@/lib/services/clinical';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, CheckCircle, FileText, Camera, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { toast } from 'sonner';
import type { ProcedureSession } from '@/types/models';

function toDateInputValue(date: Date) {
    return format(date, 'yyyy-MM-dd');
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'PLANNED': return <Badge variant="secondary">Planned</Badge>;
        case 'STARTED': return <Badge variant="purple">Started</Badge>;
        case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
        case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
        case 'NO_SHOW': return <Badge variant="orange">No Show</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

export function SessionsListClient({ initialData }: { initialData: ProcedureSession[] }) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
    const [sessions, setSessions] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        // Assuming your backend supports ?date= filtering for sessions
        clinicalApi.sessions.list({ date: selectedDate }).then(res => {
            setSessions(res.results || []);
        }).catch(() => {
            toast.error("Failed to load sessions");
        }).finally(() => setIsLoading(false));
    }, [selectedDate]);

    const changeDate = (dayOffset: number) => {
        const current = new Date(selectedDate + 'T00:00:00');
        current.setDate(current.getDate() + dayOffset);
        setSelectedDate(toDateInputValue(current));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeDate(-1)} disabled={isLoading}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[150px]"
                    disabled={isLoading}
                />
                <Button variant="outline" size="icon" onClick={() => changeDate(1)} disabled={isLoading}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                {selectedDate !== toDateInputValue(new Date()) && (
                    <Button variant="ghost" onClick={() => setSelectedDate(toDateInputValue(new Date()))} disabled={isLoading}>
                        Today
                    </Button>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200/60 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time / Date</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Procedure</TableHead>
                            <TableHead>Therapist</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No sessions booked for today.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.map((session) => (
                                <TableRow
                                    key={session.id}
                                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => router.push(`/sessions/${session.id}`)}
                                >
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(parseISO(session.created_at), 'MMM dd, yyyy')}
                                        <div className="text-xs text-muted-foreground">
                                            {format(parseISO(session.created_at), 'hh:mm a')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {session.patient_details?.first_name} {session.patient_details?.last_name}
                                        <div className="text-xs text-muted-foreground">{session.patient_details?.phone_primary}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                                <Activity className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">{session.procedure_name || 'Unknown Procedure'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {session.provider_details?.name || 'Unassigned'}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/sessions/${session.id}`);
                                            }}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
