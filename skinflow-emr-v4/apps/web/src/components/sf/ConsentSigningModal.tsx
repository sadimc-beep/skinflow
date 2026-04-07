'use client';

import { useRef, useState, useEffect } from 'react';
import { clinicalApi } from '@/lib/services/clinical';
import { SignaturePad, type SignaturePadHandle } from './SignaturePad';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';

interface ConsentTemplate {
    id: number;
    name: string;
    content: string;
}

interface ConsentSigningModalProps {
    sessionId: number;
    patientName: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ConsentSigningModal({
    sessionId,
    patientName,
    onSuccess,
    onCancel,
}: ConsentSigningModalProps) {
    const padRef = useRef<SignaturePadHandle>(null);
    const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'select' | 'sign' | 'done'>('select');

    useEffect(() => {
        clinicalApi.sessions.listConsentTemplates()
            .then(res => {
                const list = res.results || [];
                setTemplates(list);
                // Auto-select if only one template
                if (list.length === 1) {
                    setSelectedTemplate(list[0]);
                    setStep('sign');
                }
            })
            .catch(() => setError('Could not load consent templates.'))
            .finally(() => setLoadingTemplates(false));
    }, []);

    const handleSubmit = async () => {
        if (!selectedTemplate) return;
        if (padRef.current?.isEmpty()) {
            setError('Please draw your signature before submitting.');
            return;
        }
        setError('');
        setSubmitting(true);

        padRef.current!.toBlob(async (blob) => {
            if (!blob) {
                setError('Could not read signature. Please try again.');
                setSubmitting(false);
                return;
            }
            try {
                await clinicalApi.sessions.uploadConsent(sessionId, {
                    signed_by: patientName,
                    signature: blob,
                });
                setStep('done');
                setTimeout(onSuccess, 1200);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
            } finally {
                setSubmitting(false);
            }
        });
    };

    // ── Backdrop ──────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E8E1D6]">
                    <FileText className="w-5 h-5 text-[#1C1917]" />
                    <h2 className="text-lg font-semibold text-[#1C1917]">Consent Form</h2>
                    <span className="ml-auto text-sm text-[#78716C]">{patientName}</span>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Loading */}
                    {loadingTemplates && (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[#C4A882]" />
                        </div>
                    )}

                    {/* Template selection (multiple templates) */}
                    {!loadingTemplates && step === 'select' && templates.length > 1 && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-[#1C1917]">Select the consent form for this procedure:</p>
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { setSelectedTemplate(t); setStep('sign'); }}
                                    className="w-full text-left p-4 rounded-xl border-2 border-[#D9D0C5] hover:border-[#1C1917] transition-colors"
                                >
                                    <p className="font-medium text-[#1C1917]">{t.name}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No templates */}
                    {!loadingTemplates && templates.length === 0 && (
                        <div className="text-center py-10 space-y-2">
                            <p className="text-[#78716C]">No consent form templates found.</p>
                            <p className="text-sm text-[#A8A29E]">Create one in Settings → Consent Templates.</p>
                        </div>
                    )}

                    {/* Sign step */}
                    {step === 'sign' && selectedTemplate && (
                        <>
                            {/* Form content */}
                            <div className="bg-[#F7F3ED] rounded-xl p-5 max-h-56 overflow-y-auto">
                                <p className="text-sm font-medium text-[#1C1917] mb-2">{selectedTemplate.name}</p>
                                <p className="text-sm text-[#44403C] whitespace-pre-wrap leading-relaxed">
                                    {selectedTemplate.content}
                                </p>
                            </div>

                            {/* Signature area */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-[#1C1917]">Patient Signature</p>
                                    <button
                                        onClick={() => padRef.current?.clear()}
                                        className="flex items-center gap-1 text-xs text-[#78716C] hover:text-[#1C1917]"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Clear
                                    </button>
                                </div>
                                <div className="border-2 border-[#D9D0C5] rounded-xl overflow-hidden bg-white">
                                    <SignaturePad
                                        ref={padRef}
                                        height={180}
                                        className="w-full"
                                    />
                                </div>
                                <p className="text-xs text-[#A8A29E]">Sign above using your finger or stylus.</p>
                            </div>
                        </>
                    )}

                    {/* Done */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center py-10 gap-4">
                            <CheckCircle2 className="w-14 h-14 text-green-600" />
                            <p className="text-lg font-semibold text-[#1C1917]">Consent Recorded</p>
                        </div>
                    )}

                    {error && (
                        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                {step === 'sign' && (
                    <div className="flex gap-3 px-6 py-4 border-t border-[#E8E1D6]">
                        <Button variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 bg-[#1C1917] hover:bg-[#3E3832] text-white"
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Sign & Submit
                        </Button>
                    </div>
                )}
                {step === 'select' && templates.length === 0 && (
                    <div className="px-6 py-4 border-t border-[#E8E1D6]">
                        <Button variant="outline" onClick={onCancel} className="w-full">Close</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
