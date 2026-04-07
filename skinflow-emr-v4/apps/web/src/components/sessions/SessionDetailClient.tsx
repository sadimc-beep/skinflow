"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { clinicalApi } from '@/lib/services/clinical';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Play, CheckCircle, FileText, Camera, Upload, AlertTriangle, ChevronRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { BotoxForm } from './SpecializedForms/BotoxForm';
import { FillerForm } from './SpecializedForms/FillerForm';
import { LHRForm } from './SpecializedForms/LHRForm';
import { ClinicalRequisitionForm } from './ClinicalRequisitionForm';
import { ConsentSigningModal } from '@/components/sf/ConsentSigningModal';
import type { ProcedureSession } from '@/types/models';
import Link from 'next/link';

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

export function SessionDetailClient({ initialData }: { initialData: ProcedureSession }) {
    const router = useRouter();
    const [session, setSession] = useState(initialData);
    const [isUpdating, setIsUpdating] = useState(false);

    // Consent states
    const [showConsentModal, setShowConsentModal] = useState(false);

    // Photo states
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [clinicalPhotoUrl, setClinicalPhotoUrl] = useState<string | null>(
        (initialData as any).clinical_photo_url ?? null
    );

    const hasConsent = session.consent_form !== null;
    const hasPhoto = session.clinical_photo !== null;
    const canStart = hasConsent && hasPhoto && session.status === 'PLANNED';

    const patientName = `${session.patient_details?.first_name || ''} ${session.patient_details?.last_name || ''}`.trim();

    const handleConsentSuccess = () => {
        setShowConsentModal(false);
        setSession(prev => ({ ...prev, consent_form: -1 })); // truthy sentinel until refresh
        toast.success('Consent form signed and attached.');
        router.refresh();
    };

    const handleUploadPhoto = async () => {
        if (!photoFile) {
            toast.warning('Please select a photo file.');
            return;
        }
        setIsUploadingPhoto(true);
        try {
            const form = new FormData();
            form.append('photo', photoFile);
            form.append('category', 'PRE_SESSION');
            // Use the existing upload_photo action via fetch directly (FormData)
            const res = await clinicalApi.sessions.uploadPhoto(session.id, photoFile) as { id: number; photo_url: string };
            setSession(prev => ({ ...prev, clinical_photo: res.id }));
            setClinicalPhotoUrl(res.photo_url ?? null);
            toast.success('Clinical photo attached.');
            router.refresh();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload photo.');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleStartSession = async () => {
        setIsUpdating(true);
        try {
            await clinicalApi.sessions.start(session.id);
            setSession(prev => ({ ...prev, status: 'STARTED' }));
            toast.success("Session Started Successfully");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to start session. Ensure consent and photo are attached.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCompleteSession = async () => {
        setIsUpdating(true);
        try {
            // Updating status to COMPLETED via default update endpoint
            await clinicalApi.sessions.update(session.id, { status: 'COMPLETED' });
            setSession(prev => ({ ...prev, status: 'COMPLETED' }));
            toast.success("Session Completed");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to complete session.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveSpecializedData = async (data: Record<string, any>) => {
        setIsUpdating(true);
        try {
            await clinicalApi.sessions.update(session.id, { specialized_data: data });
            setSession(prev => ({ ...prev, specialized_data: data }));
            toast.success("Clinical charting saved");
        } catch (error: any) {
            toast.error(error.message || "Failed to save clinical data");
        } finally {
            setIsUpdating(false);
        }
    };

    const renderSpecializedForm = () => {
        const procName = (session.procedure_name || '').toLowerCase();
        const readonly = session.status === 'COMPLETED';
        const initData = session.specialized_data || {};

        if (procName.includes('botox') || procName.includes('toxin') || procName.includes('dysport')) {
            return <BotoxForm initialData={initData} onSave={handleSaveSpecializedData} readonly={readonly} clinicalPhotoUrl={clinicalPhotoUrl} />;
        }
        if (procName.includes('filler') || procName.includes('juvederm') || procName.includes('restylane')) {
            return <FillerForm initialData={initData} onSave={handleSaveSpecializedData} readonly={readonly} clinicalPhotoUrl={clinicalPhotoUrl} />;
        }
        if (procName.includes('laser') || procName.includes('lhr') || procName.includes('hair removal')) {
            return <LHRForm initialData={initData} onSave={handleSaveSpecializedData} readonly={readonly} />;
        }
        return null;
    };

    const isSessionReadonly = session.status === 'COMPLETED';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {showConsentModal && (
                <ConsentSigningModal
                    sessionId={session.id}
                    patientName={patientName}
                    onSuccess={handleConsentSuccess}
                    onCancel={() => setShowConsentModal(false)}
                />
            )}

            <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Link href="/sessions" className="hover:text-primary transition-colors">
                    Daily Sessions
                </Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-foreground font-medium">Session #{session.id}</span>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Procedure Session</h2>
                    <p className="text-muted-foreground mt-1">
                        {format(parseISO(session.created_at), 'MMMM dd, yyyy - hh:mm a')}
                    </p>
                </div>
                <div>{getStatusBadge(session.status)}</div>
            </div>

            {/* Medical Alerts */}
            {(session.patient_details as any)?.has_known_allergies && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-red-800 font-semibold">Patient has strict known allergies</h4>
                        <p className="text-red-700 text-sm mt-1">Review patient record thoroughly before administering any compounds.</p>
                    </div>
                </div>
            )}

            {(session.patient_details as any)?.has_chronic_conditions && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-amber-800 font-semibold">Patient has active chronic conditions</h4>
                        <p className="text-amber-700 text-sm mt-1">Ensure procedure is safely contraindicated against existing conditions.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Patient</p>
                            <p className="font-semibold text-gray-900">
                                {session.patient_details?.first_name} {session.patient_details?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{session.patient_details?.phone_primary}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Procedure</p>
                            <p className="text-gray-900">{session.procedure_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Therapist</p>
                            <p className="text-gray-900">{session.provider_details?.name || 'Unassigned'}</p>
                        </div>
                        {session.status === 'COMPLETED' && session.consumable_cost !== undefined && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Consumable Cost</p>
                                <p className="text-gray-900 font-mono">
                                    ৳ {parseFloat(session.consumable_cost || '0').toFixed(2)}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Requirements Checklist */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Pre-Session Requirements</CardTitle>
                        <CardDescription>All items must be completed before starting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Consent */}
                        <div className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${hasConsent ? 'bg-green-50/50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`flex items-center font-medium ${hasConsent ? 'text-green-700' : 'text-slate-700'}`}>
                                    <FileText className={`mr-2 h-5 w-5 ${hasConsent ? 'text-green-600' : 'text-slate-400'}`} />
                                    Signed Consent Form
                                </span>
                                {hasConsent ? (
                                    <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Attached</Badge>
                                ) : (
                                    <Badge variant="warning">Pending</Badge>
                                )}
                            </div>
                            {!hasConsent && session.status === 'PLANNED' && (
                                <Button size="sm" onClick={() => setShowConsentModal(true)} className="h-9 self-start">
                                    <FileText className="h-4 w-4 mr-2" /> Collect Consent
                                </Button>
                            )}
                        </div>

                        {/* Photo */}
                        <div className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${hasPhoto ? 'bg-green-50/50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`flex items-center font-medium ${hasPhoto ? 'text-green-700' : 'text-slate-700'}`}>
                                    <Camera className={`mr-2 h-5 w-5 ${hasPhoto ? 'text-green-600' : 'text-slate-400'}`} />
                                    Clinical Baseline Photo
                                </span>
                                {hasPhoto ? (
                                    <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Attached</Badge>
                                ) : (
                                    <Badge variant="warning">Pending</Badge>
                                )}
                            </div>
                            {!hasPhoto && session.status === 'PLANNED' && (
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                                        className="h-9 text-sm bg-white"
                                    />
                                    <Button size="sm" onClick={handleUploadPhoto} disabled={isUploadingPhoto || !photoFile} className="h-9 shrink-0">
                                        <Upload className="h-4 w-4 mr-2" /> Upload
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Start Action */}
                        <div className="pt-2 mt-2 flex justify-end">
                            {session.status === 'PLANNED' && (
                                <Button
                                    className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
                                    disabled={!canStart || isUpdating}
                                    onClick={handleStartSession}
                                >
                                    <Play className="mr-2 h-5 w-5 fill-current" /> Start Session Now
                                </Button>
                            )}
                            {session.status === 'STARTED' && (
                                <Button
                                    className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                                    disabled={isUpdating}
                                    onClick={handleCompleteSession}
                                >
                                    <CheckCircle className="mr-2 h-5 w-5" /> Mark as Completed
                                </Button>
                            )}
                            {session.status === 'COMPLETED' && (
                                <div className="w-full h-12 flex items-center justify-center bg-slate-100 text-slate-500 rounded-md border border-slate-200 font-medium">
                                    <Lock className="w-4 h-4 mr-2" /> Session Finalized & Locked
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Specialized Charting Rendered Below */}
            {renderSpecializedForm()}

            {/* In-Session Inventory Requisition */}
            {session.status !== 'PLANNED' && (
                <ClinicalRequisitionForm sessionId={session.id} readonly={isSessionReadonly} />
            )}

        </div>
    );
}
