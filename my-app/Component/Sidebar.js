
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
        { name: 'Settings', href: '/settings' },
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
                <div className="p-5">
                    {isCollapsed ? (
                        <button
                            onClick={onToggleCollapse}
                            className="text-2xl text-stone-700 hover:text-green-900"
                            aria-label="Expand sidebar"
                        >
                            ☰
                        </button>
                    ) : (
                        <>
                            <div className="flex items-center justify-between border-b border-stone-100 px-2 pb-6">
                                <div>
                                    <h1 className="text-base font-semibold text-stone-900">
                                        Penalty Tracker
                                    </h1>

                                    <p className="text-xs text-stone-500">
                                        SaaS Admin Panel
                                    </p>
                                </div>

                                <button
                                    onClick={onToggleCollapse}
                                    className="text-xl text-stone-500 hover:text-stone-900"
                                    aria-label="Collapse sidebar"
                                >
                                    X
                                </button>
                            </div>

                            <nav className="mt-6 space-y-1.5">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`block rounded-lg px-3.5 py-2.5 text-sm font-medium
                                                ${isActive
                                                    ? 'bg-green-900 text-white'
                                                    : 'text-stone-600 hover:bg-stone-100'
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
