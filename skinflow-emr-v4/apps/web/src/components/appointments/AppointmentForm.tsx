"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { coreApi, appointmentsApi } from '@/lib/services/appointments';
import { patientsApi } from '@/lib/services/patients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import type { AppointmentFormData, Appointment, Provider, Patient } from '@/types/models';

interface AppointmentFormProps {
    /** When provided the form operates in edit mode — pre-fills fields and PATCHes on submit */
    appointment?: Appointment;
}

export function AppointmentForm({ appointment }: AppointmentFormProps) {
    const router = useRouter();
    const isEditing = !!appointment;

    const [providers, setProviders] = useState<Provider[]>([]);
    const [patients, setPatients]   = useState<Patient[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        Promise.all([
            coreApi.providers.list({ is_active: true }),
            patientsApi.list({ limit: 200 }),
        ])
            .then(([provRes, patRes]) => {
                setProviders(provRes.results ?? []);
                setPatients(patRes.results ?? []);
            })
            .catch(() => toast.error('Failed to load patients and providers.'))
            .finally(() => setIsLoadingData(false));
    }, []);

    // Build default datetime value — use existing appointment's time in edit mode
    function toDatetimeLocal(isoString: string) {
        const d = new Date(isoString);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const defaultDateTime = appointment
        ? toDatetimeLocal(appointment.date_time)
        : now.toISOString().slice(0, 16);

    const form = useForm<AppointmentFormData>({
        defaultValues: {
            patient:   appointment?.patient   ?? undefined,
            provider:  appointment?.provider  ?? undefined,
            date_time: defaultDateTime,
            notes:     appointment?.notes     ?? '',
        },
    });

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            const payload = {
                ...data,
                date_time: new Date(data.date_time).toISOString(),
            };
            if (isEditing) {
                await appointmentsApi.update(appointment.id, payload);
                toast.success('Appointment updated');
                router.push(`/appointments/${appointment.id}`);
            } else {
                await appointmentsApi.create(payload);
                toast.success('Appointment scheduled successfully');
                router.push('/appointments');
            }
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save appointment');
        }
    };

    const patientOptions = patients.map(p => ({
        value: p.id.toString(),
        label: `${p.first_name} ${p.last_name} — ${p.phone_primary}`,
    }));

    const providerOptions = providers.map(p => ({
        value: p.id.toString(),
        label: `Dr. ${p.user.first_name} ${p.user.last_name}${p.specialization ? ` (${p.specialization})` : ''}`,
    }));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEditing ? 'Edit Appointment' : 'Schedule Appointment'}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="patient"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Patient *</FormLabel>
                                    <FormControl>
                                        <Combobox
                                            options={patientOptions}
                                            value={field.value?.toString()}
                                            onChange={val => field.onChange(parseInt(val))}
                                            placeholder="Select patient"
                                            searchPlaceholder="Search by name or phone…"
                                            emptyText="No patients found."
                                            disabled={isLoadingData}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="provider"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provider *</FormLabel>
                                    <FormControl>
                                        <Combobox
                                            options={providerOptions}
                                            value={field.value?.toString()}
                                            onChange={val => field.onChange(parseInt(val))}
                                            placeholder="Select provider"
                                            searchPlaceholder="Search by name or specialization…"
                                            emptyText="No providers found."
                                            disabled={isLoadingData}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* TODO: Replace datetime-local with a proper date/time picker (flagged for future UX improvement) */}
                        <FormField
                            control={form.control}
                            name="date_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date & Time *</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} required />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Reason for visit…" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {isEditing ? 'Save Changes' : 'Schedule'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
