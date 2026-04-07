import { notFound } from 'next/navigation';
import { clinicalApi } from '@/lib/services/clinical';
import { SessionDetailClient } from '@/components/sessions/SessionDetailClient';
import type { ProcedureSession } from '@/types/models';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const session = await clinicalApi.sessions.get(id);
        if (!session) {
            return notFound();
        }

        // Fetch the clinical photo URL so face mapping works on first render
        let clinicalPhotoUrl: string | null = null;
        if (session.clinical_photo) {
            try {
                const photo = await clinicalApi.photos.get(session.clinical_photo);
                clinicalPhotoUrl = photo.photo_url ?? null;
            } catch {
                // non-fatal — schematic will fall back to SVG drawing
            }
        }

        const sessionWithPhoto = { ...session, clinical_photo_url: clinicalPhotoUrl };

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <SessionDetailClient initialData={sessionWithPhoto} />
            </div>
        );
    } catch (error) {
        console.error("Failed to fetch session details:", error);
        return notFound();
    }
}
