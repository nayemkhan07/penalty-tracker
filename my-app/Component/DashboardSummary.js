
'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/Lib/firebase';

export default function DashboardSummary() {
    const [entries, setEntries] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState('');

    // Firebase Realtime Data
    useEffect(() => {
        const entriesRef = collection(db, 'penaltyEntries');

        const unsubscribe = onSnapshot(
            entriesRef,
            (snapshot) => {
                const firebaseEntries = snapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }));

                setEntries(firebaseEntries);
                setError('');
                setIsLoaded(true);
            },
            (error) => {
                console.error('Firebase Error:', error);
                setError('Failed to load dashboard data from Firebase.');
                setIsLoaded(true);
            }
        );

        return () => unsubscribe();
    }, []);

    // Format Taka
    const formatTaka = (amount) =>
        `৳ ${Number(amount || 0).toLocaleString('en-BD', {
            maximumFractionDigits: 2,
        })}`;

    // Summary Calculations
    const totalEntries = entries.length;

    const totalFine = entries.reduce(
        (total, entry) => total + (Number(entry.amount) || 0),
        0
    );

    const dueAmount = entries
        .filter(
            (entry) =>
                String(entry.status || '').toLowerCase() === 'pending'
        )
        .reduce(
            (total, entry) => total + (Number(entry.amount) || 0),
            0
        );

    const paidAmount = totalFine - dueAmount;

    // Generate Last 6 Months
    const monthlyData = useMemo(() => {
        const currentDate = new Date();
        const months = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - i,
                1
            );

            const year = date.getFullYear();
            const monthNumber = String(
                date.getMonth() + 1
            ).padStart(2, '0');

            const key = `${year}-${monthNumber}`;

            months.push({
                key,
                label: date.toLocaleDateString('en-US', {
                    month: 'short',
                }),
                total: 0,
                paid: 0,
            });
        }

        entries.forEach((entry) => {
            if (
                typeof entry.date !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
            ) {
                return;
            }

            const [year, month, day] = entry.date
                .split('-')
                .map(Number);

            const date = new Date(year, month - 1, day);

            if (
                date.getFullYear() !== year ||
                date.getMonth() !== month - 1 ||
                date.getDate() !== day
            ) {
                return;
            }

            const monthKey = entry.date.slice(0, 7);

            const currentMonth = months.find(
                (item) => item.key === monthKey
            );

            if (!currentMonth) {
                return;
            }

            const amount = Number(entry.amount) || 0;

            currentMonth.total += amount;

            if (
                String(entry.status || '').toLowerCase() === 'paid'
            ) {
                currentMonth.paid += amount;
            }
        });

        return months;
    }, [entries]);

    // Find highest monthly value for graph scaling
    const maxMonthlyFine = Math.max(
        ...monthlyData.map((month) => month.total),
        0
    );

    // Summary Cards
    const summaryCards = [
        {
            title: 'Total Entries',
            value: totalEntries.toLocaleString('en-BD'),
            description: 'All penalty records',
            icon: '📋',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-700',
            valueColor: 'text-emerald-950',
        },
        {
            title: 'Total Fine',
            value: formatTaka(totalFine),
            description: 'Total recorded fines',
            icon: '৳',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-700',
            valueColor: 'text-emerald-950',
        },
        {
            title: 'Due Amount',
            value: formatTaka(dueAmount),
            description: 'Unpaid penalty amounts',
            icon: '⏳',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            valueColor: 'text-red-600',
        },
    ];

    // Loading State
    if (!isLoaded) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="h-36 animate-pulse rounded-xl border border-stone-200 bg-white"
                    />
                ))}
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {summaryCards.map((card) => (
                    <div
                        key={card.title}
                        className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-stone-500">
                                {card.title}
                            </p>

                            <div
                                className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${card.iconBg} ${card.iconColor}`}
                            >
                                {card.icon}
                            </div>
                        </div>

                        <h2
                            className={`mt-4 break-words text-2xl font-bold ${card.valueColor}`}
                        >
                            {card.value}
                        </h2>

                        <p className="mt-2 text-xs text-stone-400">
                            {card.description}
                        </p>
                    </div>
                ))}

            </div>

            {/* Monthly Analytics */}
            <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">

                {/* Graph Header */}
                <div className="flex flex-col gap-3 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-lg font-bold text-stone-900">
                            Monthly Analytics
                        </h2>

                        <p className="mt-1 text-sm text-stone-500">
                            Fine collection and payment overview
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600">

                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-sm bg-emerald-800" />
                            Total Fine
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-sm bg-amber-500" />
                            Paid Amount
                        </div>

                    </div>
                </div>

                {/* Graph Content */}
                <div className="p-5">

                    <div className="mb-5 grid grid-cols-2 gap-3">

                        <div className="rounded-lg bg-emerald-50 p-3">
                            <p className="text-xs font-medium text-emerald-800">
                                Total Fine
                            </p>

                            <p className="mt-1 text-lg font-bold text-emerald-950">
                                {formatTaka(totalFine)}
                            </p>
                        </div>

                        <div className="rounded-lg bg-amber-50 p-3">
                            <p className="text-xs font-medium text-amber-800">
                                Paid Amount
                            </p>

                            <p className="mt-1 text-lg font-bold text-amber-900">
                                {formatTaka(paidAmount)}
                            </p>
                        </div>

                    </div>

                    {/* Bar Chart */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[520px]">

                            <div
                                className="relative h-64 border-b border-l border-stone-200"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)',
                                    backgroundSize: '100% 25%',
                                }}
                            >

                                <div className="absolute inset-0 flex items-end justify-around px-3">

                                    {monthlyData.map((month) => {
                                        const totalHeight =
                                            maxMonthlyFine > 0
                                                ? (month.total / maxMonthlyFine) * 100
                                                : 0;

                                        const paidHeight =
                                            maxMonthlyFine > 0
                                                ? (month.paid / maxMonthlyFine) * 100
                                                : 0;

                                        return (
                                            <div
                                                key={month.key}
                                                className="flex h-full flex-1 items-end justify-center gap-2 px-2"
                                            >

                                                {/* Total Fine Bar */}
                                                <div
                                                    title={`Total Fine: ${formatTaka(month.total)}`}
                                                    className="w-5 max-w-[35%] rounded-t-md bg-emerald-800 transition-all duration-500 hover:bg-emerald-600 sm:w-8"
                                                    style={{
                                                        height: `${totalHeight}%`,
                                                        minHeight:
                                                            month.total > 0 ? '3px' : '0px',
                                                    }}
                                                />

                                                {/* Paid Amount Bar */}
                                                <div
                                                    title={`Paid Amount: ${formatTaka(month.paid)}`}
                                                    className="w-5 max-w-[35%] rounded-t-md bg-amber-500 transition-all duration-500 hover:bg-amber-400 sm:w-8"
                                                    style={{
                                                        height: `${paidHeight}%`,
                                                        minHeight:
                                                            month.paid > 0 ? '3px' : '0px',
                                                    }}
                                                />

                                            </div>
                                        );
                                    })}

                                </div>

                            </div>

                            {/* Month Labels */}
                            <div className="flex justify-around pl-3 pt-3">

                                {monthlyData.map((month) => (
                                    <div
                                        key={month.key}
                                        className="flex-1 text-center text-xs font-medium text-stone-500"
                                    >
                                        {month.label}
                                    </div>
                                ))}

                            </div>

                        </div>
                    </div>

                    {/* Graph Footer */}
                    <div className="mt-6 border-t border-stone-100 pt-4">

                        <p className="text-xs text-stone-500">
                            Showing monthly data for the last 6 months.
                            All figures are calculated directly from
                            Firestore records.
                        </p>

                    </div>

                </div>

            </section>

        </div>
    );
}
