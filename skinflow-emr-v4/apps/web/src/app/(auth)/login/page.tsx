'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Logged in successfully');
            router.push('/');
        } catch (error: any) {
            toast.error(error.message || 'Failed to login');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#EDE7DC] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-[#F7F3ED] rounded-3xl p-8 shadow-2xl border border-[#E8E1D6]">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#1C1917] text-[#C4A882] rounded-2xl flex items-center justify-center mb-5 rotate-3">
                        <Shield className="w-8 h-8 -rotate-3" />
                    </div>
                    <h1 className="text-4xl font-display text-[#1C1917] mb-2 tracking-tight">Skinflow EMR</h1>
                    <p className="text-[#A0978D] font-medium text-sm uppercase tracking-widest">Authorized Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-[#78706A] uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white rounded-2xl border border-[#E8E1D6] focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] outline-none transition font-medium text-[#1C1917]"
                            placeholder="doctor@clinic.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#78706A] uppercase tracking-wider mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white rounded-2xl border border-[#E8E1D6] focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] outline-none transition font-medium text-[#1C1917]"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] py-4 rounded-2xl font-bold transition disabled:opacity-70 shadow-lg shadow-black/5 mt-4"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                    </button>

                    <div className="text-center pt-4">
                        <a href="#" className="text-xs text-[#A0978D] hover:text-[#C4A882] font-semibold transition" onClick={(e) => e.preventDefault()}>
                            Forgot your password?
                        </a>
                    </div>
                </form>
            </div>

            <div className="absolute bottom-8 text-center w-full">
                <p className="text-xs text-[#A0978D] font-medium">Protected by Skinflow Identity • Enterprise Grade Security</p>
            </div>
        </div>
    );
}
