'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { clinicalApi } from '@/lib/services/clinical';
import { patientsApi } from '@/lib/services/patients';
import { coreApi } from '@/lib/services/appointments';
import { useDebounce } from '@/lib/hooks/use-debounce';
import type { Patient, Provider } from '@/types/models';

type FormValues = {
    patient: Patient | null;
    provider: Provider | null;
    chief_complaint: string;
};

export default function NewWalkInPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Patient combobox
    const [patientOpen, setPatientOpen] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState<Patient[]>([]);
    const debouncedPatientSearch = useDebounce(patientSearch, 300);

    // Provider combobox
    const [providerOpen, setProviderOpen] = useState(false);
    const [providers, setProviders] = useState<Provider[]>([]);

    const form = useForm<FormValues>({
        defaultValues: {
            patient: null,
            provider: null,
            chief_complaint: '',
        },
    });

    // Search patients as user types
    useEffect(() => {
        patientsApi
            .list({ search: debouncedPatientSearch, limit: 20 })
            .then((res) => setPatientResults(res.results || []))
            .catch(() => toast.error('Failed to search patients'));
    }, [debouncedPatientSearch]);

    // Load providers once
    useEffect(() => {
        coreApi.providers
            .list({ is_active: true })
            .then((res) => setProviders(res.results || []))
            .catch(() => toast.error('Failed to load providers'));
    }, []);

    const onSubmit = async (data: FormValues) => {
        if (!data.patient) {
            toast.error('Please select a patient.');
            return;
        }
        if (!data.provider) {
            toast.error('Please select a provider.');
            return;
        }
        setIsSubmitting(true);
        try {
            const consultation = await clinicalApi.consultations.create({
                patient: data.patient.id,
                provider: data.provider.id,
                chief_complaint: data.chief_complaint,
            });
            toast.success('Consultation started.');
            router.push(`/consultations/${consultation.id}`);
        } catch (error) {
            toast.error((error as Error).message || 'Failed to create consultation.');
            setIsSubmitting(false);
        }
    };

    const selectedPatient = form.watch('patient');
    const selectedProvider = form.watch('provider');

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/consultations')}
                    className="text-[#78706A] hover:text-[#1C1917] hover:bg-[#F7F3ED]"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">New Walk-in</h2>
                    <p className="text-[#78706A] text-sm mt-1">Start a consultation without a prior appointment.</p>
                </div>
            </div>

            <div className="border border-[#E8E1D6] rounded-2xl bg-white shadow-sm p-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Patient */}
                        <FormField
                            control={form.control}
                            name="patient"
                            render={() => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="text-[#1C1917] font-bold">Patient *</FormLabel>
                                    <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        'w-full justify-between bg-white border-[#D9D0C5] text-[#1C1917] h-10',
                                                        !selectedPatient && 'text-[#A0978D] font-normal',
                                                    )}
                                                >
                                                    {selectedPatient
                                                        ? `${selectedPatient.first_name} ${selectedPatient.last_name}${selectedPatient.phone_primary ? ` — ${selectedPatient.phone_primary}` : ''}`
                                                        : 'Search patient by name or phone…'}
                                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[480px] p-0 border-[#D9D0C5]" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Search by name or phone…"
                                                    value={patientSearch}
                                                    onValueChange={setPatientSearch}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No patients found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {patientResults.map((p) => (
                                                            <CommandItem
                                                                key={p.id}
                                                                value={p.id.toString()}
                                                                onSelect={() => {
                                                                    form.setValue('patient', p);
                                                                    setPatientOpen(false);
                                                                }}
                                                            >
                                                                <div className="flex justify-between w-full">
                                                                    <span className="font-medium">{p.first_name} {p.last_name}</span>
                                                                    <span className="text-muted-foreground text-sm">{p.phone_primary}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Provider */}
                        <FormField
                            control={form.control}
                            name="provider"
                            render={() => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="text-[#1C1917] font-bold">Provider *</FormLabel>
                                    <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        'w-full justify-between bg-white border-[#D9D0C5] text-[#1C1917] h-10',
                                                        !selectedProvider && 'text-[#A0978D] font-normal',
                                                    )}
                                                >
                                                    {selectedProvider
                                                        ? `Dr. ${selectedProvider.user_details?.first_name ?? ''} ${selectedProvider.user_details?.last_name ?? ''}`.trim()
                                                        : 'Select a provider…'}
                                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[480px] p-0 border-[#D9D0C5]" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search provider…" />
                                                <CommandList>
                                                    <CommandEmpty>No providers found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {providers.map((p) => (
                                                            <CommandItem
                                                                key={p.id}
                                                                value={`${p.user_details?.first_name ?? ''} ${p.user_details?.last_name ?? ''} ${p.specialization}`}
                                                                onSelect={() => {
                                                                    form.setValue('provider', p);
                                                                    setProviderOpen(false);
                                                                }}
                                                            >
                                                                <div className="flex justify-between w-full">
                                                                    <span className="font-medium">Dr. {p.user_details?.first_name} {p.user_details?.last_name}</span>
                                                                    <span className="text-muted-foreground text-sm">{p.specialization}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Chief Complaint */}
                        <FormField
                            control={form.control}
                            name="chief_complaint"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#1C1917] font-bold">
                                        Chief Complaint <span className="text-[#A0978D] font-normal">(optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g. Acne breakout on forehead, wants Botox consultation…"
                                            className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#1C1917] hover:bg-[#3E3832] text-white h-12 text-base font-bold rounded-xl"
                        >
                            <UserPlus className="mr-2 h-5 w-5 text-[#C4A882]" />
                            {isSubmitting ? 'Starting consultation…' : 'Start Walk-in Consultation'}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
