
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
        <main className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

                <h1 className="text-2xl font-bold text-green-950">
                    Penalty Tracker
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Sign in to your admin account.
                </p>

                <form onSubmit={handleLogin} className="mt-8 space-y-5">

                    <div>
                        <label className="mb-2 block text-sm font-medium text-green-950">
                            Email Address
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-green-800 text-green-950"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-green-950">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-green-800 text-green-950   "
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
                        className="w-full rounded-lg bg-green-950 py-3 font-medium text-white hover:bg-green-800 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Login'}
                    </button>

                </form>
            </div>
        </main>
    );
}
