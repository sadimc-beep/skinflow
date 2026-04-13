'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clinicalApi } from '@/lib/services/clinical';
import { appointmentsApi } from '@/lib/services/appointments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { ClinicalIntake } from '@/types/models';

export default function IntakePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [existingIntake, setExistingIntake] = useState<ClinicalIntake | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        blood_pressure: '',
        pulse: '',
        weight: '',
        height: '',
        chief_complaint: '',
    });

    useEffect(() => {
        clinicalApi.intake.getByAppointment(id)
            .then((records) => {
                if (records.length > 0) {
                    const intake = records[0];
                    setExistingIntake(intake);
                    setForm({
                        blood_pressure: intake.blood_pressure ?? '',
                        pulse: intake.pulse ?? '',
                        weight: intake.weight ?? '',
                        height: intake.height ?? '',
                        chief_complaint: intake.chief_complaint ?? '',
                    });
                }
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (existingIntake) {
                await clinicalApi.intake.update(existingIntake.id, form);
            } else {
                await clinicalApi.intake.create({ ...form, appointment: parseInt(id) });
            }
            // Mark appointment as ready for consultation
            await appointmentsApi.updateStatus(parseInt(id), 'READY_FOR_CONSULT');
            toast.success('Vitals recorded — patient ready for consultation');
            router.push(`/appointments/${id}`);
        } catch (e: any) {
            toast.error(e.message || 'Failed to save vitals');
        } finally {
            setIsSaving(false);
        }
    };

    const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#A0978D]" />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/appointments" className="hover:text-primary transition-colors">Appointments</Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <Link href={`/appointments/${id}`} className="hover:text-primary transition-colors">Appointment #{id}</Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-foreground font-medium">Record Vitals</span>
            </div>

            <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Record Vitals</h2>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Clinical Intake</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="bp">Blood Pressure</Label>
                            <Input id="bp" placeholder="e.g. 120/80" value={form.blood_pressure} onChange={set('blood_pressure')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="pulse">Pulse (bpm)</Label>
                            <Input id="pulse" placeholder="e.g. 72" value={form.pulse} onChange={set('pulse')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input id="weight" placeholder="e.g. 65" value={form.weight} onChange={set('weight')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="height">Height (cm)</Label>
                            <Input id="height" placeholder="e.g. 165" value={form.height} onChange={set('height')} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="complaint">Chief Complaint</Label>
                        <Textarea
                            id="complaint"
                            placeholder="Patient's primary concern today…"
                            rows={3}
                            value={form.chief_complaint}
                            onChange={set('chief_complaint')}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-3">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save & Mark Ready'}
                </Button>
                <Button variant="outline" onClick={() => router.push(`/appointments/${id}`)}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
