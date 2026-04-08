'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clinicalApi } from '@/lib/services/clinical';
import { SessionDetailClient } from '@/components/sessions/SessionDetailClient';
import type { ProcedureSession } from '@/types/models';

export default function SessionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [session, setSession] = useState<(ProcedureSession & { clinical_photo_url?: string | null }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        clinicalApi.sessions.get(id)
            .then(async (data) => {
                let clinicalPhotoUrl: string | null = null;
                if (data.clinical_photo) {
                    try {
                        const photo = await clinicalApi.photos.get(data.clinical_photo);
                        clinicalPhotoUrl = photo.photo_url ?? null;
                    } catch {
                        // non-fatal — schematic falls back to SVG drawing
                    }
                }
                setSession({ ...data, clinical_photo_url: clinicalPhotoUrl });
            })
            .catch(() => router.replace('/sessions'))
            .finally(() => setIsLoading(false));
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                Loading session…
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <SessionDetailClient initialData={session} />
        </div>
    );
}
