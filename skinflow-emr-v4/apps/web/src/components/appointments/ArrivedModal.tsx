'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ArrivedModalProps {
    appointmentId: number | null;
    open: boolean;
    defaultFee: number;
    onClose: () => void;
    onCheckIn: (appointmentId: number, fee: number) => Promise<void>;
    onRequestWaiver: (appointmentId: number, fee: number, reason: string) => Promise<void>;
}

export function ArrivedModal({ appointmentId, open, defaultFee, onClose, onCheckIn, onRequestWaiver }: ArrivedModalProps) {
    const [loading, setLoading] = useState(false);
    const [waiverMode, setWaiverMode] = useState(false);
    const [reason, setReason] = useState('');

    const handleClose = () => {
        setWaiverMode(false);
        setReason('');
        onClose();
    };

    const handleCheckIn = async () => {
        if (!appointmentId) return;
        setLoading(true);
        try {
            await onCheckIn(appointmentId, defaultFee);
            handleClose();
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWaiver = async () => {
        if (!appointmentId || !reason.trim()) return;
        setLoading(true);
        try {
            await onRequestWaiver(appointmentId, defaultFee, reason.trim());
            handleClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Patient Arrival & Check-In</DialogTitle>
                    <DialogDescription>
                        Collect the consultation fee before the patient proceeds to vitals and consultation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Consultation Fee (৳)
                        </Label>
                        <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-[#1C1917] font-semibold text-base">
                            ৳{defaultFee.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Set from provider's default fee. Cannot be edited here.</p>
                    </div>

                    {!waiverMode ? (
                        <button
                            type="button"
                            onClick={() => setWaiverMode(true)}
                            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                            Request fee waiver
                        </button>
                    ) : (
                        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                            <Label className="text-xs font-medium text-amber-800">
                                Waiver reason <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Explain why the fee should be waived…"
                                className="resize-none bg-white text-sm"
                                rows={3}
                            />
                            <button
                                type="button"
                                onClick={() => { setWaiverMode(false); setReason(''); }}
                                className="text-xs text-amber-700 underline underline-offset-2"
                            >
                                Cancel waiver request
                            </button>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    {waiverMode ? (
                        <Button
                            onClick={handleRequestWaiver}
                            disabled={loading || !reason.trim()}
                            variant="outline"
                            className="border-amber-400 text-amber-800 hover:bg-amber-50"
                        >
                            {loading ? 'Submitting…' : 'Submit Waiver Request'}
                        </Button>
                    ) : (
                        <Button onClick={handleCheckIn} disabled={loading}>
                            {loading ? 'Processing…' : 'Check In'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
