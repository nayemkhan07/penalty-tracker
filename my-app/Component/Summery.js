
'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/Lib/firebase';

export default function MemberSummary() {
    const [entries, setEntries] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState('');

    // Realtime data from Firebase Firestore
    useEffect(() => {
        const entriesRef = collection(db, 'penaltyEntries');

        const unsubscribe = onSnapshot(
            entriesRef,
            (snapshot) => {
                const firebaseEntries = snapshot.docs.map((document) => ({
                    ...document.data(),
                    id: document.id,
                    status:
                        String(document.data().status || '').toLowerCase() === 'paid'
                            ? 'Paid'
                            : 'Pending',
                }));

                setEntries(firebaseEntries);
                setError('');
                setIsLoaded(true);
            },
            (error) => {
                console.error('Firestore error:', error);
                setError('Failed to load Member Summary from Firebase.');
                setIsLoaded(true);
            }
        );

        return () => unsubscribe();
    }, []);

    // Validate date
    function isValidDate(date) {
        if (typeof date !== 'string') {
            return false;
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (!datePattern.test(date)) {
            return false;
        }

        const [year, month, day] = date.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);

        return (
            year >= 2000 &&
            year <= 2100 &&
            newDate.getFullYear() === year &&
            newDate.getMonth() === month - 1 &&
            newDate.getDate() === day
        );
    }

    // Get available months
    const months = useMemo(() => {
        const availableMonths = [];

        entries.forEach((entry) => {
            if (!isValidDate(entry.date)) {
                return;
            }

            const month = entry.date.slice(0, 7);

            if (!availableMonths.includes(month)) {
                availableMonths.push(month);
            }
        });

        return availableMonths.sort((a, b) => b.localeCompare(a));
    }, [entries]);

    // Reset month filter if selected month no longer exists
    useEffect(() => {
        if (
            selectedMonth !== 'all' &&
            !months.includes(selectedMonth)
        ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedMonth('all');
        }
    }, [selectedMonth, months]);

    // Filter entries by selected month
    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => {
            if (!isValidDate(entry.date)) {
                return false;
            }

            if (selectedMonth === 'all') {
                return true;
            }

            return entry.date.slice(0, 7) === selectedMonth;
        });
    }, [entries, selectedMonth]);

    // Calculate member summary
    const memberSummary = useMemo(() => {
        const summary = {};

        filteredEntries.forEach((entry) => {
            const name = entry.member;

            if (!name) {
                return;
            }

            const amount = Number(entry.amount) || 0;

            if (!summary[name]) {
                summary[name] = {
                    name,
                    totalFine: 0,
                    dueFine: 0,
                };
            }

            summary[name].totalFine += amount;

            if (
                String(entry.status || '').toLowerCase() === 'pending'
            ) {
                summary[name].dueFine += amount;
            }
        });

        return Object.values(summary).sort(
            (a, b) => b.totalFine - a.totalFine
        );
    }, [filteredEntries]);

    // Calculate grand total
    const totalFine = useMemo(() => {
        return memberSummary.reduce(
            (total, member) => total + member.totalFine,
            0
        );
    }, [memberSummary]);

    const totalDue = useMemo(() => {
        return memberSummary.reduce(
            (total, member) => total + member.dueFine,
            0
        );
    }, [memberSummary]);

    // Format Bangladeshi Taka
    function formatTaka(amount) {
        return `৳${amount.toLocaleString('en-BD', {
            maximumFractionDigits: 2,
        })}`;
    }

    // Format month
    function formatMonth(month) {
        const [year, monthNumber] = month.split('-').map(Number);

        return new Date(year, monthNumber - 1, 1).toLocaleDateString(
            'en-US',
            {
                month: 'long',
                year: 'numeric',
            }
        );
    }

    // Loading state
    if (!isLoaded) {
        return (
            <div className="p-6 text-stone-500">
                Loading member summary from Firebase...
            </div>
        );
    }

    // Firebase error
    if (error) {
        return (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-stone-50 p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">
                <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">

                    {/* Header and Month Filter */}
                    <div className="flex flex-col gap-4 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-stone-900">
                                Member Summary
                            </h1>

                            <p className="mt-1 text-sm text-stone-500">
                                Total fines and outstanding payments
                            </p>
                        </div>

                        <div className="sm:w-64">
                            <label
                                htmlFor="month-filter"
                                className="mb-2 block text-sm font-medium text-stone-700"
                            >
                                Filter Month
                            </label>

                            <select
                                id="month-filter"
                                value={selectedMonth}
                                onChange={(event) =>
                                    setSelectedMonth(event.target.value)
                                }
                                className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                            >
                                <option value="all">All Months</option>

                                {months.map((month) => (
                                    <option key={month} value={month}>
                                        {formatMonth(month)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Member Summary Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[550px] border-collapse text-sm">
                            <thead>
                                <tr className="bg-emerald-950 text-white">
                                    <th className="px-5 py-4 text-left font-semibold">
                                        Member Name
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
                                        Total Fine
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
                                        Due Fine
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {memberSummary.length > 0 ? (
                                    memberSummary.map((member, index) => (
                                        <tr
                                            key={member.name}
                                            className={`border-b border-stone-100 transition-colors hover:bg-emerald-50 ${
                                                index % 2 === 1
                                                    ? 'bg-stone-50'
                                                    : 'bg-white'
                                            }`}
                                        >
                                            <td className="px-5 py-3.5 font-medium text-stone-800">
                                                {member.name}
                                            </td>

                                            <td className="px-5 py-3.5 text-right tabular-nums text-stone-700">
                                                {formatTaka(member.totalFine)}
                                            </td>

                                            <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-amber-700">
                                                {formatTaka(member.dueFine)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-5 py-12 text-center text-stone-500"
                                        >
                                            No penalty entries found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                            <tfoot>
                                <tr className="border-t-2 border-emerald-900 bg-emerald-50 font-bold text-emerald-950">
                                    <td className="px-5 py-4">
                                        Grand Total
                                    </td>

                                    <td className="px-5 py-4 text-right tabular-nums">
                                        {formatTaka(totalFine)}
                                    </td>

                                    <td className="px-5 py-4 text-right tabular-nums text-amber-800">
                                        {formatTaka(totalDue)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-stone-200 px-5 py-3 text-xs text-stone-500">
                        Showing {memberSummary.length} members

                        {selectedMonth !== 'all' &&
                            ` • ${formatMonth(selectedMonth)} only`}
                    </div>

                </section>
            </div>
        </main>
    );
}
    