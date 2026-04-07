import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { clinicalApi } from '@/lib/services/clinical';
import { toast } from 'sonner';

interface IntakeModalProps {
    appointmentId: number | null;
    open: boolean;
    onClose: () => void;
    onSuccess: (appointmentId: number) => void;
}

export function IntakeModal({ appointmentId, open, onClose, onSuccess }: IntakeModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        blood_pressure: '',
        pulse: '',
        weight: '',
        height: '',
        bmi: '',
        chief_complaint: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointmentId) return;
        setLoading(true);
        try {
            await clinicalApi.intake.create({ ...formData, appointment: appointmentId });
            toast.success("Clinical intake recorded");
            onSuccess(appointmentId);
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to save intake");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Patient Check-In & Vitals</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Blood Pressure</Label>
                            <Input name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} placeholder="120/80" />
                        </div>
                        <div className="space-y-2">
                            <Label>Pulse (bpm)</Label>
                            <Input name="pulse" value={formData.pulse} onChange={handleChange} placeholder="72" />
                        </div>
                        <div className="space-y-2">
                            <Label>Weight (kg)</Label>
                            <Input name="weight" value={formData.weight} onChange={handleChange} placeholder="70" />
                        </div>
                        <div className="space-y-2">
                            <Label>Height (cm)</Label>
                            <Input name="height" value={formData.height} onChange={handleChange} placeholder="175" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Chief Complaint / Notes</Label>
                        <Textarea name="chief_complaint" value={formData.chief_complaint} onChange={handleChange} placeholder="Patient's primary reason for visit..." rows={3} />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Complete Intake'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
