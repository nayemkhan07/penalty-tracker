'use client';

import { useState, useEffect } from 'react';

const members = [
    'Sabbir Alam',
    'nurr',
    'Mahbubul Hasan',
    'Sourav G.',
    'Abu Nayem',
    'Md Riyad',
    'Ziko',
    'NeoMahin',
    'Raquib',
    'Shakir Alam',
    'Khalid Hasan',
    'aurpa',
    'Taj',
    'Salman Farshe',
    'Abir',
];

const penaltyRate = 50;
const STORAGE_KEY = 'penaltyEntries';

const emptyForm = {
    date: '',
    member: '',
    reason: '',
    goalCount: '',
    status: 'Pending',
    paymentDate: '',
};

export default function PenaltyEntries() {
    const [entries, setEntries] = useState([]);
    const [form, setForm] = useState({ ...emptyForm });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved entries when the page opens.
    useEffect(() => {
        try {
            const savedEntries = localStorage.getItem(STORAGE_KEY);

            if (savedEntries) {
                setEntries(JSON.parse(savedEntries));
            }
        } catch (error) {
            console.error('Failed to load penalty entries:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save entries whenever they change.
    useEffect(() => {
        if (!isLoaded) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (error) {
            console.error('Failed to save penalty entries:', error);
        }
    }, [entries, isLoaded]);

    // Calculate the penalty amount automatically.
    const amount = Number(form.goalCount || 0) * penaltyRate;

    // Update form fields.
    function handleChange(event) {
        const { name, value } = event.target;

        setForm((oldForm) => ({
            ...oldForm,
            [name]: value,
            ...(name === 'status' && value === 'Pending'
                ? { paymentDate: '' }
                : {}),
        }));
    }

    // Open a blank form for a new entry.
    function openAddModal() {
        setForm({ ...emptyForm });
        setEditingId(null);
        setIsModalOpen(true);
    }

    // Open an existing entry for editing.
    function openEditModal(entry) {
        setForm({
            date: entry.date || '',
            member: entry.member || '',
            reason: entry.reason || '',
            goalCount: String(entry.goalCount ?? ''),
            status: entry.status || 'Pending',
            paymentDate: entry.paymentDate || '',
        });

        setEditingId(entry.id);
        setIsModalOpen(true);
    }

    // Close the modal.
    function closeModal() {
        setIsModalOpen(false);
        setForm({ ...emptyForm });
        setEditingId(null);
    }

    // Add a new entry or update an existing entry.
    function handleSubmit(event) {
        event.preventDefault();

        const penaltyCount = Number(form.goalCount);

        if (!Number.isFinite(penaltyCount) || penaltyCount <= 0) {
            alert('Please enter a valid penalty count.');
            return;
        }

        if (form.status === 'Paid' && !form.paymentDate) {
            alert('Please select the payment date.');
            return;
        }

        const entry = {
            id: editingId ?? Date.now(),
            date: form.date,
            member: form.member,
            reason: form.reason,
            goalCount: penaltyCount,
            amount: penaltyCount * penaltyRate,
            status: form.status,
            paymentDate:
                form.status === 'Paid' ? form.paymentDate : '',
        };

        if (editingId !== null) {
            setEntries((oldEntries) =>
                oldEntries.map((item) =>
                    item.id === editingId ? entry : item
                )
            );
        } else {
            setEntries((oldEntries) => [...oldEntries, entry]);
        }

        closeModal();
    }

    // Calculate totals.
    const totalFine = entries.reduce(
        (total, entry) => total + Number(entry.amount || 0),
        0
    );

    const dueFine = entries
        .filter((entry) => entry.status === 'Pending')
        .reduce(
            (total, entry) => total + Number(entry.amount || 0),
            0
        );

    const formatTaka = (value) =>
        `৳ ${value.toLocaleString('en-BD', {
            maximumFractionDigits: 2,
        })}`;

    // Wait until saved entries have loaded.
    if (!isLoaded) {
        return (
            <main className="min-h-screen bg-stone-50 p-6 text-slate-800">
                Loading penalty entries...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-stone-50 p-4 text-slate-800 sm:p-8">
            <div className="mx-auto max-w-7xl">

                {/* Page heading */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Penalty Entries
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage and track all penalty records.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="rounded-lg bg-green-950 px-5 py-3 font-medium text-white hover:bg-green-800"
                    >
                        + Add Entry
                    </button>
                </div>

                {/* Summary cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Total Entries
                        </p>

                        <h2 className="mt-3 text-2xl font-bold">
                            {entries.length}
                        </h2>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Total Fine Amount
                        </p>

                        <h2 className="mt-3 text-2xl font-bold">
                            {formatTaka(totalFine)}
                        </h2>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Due Amount
                        </p>

                        <h2 className="mt-3 text-2xl font-bold text-red-600">
                            {formatTaka(dueFine)}
                        </h2>
                    </div>
                </div>

                {/* Entries table */}
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className="border-b border-stone-200 p-5">
                        <h2 className="text-lg font-semibold">
                            All Entries
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-stone-100 text-slate-600">
                                <tr>
                                    <th className="px-4 py-4">#</th>
                                    <th className="px-4 py-4">Date</th>
                                    <th className="px-4 py-4">Member</th>
                                    <th className="px-4 py-4">Reason</th>
                                    <th className="px-4 py-4">Penalty Count</th>
                                    <th className="px-4 py-4">Amount</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4">Payment Date</th>
                                    <th className="px-4 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {entries.map((entry, index) => (
                                    <tr
                                        key={entry.id}
                                        className="border-t border-stone-200 hover:bg-stone-50"
                                    >
                                        <td className="px-4 py-4">
                                            {index + 1}
                                        </td>

                                        <td className="px-4 py-4">
                                            {entry.date}
                                        </td>

                                        <td className="px-4 py-4 font-medium">
                                            {entry.member}
                                        </td>

                                        <td className="px-4 py-4">
                                            {entry.reason}
                                        </td>

                                        <td className="px-4 py-4">
                                            {entry.goalCount}
                                        </td>

                                        <td className="px-4 py-4">
                                            {formatTaka(Number(entry.amount || 0))}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${entry.status === 'Paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                    }`}
                                            >
                                                {entry.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            {entry.paymentDate || '—'}
                                        </td>

                                        <td className="px-4 py-4">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(entry)}
                                                className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-100"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {entries.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-6 py-16 text-center"
                                        >
                                            <p className="font-medium text-slate-700">
                                                No entries yet
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Click Add Entry to create your first record.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="entry-title"
                        className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
                    >
                        {/* Modal heading */}
                        <div className="flex items-center justify-between border-b border-stone-200 p-6">
                            <div>
                                <h2
                                    id="entry-title"
                                    className="text-xl font-bold"
                                >
                                    {editingId !== null
                                        ? 'Edit Entry'
                                        : 'Add New Entry'}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Fill in the penalty details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                aria-label="Close modal"
                                className="rounded-lg px-3 py-2 text-2xl text-slate-500 hover:bg-stone-100"
                            >
                                ×
                            </button>
                        </div>

                        {/* Entry form */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                {/* Date */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Date *
                                    </label>

                                    <input
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                                    />
                                </div>

                                {/* Member */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Member *
                                    </label>

                                    <select
                                        name="member"
                                        value={form.member}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                                    >
                                        <option value="">Select member</option>

                                        {members.map((member) => (
                                            <option key={member} value={member}>
                                                {member}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason */}
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-medium">
                                        Reason *
                                    </label>

                                    <textarea
                                        name="reason"
                                        value={form.reason}
                                        onChange={handleChange}
                                        placeholder="Enter reason for penalty"
                                        required
                                        rows={3}
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                                    />
                                </div>

                                {/* Penalty count */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Penalty Count *
                                    </label>

                                    <input
                                        type="number"
                                        name="goalCount"
                                        value={form.goalCount}
                                        onChange={handleChange}
                                        placeholder="e.g. 0.25, 0.5, 1"
                                        min="0.25"
                                        step="0.25"
                                        required
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                                    />

                                    <p className="mt-1 text-xs text-slate-500">
                                        1 penalty = ৳50
                                    </p>
                                </div>

                                {/* Automatic amount */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Amount (৳)
                                    </label>

                                    <input
                                        type="text"
                                        value={amount.toLocaleString('en-BD')}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-lg border border-stone-300 bg-stone-100 px-3 py-3 text-sm text-slate-700 outline-none"
                                    />

                                    <p className="mt-1 text-xs text-slate-500">
                                        Amount is calculated automatically.
                                    </p>
                                </div>

                                {/* Payment status */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Status *
                                    </label>

                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>

                                {/* Payment date */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Payment Date {form.status === 'Paid' && '*'}
                                    </label>

                                    <input
                                        type="date"
                                        name="paymentDate"
                                        value={form.paymentDate}
                                        onChange={handleChange}
                                        required={form.status === 'Paid'}
                                        disabled={form.status !== 'Paid'}
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Form buttons */}
                            <div className="mt-8 flex justify-end gap-3 border-t border-stone-200 pt-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-lg border border-stone-300 px-5 py-3 font-medium hover:bg-stone-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-green-950 px-6 py-3 font-medium text-white hover:bg-green-800"
                                >
                                    {editingId !== null
                                        ? 'Save Changes'
                                        : 'Add Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
