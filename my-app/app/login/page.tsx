'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/Lib/firebase';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            router.replace('/');
        } catch {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    }


    return (
        <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
            <div className="w-full max-w-[400px]">

                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-[#171717]">
                        Penalty Tracker
                    </h1>

                    <p className="mt-3 text-sm text-[#737373]">
                        Sign in to your account to continue.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">

                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#262626]">
                            Email Address
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full border border-[#D4D4D4] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-black"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#262626]">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full border border-[#D4D4D4] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-black"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Login'}
                    </button>

                </form>

                <p className="mt-8 text-center text-xs text-[#A3A3A3]">
                    Penalty Tracker Management System
                </p>

            </div>
        </main>
    );

}
