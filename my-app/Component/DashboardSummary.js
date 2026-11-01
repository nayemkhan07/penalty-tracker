'use client';

import { useEffect, useState } from 'react';

export default function DashboardSummary() {
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        function loadEntries() {
            try {
                const savedEntries = localStorage.getItem('penaltyEntries');
                const parsedEntries = savedEntries
                    ? JSON.parse(savedEntries)
                    : [];

                setEntries(
                    Array.isArray(parsedEntries) ? parsedEntries : []
                );
            } catch (error) {
                console.error('Failed to load entries:', error);
                setEntries([]);
            }
        }

        loadEntries();

        window.addEventListener('storage', loadEntries);

        return () => {
            window.removeEventListener('storage', loadEntries);
        };
    }, []);

    const totalEntries = entries.length;

    const totalFine = entries.reduce(
        (total, entry) => total + Number(entry.amount || 0),
        0
    );

    const dueAmount = entries
        .filter((entry) => entry.status === 'Pending')
        .reduce(
            (total, entry) => total + Number(entry.amount || 0),
            0
        );

    const formatTaka = (amount) =>
        `৳ ${amount.toLocaleString('en-BD', {
            maximumFractionDigits: 2,
        })}`;

    const summaryCards = [
        {
            title: 'Total Entries',
            value: totalEntries,
            description: 'All penalty records',
            color: 'text-emerald-950',
            icon: '📋',
        },
        {
            title: 'Total Fine',
            value: formatTaka(totalFine),
            description: 'Total recorded fines',
            color: 'text-emerald-950',
            icon: '৳',
        },
        {
            title: 'Due Amount',
            value: formatTaka(dueAmount),
            description: 'Unpaid penalty amounts',
            color: 'text-red-600',
            icon: '⏳',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => (
                <div
                    key={card.title}
                    className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-stone-500">
                            {card.title}
                        </p>

                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-lg text-emerald-900">
                            {card.icon}
                        </span>
                    </div>

                    <h2
                        className={`mt-4 text-2xl font-bold ${card.color}`}
                    >
                        {card.value}
                    </h2>

                    <p className="mt-2 text-xs text-stone-400">
                        {card.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
