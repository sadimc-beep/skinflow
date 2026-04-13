"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { clinicalApi } from '@/lib/services/clinical';
import { useAuth } from '@/lib/context/AuthContext';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Activity, Users, User } from 'lucide-react';
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
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
    const [sessions, setSessions] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    // Default to "My Sessions" if the logged-in user is a provider
    const [mySessionsOnly, setMySessionsOnly] = useState(!!user?.provider_id);

    useEffect(() => {
        setIsLoading(true);
        const params: Parameters<typeof clinicalApi.sessions.list>[0] = { date: selectedDate };
        if (mySessionsOnly && user?.provider_id) {
            params.provider = user.provider_id;
        }
        clinicalApi.sessions.list(params).then(res => {
            setSessions(res.results || []);
        }).catch(() => {
            toast.error("Failed to load sessions");
        }).finally(() => setIsLoading(false));
    }, [selectedDate, mySessionsOnly, user?.provider_id]);

    const changeDate = (dayOffset: number) => {
        const current = new Date(selectedDate + 'T00:00:00');
        current.setDate(current.getDate() + dayOffset);
        setSelectedDate(toDateInputValue(current));
    };

    const formatSessionTime = (session: ProcedureSession) => {
        const dt = session.scheduled_at ?? session.created_at;
        try {
            return {
                date: format(parseISO(dt), 'MMM dd, yyyy'),
                time: format(parseISO(dt), 'hh:mm a'),
                isScheduled: !!session.scheduled_at,
            };
        } catch {
            return { date: '—', time: '—', isScheduled: false };
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Date navigation */}
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

                {/* My Sessions / All Sessions toggle — only shown if the logged-in user has a provider profile */}
                {user?.provider_id && (
                    <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 p-1 bg-slate-50">
                        <Button
                            size="sm"
                            variant={mySessionsOnly ? 'default' : 'ghost'}
                            className="h-8 px-3 text-xs"
                            onClick={() => setMySessionsOnly(true)}
                        >
                            <User className="h-3.5 w-3.5 mr-1.5" /> My Sessions
                        </Button>
                        <Button
                            size="sm"
                            variant={!mySessionsOnly ? 'default' : 'ghost'}
                            className="h-8 px-3 text-xs"
                            onClick={() => setMySessionsOnly(false)}
                        >
                            <Users className="h-3.5 w-3.5 mr-1.5" /> All Sessions
                        </Button>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200/60 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Scheduled Time</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Procedure</TableHead>
                            <TableHead>Therapist</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Loading…
                                </TableCell>
                            </TableRow>
                        ) : sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No sessions scheduled for this date.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.map((session) => {
                                const { date, time, isScheduled } = formatSessionTime(session);
                                return (
                                    <TableRow
                                        key={session.id}
                                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => router.push(`/sessions/${session.id}`)}
                                    >
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {date}
                                            <div className="text-xs text-muted-foreground">
                                                {time}
                                                {!isScheduled && (
                                                    <span className="ml-1 text-amber-500">(created)</span>
                                                )}
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
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
