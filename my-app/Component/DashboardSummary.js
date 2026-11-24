'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/Lib/firebase';

export default function DashboardSummary() {
    const [entries, setEntries] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState('');

    const toMoney = (value) => {
        const number = Number(value) || 0;
        return Math.round((number + Number.EPSILON) * 100) / 100;
    };

    // Firebase Realtime Data
    useEffect(() => {
        const entriesRef = collection(db, 'penaltyEntries');

        const unsubscribe = onSnapshot(
            entriesRef,
            (snapshot) => {
                const firebaseEntries = snapshot.docs.map((document) => {
                    const data = document.data();
                    const amount = toMoney(data.amount);

                    const paidAmount =
                        data.paidAmount !== undefined
                            ? toMoney(data.paidAmount)
                            : String(data.status || '').toLowerCase() === 'paid'
                                ? amount
                                : 0;

                    const dueAmount =
                        data.dueAmount !== undefined
                            ? toMoney(data.dueAmount)
                            : Math.max(0, amount - paidAmount);

                    return {
                        ...data,
                        id: document.id,
                        amount,
                        paidAmount,
                        dueAmount,
                    };
                });

                setEntries(firebaseEntries);
                setError('');
                setIsLoaded(true);
            },
            (firebaseError) => {
                console.error('Firebase Error:', firebaseError);
                setError('Failed to load dashboard data from Firebase.');
                setIsLoaded(true);
            }
        );

        return () => unsubscribe();
    }, []);

    const formatTaka = (amount) =>
        `৳ ${toMoney(amount).toLocaleString('en-BD', {
            maximumFractionDigits: 2,
        })}`;

    // Summary Calculations
    const totalEntries = entries.length;

    const totalFine = toMoney(
        entries.reduce((total, entry) => total + entry.amount, 0)
    );

    const paidAmount = toMoney(
        entries.reduce((total, entry) => total + entry.paidAmount, 0)
    );

    const dueAmount = toMoney(
        entries.reduce((total, entry) => total + entry.dueAmount, 0)
    );

    // Last 6 Months Data
  const [monthlyData, setMonthlyData] = useState([]);

useEffect(() => {
    const currentDate = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
        );

        const year = date.getFullYear();
        const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
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

        const monthKey = entry.date.slice(0, 7);
        const currentMonth = months.find(
            (month) => month.key === monthKey
        );

        if (!currentMonth) return;

        currentMonth.total += entry.amount;
        currentMonth.paid += entry.paidAmount;
    });

    setMonthlyData(
        months.map((month) => ({
            ...month,
            total: toMoney(month.total),
            paid: toMoney(month.paid),
        }))
    );
}, [entries]);

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
            title: 'Paid Amount',
            value: formatTaka(paidAmount),
            description: 'Total collected payments',
            icon: '✓',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-700',
            valueColor: 'text-emerald-700',
        },
        {
            title: 'Due Amount',
            value: formatTaka(dueAmount),
            description: 'Remaining unpaid amounts',
            icon: '⏳',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            valueColor: 'text-red-600',
        },
    ];

    if (!isLoaded) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                    <div
                        key={item}
                        className="h-36 animate-pulse rounded-xl border border-stone-200 bg-white"
                    />
                ))}
            </div>
        );
    }

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

                        <h2 className={`mt-4 break-words text-2xl font-bold ${card.valueColor}`}>
                            {card.value}
                        </h2>

                        <p className="mt-2 text-xs text-stone-400">
                            {card.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Simple Monthly Graph */}
            <section className="rounded-xl border border-stone-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-stone-900">
                            Monthly Analytics
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Last 6 months fine overview
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
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

                <div className="p-5">
                    <div className="flex h-64 items-end justify-around gap-3 border-b border-stone-200 pb-0">
                        {monthlyData.map((month) => {
                            const totalHeight = maxMonthlyFine > 0
                                ? (month.total / maxMonthlyFine) * 100
                                : 0;

                            const paidHeight = maxMonthlyFine > 0
                                ? (month.paid / maxMonthlyFine) * 100
                                : 0;

                            return (
                                <div
                                    key={month.key}
                                    className="flex h-full flex-1 flex-col items-center justify-end"
                                >
                                    <div className="flex h-full w-full items-end justify-center gap-1 sm:gap-2">
                                        <div
                                            title={`Total Fine: ${formatTaka(month.total)}`}
                                            className="w-5 max-w-[40%] rounded-t-md bg-emerald-800 transition-all sm:w-8"
                                            style={{
                                                height: `${totalHeight}%`,
                                                minHeight: month.total > 0 ? '3px' : '0px',
                                            }}
                                        />

                                        <div
                                            title={`Paid Amount: ${formatTaka(month.paid)}`}
                                            className="w-5 max-w-[40%] rounded-t-md bg-amber-500 transition-all sm:w-8"
                                            style={{
                                                height: `${paidHeight}%`,
                                                minHeight: month.paid > 0 ? '3px' : '0px',
                                            }}
                                        />
                                    </div>

                                    <p className="pt-3 text-xs font-medium text-stone-500">
                                        {month.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-stone-100 px-5 py-3">
                    <p className="text-xs text-stone-400">
                        Monthly figures are grouped by penalty entry date.
                    </p>
                </div>

            </section>
        </div>
    );
}
