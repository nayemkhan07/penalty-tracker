'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/Lib/firebase';
import { useAuth } from '@/Context/AuthContext';

export default function Navbar({ onMenuClick }) {
    const pathname = usePathname();
    const router = useRouter();

    const { user, loading } = useAuth();

    const pageNames = {
        '/': 'Dashboard',
        '/entries': 'Penalty Entries',
        '/summary': 'Member Summary',
        '/settings': 'Settings',
    };

    const pageTitle = pageNames[pathname] || 'Penalty Tracker';

    async function handleLogout() {
        try {
            await signOut(auth);
            router.replace('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    function handleLogin() {
        router.push('/login');
    }

    return (
        <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-6">

            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="text-2xl text-stone-600 hover:text-stone-900 lg:hidden"
                    aria-label="Open sidebar"
                >
                    ☰
                </button>

                <h1 className="text-lg font-semibold text-stone-900">
                    {pageTitle}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {!loading && (
                    user ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-sm font-medium text-stone-600 transition hover:text-stone-950"
                        >
                            Logout
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleLogin}
                            className="text-sm font-medium text-stone-600 transition hover:text-stone-950"
                        >
                            Login
                        </button>
                    )
                )}
            </div>

        </header>
    );
}
