"use client";

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { patientsApi } from '@/lib/services/patients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { PatientFormData, Patient } from '@/types/models';

type PatientFormProps = {
    initialData?: Patient;
};

export function PatientForm({ initialData }: PatientFormProps) {
    const router = useRouter();
    const isEditing = !!initialData;

    const form = useForm<PatientFormData>({
        defaultValues: initialData ? {
            first_name: initialData.first_name,
            last_name: initialData.last_name,
            date_of_birth: initialData.date_of_birth || '',
            gender: initialData.gender,
            blood_group: initialData.blood_group,
            phone_primary: initialData.phone_primary,
            email: initialData.email || '',
            national_id: initialData.national_id || '',
            has_known_allergies: initialData.has_known_allergies,
            has_chronic_conditions: initialData.has_chronic_conditions,
            phone_secondary: initialData.phone_secondary || '',
            passport_number: initialData.passport_number || '',
            occupation: initialData.occupation || '',
            marital_status: initialData.marital_status || 'SINGLE',
            address: initialData.address || '',
            city: initialData.city || '',
            state: initialData.state || '',
            zip_code: initialData.zip_code || '',
            country: initialData.country || '',
            emergency_contact_name: initialData.emergency_contact_name || '',
            emergency_contact_relation: initialData.emergency_contact_relation || '',
            emergency_contact_phone: initialData.emergency_contact_phone || '',
        } : {
            first_name: '', last_name: '', phone_primary: '',
            gender: 'MALE', blood_group: 'UNKNOWN', email: '',
            national_id: '', date_of_birth: '',
            has_known_allergies: false, has_chronic_conditions: false,
            phone_secondary: '', passport_number: '',
            occupation: '', marital_status: 'SINGLE', address: '',
            city: '', state: '', zip_code: '', country: '',
            emergency_contact_name: '', emergency_contact_relation: '', emergency_contact_phone: '',
        },
    });

    const onSubmit = async (data: PatientFormData) => {
        try {
            const payload = { ...data };
            // Ensure empty date strings are converted to null for Django DateField
            if (payload.date_of_birth === '') {
                payload.date_of_birth = null as any;
            }

            if (isEditing) {
                await patientsApi.update(initialData.id, payload);
                toast.success("Patient updated successfully");
                router.push(`/patients/${initialData.id}`);
            } else {
                const newPatient = await patientsApi.create(payload);
                toast.success("Patient created successfully");
                router.push(`/patients/${newPatient.id}`);
            }
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to save patient");
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Primary identification and demographics.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={form.control} name="first_name" render={({ field }) => (
                            <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input placeholder="John" {...field} required /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="last_name" render={({ field }) => (
                            <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input placeholder="Doe" {...field} required /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                            <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem><FormLabel>Gender *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                        <SelectItem value="UNKNOWN">Unknown</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="blood_group" render={({ field }) => (
                            <FormItem><FormLabel>Blood Group</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'].map(g => (
                                            <SelectItem key={g} value={g}>{g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="marital_status" render={({ field }) => (
                            <FormItem><FormLabel>Marital Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="SINGLE">Single</SelectItem>
                                        <SelectItem value="MARRIED">Married</SelectItem>
                                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Details</CardTitle>
                        <CardDescription>How to reach the patient.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={form.control} name="phone_primary" render={({ field }) => (
                            <FormItem><FormLabel>Primary Phone *</FormLabel><FormControl><Input placeholder="+8801XXXXXXXXX" {...field} required /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone_secondary" render={({ field }) => (
                            <FormItem><FormLabel>Secondary Phone</FormLabel><FormControl><Input placeholder="+8801XXXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem className="lg:col-span-3"><FormLabel>Full Address</FormLabel><FormControl><Input placeholder="Street address..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem><FormLabel>State/Region</FormLabel><FormControl><Input placeholder="State" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="zip_code" render={({ field }) => (
                            <FormItem><FormLabel>ZIP/Postal Code</FormLabel><FormControl><Input placeholder="ZIP Code" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Emergency & Identification</CardTitle>
                        <CardDescription>Support contacts and legal IDs.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
                            <FormItem><FormLabel>Emergency Contact</FormLabel><FormControl><Input placeholder="Name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="emergency_contact_relation" render={({ field }) => (
                            <FormItem><FormLabel>Relation</FormLabel><FormControl><Input placeholder="Spouse" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="emergency_contact_phone" render={({ field }) => (
                            <FormItem><FormLabel>Emergency Phone</FormLabel><FormControl><Input placeholder="+8801XXXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="national_id" render={({ field }) => (
                            <FormItem><FormLabel>National ID (NID)</FormLabel><FormControl><Input placeholder="NID Number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="passport_number" render={({ field }) => (
                            <FormItem><FormLabel>Passport Number</FormLabel><FormControl><Input placeholder="Passport Number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="occupation" render={({ field }) => (
                            <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input placeholder="Occupation" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">Medical Alerts</CardTitle>
                        <CardDescription>Check if any apply.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <FormField control={form.control} name="has_known_allergies" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm w-full md:w-1/2">
                                <div className="space-y-0.5">
                                    <FormLabel>Known Allergies</FormLabel>
                                    <FormDescription className="text-sm text-muted-foreground mr-4">Does patient have medication/food allergies?</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="has_chronic_conditions" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm w-full md:w-1/2">
                                <div className="space-y-0.5">
                                    <FormLabel>Chronic Conditions</FormLabel>
                                    <FormDescription className="text-sm text-muted-foreground mr-4">E.g. Diabetes, Hypertension</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg">{isEditing ? 'Save Changes' : 'Create Patient'}</Button>
                </div>
            </form>
        </Form>
    );
}
