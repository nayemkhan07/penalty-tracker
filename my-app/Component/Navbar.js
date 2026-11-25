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
        <header className="flex h-16 items-center justify-between border-b border-[#E5E5E7] bg-white px-5 md:px-7">

            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="text-xl text-[#626A78] transition hover:text-black lg:hidden"
                    aria-label="Open sidebar"
                >
                    ☰
                </button>

                <h1 className="text-base font-semibold tracking-tight text-[#171717]">
                    {pageTitle}
                </h1>
            </div>

            <div className="flex items-center">
                {!loading && (
                    user ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-sm font-medium text-[#626A78] transition hover:text-black"
                        >
                            Logout
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleLogin}
                            className="text-sm font-medium text-[#626A78] transition hover:text-black"
                        >
                            Login
                        </button>
                    )
                )}
            </div>

        </header>
    );
}
