"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { billingApi } from '@/lib/services/billing';
import { clinicalApi } from '@/lib/services/clinical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

export function PatientEntitlements({ patientId, consultationId }: { patientId: number, consultationId?: number }) {
    const router = useRouter();
    const [entitlements, setEntitlements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchEntitlements = async () => {
            try {
                const res = await billingApi.entitlements.list({ patient: patientId });
                if (mounted) setEntitlements(res.results || []);
            } catch (err) {
                console.error("Failed to fetch patient entitlements", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchEntitlements();
        return () => { mounted = false; };
    }, [patientId]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" /> Active Entitlements & Pre-Paid Packages
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-10 bg-slate-100 rounded w-full"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const activeEntitlements = entitlements.filter(e => e.is_active);

    const handleStartSession = async (entitlementId: number) => {
        setIsStarting(entitlementId);
        try {
            const payload: any = {
                entitlement: entitlementId,
                status: 'PLANNED'
            };
            if (consultationId) {
                payload.consultation = consultationId;
            }

            const newSession = await clinicalApi.sessions.create(payload);
            toast.success("Session created. Redirecting to workspace...");
            router.push(`/sessions/${newSession.id}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to create session.");
            setIsStarting(null);
        }
    };

    return (
        <Card className="mt-6 border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[#F7F3ED] rounded-t-2xl pb-4 border-b border-[#E8E1D6]">
                <CardTitle className="flex items-center gap-2 text-[#1C1917]">
                    <PieChart className="h-5 w-5 text-[#C4A882]" /> Active Pre-Paid Packages
                </CardTitle>
                <p className="text-sm text-[#78706A]">
                    Procedures and sessions already purchased by this patient. Providers can redeem these directly from the Consultation editor.
                </p>
            </CardHeader>
            <CardContent className="pt-6">
                {activeEntitlements.length === 0 ? (
                    <div className="text-center py-6 text-[#A0978D] border-2 border-dashed border-[#E8E1D6] rounded-xl bg-[#F7F3ED]/50">
                        No active pre-paid procedure packages found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeEntitlements.map((en) => (
                            <div key={en.id} className="border border-[#E8E1D6] rounded-xl p-5 flex flex-col justify-between bg-white relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 h-full w-2 bg-[#C4A882] rounded-r-xl"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-[#1C1917] text-lg">
                                            {en.procedure_name || (en.procedure_type ? 'Procedure' : 'Package')}
                                        </h4>
                                        <p className="text-sm text-[#A0978D] mt-1 font-medium italic">
                                            Purchased: {format(new Date(en.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="bg-[#F7F3ED] text-[#C4A882] border-[#C4A882]/30 px-3 py-1">
                                        {en.remaining_qty} Sessions Left
                                    </Badge>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[#E8E1D6] grid grid-cols-3 text-center divide-x divide-[#E8E1D6]">
                                    <div>
                                        <div className="text-xs text-[#78706A] mb-1 font-semibold uppercase tracking-wider">Total</div>
                                        <div className="font-bold text-[#1C1917] text-lg">{en.total_qty}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#78706A] mb-1 font-semibold uppercase tracking-wider">Used</div>
                                        <div className="font-bold text-[#C4705A] text-lg">{en.used_qty}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#78706A] mb-1 font-semibold uppercase tracking-wider">Remaining</div>
                                        <div className="font-bold text-[#7A9E8A] text-lg">{en.remaining_qty}</div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        className="w-full bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-xl h-11 font-bold transition-transform active:scale-95"
                                        disabled={isStarting === en.id || en.remaining_qty <= 0}
                                        onClick={() => handleStartSession(en.id)}
                                    >
                                        <PlayCircle className="mr-2 h-5 w-5" />
                                        {isStarting === en.id ? 'Creating...' : 'Start Session'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
