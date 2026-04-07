'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ConsentTemplate {
    id: number;
    name: string;
    content: string;
}

const BLANK: Omit<ConsentTemplate, 'id'> = { name: '', content: '' };

export default function ConsentTemplatesPage() {
    const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Partial<ConsentTemplate> | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    const load = async () => {
        try {
            const res = await fetchApi<{ results: ConsentTemplate[] }>('/clinical/consent-templates/');
            setTemplates(res.results || []);
        } catch {
            toast.error('Failed to load consent templates.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSave = async () => {
        if (!editing) return;
        if (!editing.name?.trim() || !editing.content?.trim()) {
            toast.error('Name and content are required.');
            return;
        }
        setSaving(true);
        try {
            if (editing.id) {
                await fetchApi(`/clinical/consent-templates/${editing.id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify({ name: editing.name, content: editing.content }),
                });
                toast.success('Template updated.');
            } else {
                await fetchApi('/clinical/consent-templates/', {
                    method: 'POST',
                    body: JSON.stringify({ name: editing.name, content: editing.content }),
                });
                toast.success('Template created.');
            }
            setEditing(null);
            load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Save failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleting(id);
        try {
            await fetchApi(`/clinical/consent-templates/${id}/`, { method: 'DELETE' });
            toast.success('Template deleted.');
            load();
        } catch {
            toast.error('Delete failed.');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Consent Templates</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage the legal text shown to patients before signing.
                    </p>
                </div>
                {!editing && (
                    <Button
                        onClick={() => setEditing({ ...BLANK })}
                        className="bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-full px-5"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Template
                    </Button>
                )}
            </div>

            {/* Editor */}
            {editing && (
                <Card className="border-[#E8E1D6] rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {editing.id ? 'Edit Template' : 'New Template'}
                        </CardTitle>
                        <CardDescription>
                            The content will be shown to the patient before they sign.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Template Name</label>
                            <Input
                                value={editing.name || ''}
                                onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Standard Procedure Consent"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Content</label>
                            <textarea
                                value={editing.content || ''}
                                onChange={e => setEditing(prev => ({ ...prev, content: e.target.value }))}
                                rows={10}
                                placeholder="I, the undersigned, hereby consent to the procedure and confirm that..."
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setEditing(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-[#1C1917] hover:bg-[#3E3832] text-white"
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" /> Save Template
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[#C4A882]" />
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-[#E8E1D6] rounded-2xl">
                    <FileText className="w-10 h-10 mx-auto text-[#C4A882] mb-3" />
                    <p className="text-[#78716C]">No consent templates yet.</p>
                    <p className="text-sm text-[#A8A29E] mt-1">
                        Create one above to enable digital consent signing on procedure sessions.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {templates.map(t => (
                        <Card key={t.id} className="border-[#E8E1D6] rounded-2xl">
                            <CardContent className="py-4 px-5 flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[#1C1917]">{t.name}</p>
                                    <p className="text-sm text-[#78716C] mt-1 line-clamp-2">{t.content}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditing({ ...t })}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={deleting === t.id}
                                        onClick={() => handleDelete(t.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        {deleting === t.id
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Trash2 className="w-4 h-4" />
                                        }
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
