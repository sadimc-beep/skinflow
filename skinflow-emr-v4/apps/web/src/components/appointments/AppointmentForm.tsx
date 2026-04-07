"use client";

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { appointmentsApi } from '@/lib/services/appointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { AppointmentFormData, Provider, Patient } from '@/types/models';

type AppointmentFormProps = {
    providers: Provider[];
    // For simplicity, we are passing all patients to the client. 
    // In production, this would be an async searchable combobox.
    patients: Patient[];
};

export function AppointmentForm({ providers, patients }: AppointmentFormProps) {
    const router = useRouter();

    // Get current datetime formatted for datetime-local input
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const defaultDateTime = now.toISOString().slice(0, 16);

    const form = useForm<AppointmentFormData>({
        defaultValues: {
            patient: undefined,
            provider: undefined,
            date_time: defaultDateTime,
            notes: '',
        },
    });

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            // API expects ISO 8601 string, input datetime-local gives "YYYY-MM-DDThh:mm"
            const payload = {
                ...data,
                date_time: new Date(data.date_time).toISOString()
            };
            await appointmentsApi.create(payload);
            toast.success("Appointment scheduled successfully");
            router.push('/appointments');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to schedule appointment");
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule Appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="patient"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Patient *</FormLabel>
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {patients.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.first_name} {p.last_name} ({p.phone_primary})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {providers.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    Dr. {p.user.first_name} {p.user.last_name} ({p.specialization})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                        <Input placeholder="Reason for visit..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit">Schedule</Button>
                </div>
            </form>
        </Form>
    );
}
