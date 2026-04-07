'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, Trash2, Settings, Undo2 } from 'lucide-react';
import { accountingApi } from '@/lib/services/accounting';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils/formatters';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function JournalEntriesClient() {
    const [journals, setJournals] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({});

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        reference_number: '',
        description: '',
        status: 'POSTED',
        lines_data: [
            { account: '', description: '', debit: '0', credit: '0' },
            { account: '', description: '', debit: '0', credit: '0' }
        ]
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [journalsRes, accountsRes, settingsRes] = await Promise.all([
                accountingApi.getJournals(),
                accountingApi.getAccounts(), // For the dropdowns
                accountingApi.getSettings()
            ]);
            setJournals((journalsRes as any).results || []);
            setAccounts((accountsRes as any).results || []);
            setSettings((settingsRes as any) || {});
        } catch (error) {
            console.error('Failed to load journal data:', error);
            toast.error('Failed to load journal entries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            reference_number: '',
            description: '',
            status: 'POSTED',
            lines_data: [
                { account: '', description: '', debit: '0', credit: '0' },
                { account: '', description: '', debit: '0', credit: '0' }
            ]
        });
        setIsModalOpen(true);
    };

    const addLine = () => {
        setFormData({
            ...formData,
            lines_data: [...formData.lines_data, { account: '', description: '', debit: '0', credit: '0' }]
        });
    };

    const removeLine = (index: number) => {
        if (formData.lines_data.length <= 2) {
            toast.error('A journal entry must have at least 2 lines.');
            return;
        }
        const newLines = [...formData.lines_data];
        newLines.splice(index, 1);
        setFormData({ ...formData, lines_data: newLines });
    };

    const updateLine = (index: number, field: string, value: string) => {
        const newLines = [...formData.lines_data];
        (newLines[index] as any)[field] = value;

        // Auto-zero the opposite side to prevent confusion
        if (field === 'debit' && Number(value) > 0) newLines[index].credit = '0';
        if (field === 'credit' && Number(value) > 0) newLines[index].debit = '0';

        setFormData({ ...formData, lines_data: newLines });
    };

    const totalDebit = formData.lines_data.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = formData.lines_data.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const handleSave = async () => {
        if (!isBalanced) {
            toast.error('Debits and Credits must be equal and greater than 0.');
            return;
        }

        const missingAccounts = formData.lines_data.some(l => !l.account);
        if (missingAccounts) {
            toast.error('All lines must have an account selected.');
            return;
        }

        try {
            await accountingApi.createJournal(formData);
            toast.success('Journal Entry Posted');
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to post entry');
        }
    };

    const handleReverse = async (id: number) => {
        if (!confirm('Are you sure you want to reverse this journal entry? This will post a completely new entry flipping all debits and credits.')) return;
        try {
            await accountingApi.reverseJournal(id);
            toast.success('Journal Entry Reversed successfully.');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to reverse entry');
        }
    };

    const handleSaveSettings = async () => {
        try {
            await accountingApi.updateSettings({ closed_books_date: settings.closed_books_date });
            toast.success('Accounting Settings Updated');
            setIsSettingsModalOpen(false);
        } catch (error: any) {
            toast.error('Failed to update settings');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-transparent mb-2">
                <h2 className="text-3xl font-serif text-[#1C1917]">Journal Entries</h2>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsSettingsModalOpen(true)} className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED] shadow-sm">
                        <Settings className="h-5 w-5 mr-2" />
                        Settings
                    </Button>
                    <Button onClick={handleOpenModal} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832] shadow-sm">
                        <Plus className="h-5 w-5 mr-2" />
                        New Entry
                    </Button>
                </div>
            </div>

            <Card className="bg-white border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Date</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Reference</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Description</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Line Items</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Status</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm  text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow className="border-b border-[#E8E1D6]">
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#A0978D]" />
                                    </TableCell>
                                </TableRow>
                            ) : journals.length === 0 ? (
                                <TableRow className="border-b border-[#E8E1D6]">
                                    <TableCell colSpan={6} className="h-24 text-center text-[#A0978D] font-medium">
                                        No journal entries found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                journals.map((entry) => (
                                    <TableRow key={entry.id} className="hover:bg-[#EDE7DC] border-b border-[#E8E1D6] transition-colors">
                                        <TableCell className="font-bold text-[#1C1917] text-sm whitespace-nowrap py-4 px-6">
                                            {entry.date}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-bold text-[#1C1917] text-sm">{entry.reference_number || '-'}</div>
                                            <div className="text-sm text-[#A0978D] mt-1">{entry.source_model}</div>
                                        </TableCell>
                                        <TableCell className="text-[#78706A] text-sm font-medium py-4 px-6">{entry.description}</TableCell>
                                        <TableCell className="py-2 px-6">
                                            <div className="space-y-1.5 py-2">
                                                {entry.lines?.map((line: any, idx: number) => (
                                                    <div key={line.id} className="flex justify-between items-center text-sm md:text-sm">
                                                        <span className={Number(line.debit) > 0 ? "font-bold text-[#1C1917]" : "text-[#78706A] pl-4 italic"}>
                                                            {line.account_code ? `${line.account_code} - ` : ''}{line.account_name}
                                                        </span>
                                                        <span className="tabular-nums font-bold text-[#1C1917]">
                                                            {Number(line.debit) > 0 ? formatCurrency(line.debit) : formatCurrency(line.credit)}
                                                            <span className={Number(line.debit) > 0 ? "text-[#C4705A] ml-1.5 text-xs font-semibold" : "text-[#7A9E8A] ml-1.5 text-xs font-semibold"}>
                                                                {Number(line.debit) > 0 ? 'DR' : 'CR'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={entry.status === 'POSTED' ? 'inline-flex items-center rounded-md bg-[#7A9E8A]/10 px-2.5 py-1 text-sm font-semibold text-[#4A6B5A] ring-1 ring-inset ring-[#7A9E8A]/20' : 'inline-flex items-center rounded-md bg-[#F7F3ED] px-2.5 py-1 text-sm font-semibold text-[#78706A] ring-1 ring-inset ring-[#D9D0C5]'}>
                                                    {entry.status}
                                                </span>
                                                {entry.reversed_by && (
                                                    <span className="inline-flex items-center rounded-md bg-[#C4705A]/10 px-2 py-0.5 text-xs font-semibold text-[#904431] ring-1 ring-inset ring-[#C4705A]/20">Reversed</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            {entry.status === 'POSTED' && !entry.reversed_by && (
                                                <Button variant="ghost" size="sm" onClick={() => handleReverse(entry.id)} title="Reverse Entry" className="text-[#A0978D] hover:text-[#C4705A] hover:bg-[#F7F3ED]">
                                                    <Undo2 className="h-5 w-5" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">Accounting Settings</DialogTitle>
                        <DialogDescription className="text-sm text-[#78706A]">
                            Manage strict fiscal period lock dates. Books closed on or before this date cannot be modified or reversed into.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-[#1C1917]">Closed Books Date</label>
                            <Input
                                type="date"
                                className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                value={settings.closed_books_date || ''}
                                onChange={e => setSettings({ ...settings, closed_books_date: e.target.value })}
                            />
                            <p className="text-sm text-[#A0978D]">Leaving this blank means your books are completely open (not recommended for production).</p>
                        </div>
                    </div>
                    <DialogFooter className="mt-8 space-x-3 gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)} className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                        <Button onClick={handleSaveSettings} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">Save Settings</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-5xl bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-3xl font-bold font-serif text-[#1C1917]">New Manual Journal Entry</DialogTitle>
                        <DialogDescription className="text-sm text-[#78706A]">
                            Create a balanced double-entry manual journal. Total debits must equal total credits.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-2">
                        <div className="grid grid-cols-3 gap-5">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Date *</label>
                                <Input
                                    type="date"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Reference</label>
                                <Input
                                    value={formData.reference_number}
                                    onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                                    placeholder="e.g. ADJ-2023-01"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Description</label>
                                <Input
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Memo"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                />
                            </div>
                        </div>

                        <div className="border border-[#E8E1D6] rounded-xl mt-4 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-[#F7F3ED]">
                                    <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                        <TableHead className="w-[300px] font-bold text-[#1C1917] py-4 px-4 text-sm ">Account</TableHead>
                                        <TableHead className="font-bold text-[#1C1917] py-4 px-4 text-sm ">Line Description</TableHead>
                                        <TableHead className="w-[120px] text-right font-bold text-[#1C1917] py-4 px-4 text-sm ">Debit</TableHead>
                                        <TableHead className="w-[120px] text-right font-bold text-[#1C1917] py-4 px-4 text-sm ">Credit</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.lines_data.map((line, idx) => (
                                        <TableRow key={idx} className="hover:bg-transparent border-b border-[#E8E1D6]">
                                            <TableCell className="p-3">
                                                <Select value={line.account} onValueChange={v => updateLine(idx, 'account', v)}>
                                                    <SelectTrigger className="h-11 bg-white border-[#D9D0C5] rounded-xl text-sm text-[#1C1917]">
                                                        <SelectValue placeholder="Select Account" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[200px] border-[#D9D0C5] rounded-xl shadow-md">
                                                        {accounts.map(acc => (
                                                            <SelectItem key={acc.id} value={acc.id.toString()} className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">
                                                                {acc.code ? `${acc.code} - ` : ''}{acc.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="p-3">
                                                <Input
                                                    placeholder="Optional"
                                                    value={line.description}
                                                    onChange={e => updateLine(idx, 'description', e.target.value)}
                                                    className="h-11 bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                                />
                                            </TableCell>
                                            <TableCell className="p-3">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="h-11 bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm text-right font-medium text-[#1C1917]"
                                                    value={line.debit}
                                                    onChange={e => updateLine(idx, 'debit', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="p-3">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="h-11 bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm text-right font-medium text-[#1C1917]"
                                                    value={line.credit}
                                                    onChange={e => updateLine(idx, 'credit', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="p-3 text-center">
                                                <Button variant="ghost" size="icon" onClick={() => removeLine(idx)} className="text-[#A0978D] hover:text-[#C4705A] hover:bg-[#F7F3ED] rounded-xl">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-3 border-t border-[#E8E1D6] bg-white">
                                <Button variant="ghost" size="sm" onClick={addLine} className="text-[#1C1917] hover:bg-[#F7F3ED] font-bold rounded-xl h-10 px-4">
                                    <Plus className="h-4 w-4 mr-2" /> Add Line
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-5 gap-10 px-4 text-sm">
                            <div className="flex flex-col items-end">
                                <span className="text-[#A0978D] font-bold  text-xs mb-1">Total Debits</span>
                                <span className={`text-2xl font-bold tabular-nums ${totalDebit > 0 ? 'text-[#1C1917]' : 'text-[#A0978D]'}`}>
                                    {formatCurrency(totalDebit)}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[#A0978D] font-bold  text-xs mb-1">Total Credits</span>
                                <span className={`text-2xl font-bold tabular-nums ${totalCredit > 0 ? 'text-[#1C1917]' : 'text-[#A0978D]'}`}>
                                    {formatCurrency(totalCredit)}
                                </span>
                            </div>
                        </div>
                        {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
                            <div className="text-[#C4705A] text-sm font-bold text-right px-4 mt-2">
                                Out of balance by {formatCurrency(Math.abs(totalDebit - totalCredit))}
                            </div>
                        )}
                        {isBalanced && totalDebit > 0 && (
                            <div className="text-[#7A9E8A] text-sm font-bold text-right px-4 mt-2 flex items-center justify-end">
                                Balanced <span className="ml-1 text-xl">✓</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-8 space-x-3 gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                        <Button onClick={handleSave} disabled={!isBalanced} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832] disabled:opacity-50 disabled:bg-[#A0978D]">Post Journal Entry</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
