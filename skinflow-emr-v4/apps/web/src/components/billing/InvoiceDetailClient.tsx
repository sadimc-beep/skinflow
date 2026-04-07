"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { billingApi } from '@/lib/services/billing';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Printer, ArrowLeft, CheckCircle2, Clock, FileText, User, Download } from 'lucide-react';
import type { Invoice } from '@/types/models';
import { useAuth } from '@/lib/context/AuthContext';

const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(num);
};

const STATUS_STEPS = [
    { key: 'created', label: 'Created' },
    { key: 'issued', label: 'Issued' },
    { key: 'paid', label: 'Paid' },
];

function getStatusStepIndex(status: string) {
    switch (status) {
        case 'DRAFT': return 0;
        case 'UNPAID': return 1;
        case 'PARTIALLY_PAID': return 1;
        case 'PAID': return 2;
        default: return 0;
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'PAID': return 'bg-[#F7F3ED] text-[#7A9E8A] border-[#7A9E8A]/30';
        case 'PARTIALLY_PAID': return 'bg-[#F7F3ED] text-[#C4A882] border-[#C4A882]/30';
        case 'UNPAID': return 'bg-[#F7F3ED] text-[#C4705A] border-[#C4705A]/30';
        default: return 'bg-[#F7F3ED] text-[#A0978D] border-[#D9D0C5]';
    }
}

export function InvoiceDetailClient({ initialData }: { initialData: Invoice }) {
    const router = useRouter();
    const { user } = useAuth();
    const [invoice, setInvoice] = useState<Invoice>(initialData);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const clinicName = user?.organization_name ?? 'Clinic';

    const [paymentData, setPaymentData] = useState({
        amount: invoice.balance_due,
        method: 'CASH'
    });

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await billingApi.payments.create({
                invoice: invoice.id,
                amount: paymentData.amount,
                method: paymentData.method as any,
                status: 'COMPLETED'
            });
            toast.success("Payment recorded successfully");
            setPaymentModalOpen(false);
            const updated = await billingApi.invoices.get(invoice.id);
            setInvoice(updated);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            await billingApi.invoices.downloadPdf(invoice.id);
        } catch {
            toast.error('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const stepIndex = getStatusStepIndex(invoice.status);

    return (
        <div className="space-y-6 print:space-y-4">
            {/* ── Navigation (hidden on print) ── */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-3">
                    {invoice.patient_details && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/patients/${invoice.patient_details.id}`}>
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Back to Patient
                            </Link>
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        {isDownloadingPdf ? 'Generating…' : 'Download PDF'}
                    </Button>
                </div>
            </div>

            {/* ── Printable Invoice Header ── */}
            <div className="bg-white rounded-lg border p-6 print:border-0 print:p-0">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{clinicName}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Tax Invoice</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold font-mono text-indigo-700">
                            INV-{invoice.id.toString().padStart(6, '0')}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Date: {format(new Date(invoice.created_at), 'dd MMM yyyy')}
                        </p>
                    </div>
                </div>

                {invoice.patient_details && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border mb-6">
                        <div className="rounded-full bg-[#E8E1D6] p-2">
                            <User className="h-4 w-4 text-[#1C1917]" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Billed To</p>
                            <p className="font-semibold">
                                {invoice.patient_details.first_name} {invoice.patient_details.last_name}
                            </p>
                            {invoice.patient_details.phone_primary && (
                                <p className="text-sm text-muted-foreground">{invoice.patient_details.phone_primary}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Status Timeline (hidden on print) */}
                <div className="print:hidden mb-6">
                    <div className="flex items-center gap-0">
                        {STATUS_STEPS.map((step, i) => {
                            const isActive = i <= stepIndex;
                            const isCurrentStep = i === stepIndex;
                            return (
                                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all
                                        ${isCurrentStep ? 'bg-[#1C1917] text-[#F7F3ED] border-[#1C1917]' :
                                            isActive ? 'bg-[#E8E1D6] text-[#1C1917] border-[#D9D0C5]' :
                                                'bg-[#F7F3ED] text-[#A0978D] border-[#D9D0C5]'}`}>
                                        {isActive
                                            ? <CheckCircle2 className="h-3.5 w-3.5" />
                                            : <Clock className="h-3.5 w-3.5" />
                                        }
                                        {step.label}
                                    </div>
                                    {i < STATUS_STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? 'bg-[#1C1917]' : 'bg-[#D9D0C5]'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Line Items */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Line Items
                        </h3>
                        {(!invoice.items || invoice.items.length === 0) ? (
                            <p className="text-muted-foreground text-sm italic">No items on this invoice.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Discount</TableHead>
                                        <TableHead className="text-right">Net</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="text-right text-orange-600">
                                                {parseFloat(item.discount) > 0 ? `-${formatCurrency(item.discount)}` : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(item.net_price)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    {/* Payments */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                        {(!invoice.payments || invoice.payments.length === 0) ? (
                            <p className="text-muted-foreground text-sm italic">No payments recorded yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.payments.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{format(new Date(p.created_at), 'MMM d, yyyy h:mm a')}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {p.method.replace('_', ' ').toLowerCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`bg-[#F7F3ED] ${p.status === 'COMPLETED' ? 'text-[#7A9E8A] border-[#7A9E8A]/30' : 'text-[#A0978D] border-[#D9D0C5]'}`}>
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-[#1C1917]">
                                                {formatCurrency(p.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                {/* Summary Panel */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Summary</h3>
                            <Badge className={`${getStatusColor(invoice.status)} border`} variant="outline">
                                {invoice.status.replace('_', ' ')}
                            </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground mb-3">
                            Type: <span className="text-foreground capitalize">{invoice.invoice_type.replace('_', ' ').toLowerCase()}</span>
                        </div>

                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {parseFloat(invoice.discount_total) > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Discount</span>
                                    <span>−{formatCurrency(invoice.discount_total)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-base pt-2 border-t">
                                <span>Total</span>
                                <span>{formatCurrency(invoice.total)}</span>
                            </div>
                            <div className={`flex justify-between font-bold text-lg pt-2 border-t ${parseFloat(invoice.balance_due) > 0 ? 'text-[#C4705A]' : 'text-[#7A9E8A]'}`}>
                                <span>Balance Due</span>
                                <span>{formatCurrency(invoice.balance_due)}</span>
                            </div>
                        </div>

                        {parseFloat(invoice.balance_due) > 0 && (
                            <div className="mt-6">
                                <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full h-12 rounded-xl text-base font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">Record Payment</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Record Payment</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleRecordPayment} className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Amount (BDT ৳)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={paymentData.amount}
                                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                                    max={invoice.balance_due}
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground">Max: {formatCurrency(invoice.balance_due)}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Payment Method</Label>
                                                <Select value={paymentData.method} onValueChange={(v) => setPaymentData({ ...paymentData, method: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CASH">Cash</SelectItem>
                                                        <SelectItem value="CARD">Credit / Debit Card</SelectItem>
                                                        <SelectItem value="BKASH">bKash</SelectItem>
                                                        <SelectItem value="NAGAD">Nagad</SelectItem>
                                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <DialogFooter className="mt-6">
                                                <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)} className="rounded-xl h-11 px-6 border-[#D9D0C5]">Cancel</Button>
                                                <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-6 font-bold bg-[#1C1917] hover:bg-[#3E3832]">
                                                    {isSubmitting ? 'Confirming...' : 'Confirm Payment'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    nav, header, aside, footer { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
}
