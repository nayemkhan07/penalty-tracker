// 'use client';

// import { useState, useEffect } from 'react';
// import {
//     collection,
//     addDoc,
//     updateDoc,
//     doc,
//     onSnapshot,
// } from 'firebase/firestore';

// import { db } from '@/Lib/firebase';

// const members = [
//     'Sabbir Alam',
//     'nurr',
//     'Mahbubul Hasan',
//     'Sourav G.',
//     'Abu Nayem',
//     'Md Riyad',
//     'Ziko',
//     'NeoMahin',
//     'Raquib',
//     'Shakir Alam',
//     'Khalid Hasan',
//     'aurpa',
//     'Taj',
//     'Salman Farshe',
//     'Abir',
// ];

// const penaltyRate = 50;

// const emptyForm = {
//     date: '',
//     member: '',
//     reason: '',
//     goalCount: '',
// };

// function formatTaka(amount) {
//     return `৳${Number(amount || 0).toLocaleString('en-BD')}`;
// }

// // Get payment values from both old and new Firestore documents.
// function normalizeEntry(document) {
//     const data = document.data();

//     const amount = Number(data.amount || 0);

//     // Old entries may not have paidAmount.
//     const paidAmount =
//         data.paidAmount !== undefined
//             ? Number(data.paidAmount || 0)
//             : data.status?.toLowerCase() === 'paid'
//                 ? amount
//                 : 0;

//     const dueAmount =
//         data.dueAmount !== undefined
//             ? Number(data.dueAmount || 0)
//             : Math.max(0, amount - paidAmount);

//     let status = 'Pending';

//     if (dueAmount <= 0 && amount > 0) {
//         status = 'Paid';
//     } else if (paidAmount > 0) {
//         status = 'Partial';
//     }

//     return {
//         id: document.id,
//         ...data,
//         amount,
//         paidAmount,
//         dueAmount,
//         status,
//         paymentDate: data.paymentDate || '',
//         payments: Array.isArray(data.payments) ? data.payments : [],
//     };
// }

// export default function PenaltyEntries() {
//     const [entries, setEntries] = useState([]);
//     const [form, setForm] = useState({ ...emptyForm });

//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [editingId, setEditingId] = useState(null);

//     const [isLoaded, setIsLoaded] = useState(false);
//     const [isSaving, setIsSaving] = useState(false);

//     const [fetchError, setFetchError] = useState('');
//     const [saveError, setSaveError] = useState('');

//     // Real-time Firestore listener.
//     useEffect(() => {
//         const entriesRef = collection(db, 'penaltyEntries');

//         const unsubscribe = onSnapshot(
//             entriesRef,
//             (querySnapshot) => {
//                 const savedEntries = querySnapshot.docs.map(normalizeEntry);

//                 savedEntries.sort((a, b) =>
//                     (b.date || '').localeCompare(a.date || '')
//                 );

//                 setEntries(savedEntries);
//                 setFetchError('');
//                 setIsLoaded(true);
//             },
//             (error) => {
//                 console.error('Firestore Read Error:', error);

//                 setFetchError(
//                     error.code
//                         ? `${error.code}: ${error.message}`
//                         : error.message
//                 );

//                 setIsLoaded(true);
//             }
//         );

//         return () => unsubscribe();
//     }, []);

//     const amount = Number(form.goalCount || 0) * penaltyRate;

//     function handleChange(event) {
//         const { name, value } = event.target;

//         setForm((oldForm) => ({
//             ...oldForm,
//             [name]: value,
//         }));
//     }

//     // Open Add Entry modal.
//     function openAddModal() {
//         setForm({ ...emptyForm });
//         setEditingId(null);
//         setSaveError('');
//         setIsModalOpen(true);
//     }

//     // Open Edit Entry modal.
//     function openEditModal(entry) {
//         setForm({
//             date: entry.date || '',
//             member: entry.member || '',
//             reason: entry.reason || '',
//             goalCount: String(entry.goalCount ?? ''),
//         });

//         setEditingId(entry.id);
//         setSaveError('');
//         setIsModalOpen(true);
//     }

//     function closeModal() {
//         if (isSaving) return;

//         setIsModalOpen(false);
//         setForm({ ...emptyForm });
//         setEditingId(null);
//         setSaveError('');
//     }

//     // Add or update an entry in Firestore.
//     async function handleSubmit(event) {
//         event.preventDefault();

//         if (isSaving) return;

//         const penaltyCount = Number(form.goalCount);

//         if (!Number.isFinite(penaltyCount) || penaltyCount <= 0) {
//             setSaveError('Please enter a valid penalty count.');
//             return;
//         }

//         if (!form.date || !form.member || !form.reason.trim()) {
//             setSaveError('Please complete all required fields.');
//             return;
//         }

//         const newAmount = penaltyCount * penaltyRate;

//         try {
//             setIsSaving(true);
//             setSaveError('');

//             if (editingId !== null) {
//                 const existingEntry = entries.find(
//                     (entry) => entry.id === editingId
//                 );

//                 if (!existingEntry) {
//                     throw new Error('Entry not found.');
//                 }

//                 const oldPaidAmount = Number(
//                     existingEntry.paidAmount || 0
//                 );

//                 // Do not allow the fine amount to become less than
//                 // the amount already paid.
//                 if (newAmount < oldPaidAmount) {
//                     setSaveError(
//                         `Amount cannot be less than already paid amount ${formatTaka(oldPaidAmount)}.`
//                     );
//                     return;
//                 }

//                 const updatedDueAmount = newAmount - oldPaidAmount;

//                 let updatedStatus = 'Pending';

//                 if (updatedDueAmount === 0 && newAmount > 0) {
//                     updatedStatus = 'Paid';
//                 } else if (oldPaidAmount > 0) {
//                     updatedStatus = 'Partial';
//                 }

//                 // Preserve payment information while editing.
//                 await updateDoc(
//                     doc(db, 'penaltyEntries', editingId),
//                     {
//                         date: form.date,
//                         member: form.member,
//                         reason: form.reason.trim(),
//                         goalCount: penaltyCount,
//                         amount: newAmount,
//                         paidAmount: oldPaidAmount,
//                         dueAmount: updatedDueAmount,
//                         status: updatedStatus,
//                         paymentDate: existingEntry.paymentDate || '',
//                         payments: existingEntry.payments || [],
//                     }
//                 );
//             } else {
//                 // New entries always start as unpaid.
//                 await addDoc(
//                     collection(db, 'penaltyEntries'),
//                     {
//                         date: form.date,
//                         member: form.member,
//                         reason: form.reason.trim(),
//                         goalCount: penaltyCount,
//                         amount: newAmount,
//                         paidAmount: 0,
//                         dueAmount: newAmount,
//                         status: 'Pending',
//                         paymentDate: '',
//                         payments: [],
//                     }
//                 );
//             }

//             // onSnapshot automatically updates the table.
//             setIsModalOpen(false);
//             setForm({ ...emptyForm });
//             setEditingId(null);
//         } catch (error) {
//             console.error('Firestore Save Error:', error);

//             setSaveError(
//                 error.code
//                     ? `${error.code}: ${error.message}`
//                     : error.message
//             );
//         } finally {
//             setIsSaving(false);
//         }
//     }

//     if (!isLoaded) {
//         return (
//             <main className="min-h-screen bg-stone-50 p-6 text-slate-800">
//                 <p className="font-medium">
//                     Loading penalty entries from Firebase...
//                 </p>
//             </main>
//         );
//     }

//     return (
//         <main className="min-h-screen bg-stone-50 p-4 text-slate-800 sm:p-8">
//             <div className="mx-auto max-w-7xl">

//                 {/* Page Heading */}
//                 <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
//                     <div>
//                         <h1 className="text-3xl font-bold">
//                             Penalty Entries
//                         </h1>

//                         <p className="mt-2 text-sm text-slate-500">
//                             Manage and track all penalty records.
//                         </p>
//                     </div>

//                     <button
//                         type="button"
//                         onClick={openAddModal}
//                         className="rounded-lg bg-green-950 px-5 py-3 font-medium text-white hover:bg-green-800"
//                     >
//                         + Add Entry
//                     </button>
//                 </div>

//                 {/* Firebase Read Error */}
//                 {fetchError && (
//                     <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//                         <p className="font-semibold">
//                             Failed to load entries from Firebase.
//                         </p>
//                         <p className="mt-1">{fetchError}</p>
//                     </div>
//                 )}

//                 {/* Entries Table */}
//                 <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
//                     <div className="border-b border-stone-200 p-5">
//                         <h2 className="text-lg font-semibold">
//                             All Entries
//                         </h2>

//                         <p className="mt-1 text-xs text-slate-500">
//                             {entries.length} total entries
//                         </p>
//                     </div>

//                     <div className="overflow-x-auto">
//                         <table className="w-full min-w-[1100px] text-left text-sm">
//                             <thead className="bg-stone-100 text-slate-600">
//                                 <tr>
//                                     <th className="px-4 py-4">#</th>
//                                     <th className="px-4 py-4">Date</th>
//                                     <th className="px-4 py-4">Member</th>
//                                     <th className="px-4 py-4">Reason</th>
//                                     <th className="px-4 py-4">Penalty Count</th>
//                                     <th className="px-4 py-4">Amount</th>
//                                     <th className="px-4 py-4">Status</th>
//                                     <th className="px-4 py-4">Payment Date</th>
//                                     <th className="px-4 py-4">Action</th>
//                                 </tr>
//                             </thead>

//                             <tbody>
//                                 {entries.map((entry, index) => (
//                                     <tr
//                                         key={entry.id}
//                                         className="border-t border-stone-200 hover:bg-stone-50"
//                                     >
//                                         <td className="px-4 py-4">
//                                             {index + 1}
//                                         </td>

//                                         <td className="px-4 py-4">
//                                             {entry.date || '—'}
//                                         </td>

//                                         <td className="px-4 py-4 font-medium">
//                                             {entry.member || '—'}
//                                         </td>

//                                         <td className="px-4 py-4">
//                                             {entry.reason || '—'}
//                                         </td>

//                                         <td className="px-4 py-4">
//                                             {entry.goalCount ?? '—'}
//                                         </td>

//                                         <td className="px-4 py-4 font-medium">
//                                             {formatTaka(entry.amount)}
//                                         </td>

//                                         <td className="px-4 py-4">
//                                             <span
//                                                 className={`rounded-full px-3 py-1 text-xs font-medium ${entry.status === 'Paid'
//                                                     ? 'bg-green-100 text-green-800'
//                                                     : entry.status === 'Partial'
//                                                         ? 'bg-blue-100 text-blue-800'
//                                                         : 'bg-amber-100 text-amber-800'
//                                                     }`}
//                                             >
//                                                 {entry.status}
//                                             </span>
//                                         </td>

//                                         <td className="px-4 py-4">
//                                             {entry.paymentDate || '—'}
//                                         </td>

//                                         <td className="px-4 py-4">
//                                             <button
//                                                 type="button"
//                                                 onClick={() => openEditModal(entry)}
//                                                 className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-100"
//                                             >
//                                                 Edit
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))}

//                                 {entries.length === 0 && (
//                                     <tr>
//                                         <td
//                                             colSpan={9}
//                                             className="px-6 py-16 text-center"
//                                         >
//                                             <p className="font-medium text-slate-700">
//                                                 No entries yet
//                                             </p>

//                                             <p className="mt-1 text-sm text-slate-500">
//                                                 Click Add Entry to create your first record.
//                                             </p>
//                                         </td>
//                                     </tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             </div>

//             {/* Add/Edit Modal */}
//             {isModalOpen && (
//                 <div
//                     className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
//                     onMouseDown={(event) => {
//                         if (
//                             event.target === event.currentTarget &&
//                             !isSaving
//                         ) {
//                             closeModal();
//                         }
//                     }}
//                 >
//                     <div
//                         role="dialog"
//                         aria-modal="true"
//                         aria-labelledby="entry-title"
//                         className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
//                     >
//                         {/* Modal Heading */}
//                         <div className="flex items-center justify-between border-b border-stone-200 p-6">
//                             <div>
//                                 <h2
//                                     id="entry-title"
//                                     className="text-xl font-bold"
//                                 >
//                                     {editingId !== null
//                                         ? 'Edit Entry'
//                                         : 'Add New Entry'}
//                                 </h2>

//                                 <p className="mt-1 text-sm text-slate-500">
//                                     Fill in the penalty details below.
//                                 </p>
//                             </div>

//                             <button
//                                 type="button"
//                                 onClick={closeModal}
//                                 disabled={isSaving}
//                                 aria-label="Close modal"
//                                 className="rounded-lg px-3 py-2 text-2xl text-slate-500 hover:bg-stone-100 disabled:opacity-50"
//                             >
//                                 ×
//                             </button>
//                         </div>

//                         {/* Entry Form */}
//                         <form onSubmit={handleSubmit} className="p-6">
//                             <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

//                                 {/* Date */}
//                                 <div>
//                                     <label className="mb-2 block text-sm font-medium">
//                                         Date *
//                                     </label>

//                                     <input
//                                         type="date"
//                                         name="date"
//                                         value={form.date}
//                                         onChange={handleChange}
//                                         required
//                                         className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
//                                     />
//                                 </div>

//                                 {/* Member */}
//                                 <div>
//                                     <label className="mb-2 block text-sm font-medium">
//                                         Member *
//                                     </label>

//                                     <select
//                                         name="member"
//                                         value={form.member}
//                                         onChange={handleChange}
//                                         required
//                                         className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
//                                     >
//                                         <option value="">
//                                             Select member
//                                         </option>

//                                         {members.map((member) => (
//                                             <option key={member} value={member}>
//                                                 {member}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 {/* Reason */}
//                                 <div className="sm:col-span-2">
//                                     <label className="mb-2 block text-sm font-medium">
//                                         Reason *
//                                     </label>

//                                     <textarea
//                                         name="reason"
//                                         value={form.reason}
//                                         onChange={handleChange}
//                                         placeholder="Enter reason for penalty"
//                                         required
//                                         rows={3}
//                                         className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
//                                     />
//                                 </div>

//                                 {/* Penalty Count */}
//                                 <div>
//                                     <label className="mb-2 block text-sm font-medium">
//                                         Penalty Count *
//                                     </label>

//                                     <input
//                                         type="number"
//                                         name="goalCount"
//                                         value={form.goalCount}
//                                         onChange={handleChange}
//                                         placeholder="e.g. 0.25, 0.5, 1"
//                                         min="0.25"
//                                         step="0.25"
//                                         required
//                                         className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
//                                     />

//                                     <p className="mt-1 text-xs text-slate-500">
//                                         1 penalty = ৳50
//                                     </p>
//                                 </div>

//                                 {/* Automatic Amount */}
//                                 <div>
//                                     <label className="mb-2 block text-sm font-medium">
//                                         Amount (৳)
//                                     </label>

//                                     <input
//                                         type="text"
//                                         value={formatTaka(amount)}
//                                         readOnly
//                                         className="w-full cursor-not-allowed rounded-lg border border-stone-300 bg-stone-100 px-3 py-3 text-sm text-slate-700 outline-none"
//                                     />

//                                     <p className="mt-1 text-xs text-slate-500">
//                                         Amount is calculated automatically.
//                                     </p>
//                                 </div>
//                             </div>

//                             {/* Payment information notice */}
//                             <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
//                                 Payment status and payment date will be managed
//                                 from the Member Summary page.
//                             </div>

//                             {/* Save Error */}
//                             {saveError && (
//                                 <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//                                     {saveError}
//                                 </div>
//                             )}

//                             {/* Form Buttons */}
//                             <div className="mt-8 flex justify-end gap-3 border-t border-stone-200 pt-5">
//                                 <button
//                                     type="button"
//                                     onClick={closeModal}
//                                     disabled={isSaving}
//                                     className="rounded-lg border border-stone-300 px-5 py-3 font-medium hover:bg-stone-50 disabled:opacity-50"
//                                 >
//                                     Cancel
//                                 </button>

//                                 <button
//                                     type="submit"
//                                     disabled={isSaving}
//                                     className="rounded-lg bg-green-950 px-6 py-3 font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
//                                 >
//                                     {isSaving
//                                         ? 'Saving...'
//                                         : editingId !== null
//                                             ? 'Save Changes'
//                                             : 'Add Entry'}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </main>
//     );
// }






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
        setForm({ ...emptyForm });
        setEditingId(null);
        setSaveError('');
        setIsModalOpen(true);
    }

    // Open Edit Entry modal.
    function openEditModal(entry) {
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

        if (isSaving) return;

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
        <main className="min-h-screen bg-stone-50 p-4 text-slate-800 sm:p-8">
            <div className="mx-auto max-w-7xl">

                {/* Page Heading */}
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
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className="border-b border-stone-200 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    All Entries
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Showing {filteredEntries.length} of {entries.length} entries
                                </p>
                            </div>

                            {/* Member Search */}
                            <div className="w-full sm:w-72">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    placeholder="Search member name..."
                                    className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                                />
                            </div>
                        </div>
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
                                {filteredEntries.map((entry, index) => (
                                    <tr
                                        key={entry.id}
                                        className="border-t border-stone-200 hover:bg-stone-50"
                                    >
                                        <td className="px-4 py-4">
                                            {index + 1}
                                        </td>

                                        <td className="px-4 py-4">
                                            {entry.date || '—'}
                                        </td>

                                        <td className="px-4 py-4 font-medium">
                                            {entry.member || '—'}
                                        </td>

                                        <td className="px-4 py-4">
                                            {entry.reason || '—'}
                                        </td>

                                        <td className="px-4 py-4">
                                            {entry.goalCount ?? '—'}
                                        </td>

                                        <td className="px-4 py-4 font-medium">
                                            {formatTaka(entry.amount)}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${entry.status === 'Paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : entry.status === 'Partial'
                                                        ? 'bg-blue-100 text-blue-800'
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

                                {filteredEntries.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-6 py-16 text-center"
                                        >
                                            <p className="font-medium text-slate-700">
                                                {searchTerm.trim()
                                                    ? 'No matching member found.'
                                                    : 'No entries yet.'}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {searchTerm.trim()
                                                    ? 'Try searching with another member name.'
                                                    : 'Click Add Entry to create your first record.'}
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
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
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
                        className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
                    >
                        {/* Modal Heading */}
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
                                disabled={isSaving}
                                aria-label="Close modal"
                                className="rounded-lg px-3 py-2 text-2xl text-slate-500 hover:bg-stone-100 disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>

                        {/* Entry Form */}
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

                                {/* Penalty Count */}
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

                                {/* Automatic Amount */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Amount (৳)
                                    </label>

                                    <input
                                        type="text"
                                        value={formatTaka(amount)}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-lg border border-stone-300 bg-stone-100 px-3 py-3 text-sm text-slate-700 outline-none"
                                    />

                                    <p className="mt-1 text-xs text-slate-500">
                                        Amount is calculated automatically.
                                    </p>
                                </div>
                            </div>

                            {/* Payment information notice */}
                            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
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
                            <div className="mt-8 flex justify-end gap-3 border-t border-stone-200 pt-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSaving}
                                    className="rounded-lg border border-stone-300 px-5 py-3 font-medium hover:bg-stone-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-lg bg-green-950 px-6 py-3 font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
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
