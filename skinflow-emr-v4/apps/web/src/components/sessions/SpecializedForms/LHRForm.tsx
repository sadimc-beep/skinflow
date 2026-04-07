"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

interface LHRData {
    body_area?: string;
    machine_used?: string;
    fitzpatrick_scale?: string;
    fluence?: string;        // Joules/cm2
    pulse_duration?: string; // ms
    spot_size?: string;      // mm
    cooling?: string;
    notes?: string;
}

export interface LHRFormProps {
    initialData?: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
    readonly?: boolean;
}

export function LHRForm({ initialData = {}, onSave, readonly = false }: LHRFormProps) {
    const [data, setData] = useState<LHRData>({
        body_area: initialData.body_area || '',
        machine_used: initialData.machine_used || '',
        fitzpatrick_scale: initialData.fitzpatrick_scale || '',
        fluence: initialData.fluence || '',
        pulse_duration: initialData.pulse_duration || '',
        spot_size: initialData.spot_size || '',
        cooling: initialData.cooling || '',
        notes: initialData.notes || ''
    });

    const [isDirty, setIsDirty] = useState(false);

    const handleChange = (field: keyof LHRData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSavePrimary = () => {
        onSave(data);
        setIsDirty(false);
    };

    return (
        <Card className="border-orange-200">
            <CardHeader className="bg-orange-50/50 rounded-t-lg border-b border-orange-100">
                <CardTitle className="text-xl text-orange-900">Laser Hair Removal (LHR) Parameters</CardTitle>
                <CardDescription>Track device settings for safety and efficacy</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Patient & Device Setup */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Treatment Setup</h3>

                        <div className="grid gap-2">
                            <Label>Body Area Treated</Label>
                            <Input
                                placeholder="e.g. Upper Lip, Full Back, Underarms"
                                value={data.body_area}
                                onChange={(e) => handleChange('body_area', e.target.value)}
                                disabled={readonly}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Skin Type (Fitzpatrick)</Label>
                            <Select
                                value={data.fitzpatrick_scale}
                                onValueChange={(val) => handleChange('fitzpatrick_scale', val)}
                                disabled={readonly}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Skin Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="I">Type I (Always burns, never tans)</SelectItem>
                                    <SelectItem value="II">Type II (Usually burns, tans minimally)</SelectItem>
                                    <SelectItem value="III">Type III (Sometimes burns, tans uniformly)</SelectItem>
                                    <SelectItem value="IV">Type IV (Burns minimally, always tans well)</SelectItem>
                                    <SelectItem value="V">Type V (Rarely burns, tans profusely)</SelectItem>
                                    <SelectItem value="VI">Type VI (Never burns, deeply pigmented)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Machine / Wavelength</Label>
                            <Input
                                placeholder="e.g. Alexandrite 755nm / Nd:YAG 1064nm"
                                value={data.machine_used}
                                onChange={(e) => handleChange('machine_used', e.target.value)}
                                disabled={readonly}
                            />
                        </div>
                    </div>

                    {/* Machine Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Device Parameters</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Fluence (J/cm²)</Label>
                                <Input
                                    type="number" step="0.5"
                                    placeholder="Energy"
                                    value={data.fluence}
                                    onChange={(e) => handleChange('fluence', e.target.value)}
                                    disabled={readonly}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Pulse Duration (ms)</Label>
                                <Input
                                    type="number" step="1"
                                    placeholder="Width"
                                    value={data.pulse_duration}
                                    onChange={(e) => handleChange('pulse_duration', e.target.value)}
                                    disabled={readonly}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Spot Size (mm)</Label>
                                <Input
                                    type="number" step="1"
                                    placeholder="Diameter"
                                    value={data.spot_size}
                                    onChange={(e) => handleChange('spot_size', e.target.value)}
                                    disabled={readonly}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Cooling Setting</Label>
                                <Input
                                    placeholder="e.g. Cryo Level 4"
                                    value={data.cooling}
                                    onChange={(e) => handleChange('cooling', e.target.value)}
                                    disabled={readonly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Full width notes & Save */}
                    <div className="col-span-1 md:col-span-2 space-y-4 mt-2 border-t pt-4">
                        <div className="grid gap-2">
                            <Label>Clinical Notes / Tolerability</Label>
                            <Input
                                placeholder="e.g. Perifollicular edema noted. Patient tolerated well."
                                value={data.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                disabled={readonly}
                            />
                        </div>

                        {!readonly && (
                            <div className="flex flex-col items-center mt-4">
                                <Button
                                    className="w-full md:w-1/2 bg-orange-600 hover:bg-orange-700"
                                    onClick={handleSavePrimary}
                                    disabled={!isDirty}
                                >
                                    <Save className="w-4 h-4 mr-2" /> Save LHR Parameters
                                </Button>
                                {!isDirty && (data.fluence || data.body_area) && (
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
