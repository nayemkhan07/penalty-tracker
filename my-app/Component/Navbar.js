// 'use client';

// import { usePathname } from 'next/navigation';

// export default function Navbar({ onMenuClick }) {
//     const pathname = usePathname();

//     const pageNames = {
//         '/': 'Dashboard',
//         '/entries': 'Penalty Entries',
//         '/summary': 'Member Summary',
//         '/settings': 'Settings',
//     };

//     const pageTitle = pageNames[pathname] || 'Penalty Tracker';

//     return (
//         <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-6">
//             <div className="flex items-center gap-4">
//                 <button
//                     onClick={onMenuClick}
//                     className="text-2xl text-stone-600 hover:text-stone-900 lg:hidden"
//                     aria-label="Open sidebar"
//                 >
//                     ☰
//                 </button>

//                 <h1 className="text-lg font-semibold text-stone-900">
//                     {pageTitle}
//                 </h1>
//             </div>

//             <div className="flex items-center gap-4">
//                 <div className="flex items-center gap-2">
//                    logout button will be there
//                 </div>
//             </div>
//         </header>
//     );
// }



'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/Lib/firebase';

export default function Navbar({ onMenuClick }) {
    const pathname = usePathname();
    const router = useRouter();

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
                    <button
                        onClick={handleLogout}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
