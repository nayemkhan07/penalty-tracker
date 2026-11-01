'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleMobileMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div>
            <Sidebar
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            <div
                className={`min-h-screen transition-all duration-200 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                <Navbar onMenuClick={toggleMobileMenu} />

                <main className="min-h-[calc(100vh-4rem)] bg-stone-50 p-6">
                    {children}
                </main>

            </div>
        </div>
    );
}
