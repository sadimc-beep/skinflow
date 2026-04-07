"use client";

import React, { useState, useEffect } from 'react';
import { FacialSchematic, BOTOX_ZONES } from './FacialSchematic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface BotoxData {
    lot_number?: string;
    dilution?: string;
    zones: Record<string, number>;
    customZones: Array<{ id: string; label: string; x: number; y: number }>;
}

export interface BotoxFormProps {
    initialData?: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
    readonly?: boolean;
    clinicalPhotoUrl?: string | null;
}

export function BotoxForm({ initialData = {}, onSave, readonly = false, clinicalPhotoUrl }: BotoxFormProps) {
    const [data, setData] = useState<BotoxData>({
        lot_number: initialData.lot_number || '',
        dilution: initialData.dilution || '2.5ml per 100U',
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
                nextZones[zoneId] = Number(value);
            }
            return { ...prev, zones: nextZones };
        });
        setIsDirty(true);
    };

    const totalUnits = Object.values(data.zones).reduce((sum, val) => sum + (Number(val) || 0), 0);

    const handleSavePrimary = () => {
        onSave(data);
        setIsDirty(false);
    };

    return (
        <Card className="border-blue-200">
            <CardHeader className="bg-blue-50/50 rounded-t-lg border-b border-blue-100">
                <CardTitle className="text-xl text-blue-900">Botox / Neurotoxin Charting</CardTitle>
                <CardDescription>Visual tracker for injection units</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visual Charting */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-slate-700">Facial Zones</h3>
                            <div className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                                Total: {totalUnits} Units
                            </div>
                        </div>
                        <FacialSchematic
                            mode="botox"
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
                                <Label htmlFor="lot_number">Vial Lot Number</Label>
                                <Input
                                    id="lot_number"
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
                                <Label htmlFor="dilution">Reconstitution / Dilution</Label>
                                <Input
                                    id="dilution"
                                    placeholder="e.g. 2.5ml per 100U"
                                    value={data.dilution}
                                    onChange={(e) => {
                                        setData({ ...data, dilution: e.target.value });
                                        setIsDirty(true);
                                    }}
                                    disabled={readonly}
                                />
                            </div>
                        </div>

                        {!readonly && (
                            <div className="mt-auto pt-6 border-t flex flex-col items-center">
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700"
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
