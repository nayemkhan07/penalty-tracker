'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
} from 'firebase/firestore';

import { db } from '@/Lib/firebase';
import { useAuth } from '@/Context/AuthContext';

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

const emptyForm = {
    date: '',
    member: '',
    reason: '',
    goalCount: '',
};

function formatTaka(amount) {
    return `৳${Number(amount || 0).toLocaleString('en-BD')}`;
}

// Get payment values from both old and new Firestore documents.
function normalizeEntry(document) {
    const data = document.data();

    const amount = Number(data.amount || 0);

    const paidAmount =
        data.paidAmount !== undefined
            ? Number(data.paidAmount || 0)
            : data.status?.toLowerCase() === 'paid'
                ? amount
                : 0;

    const dueAmount =
        data.dueAmount !== undefined
            ? Number(data.dueAmount || 0)
            : Math.max(0, amount - paidAmount);

    let status = 'Pending';

    if (dueAmount <= 0 && amount > 0) {
        status = 'Paid';
    } else if (paidAmount > 0) {
        status = 'Partial';
    }

    return {
        id: document.id,
        ...data,
        amount,
        paidAmount,
        dueAmount,
        status,
        paymentDate: data.paymentDate || '',
        payments: Array.isArray(data.payments) ? data.payments : [],
    };
}

export default function PenaltyEntries() {
    const [entries, setEntries] = useState([]);
    const [form, setForm] = useState({ ...emptyForm });

    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [fetchError, setFetchError] = useState('');
    const [saveError, setSaveError] = useState('');

    // Firebase Authentication
    const { user, loading: authLoading } = useAuth();

    const canWrite = !authLoading && !!user;

    // Real-time Firestore listener.
    useEffect(() => {
        const entriesRef = collection(db, 'penaltyEntries');

        const unsubscribe = onSnapshot(
            entriesRef,
            (querySnapshot) => {
                const savedEntries = querySnapshot.docs.map(normalizeEntry);

                savedEntries.sort((a, b) =>
                    (b.date || '').localeCompare(a.date || '')
                );

                setEntries(savedEntries);
                setFetchError('');
                setIsLoaded(true);
            },
            (error) => {
                console.error('Firestore Read Error:', error);

                setFetchError(
                    error.code
                        ? `${error.code}: ${error.message}`
                        : error.message
                );

                setIsLoaded(true);
            }
        );

        return () => unsubscribe();
    }, []);

    // Filter entries by member name.
    const filteredEntries = entries.filter((entry) =>
        String(entry.member || '')
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase())
    );

    const amount = Number(form.goalCount || 0) * penaltyRate;

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((oldForm) => ({
            ...oldForm,
            [name]: value,
        }));
    }

    // Open Add Entry modal.
    function openAddModal() {
        if (!canWrite) return;

        setForm({ ...emptyForm });
        setEditingId(null);
        setSaveError('');
        setIsModalOpen(true);
    }

    // Open Edit Entry modal.
    function openEditModal(entry) {
        if (!canWrite) return;

        setForm({
            date: entry.date || '',
            member: entry.member || '',
            reason: entry.reason || '',
            goalCount: String(entry.goalCount ?? ''),
        });

        setEditingId(entry.id);
        setSaveError('');
        setIsModalOpen(true);
    }

    function closeModal() {
        if (isSaving) return;

        setIsModalOpen(false);
        setForm({ ...emptyForm });
        setEditingId(null);
        setSaveError('');
    }

    // Add or update an entry in Firestore.
    async function handleSubmit(event) {
        event.preventDefault();

        if (!canWrite || isSaving) return;

        const penaltyCount = Number(form.goalCount);

        if (!Number.isFinite(penaltyCount) || penaltyCount <= 0) {
            setSaveError('Please enter a valid penalty count.');
            return;
        }

        if (!form.date || !form.member || !form.reason.trim()) {
            setSaveError('Please complete all required fields.');
            return;
        }

        const newAmount = penaltyCount * penaltyRate;

        try {
            setIsSaving(true);
            setSaveError('');

            if (editingId !== null) {
                const existingEntry = entries.find(
                    (entry) => entry.id === editingId
                );

                if (!existingEntry) {
                    throw new Error('Entry not found.');
                }

                const oldPaidAmount = Number(
                    existingEntry.paidAmount || 0
                );

                // Do not allow the fine amount to become less than
                // the amount already paid.
                if (newAmount < oldPaidAmount) {
                    setSaveError(
                        `Amount cannot be less than already paid amount ${formatTaka(oldPaidAmount)}.`
                    );
                    return;
                }

                const updatedDueAmount = newAmount - oldPaidAmount;

                let updatedStatus = 'Pending';

                if (updatedDueAmount === 0 && newAmount > 0) {
                    updatedStatus = 'Paid';
                } else if (oldPaidAmount > 0) {
                    updatedStatus = 'Partial';
                }

                // Preserve payment information while editing.
                await updateDoc(
                    doc(db, 'penaltyEntries', editingId),
                    {
                        date: form.date,
                        member: form.member,
                        reason: form.reason.trim(),
                        goalCount: penaltyCount,
                        amount: newAmount,
                        paidAmount: oldPaidAmount,
                        dueAmount: updatedDueAmount,
                        status: updatedStatus,
                        paymentDate: existingEntry.paymentDate || '',
                        payments: existingEntry.payments || [],
                    }
                );
            } else {
                // New entries always start as unpaid.
                await addDoc(
                    collection(db, 'penaltyEntries'),
                    {
                        date: form.date,
                        member: form.member,
                        reason: form.reason.trim(),
                        goalCount: penaltyCount,
                        amount: newAmount,
                        paidAmount: 0,
                        dueAmount: newAmount,
                        status: 'Pending',
                        paymentDate: '',
                        payments: [],
                    }
                );
            }

            // onSnapshot automatically updates the table.
            setIsModalOpen(false);
            setForm({ ...emptyForm });
            setEditingId(null);

        } catch (error) {
            console.error('Firestore Save Error:', error);

            setSaveError(
                error.code
                    ? `${error.code}: ${error.message}`
                    : error.message
            );
        } finally {
            setIsSaving(false);
        }
    }

    if (!isLoaded) {
        return (
            <main className="min-h-screen bg-stone-50 p-6 text-slate-800">
                <p className="font-medium">
                    Loading penalty entries from Firebase...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white p-4 text-[#171717] sm:p-8">
            <div className="mx-auto max-w-7xl">

                {/* Page Heading */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Penalty Entries
                        </h1>

                        <p className="mt-2 text-sm text-[#626A78]">
                            Manage and track all penalty records.
                        </p>
                    </div>

                    {/* Add Entry */}
                    {canWrite && (
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="rounded-lg bg-[#1D1D1F] px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
                        >
                            + Add Entry
                        </button>
                    )}
                </div>

                {/* Firebase Read Error */}
                {fetchError && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <p className="font-semibold">
                            Failed to load entries from Firebase.
                        </p>
                        <p className="mt-1">{fetchError}</p>
                    </div>
                )}

                {/* Entries Table */}
                <div className="overflow-hidden rounded-xl border border-[#E0E2E7] bg-white">

                    {/* Table Header */}
                    <div className="border-b border-[#E0E2E7] px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-semibold text-[#171717]">
                                    All entries
                                </h2>

                                <p className="mt-1 text-xs text-[#626A78]">
                                    Showing {filteredEntries.length} of {entries.length} entries
                                </p>
                            </div>

                            {/* Member Search */}
                            <div className="w-full sm:w-64">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    placeholder="Search member name"
                                    className="w-full rounded-lg border border-[#D9DDE4] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none transition placeholder:text-[#9298A3] focus:border-[#777D87]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">

                            <thead className="bg-[#F6F7F9] text-[#626A78]">
                                <tr>
                                    <th className="px-4 py-3.5 font-medium">#</th>
                                    <th className="px-4 py-3.5 font-medium">Date</th>
                                    <th className="px-4 py-3.5 font-medium">Member</th>
                                    <th className="px-4 py-3.5 font-medium">Reason</th>
                                    <th className="px-4 py-3.5 text-center font-medium">Count</th>
                                    <th className="px-4 py-3.5 font-medium">Amount</th>
                                    <th className="px-4 py-3.5 font-medium">Status</th>
                                    <th className="px-4 py-3.5 font-medium">Payment date</th>

                                    {/* Action Column */}
                                    {canWrite && (
                                        <th className="px-4 py-3.5 font-medium">
                                            Action
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredEntries.map((entry, index) => (
                                    <tr
                                        key={entry.id}
                                        className="border-t border-[#E0E2E7] transition-colors hover:bg-[#FAFAFA]"
                                    >
                                        <td className="px-4 py-4 text-[#626A78]">
                                            {index + 1}
                                        </td>

                                        <td className="px-4 py-4 font-medium text-[#171717]">
                                            {entry.date || '—'}
                                        </td>

                                        <td className="px-4 py-4 font-medium text-[#171717]">
                                            {entry.member || '—'}
                                        </td>

                                        <td className="px-4 py-4 text-[#626A78]">
                                            {entry.reason || '—'}
                                        </td>

                                        <td className="px-4 py-4 text-center font-medium text-[#171717]">
                                            {entry.goalCount ?? '—'}
                                        </td>

                                        <td className="px-4 py-4 font-semibold text-[#171717]">
                                            {formatTaka(entry.amount)}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${entry.status === 'Paid'
                                                    ? 'bg-[#1D1D1F] text-white'
                                                    : entry.status === 'Partial'
                                                        ? 'border border-[#D9DDE4] bg-white text-[#626A78]'
                                                        : 'border border-[#E0E2E7] bg-[#F6F7F9] text-[#626A78]'
                                                    }`}
                                            >
                                                {entry.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-[#626A78]">
                                            {entry.paymentDate || '—'}
                                        </td>

                                        {/* Edit Button */}
                                        {canWrite && (
                                            <td className="px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(entry)}
                                                    className="rounded-md border border-[#D9DDE4] px-3 py-1.5 text-xs font-medium text-[#171717] transition hover:bg-[#F3F4F6]"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}

                                {filteredEntries.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={canWrite ? 9 : 8}
                                            className="px-6 py-16 text-center"
                                        >
                                            <p className="font-medium text-[#171717]">
                                                {searchTerm.trim()
                                                    ? 'No matching member found.'
                                                    : 'No entries yet.'}
                                            </p>

                                            <p className="mt-1 text-sm text-[#858B97]">
                                                {searchTerm.trim()
                                                    ? 'Try searching with another member name.'
                                                    : canWrite
                                                        ? 'Click Add Entry to create your first record.'
                                                        : 'No penalty entries are available.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && canWrite && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isSaving
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="entry-title"
                        className="my-auto w-full max-w-2xl rounded-xl border border-[#E0E2E7] bg-white shadow-xl"
                    >
                        {/* Modal Heading */}
                        <div className="flex items-center justify-between border-b border-[#E0E2E7] px-6 py-5">
                            <div>
                                <h2
                                    id="entry-title"
                                    className="text-xl font-semibold text-[#171717]"
                                >
                                    {editingId !== null
                                        ? 'Edit Entry'
                                        : 'Add New Entry'}
                                </h2>

                                <p className="mt-1 text-sm text-[#858B97]">
                                    Fill in the penalty details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isSaving}
                                aria-label="Close modal"
                                className="rounded-lg px-3 py-2 text-2xl text-[#626A78] transition hover:bg-[#F3F4F6] disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>

                        {/* Entry Form */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                {/* Date */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#171717]">
                                        Date *
                                    </label>

                                    <input
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-[#D9DDE4] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#777D87]"
                                    />
                                </div>

                                {/* Member */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#171717]">
                                        Member *
                                    </label>

                                    <select
                                        name="member"
                                        value={form.member}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-[#D9DDE4] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#777D87]"
                                    >
                                        <option value="">
                                            Select member
                                        </option>

                                        {members.map((member) => (
                                            <option key={member} value={member}>
                                                {member}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason */}
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-[#171717]">
                                        Reason *
                                    </label>

                                    <textarea
                                        name="reason"
                                        value={form.reason}
                                        onChange={handleChange}
                                        placeholder="Enter reason for penalty"
                                        required
                                        rows={3}
                                        className="w-full rounded-lg border border-[#D9DDE4] bg-white px-3 py-3 text-sm outline-none transition placeholder:text-[#9298A3] focus:border-[#777D87]"
                                    />
                                </div>

                                {/* Penalty Count */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#171717]">
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
                                        className="w-full rounded-lg border border-[#D9DDE4] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#777D87]"
                                    />

                                    <p className="mt-1 text-xs text-[#858B97]">
                                        1 penalty = ৳50
                                    </p>
                                </div>

                                {/* Automatic Amount */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#171717]">
                                        Amount (৳)
                                    </label>

                                    <input
                                        type="text"
                                        value={formatTaka(amount)}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-lg border border-[#D9DDE4] bg-[#F6F7F9] px-3 py-3 text-sm text-[#626A78] outline-none"
                                    />

                                    <p className="mt-1 text-xs text-[#858B97]">
                                        Amount is calculated automatically.
                                    </p>
                                </div>
                            </div>

                            {/* Payment Information */}
                            <div className="mt-5 rounded-lg border border-[#E0E2E7] bg-[#F6F7F9] p-3 text-sm text-[#626A78]">
                                Payment status and payment date will be managed
                                from the Member Summary page.
                            </div>

                            {/* Save Error */}
                            {saveError && (
                                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {saveError}
                                </div>
                            )}

                            {/* Form Buttons */}
                            <div className="mt-8 flex justify-end gap-3 border-t border-[#E0E2E7] pt-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSaving}
                                    className="rounded-lg border border-[#D9DDE4] px-5 py-3 text-sm font-medium text-[#626A78] transition hover:bg-[#F6F7F9] disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-lg bg-[#1D1D1F] px-6 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving
                                        ? 'Saving...'
                                        : editingId !== null
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
