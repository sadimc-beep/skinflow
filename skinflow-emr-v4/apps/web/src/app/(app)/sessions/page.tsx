import { clinicalApi } from '@/lib/services/clinical';
import { SessionsListClient } from '@/components/sessions/SessionsListClient';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
    // Fetch sessions for today
    const today = new Date().toISOString().split('T')[0];

    // In a real implementation this would fetch by the logged in therapist and specifically for today.
    // For now we fetch all sessions for demo purposes.
    const sessionsRes = await clinicalApi.sessions.list();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Daily Sessions</h2>
                <div className="flex items-center space-x-2">
                    {/* Date picker or filter could go here */}
                </div>
            </div>

            <SessionsListClient initialData={sessionsRes.results || []} />
        </div>
    );
}
