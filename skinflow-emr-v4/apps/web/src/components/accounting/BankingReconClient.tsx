'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Building, CreditCard, Component, Upload, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { accountingApi } from '@/lib/services/accounting';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { StatementMatchingPanel } from './StatementMatchingPanel';

export function BankingReconClient() {
    const [banks, setBanks] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        bank_name: '',
        account_number: '',
        account_type: 'BANK',
        ledger_account: '',
        is_active: true
    });

    // Settlement Workflow State
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [selectedHoldingBank, setSelectedHoldingBank] = useState<any>(null);
    const [settleData, setSettleData] = useState({
        destination_bank_id: '',
        amount: '',
        fee_amount: '0',
        description: ''
    });

    // Reconciliation Workflow State
    const [isReconModalOpen, setIsReconModalOpen] = useState(false);
    const [reconBank, setReconBank] = useState<any>(null);
    const [reconData, setReconData] = useState({
        statement_date: new Date().toISOString().split('T')[0],
        statement_ending_balance: '0'
    });
    const [unclearedLines, setUnclearedLines] = useState<any[]>([]);
    const [selectedLines, setSelectedLines] = useState<number[]>([]);
    const [reconSummary, setReconSummary] = useState<any>(null);

    // Import Statement State
    const [importBank, setImportBank] = useState<any>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Statement Matching Panel
    const [matchingBank, setMatchingBank] = useState<any>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const responses = await Promise.all([
                accountingApi.getBankAccounts(),
                accountingApi.getAccounts({ account_type: 'ASSET' }) // Only link to Asset accounts
            ]);
            const banksRes: any = responses[0];
            const accsRes: any = responses[1];

            setBanks(banksRes.results || []);
            setAccounts(accsRes.results || []);
        } catch (error) {
            console.error('Failed to load banking data:', error);
            toast.error('Failed to load bank accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = () => {
        setFormData({
            name: '',
            bank_name: '',
            account_number: '',
            account_type: 'BANK',
            ledger_account: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.ledger_account) {
            toast.error('Name and Ledger Account are required');
            return;
        }

        try {
            await accountingApi.createBankAccount(formData);
            toast.success('Bank Account created');
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            toast.error('Failed to create bank account. Ensure the ledger link is unique.');
        }
    };

    const handleOpenSettle = (bank: any) => {
        setSelectedHoldingBank(bank);
        setSettleData({
            destination_bank_id: '',
            amount: '',
            fee_amount: '0',
            description: `Transfer from ${bank.name}`
        });
        setIsSettleModalOpen(true);
    };

    const handleSettle = async () => {
        if (!settleData.destination_bank_id || !settleData.amount) {
            toast.error('Please fill out all required fields');
            return;
        }

        try {
            if (selectedHoldingBank.account_type === 'HOLDING_CC') {
                await accountingApi.settleCc(selectedHoldingBank.id, settleData);
                toast.success('Credit Card Batch Settled');
            } else if (selectedHoldingBank.account_type === 'HOLDING_CHECK') {
                await accountingApi.clearCheck(selectedHoldingBank.id, settleData);
                toast.success('Check Cleared');
            }
            setIsSettleModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to process settlement');
        }
    };

    const handleOpenRecon = async (bank: any) => {
        setReconBank(bank);
        setReconData({
            statement_date: new Date().toISOString().split('T')[0],
            statement_ending_balance: '0'
        });
        setSelectedLines([]);
        setReconSummary(null);

        try {
            const [lines, summary] = await Promise.all([
                accountingApi.getUnclearedLines(bank.id),
                accountingApi.getReconSummary(bank.id),
            ]);
            setUnclearedLines((lines as any) || []);
            setReconSummary(summary);
            setIsReconModalOpen(true);
        } catch (error) {
            toast.error('Failed to fetch uncleared lines for reconciliation');
        }
    };

    const handleOpenImport = (bank: any) => {
        setImportBank(bank);
        setImportFile(null);
        setImportResult(null);
    };

    const handleImportFile = async () => {
        if (!importBank || !importFile) return;
        setIsImporting(true);
        try {
            const result = await accountingApi.uploadStatement(importBank.id, importFile);
            setImportResult(result);
            toast.success(`Imported ${result.imported} transactions (${result.auto_matched} auto-matched)`);
        } catch (e: any) {
            toast.error(e.message || 'Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    const handleToggleLine = (id: number) => {
        if (selectedLines.includes(id)) {
            setSelectedLines(selectedLines.filter(lineId => lineId !== id));
        } else {
            setSelectedLines([...selectedLines, id]);
        }
    };

    const handleCompleteRecon = async () => {
        if (!reconData.statement_date || !reconData.statement_ending_balance) {
            toast.error('Statement date and ending balance are required');
            return;
        }

        try {
            const recon: any = await accountingApi.createReconciliation({
                organization: reconBank.organization,
                bank_account: reconBank.id,
                statement_date: reconData.statement_date,
                statement_ending_balance: reconData.statement_ending_balance
            });

            if (selectedLines.length > 0) {
                await accountingApi.clearReconciliationLines(recon.id, { line_ids: selectedLines });
            }

            await accountingApi.completeReconciliation(recon.id);
            toast.success('Bank Reconciliation Completed');
            setIsReconModalOpen(false);
            loadData();
        } catch (error) {
            toast.error('Failed to complete reconciliation');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CASH': return <Component className="h-4 w-4 text-emerald-500" />;
            case 'BANK': return <Building className="h-4 w-4 text-blue-500" />;
            case 'HOLDING_CC': return <CreditCard className="h-4 w-4 text-purple-500" />;
            case 'HOLDING_CHECK': return <Component className="h-4 w-4 text-orange-500" />;
            default: return <Building className="h-4 w-4 text-[#A0978D]" />;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-transparent mb-2">
                <h2 className="text-3xl font-serif text-[#1C1917]">Local Bank Accounts</h2>
                <Button onClick={handleOpenModal} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832] shadow-sm">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Bank / Drawer
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-[#A0978D]" />
                    </div>
                ) : banks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-[#A0978D] bg-[#F7F3ED] rounded-2xl border border-[#D9D0C5] border-dashed font-medium text-sm">
                        No bank accounts configured.
                    </div>
                ) : (
                    banks.map(bank => (
                        <Card key={bank.id} className="bg-white border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-[#F7F3ED] rounded-xl text-[#1C1917] shadow-sm ring-1 ring-[#D9D0C5]/50 border border-[#E8E1D6]">
                                        {getIcon(bank.account_type)}
                                    </div>
                                    <span className="inline-flex items-center rounded-md bg-[#1C1917]/5 px-2 py-1 text-xs font-semibold  text-[#1C1917]">
                                        {bank.account_type.replace('_', ' ')}
                                    </span>
                                </div>
                                <CardTitle className="text-xl mt-5 font-bold text-[#1C1917]">{bank.name}</CardTitle>
                                <CardDescription className="text-sm text-[#78706A] mt-1 font-medium">{bank.bank_name} {bank.account_number ? `•••• ${bank.account_number.slice(-4)}` : ''}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-sm text-[#78706A] mt-2 border-t border-[#D9D0C5] pt-5 flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-[#A0978D]">Ledger Link:</span>
                                        <span className="font-bold text-[#1C1917]">{bank.ledger_account_details?.code || ''} {bank.ledger_account_details?.name}</span>
                                    </div>

                                    {(bank.account_type === 'HOLDING_CC' || bank.account_type === 'HOLDING_CHECK') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2 h-12 rounded-xl text-sm font-bold text-[#1C1917] hover:bg-[#F7F3ED] border-[#D9D0C5] bg-white shadow-sm transition-colors"
                                            onClick={() => handleOpenSettle(bank)}
                                        >
                                            {bank.account_type === 'HOLDING_CC' ? 'Settle Batch' : 'Clear Check'} to Bank
                                        </Button>
                                    )}

                                    {bank.account_type === 'BANK' && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-10 rounded-xl text-sm font-bold text-[#1C1917] hover:bg-[#F7F3ED] border-[#D9D0C5] bg-white shadow-sm transition-colors"
                                                onClick={() => handleOpenImport(bank)}
                                            >
                                                <Upload className="h-4 w-4 mr-2" />Import Statement
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-10 rounded-xl text-sm font-bold text-[#1C1917] hover:bg-[#F7F3ED] border-[#D9D0C5] bg-white shadow-sm transition-colors"
                                                onClick={() => setMatchingBank(bank)}
                                            >
                                                <ArrowRightLeft className="h-4 w-4 mr-2" />Match Transactions
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-10 rounded-xl text-sm font-bold text-[#1C1917] hover:bg-[#F7F3ED] border-[#D9D0C5] bg-white shadow-sm transition-colors"
                                                onClick={() => handleOpenRecon(bank)}
                                            >
                                                Reconcile Statement
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">New Bank Account / Cash Drawer</DialogTitle>
                        <DialogDescription className="text-sm text-[#78706A]">
                            Represent physical places where funds are held.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-[#1C1917]">Internal Display Name *</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Front Desk Drawer 1, Main Operating Account"
                                className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Account Type</label>
                                <Select
                                    value={formData.account_type}
                                    onValueChange={v => setFormData({ ...formData, account_type: v })}
                                >
                                    <SelectTrigger className="h-12 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm text-[#1C1917]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#D9D0C5] rounded-xl shadow-md">
                                        <SelectItem value="BANK" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Real Bank Account</SelectItem>
                                        <SelectItem value="CASH" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Physical Cash Drawer</SelectItem>
                                        <SelectItem value="HOLDING_CHECK" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Check Holding (Pending Clear)</SelectItem>
                                        <SelectItem value="HOLDING_CC" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Credit Card Holding (Pending Settlement)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Link to Ledger Asset *</label>
                                <Select
                                    value={formData.ledger_account}
                                    onValueChange={v => setFormData({ ...formData, ledger_account: v })}
                                >
                                    <SelectTrigger className="h-12 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm text-[#1C1917]">
                                        <SelectValue placeholder="Select Account..." />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#D9D0C5] rounded-xl shadow-md max-h-[200px]">
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id.toString()} className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">
                                                {acc.code ? `${acc.code} - ` : ''}{acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Bank Name</label>
                                <Input
                                    value={formData.bank_name}
                                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                    placeholder="e.g. Chase"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Account Number</label>
                                <Input
                                    value={formData.account_number}
                                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                    placeholder="Last 4 digits"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-8 space-x-3 gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                        <Button onClick={handleSave} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">Connect Bank</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSettleModalOpen} onOpenChange={setIsSettleModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">
                            {selectedHoldingBank?.account_type === 'HOLDING_CC' ? 'Settle Credit Card Batch' : 'Clear Check'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#78706A]">
                            Transfer funds from the holding account to your actual bank account.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedHoldingBank && (
                        <div className="grid gap-5 py-2">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Destination Bank Account *</label>
                                <Select
                                    value={settleData.destination_bank_id}
                                    onValueChange={v => setSettleData({ ...settleData, destination_bank_id: v })}
                                >
                                    <SelectTrigger className="h-12 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm text-[#1C1917]">
                                        <SelectValue placeholder="Select Destination Bank..." />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#D9D0C5] rounded-xl shadow-md">
                                        {banks.filter(b => b.account_type === 'BANK').map(bank => (
                                            <SelectItem key={bank.id} value={bank.id.toString()} className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">
                                                {bank.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold text-[#1C1917]">Settlement Amount *</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={settleData.amount}
                                        onChange={e => setSettleData({ ...settleData, amount: e.target.value })}
                                        placeholder="0.00"
                                        className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                    />
                                </div>
                                {selectedHoldingBank.account_type === 'HOLDING_CC' && (
                                    <div className="grid gap-2">
                                        <label className="text-sm font-bold text-red-600">Merchant Fees Deducted</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={settleData.fee_amount}
                                            onChange={e => setSettleData({ ...settleData, fee_amount: e.target.value })}
                                            placeholder="0.00"
                                            className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-red-400 rounded-xl text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Description</label>
                                <Input
                                    value={settleData.description}
                                    onChange={e => setSettleData({ ...settleData, description: e.target.value })}
                                    placeholder="e.g. Batch #8483"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-8 space-x-3 gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsSettleModalOpen(false)} className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                        <Button onClick={handleSettle} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">
                            {selectedHoldingBank?.account_type === 'HOLDING_CC' ? 'Settle Batch' : 'Clear Check'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isReconModalOpen} onOpenChange={setIsReconModalOpen}>
                <DialogContent className="max-w-4xl bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">Reconcile Bank Statement: {reconBank?.name}</DialogTitle>
                        <DialogDescription className="text-sm text-[#78706A]">
                            Compare your physical bank statement with your internal ledger. Check off transactions that appear on the statement.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Recon Summary Math */}
                    {reconSummary && (
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {[
                                { label: 'Book Balance', value: reconSummary.book_balance },
                                { label: 'Cleared Balance', value: reconSummary.cleared_balance },
                                { label: 'Outstanding Deposits', value: reconSummary.outstanding_deposits },
                                { label: 'Outstanding Payments', value: reconSummary.outstanding_payments },
                            ].map(item => (
                                <div key={item.label} className="bg-[#F7F3ED] border border-[#D9D0C5] rounded-xl p-3 text-center">
                                    <div className="text-xs text-[#A0978D] font-medium mb-1">{item.label}</div>
                                    <div className="text-sm font-bold text-[#1C1917] tabular-nums">{formatCurrency(item.value)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {reconSummary && reconData.statement_ending_balance && (
                        (() => {
                            const diff = Number(reconData.statement_ending_balance) - Number(reconSummary.cleared_balance);
                            const balanced = Math.abs(diff) < 0.01;
                            return (
                                <div className={`mb-4 px-4 py-3 rounded-xl border text-sm font-bold flex items-center gap-2 ${balanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                    {balanced ? <CheckCircle2 className="h-4 w-4" /> : null}
                                    {balanced
                                        ? 'Difference: ৳0.00 — Statement matches cleared balance'
                                        : `Difference: ${formatCurrency(diff)} — Statement ending balance vs cleared balance`}
                                </div>
                            );
                        })()
                    )}

                    <div className="grid grid-cols-2 gap-6 bg-[#F7F3ED] p-5 border border-[#D9D0C5] rounded-xl shadow-sm">
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-[#1C1917]">Statement Date *</label>
                            <Input
                                type="date"
                                value={reconData.statement_date}
                                onChange={e => setReconData({ ...reconData, statement_date: e.target.value })}
                                className="h-11 bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-lg text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-[#1C1917]">Statement Ending Balance *</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={reconData.statement_ending_balance}
                                onChange={e => setReconData({ ...reconData, statement_ending_balance: e.target.value })}
                                placeholder="0.00"
                                className="h-11 bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <div className="mt-6 border border-[#E8E1D6] rounded-2xl max-h-[400px] overflow-y-auto shadow-sm">
                        <Table>
                            <TableHeader className="bg-[#F7F3ED] sticky top-0 z-10 shadow-sm border-b border-[#D9D0C5]">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px] px-6"></TableHead>
                                    <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm ">Date</TableHead>
                                    <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm ">Reference</TableHead>
                                    <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm ">Description</TableHead>
                                    <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm  text-right">Debit</TableHead>
                                    <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm  text-right">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unclearedLines.length === 0 ? (
                                    <TableRow className="border-b border-[#E8E1D6]">
                                        <TableCell colSpan={6} className="text-center h-32 text-[#A0978D] font-medium text-sm">
                                            No uncleared transactions found. You're fully reconciled!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    unclearedLines.map((line) => (
                                        <TableRow key={line.id} className={`${selectedLines.includes(line.id) ? "bg-[#EDE7DC]" : "hover:bg-[#F7F3ED]"} border-b border-[#E8E1D6] transition-colors cursor-pointer`} onClick={() => handleToggleLine(line.id)}>
                                            <TableCell className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedLines.includes(line.id)}
                                                    onCheckedChange={() => handleToggleLine(line.id)}
                                                    className="border-[#A0978D] hover:border-[#1C1917] data-[state=checked]:bg-[#1C1917] data-[state=checked]:text-[#C4A882] h-5 w-5"
                                                />
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap px-6 py-4 text-[#78706A] font-medium text-sm">{formatDate(line.date)}</TableCell>
                                            <TableCell className="px-6 py-4 text-[#1C1917] font-medium text-sm">{line.reference || '-'}</TableCell>
                                            <TableCell className="px-6 py-4 text-[#1C1917] text-sm">{line.description}</TableCell>
                                            <TableCell className="text-right px-6 py-4 tabular-nums font-bold text-[#1C1917] text-sm">{Number(line.debit) > 0 ? formatCurrency(line.debit) : '-'}</TableCell>
                                            <TableCell className="text-right px-6 py-4 tabular-nums font-bold text-[#1C1917] text-sm">{Number(line.credit) > 0 ? formatCurrency(line.credit) : '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter className="mt-8 space-x-3 gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsReconModalOpen(false)} className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                        <Button onClick={handleCompleteRecon} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">Complete Reconciliation</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Import Statement Dialog */}
            <Dialog open={!!importBank} onOpenChange={() => { setImportBank(null); setImportResult(null); }}>
                <DialogContent className="sm:max-w-[480px] bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">Import Bank Statement</DialogTitle>
                        <DialogDescription className="text-sm text-[#78706A]">
                            Upload a CSV or OFX/QFX file exported from your bank. Duplicates are skipped automatically.
                        </DialogDescription>
                    </DialogHeader>

                    {!importResult ? (
                        <div className="grid gap-5">
                            <div
                                className="border-2 border-dashed border-[#D9D0C5] rounded-2xl p-8 text-center cursor-pointer hover:bg-[#F7F3ED] transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-8 w-8 text-[#A0978D] mx-auto mb-3" />
                                {importFile ? (
                                    <div>
                                        <div className="text-sm font-bold text-[#1C1917]">{importFile.name}</div>
                                        <div className="text-xs text-[#A0978D] mt-1">{(importFile.size / 1024).toFixed(1)} KB — click to change</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-sm font-bold text-[#78706A]">Click to select file</div>
                                        <div className="text-xs text-[#A0978D] mt-1">Supported: .csv, .ofx, .qfx</div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.ofx,.qfx"
                                    className="hidden"
                                    onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                                />
                            </div>

                            <DialogFooter className="gap-3">
                                <Button variant="outline" onClick={() => setImportBank(null)} className="h-11 px-6 rounded-xl font-bold border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                                <Button onClick={handleImportFile} disabled={!importFile || isImporting} className="h-11 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">
                                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                    Import
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Total Parsed', value: importResult.total_parsed },
                                    { label: 'Imported', value: importResult.imported },
                                    { label: 'Duplicates Skipped', value: importResult.duplicates_skipped },
                                    { label: 'Auto-Matched', value: importResult.auto_matched },
                                ].map(item => (
                                    <div key={item.label} className="text-center">
                                        <div className="text-2xl font-bold text-emerald-800">{item.value}</div>
                                        <div className="text-xs text-emerald-600 font-medium">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-[#78706A] text-center">
                                {importResult.unmatched > 0
                                    ? `${importResult.unmatched} transactions need manual matching. Use "Match Transactions" to review.`
                                    : 'All transactions auto-matched!'}
                            </div>
                            <DialogFooter className="gap-3">
                                <Button variant="outline" onClick={() => { setImportBank(null); setImportResult(null); }} className="h-11 px-6 rounded-xl font-bold border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Close</Button>
                                {importResult.unmatched > 0 && (
                                    <Button onClick={() => { setMatchingBank(importBank); setImportBank(null); setImportResult(null); }} className="h-11 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">
                                        <ArrowRightLeft className="h-4 w-4 mr-2" />Match Transactions
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Statement Matching Panel */}
            {matchingBank && (
                <StatementMatchingPanel bank={matchingBank} onClose={() => setMatchingBank(null)} />
            )}
        </div>
    );
}
