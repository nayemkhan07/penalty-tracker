
'use client';

import { useEffect, useState } from 'react';

export default function MemberSummary() {
    const [entries, setEntries] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load penalty data from localStorage
    useEffect(() => {
        function loadEntries() {
            try {
                const savedData = localStorage.getItem('penaltyEntries');

                if (savedData) {
                    const data = JSON.parse(savedData);

                    if (Array.isArray(data)) {
                        setEntries(data);
                    } else {
                        setEntries([]);
                    }
                } else {
                    setEntries([]);
                }
            } catch (error) {
                console.log('Error loading penalty data:', error);
                setEntries([]);
            }

            setIsLoaded(true);
        }

        loadEntries();

        window.addEventListener('storage', loadEntries);

        return () => {
            window.removeEventListener('storage', loadEntries);
        };
    }, []);

    // Check if the date is valid
    function isValidDate(date) {
        if (typeof date !== 'string') {
            return false;
        }

        const datePattern = /^\d{4}-\d{2}-\d{2} $/;

        if (!datePattern.test(date)) {
            return false;
        }

        const parts = date.split('-');

        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);

        const newDate = new Date(year, month - 1, day);

        if (year < 2000 || year > 2100) {
            return false;
        }

        if (newDate.getFullYear() !== year) {
            return false;
        }

        if (newDate.getMonth() !== month - 1) {
            return false;
        }

        if (newDate.getDate() !== day) {
            return false;
        }

        return true;
    }

    // Get months from the existing entries
    const months = [];

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (!isValidDate(entry.date)) {
            continue;
        }

        const month = entry.date.slice(0, 7);

        if (!months.includes(month)) {
            months.push(month);
        }
    }

    // Show the latest month first
    months.sort((a, b) => b.localeCompare(a));

    // Reset the filter if the selected month no longer exists
    useEffect(() => {
        if (
            selectedMonth !== 'all' &&
            !months.includes(selectedMonth)
        ) {
            setSelectedMonth('all');
        }
    }, [selectedMonth, entries]);

    // Filter entries by month
    const filteredEntries = [];

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (!isValidDate(entry.date)) {
            continue;
        }

        if (selectedMonth === 'all') {
            filteredEntries.push(entry);
        } else if (entry.date.slice(0, 7) === selectedMonth) {
            filteredEntries.push(entry);
        }
    }

    // Create a summary for each member
    const memberSummary = [];

    for (let i = 0; i < filteredEntries.length; i++) {
        const entry = filteredEntries[i];
        const name = entry.member;

        if (!name) {
            continue;
        }

        let memberFound = false;

        for (let j = 0; j < memberSummary.length; j++) {
            if (memberSummary[j].name === name) {
                const amount = Number(entry.amount) || 0;

                memberSummary[j].totalFine += amount;

                if (entry.status === 'Pending') {
                    memberSummary[j].dueFine += amount;
                }

                memberFound = true;
                break;
            }
        }

        // Add a new member if they are not in the summary
        if (!memberFound) {
            const amount = Number(entry.amount) || 0;

            const newMember = {
                name: name,
                totalFine: amount,
                dueFine: entry.status === 'Pending' ? amount : 0,
            };

            memberSummary.push(newMember);
        }
    }

    // Sort members by total fine
    memberSummary.sort((a, b) => b.totalFine - a.totalFine);

    // Calculate the grand total
    let totalFine = 0;
    let totalDue = 0;

    for (let i = 0; i < memberSummary.length; i++) {
        totalFine += memberSummary[i].totalFine;
        totalDue += memberSummary[i].dueFine;
    }

    // Format the amount in Bangladeshi Taka
    function formatTaka(amount) {
        return `৳${amount.toLocaleString('en-BD', {
            maximumFractionDigits: 2,
        })}`;
    }

    // Convert 2026-10 into October 2026
    function formatMonth(month) {
        const parts = month.split('-');

        const year = Number(parts[0]);
        const monthNumber = Number(parts[1]);

        return new Date(year, monthNumber - 1, 1).toLocaleDateString(
            'en-US',
            {
                month: 'long',
                year: 'numeric',
            }
        );
    }

    // Show loading message before the data loads
    if (!isLoaded) {
        return (
            <div className="p-6 text-stone-500">
                Loading member summary...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-stone-50 p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">
                <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">

                    {/* Header and month filter */}
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

                    {/* Member summary table */}
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
                                            className={`border-b border-stone-100 transition-colors hover:bg-emerald-50 ${index % 2 === 1
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

                    {/* Number of members */}
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
