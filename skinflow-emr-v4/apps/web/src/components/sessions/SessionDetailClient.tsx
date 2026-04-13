"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { clinicalApi } from '@/lib/services/clinical';
import { billingApi } from '@/lib/services/billing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, CheckCircle, FileText, Camera, AlertTriangle, ChevronRight, Lock, Images, Save, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { BotoxForm } from './SpecializedForms/BotoxForm';
import { FillerForm } from './SpecializedForms/FillerForm';
import { LHRForm } from './SpecializedForms/LHRForm';
import { ClinicalRequisitionForm } from './ClinicalRequisitionForm';
import { ConsentSigningModal } from '@/components/sf/ConsentSigningModal';
import { CameraCapture } from '@/components/sf/CameraCapture';
import { MultiAngleCapture } from '@/components/sf/MultiAngleCapture';
import type { ProcedureSession, Entitlement } from '@/types/models';
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
    const [clinicalPhotoUrl, setClinicalPhotoUrl] = useState<string | null>(
        (initialData as any).clinical_photo_url ?? null
    );
    const [showSingleCamera, setShowSingleCamera] = useState(false);
    const [showMultiCapture, setShowMultiCapture] = useState(false);
    const [multiCaptureCategory, setMultiCaptureCategory] = useState<'PRE_SESSION' | 'POST_SESSION'>('PRE_SESSION');

    // Entitlement fallback selector — only needed when no entitlement is linked
    const [availableEntitlements, setAvailableEntitlements] = useState<Entitlement[]>([]);
    const [selectedEntitlementId, setSelectedEntitlementId] = useState<string>('');
    const [isLinkingEntitlement, setIsLinkingEntitlement] = useState(false);

    // Notes
    const [notes, setNotes] = useState(session.notes ?? '');
    const [notesDirty, setNotesDirty] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    const patientId = session.patient_details?.id ?? null;
    const hasEntitlement = session.entitlement !== null;
    const hasConsent = session.consent_form !== null;
    const hasPhoto = session.clinical_photo !== null;
    const canStart = hasEntitlement && hasPhoto && session.status === 'PLANNED';

    const patientName = `${session.patient_details?.first_name || ''} ${session.patient_details?.last_name || ''}`.trim();

    // Load available entitlements if session has no entitlement linked and is still PLANNED
    useEffect(() => {
        if (!hasEntitlement && session.status === 'PLANNED' && patientId) {
            billingApi.entitlements.list({ patient: patientId, is_active: true })
                .then(res => {
                    const active = (res.results || []).filter((e: Entitlement) => e.remaining_qty > 0);
                    setAvailableEntitlements(active);
                })
                .catch(() => {
                    // non-fatal — selector just stays empty
                });
        }
    }, [hasEntitlement, session.status, patientId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLinkEntitlement = async () => {
        if (!selectedEntitlementId) return;
        setIsLinkingEntitlement(true);
        try {
            const updated = await clinicalApi.sessions.update(session.id, { entitlement: parseInt(selectedEntitlementId) });
            setSession(prev => ({
                ...prev,
                entitlement: updated.entitlement,
                entitlement_details: updated.entitlement_details,
                procedure_name: updated.procedure_name ?? prev.procedure_name,
            }));
            toast.success('Entitlement linked successfully.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to link entitlement.');
        } finally {
            setIsLinkingEntitlement(false);
        }
    };

    const handleConsentSuccess = () => {
        setShowConsentModal(false);
        setSession(prev => ({ ...prev, consent_form: -1 }));
        toast.success('Consent form signed and attached.');
        router.refresh();
    };

    const handleSinglePhotoCapture = async (photoId: number) => {
        setShowSingleCamera(false);
        setSession(prev => ({ ...prev, clinical_photo: photoId }));
        try {
            const photoData = await clinicalApi.photos.get(photoId);
            setClinicalPhotoUrl(photoData.photo_url ?? null);
        } catch {
            // non-critical
        }
        toast.success('Clinical photo attached.');
        router.refresh();
    };

    const handleMultiCaptureComplete = (photoIds: number[]) => {
        setShowMultiCapture(false);
        if (photoIds.length > 0) {
            setSession(prev => ({ ...prev, clinical_photo: photoIds[photoIds.length - 1] }));
            toast.success(`${photoIds.length} photo${photoIds.length > 1 ? 's' : ''} captured and attached.`);
        } else {
            toast.info('No photos were captured.');
        }
        router.refresh();
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

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            await clinicalApi.sessions.update(session.id, { notes });
            setSession(prev => ({ ...prev, notes }));
            setNotesDirty(false);
            toast.success("Notes saved.");
        } catch (error: any) {
            toast.error(error.message || "Failed to save notes.");
        } finally {
            setIsSavingNotes(false);
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
                        {session.scheduled_at
                            ? format(parseISO(session.scheduled_at), 'MMMM dd, yyyy - hh:mm a')
                            : format(parseISO(session.created_at), 'MMMM dd, yyyy - hh:mm a')}
                    </p>
                </div>
                <div>{getStatusBadge(session.status)}</div>
            </div>

            {/* Medical Alerts */}
            {session.patient_details?.has_known_allergies && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-red-800 font-semibold">Patient has strict known allergies</h4>
                        <p className="text-red-700 text-sm mt-1">Review patient record thoroughly before administering any compounds.</p>
                    </div>
                </div>
            )}

            {session.patient_details?.has_chronic_conditions && (
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
                    <CardContent className="space-y-4">

                        {/* 1. Entitlement */}
                        <div className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${hasEntitlement ? 'bg-green-50/50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`flex items-center font-medium ${hasEntitlement ? 'text-green-700' : 'text-slate-700'}`}>
                                    <Ticket className={`mr-2 h-5 w-5 ${hasEntitlement ? 'text-green-600' : 'text-slate-400'}`} />
                                    Session Entitlement
                                </span>
                                {hasEntitlement ? (
                                    <Badge variant="success">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        {session.entitlement_details?.procedure_name || 'Linked'} — {session.entitlement_details?.remaining_qty ?? '?'} left
                                    </Badge>
                                ) : (
                                    <Badge variant="warning">Not Linked</Badge>
                                )}
                            </div>
                            {!hasEntitlement && session.status === 'PLANNED' && (
                                availableEntitlements.length > 0 ? (
                                    <div className="flex gap-2 items-center">
                                        <Select value={selectedEntitlementId} onValueChange={setSelectedEntitlementId}>
                                            <SelectTrigger className="flex-1 h-9 text-sm">
                                                <SelectValue placeholder="Select entitlement…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableEntitlements.map(e => (
                                                    <SelectItem key={e.id} value={String(e.id)}>
                                                        {e.procedure_name || 'Procedure'} — {e.remaining_qty} of {e.total_qty} remaining
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            size="sm"
                                            className="h-9 shrink-0"
                                            disabled={!selectedEntitlementId || isLinkingEntitlement}
                                            onClick={handleLinkEntitlement}
                                        >
                                            Link
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                                        No active entitlements found for this patient. Please ensure the procedure invoice is paid first.
                                    </p>
                                )
                            )}
                        </div>

                        {/* 2. Consent (Recommended, not required) */}
                        <div className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${hasConsent ? 'bg-green-50/50 border-green-200' : 'bg-blue-50/40 border-blue-200'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`flex items-center font-medium ${hasConsent ? 'text-green-700' : 'text-slate-700'}`}>
                                    <FileText className={`mr-2 h-5 w-5 ${hasConsent ? 'text-green-600' : 'text-slate-400'}`} />
                                    Signed Consent Form
                                </span>
                                {hasConsent ? (
                                    <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Attached</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-blue-600 border-blue-300">Recommended</Badge>
                                )}
                            </div>
                            {!hasConsent && session.status === 'PLANNED' && (
                                <Button size="sm" variant="outline" onClick={() => setShowConsentModal(true)} className="h-9 self-start border-blue-300 text-blue-700 hover:bg-blue-50">
                                    <FileText className="h-4 w-4 mr-2" /> Collect Consent
                                </Button>
                            )}
                        </div>

                        {/* 3. Photo */}
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
                                <div className="flex flex-col gap-2 mt-1">
                                    <Button
                                        size="sm"
                                        className="h-10 self-start"
                                        onClick={() => setShowSingleCamera(true)}
                                    >
                                        <Camera className="h-4 w-4 mr-2" /> Take Photo
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-10 self-start"
                                        onClick={() => { setMultiCaptureCategory('PRE_SESSION'); setShowMultiCapture(true); }}
                                    >
                                        <Images className="h-4 w-4 mr-2" /> Capture 5-Angle Pre-Session Photos
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Start / Complete / Locked */}
                        <div className="pt-2 mt-2 flex justify-end">
                            {session.status === 'PLANNED' && (
                                <Button
                                    className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
                                    disabled={!canStart || isUpdating}
                                    onClick={handleStartSession}
                                    title={!hasEntitlement ? 'Link an entitlement first' : !hasPhoto ? 'Capture a baseline photo first' : undefined}
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

            {/* Post-Session Photos */}
            {session.status === 'STARTED' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Images className="h-5 w-5" />
                            Post-Session Photos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={() => { setMultiCaptureCategory('POST_SESSION'); setShowMultiCapture(true); }}
                        >
                            <Camera className="h-4 w-4 mr-2" /> Capture 5-Angle Post-Session Photos
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Specialized Charting */}
            {renderSpecializedForm()}

            {/* Session Notes — shown for all procedures, writable while not COMPLETED */}
            {session.status !== 'PLANNED' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Session Notes</CardTitle>
                        <CardDescription>Clinical observations, tolerability, follow-up instructions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Textarea
                            placeholder="Enter session notes…"
                            value={notes}
                            onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                            disabled={isSessionReadonly}
                            rows={4}
                            className="resize-none"
                        />
                        {!isSessionReadonly && (
                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    onClick={handleSaveNotes}
                                    disabled={!notesDirty || isSavingNotes}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSavingNotes ? 'Saving…' : 'Save Notes'}
                                </Button>
                                {!notesDirty && notes && (
                                    <span className="text-xs text-green-600 font-medium">Saved</span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* In-Session Inventory Requisition */}
            {session.status !== 'PLANNED' && (
                <ClinicalRequisitionForm sessionId={session.id} readonly={isSessionReadonly} />
            )}

            {/* Camera modals */}
            {showSingleCamera && (
                <CameraCapture
                    patientId={session.patient_details?.id ?? 0}
                    sessionId={session.id}
                    category="PRE_SESSION"
                    overlay="face_front"
                    onCapture={handleSinglePhotoCapture}
                    onCancel={() => setShowSingleCamera(false)}
                />
            )}
            {showMultiCapture && (
                <MultiAngleCapture
                    patientId={session.patient_details?.id ?? 0}
                    sessionId={session.id}
                    category={multiCaptureCategory}
                    onComplete={handleMultiCaptureComplete}
                    onCancel={() => setShowMultiCapture(false)}
                />
            )}
        </div>
    );
}
