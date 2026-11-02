'use client';

import { usePathname } from 'next/navigation';

export default function Navbar({ onMenuClick }) {
    const pathname = usePathname();

    const pageNames = {
        '/': 'Dashboard',
        '/entries': 'Penalty Entries',
        '/summary': 'Member Summary',
        '/settings': 'Settings',
    };

    const pageTitle = pageNames[pathname] || 'Penalty Tracker';

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
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-900 text-sm font-semibold text-white">
                        A
                    </div>

                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-stone-900">
                            Admin
                        </p>
                        <p className="text-xs text-stone-500">
                            Administrator
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}