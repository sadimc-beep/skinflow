"use client";

import React, { useState } from 'react';
import { FacialSchematic, FILLER_ZONES } from './FacialSchematic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

interface FillerData {
    product_name?: string;
    lot_number?: string;
    technique?: 'needle' | 'cannula' | 'mixed';
    zones: Record<string, string>; // ml can be decimal, so we store as string representation of number or float
    customZones: Array<{ id: string; label: string; x: number; y: number }>;
}

export interface FillerFormProps {
    initialData?: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
    readonly?: boolean;
    clinicalPhotoUrl?: string | null;
}

export function FillerForm({ initialData = {}, onSave, readonly = false, clinicalPhotoUrl }: FillerFormProps) {
    const [data, setData] = useState<FillerData>({
        product_name: initialData.product_name || '',
        lot_number: initialData.lot_number || '',
        technique: initialData.technique || 'needle',
        zones: initialData.zones || {},
        customZones: initialData.customZones || [],
    });

    const [isDirty, setIsDirty] = useState(false);

    const handleAddCustomZone = (x: number, y: number) => {
        const id = `custom-${Date.now()}`;
        const newZone = { id, label: 'Custom Point', x, y };
        setData(prev => ({
            ...prev,
            customZones: [...prev.customZones, newZone]
        }));
        setIsDirty(true);
    };

    const handleRemoveCustomZone = (zoneId: string) => {
        setData(prev => {
            const nextCustomZones = prev.customZones.filter(z => z.id !== zoneId);
            const nextZones = { ...prev.zones };
            delete nextZones[zoneId];
            return {
                ...prev,
                customZones: nextCustomZones,
                zones: nextZones
            };
        });
        setIsDirty(true);
    };

    const handleZoneChange = (zoneId: string, value: number | string) => {
        setData(prev => {
            const nextZones = { ...prev.zones };
            if (value === '' || Number(value) === 0) {
                delete nextZones[zoneId];
            } else {
                nextZones[zoneId] = String(value);
            }
            return { ...prev, zones: nextZones };
        });
        setIsDirty(true);
    };

    const totalVol = Object.values(data.zones).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(1);

    const handleSavePrimary = () => {
        onSave(data);
        setIsDirty(false);
    };

    return (
        <Card className="border-purple-200">
            <CardHeader className="bg-purple-50/50 rounded-t-lg border-b border-purple-100">
                <CardTitle className="text-xl text-purple-900">Dermal Filler Charting</CardTitle>
                <CardDescription>Visual tracker for filler volumes (mL)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visual Charting */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-slate-700">Facial Zones</h3>
                            <div className="text-sm font-medium px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                                Total: {totalVol} mL
                            </div>
                        </div>
                        <FacialSchematic
                            mode="filler"
                            data={data.zones}
                            onChange={handleZoneChange}
                            readonly={readonly}
                            imageUrl={clinicalPhotoUrl}
                            customZones={data.customZones}
                            onAddCustomZone={handleAddCustomZone}
                            onRemoveCustomZone={handleRemoveCustomZone}
                        />
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-col space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700">Product Administration</h3>
                            <div className="grid gap-2">
                                <Label htmlFor="product_name">Product Used</Label>
                                <Input
                                    id="product_name"
                                    placeholder="e.g. Juvederm Voluma / Restylane"
                                    value={data.product_name}
                                    onChange={(e) => {
                                        setData({ ...data, product_name: e.target.value });
                                        setIsDirty(true);
                                    }}
                                    disabled={readonly}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="f_lot_number">Syringe Lot Number</Label>
                                <Input
                                    id="f_lot_number"
                                    placeholder="Enter Lot #"
                                    value={data.lot_number}
                                    onChange={(e) => {
                                        setData({ ...data, lot_number: e.target.value });
                                        setIsDirty(true);
                                    }}
                                    disabled={readonly}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Administration Technique</Label>
                                <Select
                                    value={data.technique}
                                    onValueChange={(val: any) => {
                                        setData({ ...data, technique: val });
                                        setIsDirty(true);
                                    }}
                                    disabled={readonly}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select technique" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="needle">Needle Overlay (27G/30G)</SelectItem>
                                        <SelectItem value="cannula">Microcannula</SelectItem>
                                        <SelectItem value="mixed">Mixed Technique</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!readonly && (
                            <div className="mt-auto pt-6 border-t flex flex-col items-center">
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    onClick={handleSavePrimary}
                                    disabled={!isDirty}
                                >
                                    <Save className="w-4 h-4 mr-2" /> Save Charting Data
                                </Button>
                                {!isDirty && Object.keys(data.zones).length > 0 && (
                                    <span className="text-xs text-green-600 mt-2 font-medium bg-green-50 px-2 py-1 rounded">
                                        Data is up to date
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
