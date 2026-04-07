import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { RouteGuard } from './RouteGuard';

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#EDE7DC] flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content — the white canvas card floats on the warm cream */}
            <div className="flex-1 lg:pl-60 flex flex-col min-h-screen p-4 lg:p-5">
                {/* White/cream content surface */}
                <div className="flex-1 bg-[#F7F3ED] rounded-[1.75rem] flex flex-col overflow-hidden shadow-[0_2px_24px_rgba(28,25,23,0.08)]">
                    <TopNav />
                    <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10">
                        <RouteGuard>
                            {children}
                        </RouteGuard>
                    </main>
                </div>
            </div>
        </div>
    );
}
