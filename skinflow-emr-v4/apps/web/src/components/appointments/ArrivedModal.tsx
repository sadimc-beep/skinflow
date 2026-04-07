import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ArrivedModalProps {
    appointmentId: number | null;
    open: boolean;
    onClose: () => void;
    onSuccess: (appointmentId: number, fee: number) => void;
}

export function ArrivedModal({ appointmentId, open, onClose, onSuccess }: ArrivedModalProps) {
    const [loading, setLoading] = useState(false);
    const [fee, setFee] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointmentId) return;
        setLoading(true);
        try {
            onSuccess(appointmentId, parseFloat(fee) || 0);
        } catch (error: any) {
            toast.error(error.message || "Failed to process arrival");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Patient Arrival & Check-In</DialogTitle>
                    <DialogDescription>
                        Collect the consultation fee before the patient proceeds to vitals and consultation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-base text-[#1C1917] font-semibold">Consultation Fee (৳)</Label>
                        <Input
                            name="fee"
                            type="number"
                            step="0.01"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            placeholder="e.g. 1500"
                            className="font-medium"
                            required
                        />
                    </div>
                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Mark Arrived'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
