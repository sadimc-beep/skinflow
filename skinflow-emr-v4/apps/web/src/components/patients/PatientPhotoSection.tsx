'use client';

import { useState, useEffect, useCallback } from 'react';
import { clinicalApi } from '@/lib/services/clinical';
import { Button } from '@/components/ui/button';
import { CameraCapture } from '@/components/sf/CameraCapture';
import { Camera, ImageOff, Loader2 } from 'lucide-react';

interface Photo {
    id: number;
    photo_url: string;
    category: string;
    taken_at: string | null;
    description: string;
}

interface PatientPhotoSectionProps {
    patientId: number;
}

export function PatientPhotoSection({ patientId }: PatientPhotoSectionProps) {
    const [photos, setPhotos]         = useState<Photo[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showCamera, setShowCamera] = useState(false);
    const [lightbox, setLightbox]     = useState<Photo | null>(null);

    const fetchPhotos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await clinicalApi.photos.list({ patient: patientId, category: 'REGISTRATION' });
            setPhotos(res.results ?? []);
        } catch {
            // Non-fatal — show empty state
            setPhotos([]);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const handleCapture = async (photoId: number) => {
        setShowCamera(false);
        // Fetch the newly captured photo and prepend to the gallery
        try {
            const photo = await clinicalApi.photos.get(photoId);
            setPhotos(prev => [{ ...photo, category: 'REGISTRATION', taken_at: null, description: '' }, ...prev]);
        } catch {
            // Fallback: re-fetch all photos
            fetchPhotos();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-display text-xl text-[#1C1917] tracking-tight">
                    Registration Photos
                </h3>
                <Button
                    size="sm"
                    onClick={() => setShowCamera(true)}
                    className="h-9 bg-[#1C1917] hover:bg-[#3E3832] text-white"
                >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32 rounded-xl bg-[#F7F3ED] border border-[#E8E1D6]">
                    <Loader2 className="h-6 w-6 animate-spin text-[#A0978D]" />
                </div>
            ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 rounded-xl bg-[#F7F3ED] border border-[#E8E1D6] border-dashed text-[#A0978D] gap-2">
                    <ImageOff className="h-7 w-7" />
                    <p className="text-sm">No registration photos yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map(photo => (
                        <button
                            key={photo.id}
                            onClick={() => setLightbox(photo)}
                            className="aspect-square rounded-lg overflow-hidden border border-[#E8E1D6] bg-[#F7F3ED] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={photo.photo_url}
                                alt="Registration photo"
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Camera modal */}
            {showCamera && (
                <CameraCapture
                    patientId={patientId}
                    category="REGISTRATION"
                    overlay="face_front"
                    onCapture={handleCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightbox.photo_url}
                        alt="Registration photo"
                        className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
