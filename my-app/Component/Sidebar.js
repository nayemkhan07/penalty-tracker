
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({
    isOpen,
    onClose,
    isCollapsed,
    onToggleCollapse,
}) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/' },
        { name: 'Penalty Entries', href: '/entries' },
        { name: 'Member Summary', href: '/summary' },
    ];

    return (
        <div>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 h-screen border-r border-stone-200 bg-white transition-all duration-200
                ${isCollapsed ? 'w-16' : 'w-64'}
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0`}
            >
                <div className="px-4 pt-6">
                    {isCollapsed ? (
                        <button
                            onClick={onToggleCollapse}
                            className="flex h-10 w-full items-center justify-center text-xl text-stone-700 transition hover:text-black"
                            aria-label="Expand sidebar"
                        >
                            ☰
                        </button>
                    ) : (
                        <>
                            {/* Brand */}
                            <div className="flex items-center justify-between px-3">
                                <h1 className="text-base font-semibold tracking-tight text-[#171717]">
                                    Penalty Tracker
                                </h1>

                                <button
                                    onClick={onToggleCollapse}
                                    className="text-sm text-stone-400 transition hover:text-stone-900"
                                    aria-label="Collapse sidebar"
                                >
                                    ‹
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="mt-9 space-y-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`block rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-150
                                            ${isActive
                                                    ? 'bg-[#1C1C1E] text-white'
                                                    : 'text-[#626A78] hover:bg-[#F3F3F4] hover:text-[#171717]'
                                                }`}
                                        >
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}
