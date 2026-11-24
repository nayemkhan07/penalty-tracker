// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import {
//     collection,
//     onSnapshot,
//     doc,
//     runTransaction,
//     serverTimestamp,
// } from 'firebase/firestore';
// import { db } from '@/Lib/firebase';

// export default function MemberSummary() {
//     const [entries, setEntries] = useState([]);
//     const [selectedMonth, setSelectedMonth] = useState('all');
//     const [searchTerm, setSearchTerm] = useState('');

//     const [isLoaded, setIsLoaded] = useState(false);
//     const [error, setError] = useState('');

//     // Payment modal states
//     const [isPaymentOpen, setIsPaymentOpen] = useState(false);
//     const [selectedMember, setSelectedMember] = useState(null);
//     const [paymentType, setPaymentType] = useState('partial');
//     const [paymentAmount, setPaymentAmount] = useState('');
//     const [paymentDate, setPaymentDate] = useState(getTodayDate());
//     const [selectedMonths, setSelectedMonths] = useState([]);
//     const [isPaying, setIsPaying] = useState(false);
//     const [paymentError, setPaymentError] = useState('');

//     // Realtime Firestore data
//     useEffect(() => {
//         const entriesRef = collection(db, 'penaltyEntries');

//         const unsubscribe = onSnapshot(
//             entriesRef,
//             (snapshot) => {
//                 const firebaseEntries = snapshot.docs.map((document) => {
//                     const data = document.data();
//                     const amount = toMoney(data.amount);

//                     const paidAmount =
//                         data.paidAmount !== undefined
//                             ? toMoney(data.paidAmount)
//                             : String(data.status || '').toLowerCase() === 'paid'
//                                 ? amount
//                                 : 0;

//                     const dueAmount =
//                         data.dueAmount !== undefined
//                             ? toMoney(data.dueAmount)
//                             : Math.max(0, amount - paidAmount);

//                     return {
//                         ...data,
//                         id: document.id,
//                         amount,
//                         paidAmount,
//                         dueAmount,
//                         status: getPaymentStatus(amount, paidAmount),
//                     };
//                 });

//                 setEntries(firebaseEntries);
//                 setError('');
//                 setIsLoaded(true);
//             },
//             (firebaseError) => {
//                 console.error('Firestore error:', firebaseError);
//                 setError('Failed to load Member Summary from Firebase.');
//                 setIsLoaded(true);
//             }
//         );

//         return () => unsubscribe();
//     }, []);

//     // Validate date
//     function isValidDate(date) {
//         if (typeof date !== 'string') return false;

//         const datePattern = /^\d{4}-\d{2}-\d{2}$/;

//         if (!datePattern.test(date)) return false;

//         const [year, month, day] = date.split('-').map(Number);
//         const newDate = new Date(year, month - 1, day);

//         return (
//             year >= 2000 &&
//             year <= 2100 &&
//             newDate.getFullYear() === year &&
//             newDate.getMonth() === month - 1 &&
//             newDate.getDate() === day
//         );
//     }

//     // Get today's local date
//     function getTodayDate() {
//         const today = new Date();

//         const year = today.getFullYear();
//         const month = String(today.getMonth() + 1).padStart(2, '0');
//         const day = String(today.getDate()).padStart(2, '0');

//         return `${year}-${month}-${day}`;
//     }

//     // Convert money to two decimal places
//     function toMoney(value) {
//         const number = Number(value) || 0;
//         return Math.round((number + Number.EPSILON) * 100) / 100;
//     }

//     // Determine payment status
//     function getPaymentStatus(amount, paidAmount) {
//         if (amount > 0 && paidAmount >= amount) {
//             return 'Paid';
//         }

//         if (paidAmount > 0) {
//             return 'Partial';
//         }

//         return 'Pending';
//     }

//     // Available months
//     const months = useMemo(() => {
//         const availableMonths = [];

//         entries.forEach((entry) => {
//             if (!isValidDate(entry.date)) return;

//             const month = entry.date.slice(0, 7);

//             if (!availableMonths.includes(month)) {
//                 availableMonths.push(month);
//             }
//         });

//         return availableMonths.sort((a, b) => b.localeCompare(a));
//     }, [entries]);

//     // Filter entries by month
//     const filteredEntries = useMemo(() => {
//         return entries.filter((entry) => {
//             if (!isValidDate(entry.date)) return false;

//             if (selectedMonth === 'all') return true;

//             return entry.date.slice(0, 7) === selectedMonth;
//         });
//     }, [entries, selectedMonth]);

//     // Calculate member summary
//     const memberSummary = useMemo(() => {
//         const summary = {};

//         filteredEntries.forEach((entry) => {
//             const name = entry.member;

//             if (!name) return;

//             if (!summary[name]) {
//                 summary[name] = {
//                     name,
//                     totalFine: 0,
//                     paidFine: 0,
//                     dueFine: 0,
//                 };
//             }

//             summary[name].totalFine += entry.amount;
//             summary[name].paidFine += entry.paidAmount;
//             summary[name].dueFine += entry.dueAmount;
//         });

//         return Object.values(summary)
//             .map((member) => ({
//                 ...member,
//                 totalFine: toMoney(member.totalFine),
//                 paidFine: toMoney(member.paidFine),
//                 dueFine: toMoney(member.dueFine),
//             }))
//             .sort((a, b) => b.totalFine - a.totalFine);
//     }, [filteredEntries]);

//     // Filter members by search term
//     const searchedMemberSummary = useMemo(() => {
//         const searchValue = searchTerm.trim().toLowerCase();

//         if (!searchValue) return memberSummary;

//         return memberSummary.filter((member) =>
//             member.name.toLowerCase().includes(searchValue)
//         );
//     }, [memberSummary, searchTerm]);

//     // Calculate grand totals
//     const totalFine = useMemo(
//         () =>
//             toMoney(
//                 searchedMemberSummary.reduce(
//                     (total, member) => total + member.totalFine,
//                     0
//                 )
//             ),
//         [searchedMemberSummary]
//     );

//     const totalPaid = useMemo(
//         () =>
//             toMoney(
//                 searchedMemberSummary.reduce(
//                     (total, member) => total + member.paidFine,
//                     0
//                 )
//             ),
//         [searchedMemberSummary]
//     );

//     const totalDue = useMemo(
//         () =>
//             toMoney(
//                 searchedMemberSummary.reduce(
//                     (total, member) => total + member.dueFine,
//                     0
//                 )
//             ),
//         [searchedMemberSummary]
//     );

//     // Get all-time outstanding amount for a member
//     function getMemberAllTimeDue(memberName) {
//         return toMoney(
//             entries
//                 .filter((entry) => entry.member === memberName)
//                 .reduce((total, entry) => total + entry.dueAmount, 0)
//         );
//     }

//     // Get monthly outstanding dues for a member
//     const memberMonthlyDues = useMemo(() => {
//         if (!selectedMember) return [];

//         const monthlySummary = {};

//         entries.forEach((entry) => {
//             if (entry.member !== selectedMember.name) return;
//             if (!isValidDate(entry.date)) return;
//             if (entry.dueAmount <= 0) return;

//             const month = entry.date.slice(0, 7);

//             if (!monthlySummary[month]) {
//                 monthlySummary[month] = {
//                     month,
//                     dueAmount: 0,
//                     entryCount: 0,
//                 };
//             }

//             monthlySummary[month].dueAmount += entry.dueAmount;
//             monthlySummary[month].entryCount += 1;
//         });

//         return Object.values(monthlySummary)
//             .map((item) => ({
//                 ...item,
//                 dueAmount: toMoney(item.dueAmount),
//             }))
//             .sort((a, b) => a.month.localeCompare(b.month));
//     }, [entries, selectedMember]);

//     // Calculate selected months total
//     const selectedMonthsTotal = useMemo(() => {
//         return toMoney(
//             memberMonthlyDues
//                 .filter((item) => selectedMonths.includes(item.month))
//                 .reduce((total, item) => total + item.dueAmount, 0)
//         );
//     }, [memberMonthlyDues, selectedMonths]);

//     // Open payment modal
//     function openPaymentModal(member) {
//         setSelectedMember(member);
//         setPaymentType('partial');
//         setPaymentAmount('');
//         setPaymentDate(getTodayDate());
//         setSelectedMonths([]);
//         setPaymentError('');
//         setIsPaymentOpen(true);
//     }

//     // Close payment modal
//     function closePaymentModal() {
//         if (isPaying) return;

//         setIsPaymentOpen(false);
//         setSelectedMember(null);
//         setSelectedMonths([]);
//         setPaymentError('');
//     }

//     // Change payment type
//     function handlePaymentTypeChange(type) {
//         setPaymentType(type);
//         setPaymentAmount('');
//         setSelectedMonths([]);
//         setPaymentError('');
//     }

//     // Select or deselect a month
//     function handleMonthSelection(month, checked) {
//         setSelectedMonths((previousMonths) => {
//             if (checked) {
//                 return previousMonths.includes(month)
//                     ? previousMonths
//                     : [...previousMonths, month];
//             }

//             return previousMonths.filter(
//                 (selectedMonth) => selectedMonth !== month
//             );
//         });

//         setPaymentError('');
//     }

//     // Submit payment
//     async function handlePaymentSubmit(event) {
//         event.preventDefault();

//         if (!selectedMember) return;

//         if (!isValidDate(paymentDate)) {
//             setPaymentError('Please select a valid payment date.');
//             return;
//         }

//         const enteredAmount = toMoney(paymentAmount);

//         if (paymentType === 'partial' && enteredAmount <= 0) {
//             setPaymentError('Enter a valid payment amount.');
//             return;
//         }

//         if (paymentType === 'monthly' && selectedMonths.length === 0) {
//             setPaymentError('Please select at least one month.');
//             return;
//         }

//         setIsPaying(true);
//         setPaymentError('');

//         try {
//             const memberEntries = entries.filter(
//                 (entry) => entry.member === selectedMember.name
//             );

//             if (memberEntries.length === 0) {
//                 throw new Error('No penalty entries found for this member.');
//             }

//             const paymentRef = doc(collection(db, 'memberPayments'));

//             await runTransaction(db, async (transaction) => {
//                 // Read all member entries first
//                 const snapshots = await Promise.all(
//                     memberEntries.map((entry) =>
//                         transaction.get(
//                             doc(db, 'penaltyEntries', entry.id)
//                         )
//                     )
//                 );

//                 const freshEntries = snapshots
//                     .map((snapshot, index) => {
//                         if (!snapshot.exists()) return null;

//                         const data = snapshot.data();
//                         const amount = toMoney(data.amount);

//                         const paidAmount =
//                             data.paidAmount !== undefined
//                                 ? toMoney(data.paidAmount)
//                                 : String(data.status || '').toLowerCase() === 'paid'
//                                     ? amount
//                                     : 0;

//                         const dueAmount =
//                             data.dueAmount !== undefined
//                                 ? toMoney(data.dueAmount)
//                                 : Math.max(0, amount - paidAmount);

//                         return {
//                             id: memberEntries[index].id,
//                             date: data.date || '',
//                             amount,
//                             paidAmount,
//                             dueAmount,
//                         };
//                     })
//                     .filter(
//                         (entry) => entry && entry.dueAmount > 0
//                     );

//                 // Select eligible entries based on payment type
//                 let eligibleEntries = freshEntries;

//                 if (paymentType === 'monthly') {
//                     eligibleEntries = freshEntries.filter((entry) => {
//                         if (!isValidDate(entry.date)) return false;

//                         const entryMonth = entry.date.slice(0, 7);

//                         return selectedMonths.includes(entryMonth);
//                     });
//                 }

//                 // Oldest penalty first
//                 eligibleEntries.sort((a, b) => {
//                     const dateCompare = a.date.localeCompare(b.date);

//                     if (dateCompare !== 0) return dateCompare;

//                     return a.id.localeCompare(b.id);
//                 });

//                 const currentTotalDue = toMoney(
//                     eligibleEntries.reduce(
//                         (total, entry) => total + entry.dueAmount,
//                         0
//                     )
//                 );

//                 if (currentTotalDue <= 0) {
//                     throw new Error(
//                         paymentType === 'monthly'
//                             ? 'The selected months have no outstanding dues.'
//                             : 'This member has no outstanding dues.'
//                     );
//                 }

//                 const finalPaymentAmount =
//                     paymentType === 'full' || paymentType === 'monthly'
//                         ? currentTotalDue
//                         : enteredAmount;

//                 if (finalPaymentAmount > currentTotalDue) {
//                     throw new Error(
//                         `Payment cannot exceed the total due of ৳${currentTotalDue.toLocaleString('en-BD')}.`
//                     );
//                 }

//                 if (finalPaymentAmount <= 0) {
//                     throw new Error('Invalid payment amount.');
//                 }

//                 let remainingAmount = finalPaymentAmount;
//                 const allocations = [];

//                 // Allocate payment to eligible entries
//                 for (const entry of eligibleEntries) {
//                     if (remainingAmount <= 0) break;

//                     const allocatedAmount = toMoney(
//                         Math.min(entry.dueAmount, remainingAmount)
//                     );

//                     if (allocatedAmount <= 0) continue;

//                     const newPaidAmount = toMoney(
//                         entry.paidAmount + allocatedAmount
//                     );

//                     const newDueAmount = toMoney(
//                         Math.max(0, entry.amount - newPaidAmount)
//                     );

//                     const newStatus = getPaymentStatus(
//                         entry.amount,
//                         newPaidAmount
//                     );

//                     transaction.update(
//                         doc(db, 'penaltyEntries', entry.id),
//                         {
//                             paidAmount: newPaidAmount,
//                             dueAmount: newDueAmount,
//                             status: newStatus,
//                             paymentDate,
//                         }
//                     );

//                     allocations.push({
//                         entryId: entry.id,
//                         penaltyDate: entry.date,
//                         amount: allocatedAmount,
//                     });

//                     remainingAmount = toMoney(
//                         remainingAmount - allocatedAmount
//                     );
//                 }

//                 if (remainingAmount > 0) {
//                     throw new Error(
//                         'Could not allocate the complete payment. Please try again.'
//                     );
//                 }

//                 // Save payment history
//                 transaction.set(paymentRef, {
//                     member: selectedMember.name,
//                     paymentType,
//                     amount: finalPaymentAmount,
//                     paymentDate,
//                     selectedMonths:
//                         paymentType === 'monthly'
//                             ? [...selectedMonths].sort()
//                             : [],
//                     allocations,
//                     createdAt: serverTimestamp(),
//                 });
//             });

//             setIsPaymentOpen(false);
//             setSelectedMember(null);
//             setPaymentAmount('');
//             setSelectedMonths([]);
//             setPaymentError('');
//         } catch (paymentException) {
//             console.error('Payment error:', paymentException);

//             setPaymentError(
//                 paymentException.message ||
//                 'Payment failed. Please try again.'
//             );
//         } finally {
//             setIsPaying(false);
//         }
//     }

//     // Format Bangladeshi Taka
//     function formatTaka(amount) {
//         return `৳${toMoney(amount).toLocaleString('en-BD', {
//             maximumFractionDigits: 2,
//         })}`;
//     }

//     // Format month
//     function formatMonth(month) {
//         const [year, monthNumber] = month.split('-').map(Number);

//         return new Date(year, monthNumber - 1, 1).toLocaleDateString(
//             'en-US',
//             {
//                 month: 'long',
//                 year: 'numeric',
//             }
//         );
//     }

//     // Loading state
//     if (!isLoaded) {
//         return (
//             <div className="p-6 text-stone-500">
//                 Loading member summary from Firebase...
//             </div>
//         );
//     }

//     // Firebase error
//     if (error) {
//         return (
//             <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//                 {error}
//             </div>
//         );
//     }

//     return (
//         <main className="min-h-screen bg-stone-50 p-4 sm:p-6">
//             <div className="mx-auto max-w-7xl">
//                 <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
//                     {/* Header and Month Filter */}
//                     <div className="flex flex-col gap-4 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between">
//                         <div>
//                             <h1 className="text-xl font-bold text-stone-900">
//                                 Member Summary
//                             </h1>

//                             <p className="mt-1 text-sm text-stone-500">
//                                 Total fines, paid amounts and outstanding payments
//                             </p>
//                         </div>

//                         <div className="sm:w-64">
//                             <label
//                                 htmlFor="month-filter"
//                                 className="mb-2 block text-sm font-medium text-stone-700"
//                             >
//                                 Filter Month
//                             </label>

//                             <select
//                                 id="month-filter"
//                                 value={selectedMonth}
//                                 onChange={(event) =>
//                                     setSelectedMonth(event.target.value)
//                                 }
//                                 className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
//                             >
//                                 <option value="all">All Months</option>

//                                 {months.map((month) => (
//                                     <option key={month} value={month}>
//                                         {formatMonth(month)}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* Member Search */}
//                         <div className="sm:w-64">
//                             <label
//                                 htmlFor="member-search"
//                                 className="mb-2 block text-sm font-medium text-stone-700"
//                             >
//                                 Search Member
//                             </label>

//                             <input
//                                 id="member-search"
//                                 type="text"
//                                 value={searchTerm}
//                                 onChange={(event) => setSearchTerm(event.target.value)}
//                                 placeholder="Search by member name..."
//                                 className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
//                             />
//                         </div>
//                     </div>

//                     {/* Member Summary Table */}
//                     <div className="overflow-x-auto">
//                         <table className="w-full min-w-[850px] border-collapse text-sm">
//                             <thead>
//                                 <tr className="bg-emerald-950 text-white">
//                                     <th className="px-5 py-4 text-left font-semibold">
//                                         Member Name
//                                     </th>

//                                     <th className="px-5 py-4 text-right font-semibold">
//                                         Total Fine
//                                     </th>

//                                     <th className="px-5 py-4 text-right font-semibold">
//                                         Paid Fine
//                                     </th>

//                                     <th className="px-5 py-4 text-right font-semibold">
//                                         Due Fine
//                                     </th>

//                                     <th className="px-5 py-4 text-center font-semibold">
//                                         Action
//                                     </th>
//                                 </tr>
//                             </thead>

//                             <tbody>
//                                 {searchedMemberSummary.length > 0 ? (
//                                     searchedMemberSummary.map((member, index) => {
//                                         const allTimeDue =
//                                             getMemberAllTimeDue(member.name);

//                                         return (
//                                             <tr
//                                                 key={member.name}
//                                                 className={`border-b border-stone-100 transition-colors hover:bg-emerald-50 ${index % 2 === 1
//                                                     ? 'bg-stone-50'
//                                                     : 'bg-white'
//                                                     }`}
//                                             >
//                                                 <td className="px-5 py-3.5 font-medium text-stone-800">
//                                                     {member.name}
//                                                 </td>

//                                                 <td className="px-5 py-3.5 text-right tabular-nums text-stone-700">
//                                                     {formatTaka(member.totalFine)}
//                                                 </td>

//                                                 <td className="px-5 py-3.5 text-right font-medium tabular-nums text-emerald-700">
//                                                     {formatTaka(member.paidFine)}
//                                                 </td>

//                                                 <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-amber-700">
//                                                     {formatTaka(member.dueFine)}
//                                                 </td>

//                                                 <td className="px-5 py-3.5 text-center">
//                                                     {allTimeDue > 0 ? (
//                                                         <button
//                                                             type="button"
//                                                             onClick={() =>
//                                                                 openPaymentModal(member)
//                                                             }
//                                                             className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
//                                                         >
//                                                             Payment
//                                                         </button>
//                                                     ) : (
//                                                         <span className="font-medium text-emerald-700">
//                                                             Fully Paid
//                                                         </span>
//                                                     )}
//                                                 </td>
//                                             </tr>
//                                         );
//                                     })
//                                 ) : (
//                                     <tr>
//                                         <td
//                                             colSpan={5}
//                                             className="px-5 py-12 text-center text-stone-500"
//                                         >
//                                             {searchTerm.trim()
//                                                 ? 'No matching member found.'
//                                                 : 'No penalty entries found.'}
//                                         </td>
//                                     </tr>
//                                 )}
//                             </tbody>

//                             <tfoot>
//                                 <tr className="border-t-2 border-emerald-900 bg-emerald-50 font-bold text-emerald-950">
//                                     <td className="px-5 py-4">
//                                         Grand Total
//                                     </td>

//                                     <td className="px-5 py-4 text-right tabular-nums">
//                                         {formatTaka(totalFine)}
//                                     </td>

//                                     <td className="px-5 py-4 text-right tabular-nums text-emerald-800">
//                                         {formatTaka(totalPaid)}
//                                     </td>

//                                     <td className="px-5 py-4 text-right tabular-nums text-amber-800">
//                                         {formatTaka(totalDue)}
//                                     </td>

//                                     <td className="px-5 py-4"></td>
//                                 </tr>
//                             </tfoot>
//                         </table>
//                     </div>

//                     {/* Footer */}
//                     <div className="border-t border-stone-200 px-5 py-3 text-xs text-stone-500">
//                         Showing {searchedMemberSummary.length} members

//                         {selectedMonth !== 'all' &&
//                             ` • ${formatMonth(selectedMonth)} only`}
//                     </div>
//                 </section>
//             </div>

//             {/* Payment Modal */}
//             {isPaymentOpen && selectedMember && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
//                     <div className="my-auto w-full max-w-md rounded-xl bg-white shadow-xl">
//                         <div className="flex items-center justify-between border-b border-stone-200 p-5">
//                             <div>
//                                 <h2 className="text-lg font-bold text-stone-900">
//                                     Member Payment
//                                 </h2>

//                                 <p className="mt-1 text-sm text-stone-500">
//                                     {selectedMember.name}
//                                 </p>
//                             </div>

//                             <button
//                                 type="button"
//                                 onClick={closePaymentModal}
//                                 disabled={isPaying}
//                                 className="rounded-lg px-3 py-1 text-xl text-stone-500 hover:bg-stone-100 disabled:opacity-50"
//                             >
//                                 &times;
//                             </button>
//                         </div>

//                         <form onSubmit={handlePaymentSubmit} className="space-y-5 p-5">
//                             {/* Total Outstanding */}
//                             <div className="rounded-lg bg-amber-50 p-4">
//                                 <p className="text-sm text-amber-700">
//                                     Total Outstanding Due
//                                 </p>

//                                 <p className="mt-1 text-2xl font-bold text-amber-800">
//                                     {formatTaka(
//                                         getMemberAllTimeDue(selectedMember.name)
//                                     )}
//                                 </p>
//                             </div>

//                             {/* Payment Type */}
//                             <div>
//                                 <label className="mb-2 block text-sm font-medium text-stone-700">
//                                     Payment Type
//                                 </label>

//                                 <div className="grid grid-cols-3 gap-2">
//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             handlePaymentTypeChange('partial')
//                                         }
//                                         className={`rounded-lg border px-2 py-3 text-xs font-semibold transition ${paymentType === 'partial'
//                                             ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
//                                             : 'border-stone-300 text-stone-600 hover:bg-stone-50'
//                                             }`}
//                                     >
//                                         Partial
//                                     </button>

//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             handlePaymentTypeChange('full')
//                                         }
//                                         className={`rounded-lg border px-2 py-3 text-xs font-semibold transition ${paymentType === 'full'
//                                             ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
//                                             : 'border-stone-300 text-stone-600 hover:bg-stone-50'
//                                             }`}
//                                     >
//                                         Full
//                                     </button>

//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             handlePaymentTypeChange('monthly')
//                                         }
//                                         className={`rounded-lg border px-2 py-3 text-xs font-semibold transition ${paymentType === 'monthly'
//                                             ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
//                                             : 'border-stone-300 text-stone-600 hover:bg-stone-50'
//                                             }`}
//                                     >
//                                         Monthly
//                                     </button>
//                                 </div>
//                             </div>

//                             {/* Monthly Selection */}
//                             {paymentType === 'monthly' && (
//                                 <div>
//                                     <div className="mb-2 flex items-center justify-between">
//                                         <label className="text-sm font-medium text-stone-700">
//                                             Select Months to Pay
//                                         </label>

//                                         <span className="text-xs text-stone-500">
//                                             {selectedMonths.length} selected
//                                         </span>
//                                     </div>

//                                     <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-stone-200 p-3">
//                                         {memberMonthlyDues.length > 0 ? (
//                                             memberMonthlyDues.map((item) => (
//                                                 <label
//                                                     key={item.month}
//                                                     className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-emerald-50"
//                                                 >
//                                                     <div className="flex min-w-0 items-center gap-3">
//                                                         <input
//                                                             type="checkbox"
//                                                             checked={selectedMonths.includes(item.month)}
//                                                             onChange={(event) =>
//                                                                 handleMonthSelection(
//                                                                     item.month,
//                                                                     event.target.checked
//                                                                 )
//                                                             }
//                                                             disabled={isPaying}
//                                                             className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
//                                                         />

//                                                         <div>
//                                                             <p className="text-sm font-medium text-stone-800">
//                                                                 {formatMonth(item.month)}
//                                                             </p>

//                                                             <p className="text-xs text-stone-500">
//                                                                 {item.entryCount} penalty {item.entryCount === 1 ? 'entry' : 'entries'}
//                                                             </p>
//                                                         </div>
//                                                     </div>

//                                                     <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-700">
//                                                         {formatTaka(item.dueAmount)}
//                                                     </span>
//                                                 </label>
//                                             ))
//                                         ) : (
//                                             <p className="py-5 text-center text-sm text-stone-500">
//                                                 No monthly dues available.
//                                             </p>
//                                         )}
//                                     </div>

//                                     <div className="mt-3 rounded-lg bg-emerald-50 p-3">
//                                         <div className="flex items-center justify-between">
//                                             <span className="text-sm font-medium text-emerald-800">
//                                                 Selected Months
//                                             </span>

//                                             <span className="text-sm font-semibold text-emerald-900">
//                                                 {selectedMonths.length}
//                                             </span>
//                                         </div>

//                                         <div className="mt-2 flex items-center justify-between">
//                                             <span className="text-sm font-medium text-emerald-800">
//                                                 Total Payment
//                                             </span>

//                                             <span className="text-xl font-bold text-emerald-900">
//                                                 {formatTaka(selectedMonthsTotal)}
//                                             </span>
//                                         </div>
//                                     </div>

//                                     <p className="mt-2 text-xs leading-5 text-stone-500">
//                                         Select the months you want to pay. Only outstanding dues from selected months will be paid.
//                                     </p>
//                                 </div>
//                             )}

//                             {/* Payment Amount */}
//                             {paymentType !== 'monthly' && (
//                                 <div>
//                                     <label
//                                         htmlFor="payment-amount"
//                                         className="mb-2 block text-sm font-medium text-stone-700"
//                                     >
//                                         Payment Amount
//                                     </label>

//                                     <input
//                                         id="payment-amount"
//                                         type="number"
//                                         min="0.01"
//                                         step="0.01"
//                                         value={
//                                             paymentType === 'full'
//                                                 ? getMemberAllTimeDue(selectedMember.name)
//                                                 : paymentAmount
//                                         }
//                                         onChange={(event) =>
//                                             setPaymentAmount(event.target.value)
//                                         }
//                                         disabled={paymentType === 'full'}
//                                         placeholder="Enter payment amount"
//                                         required={paymentType === 'partial'}
//                                         className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-stone-100"
//                                     />

//                                     {paymentType === 'full' && (
//                                         <p className="mt-1 text-xs text-stone-500">
//                                             Full outstanding amount will be paid.
//                                         </p>
//                                     )}
//                                 </div>
//                             )}

//                             {/* Payment Date */}
//                             <div>
//                                 <label
//                                     htmlFor="payment-date"
//                                     className="mb-2 block text-sm font-medium text-stone-700"
//                                 >
//                                     Payment Date
//                                 </label>

//                                 <input
//                                     id="payment-date"
//                                     type="date"
//                                     value={paymentDate}
//                                     onChange={(event) =>
//                                         setPaymentDate(event.target.value)
//                                     }
//                                     required
//                                     className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
//                                 />
//                             </div>

//                             {/* Payment Information */}
//                             <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
//                                 {paymentType === 'monthly'
//                                     ? 'Only the selected months will be paid. Other months will remain unchanged.'
//                                     : 'Payment will automatically be allocated to the oldest unpaid penalty entries first, across all months.'}
//                             </div>

//                             {paymentError && (
//                                 <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//                                     {paymentError}
//                                 </div>
//                             )}

//                             {/* Actions */}
//                             <div className="flex gap-3 pt-1">
//                                 <button
//                                     type="button"
//                                     onClick={closePaymentModal}
//                                     disabled={isPaying}
//                                     className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
//                                 >
//                                     Cancel
//                                 </button>

//                                 <button
//                                     type="submit"
//                                     disabled={
//                                         isPaying ||
//                                         (paymentType === 'monthly' &&
//                                             (selectedMonths.length === 0 ||
//                                                 selectedMonthsTotal <= 0))
//                                     }
//                                     className="flex-1 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
//                                 >
//                                     {isPaying ? 'Processing...' : 'Confirm Payment'}
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

import { useEffect, useMemo, useState } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/Lib/firebase';
import { useAuth } from '@/Context/AuthContext';

export default function MemberSummary() {
    const { user, loading: authLoading } = useAuth();
    const canWrite = !authLoading && !!user;

    const [entries, setEntries] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState('');

    // Payment modal states
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [paymentType, setPaymentType] = useState('partial');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState('');

    useEffect(() => {
        setPaymentDate(getTodayDate());
    }, []);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentError, setPaymentError] = useState('');


    // Close payment modal immediately when user logs out
    useEffect(() => {
        if (!canWrite) {
            setIsPaymentOpen(false);
            setSelectedMember(null);
            setSelectedMonths([]);
        }
    }, [canWrite]);

    // Realtime Firestore data
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
                        status: getPaymentStatus(amount, paidAmount),
                    };
                });

                setEntries(firebaseEntries);
                setError('');
                setIsLoaded(true);
            },
            (firebaseError) => {
                console.error('Firestore error:', firebaseError);
                setError('Failed to load Member Summary from Firebase.');
                setIsLoaded(true);
            }
        );

        return () => unsubscribe();
    }, []);

    // Validate date
    function isValidDate(date) {
        if (typeof date !== 'string') return false;

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(date)) return false;

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

    // Get today's local date
    // Get today's local date
    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Convert money to two decimal places
    function toMoney(value) {
        const number = Number(value) || 0;
        return Math.round((number + Number.EPSILON) * 100) / 100;
    }

    // Determine payment status
    function getPaymentStatus(amount, paidAmount) {
        if (amount > 0 && paidAmount >= amount) {
            return 'Paid';
        }

        if (paidAmount > 0) {
            return 'Partial';
        }

        return 'Pending';
    }

    // Available months
    const months = useMemo(() => {
        const availableMonths = [];

        entries.forEach((entry) => {
            if (!isValidDate(entry.date)) return;

            const month = entry.date.slice(0, 7);

            if (!availableMonths.includes(month)) {
                availableMonths.push(month);
            }
        });

        return availableMonths.sort((a, b) => b.localeCompare(a));
    }, [entries]);

    // Filter entries by month
    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => {
            if (!isValidDate(entry.date)) return false;

            if (selectedMonth === 'all') return true;

            return entry.date.slice(0, 7) === selectedMonth;
        });
    }, [entries, selectedMonth]);

    // Calculate member summary
    const memberSummary = useMemo(() => {
        const summary = {};

        filteredEntries.forEach((entry) => {
            const name = entry.member;
            if (!name) return;

            if (!summary[name]) {
                summary[name] = {
                    name,
                    totalFine: 0,
                    paidFine: 0,
                    dueFine: 0,
                };
            }

            summary[name].totalFine += entry.amount;
            summary[name].paidFine += entry.paidAmount;
            summary[name].dueFine += entry.dueAmount;
        });

        return Object.values(summary)
            .map((member) => ({
                ...member,
                totalFine: toMoney(member.totalFine),
                paidFine: toMoney(member.paidFine),
                dueFine: toMoney(member.dueFine),
            }))
            .sort((a, b) => b.totalFine - a.totalFine);
    }, [filteredEntries]);

    // Filter members by search term
    const searchedMemberSummary = useMemo(() => {
        const searchValue = searchTerm.trim().toLowerCase();

        if (!searchValue) return memberSummary;

        return memberSummary.filter((member) =>
            member.name.toLowerCase().includes(searchValue)
        );
    }, [memberSummary, searchTerm]);

    // Calculate grand totals
    const totalFine = useMemo(
        () =>
            toMoney(
                searchedMemberSummary.reduce(
                    (total, member) => total + member.totalFine,
                    0
                )
            ),
        [searchedMemberSummary]
    );

    const totalPaid = useMemo(
        () =>
            toMoney(
                searchedMemberSummary.reduce(
                    (total, member) => total + member.paidFine,
                    0
                )
            ),
        [searchedMemberSummary]
    );

    const totalDue = useMemo(
        () =>
            toMoney(
                searchedMemberSummary.reduce(
                    (total, member) => total + member.dueFine,
                    0
                )
            ),
        [searchedMemberSummary]
    );

    // Get all-time outstanding amount for a member
    function getMemberAllTimeDue(memberName) {
        return toMoney(
            entries
                .filter((entry) => entry.member === memberName)
                .reduce((total, entry) => total + entry.dueAmount, 0)
        );
    }

    // Get monthly outstanding dues for a member
    const memberMonthlyDues = useMemo(() => {
        if (!selectedMember) return [];

        const monthlySummary = {};

        entries.forEach((entry) => {
            if (entry.member !== selectedMember.name) return;
            if (!isValidDate(entry.date)) return;
            if (entry.dueAmount <= 0) return;

            const month = entry.date.slice(0, 7);

            if (!monthlySummary[month]) {
                monthlySummary[month] = {
                    month,
                    dueAmount: 0,
                    entryCount: 0,
                };
            }

            monthlySummary[month].dueAmount += entry.dueAmount;
            monthlySummary[month].entryCount += 1;
        });

        return Object.values(monthlySummary)
            .map((item) => ({
                ...item,
                dueAmount: toMoney(item.dueAmount),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [entries, selectedMember]);

    // Calculate selected months total
    const selectedMonthsTotal = useMemo(() => {
        return toMoney(
            memberMonthlyDues
                .filter((item) => selectedMonths.includes(item.month))
                .reduce((total, item) => total + item.dueAmount, 0)
        );
    }, [memberMonthlyDues, selectedMonths]);

    // Open payment modal
    function openPaymentModal(member) {
        if (!canWrite) return;

        setSelectedMember(member);
        setPaymentType('partial');
        setPaymentAmount('');
        setPaymentDate(getTodayDate());
        setSelectedMonths([]);
        setPaymentError('');
        setIsPaymentOpen(true);
    }

    // Close payment modal
    function closePaymentModal() {
        if (isPaying) return;

        setIsPaymentOpen(false);
        setSelectedMember(null);
        setSelectedMonths([]);
        setPaymentError('');
    }

    // Change payment type
    function handlePaymentTypeChange(type) {
        setPaymentType(type);
        setPaymentAmount('');
        setSelectedMonths([]);
        setPaymentError('');
    }

    // Select or deselect a month
    function handleMonthSelection(month, checked) {
        setSelectedMonths((previousMonths) => {
            if (checked) {
                return previousMonths.includes(month)
                    ? previousMonths
                    : [...previousMonths, month];
            }

            return previousMonths.filter(
                (selectedMonth) => selectedMonth !== month
            );
        });

        setPaymentError('');
    }

    // Submit payment
    async function handlePaymentSubmit(event) {
        event.preventDefault();

        if (!canWrite || isPaying) return;
        if (!selectedMember) return;

        if (!isValidDate(paymentDate)) {
            setPaymentError('Please select a valid payment date.');
            return;
        }

        const enteredAmount = toMoney(paymentAmount);

        if (paymentType === 'partial' && enteredAmount <= 0) {
            setPaymentError('Enter a valid payment amount.');
            return;
        }

        if (paymentType === 'monthly' && selectedMonths.length === 0) {
            setPaymentError('Please select at least one month.');
            return;
        }

        setIsPaying(true);
        setPaymentError('');

        try {
            const memberEntries = entries.filter(
                (entry) => entry.member === selectedMember.name
            );

            if (memberEntries.length === 0) {
                throw new Error('No penalty entries found for this member.');
            }

            const paymentRef = doc(collection(db, 'memberPayments'));

            await runTransaction(db, async (transaction) => {
                // Read all member entries first
                const snapshots = await Promise.all(
                    memberEntries.map((entry) =>
                        transaction.get(
                            doc(db, 'penaltyEntries', entry.id)
                        )
                    )
                );

                const freshEntries = snapshots
                    .map((snapshot, index) => {
                        if (!snapshot.exists()) return null;

                        const data = snapshot.data();
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
                            id: memberEntries[index].id,
                            date: data.date || '',
                            amount,
                            paidAmount,
                            dueAmount,
                        };
                    })
                    .filter((entry) => entry && entry.dueAmount > 0);

                // Select eligible entries based on payment type
                let eligibleEntries = freshEntries;

                if (paymentType === 'monthly') {
                    eligibleEntries = freshEntries.filter((entry) => {
                        if (!isValidDate(entry.date)) return false;

                        const entryMonth = entry.date.slice(0, 7);
                        return selectedMonths.includes(entryMonth);
                    });
                }

                // Oldest penalty first
                eligibleEntries.sort((a, b) => {
                    const dateCompare = a.date.localeCompare(b.date);

                    if (dateCompare !== 0) return dateCompare;

                    return a.id.localeCompare(b.id);
                });

                const currentTotalDue = toMoney(
                    eligibleEntries.reduce(
                        (total, entry) => total + entry.dueAmount,
                        0
                    )
                );

                if (currentTotalDue <= 0) {
                    throw new Error(
                        paymentType === 'monthly'
                            ? 'The selected months have no outstanding dues.'
                            : 'This member has no outstanding dues.'
                    );
                }

                const finalPaymentAmount =
                    paymentType === 'full' || paymentType === 'monthly'
                        ? currentTotalDue
                        : enteredAmount;

                if (finalPaymentAmount > currentTotalDue) {
                    throw new Error(
                        `Payment cannot exceed the total due of ৳${currentTotalDue.toLocaleString('en-BD')}.`
                    );
                }

                if (finalPaymentAmount <= 0) {
                    throw new Error('Invalid payment amount.');
                }

                let remainingAmount = finalPaymentAmount;
                const allocations = [];

                // Allocate payment to eligible entries
                for (const entry of eligibleEntries) {
                    if (remainingAmount <= 0) break;

                    const allocatedAmount = toMoney(
                        Math.min(entry.dueAmount, remainingAmount)
                    );

                    if (allocatedAmount <= 0) continue;

                    const newPaidAmount = toMoney(
                        entry.paidAmount + allocatedAmount
                    );

                    const newDueAmount = toMoney(
                        Math.max(0, entry.amount - newPaidAmount)
                    );

                    const newStatus = getPaymentStatus(
                        entry.amount,
                        newPaidAmount
                    );

                    transaction.update(
                        doc(db, 'penaltyEntries', entry.id),
                        {
                            paidAmount: newPaidAmount,
                            dueAmount: newDueAmount,
                            status: newStatus,
                            paymentDate,
                        }
                    );

                    allocations.push({
                        entryId: entry.id,
                        penaltyDate: entry.date,
                        amount: allocatedAmount,
                    });

                    remainingAmount = toMoney(
                        remainingAmount - allocatedAmount
                    );
                }

                if (remainingAmount > 0) {
                    throw new Error(
                        'Could not allocate the complete payment. Please try again.'
                    );
                }

                // Save payment history
                transaction.set(paymentRef, {
                    member: selectedMember.name,
                    paymentType,
                    amount: finalPaymentAmount,
                    paymentDate,
                    selectedMonths:
                        paymentType === 'monthly'
                            ? [...selectedMonths].sort()
                            : [],
                    allocations,
                    createdAt: serverTimestamp(),
                });
            });

            setIsPaymentOpen(false);
            setSelectedMember(null);
            setPaymentAmount('');
            setSelectedMonths([]);
            setPaymentError('');
        } catch (paymentException) {
            console.error('Payment error:', paymentException);

            setPaymentError(
                paymentException.message ||
                'Payment failed. Please try again.'
            );
        } finally {
            setIsPaying(false);
        }
    }

    // Format Bangladeshi Taka
    function formatTaka(amount) {
        return `৳${toMoney(amount).toLocaleString('en-BD', {
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
                                Total fines, paid amounts and outstanding payments
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

                        {/* Member Search */}
                        <div className="sm:w-64">
                            <label
                                htmlFor="member-search"
                                className="mb-2 block text-sm font-medium text-stone-700"
                            >
                                Search Member
                            </label>

                            <input
                                id="member-search"
                                type="text"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search by member name..."
                                className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                            />
                        </div>
                    </div>

                    {/* Member Summary Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] border-collapse text-sm">
                            <thead>
                                <tr className="bg-emerald-950 text-white">
                                    <th className="px-5 py-4 text-left font-semibold">
                                        Member Name
                                    </th>
                                    <th className="px-5 py-4 text-right font-semibold">
                                        Total Fine
                                    </th>
                                    <th className="px-5 py-4 text-right font-semibold">
                                        Paid Fine
                                    </th>
                                    <th className="px-5 py-4 text-right font-semibold">
                                        Due Fine
                                    </th>
                                    <th className="px-5 py-4 text-center font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {searchedMemberSummary.length > 0 ? (
                                    searchedMemberSummary.map((member, index) => {
                                        const allTimeDue =
                                            getMemberAllTimeDue(member.name);

                                        return (
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

                                                <td className="px-5 py-3.5 text-right font-medium tabular-nums text-emerald-700">
                                                    {formatTaka(member.paidFine)}
                                                </td>

                                                <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-amber-700">
                                                    {formatTaka(member.dueFine)}
                                                </td>

                                                <td className="px-5 py-3.5 text-center">
                                                    {allTimeDue > 0 ? (
                                                        canWrite ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openPaymentModal(member)
                                                                }
                                                                className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                                                            >
                                                                Payment
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-stone-400">
                                                                Login to Pay
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="font-medium text-emerald-700">
                                                            Fully Paid
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-12 text-center text-stone-500"
                                        >
                                            {searchTerm.trim()
                                                ? 'No matching member found.'
                                                : 'No penalty entries found.'}
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
                                    <td className="px-5 py-4 text-right tabular-nums text-emerald-800">
                                        {formatTaka(totalPaid)}
                                    </td>
                                    <td className="px-5 py-4 text-right tabular-nums text-amber-800">
                                        {formatTaka(totalDue)}
                                    </td>
                                    <td className="px-5 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-stone-200 px-5 py-3 text-xs text-stone-500">
                        Showing {searchedMemberSummary.length} members
                        {selectedMonth !== 'all' &&
                            ` • ${formatMonth(selectedMonth)} only`}
                    </div>
                </section>
            </div>

            {/* Payment Modal */}
            {canWrite && isPaymentOpen && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                    <div className="my-auto w-full max-w-md rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-stone-200 p-5">
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">
                                    Member Payment
                                </h2>
                                <p className="mt-1 text-sm text-stone-500">
                                    {selectedMember.name}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closePaymentModal}
                                disabled={isPaying}
                                className="rounded-lg px-3 py-1 text-xl text-stone-500 hover:bg-stone-100 disabled:opacity-50"
                            >
                                &times;
                            </button>
                        </div>

                        <form
                            onSubmit={handlePaymentSubmit}
                            className="space-y-5 p-5"
                        >
                            {/* Total Outstanding */}
                            <div className="rounded-lg bg-amber-50 p-4">
                                <p className="text-sm text-amber-700">
                                    Total Outstanding Due
                                </p>
                                <p className="mt-1 text-2xl font-bold text-amber-800">
                                    {formatTaka(
                                        getMemberAllTimeDue(selectedMember.name)
                                    )}
                                </p>
                            </div>

                            {/* Payment Type */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-stone-700">
                                    Payment Type
                                </label>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handlePaymentTypeChange('partial')
                                        }
                                        className={`rounded-lg border px-2 py-3 text-xs font-semibold transition ${paymentType === 'partial'
                                            ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                                            : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                                            }`}
                                    >
                                        Partial
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handlePaymentTypeChange('full')
                                        }
                                        className={`rounded-lg border px-2 py-3 text-xs font-semibold transition ${paymentType === 'full'
                                            ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                                            : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                                            }`}
                                    >
                                        Full
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handlePaymentTypeChange('monthly')
                                        }
                                        className={`rounded-lg border px-2 py-3 text-xs font-semibold transition ${paymentType === 'monthly'
                                            ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                                            : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                                            }`}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>

                            {/* Monthly Selection */}
                            {paymentType === 'monthly' && (
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-sm font-medium text-stone-700">
                                            Select Months to Pay
                                        </label>
                                        <span className="text-xs text-stone-500">
                                            {selectedMonths.length} selected
                                        </span>
                                    </div>

                                    <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-stone-200 p-3">
                                        {memberMonthlyDues.length > 0 ? (
                                            memberMonthlyDues.map((item) => (
                                                <label
                                                    key={item.month}
                                                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-emerald-50"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMonths.includes(
                                                                item.month
                                                            )}
                                                            onChange={(event) =>
                                                                handleMonthSelection(
                                                                    item.month,
                                                                    event.target.checked
                                                                )
                                                            }
                                                            disabled={isPaying}
                                                            className="h-4 w-4 rounded border-stone-300 accent-emerald-800"
                                                        />

                                                        <div>
                                                            <p className="text-sm font-medium text-stone-800">
                                                                {formatMonth(item.month)}
                                                            </p>
                                                            <p className="text-xs text-stone-500">
                                                                {item.entryCount} penalty{' '}
                                                                {item.entryCount === 1
                                                                    ? 'entry'
                                                                    : 'entries'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-700">
                                                        {formatTaka(item.dueAmount)}
                                                    </span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="py-5 text-center text-sm text-stone-500">
                                                No monthly dues available.
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-emerald-800">
                                                Selected Months
                                            </span>
                                            <span className="text-sm font-semibold text-emerald-900">
                                                {selectedMonths.length}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-emerald-800">
                                                Total Payment
                                            </span>
                                            <span className="text-xl font-bold text-emerald-900">
                                                {formatTaka(selectedMonthsTotal)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-stone-500">
                                        Select the months you want to pay. Only outstanding dues from selected months will be paid.
                                    </p>
                                </div>
                            )}

                            {/* Payment Amount */}
                            {paymentType !== 'monthly' && (
                                <div>
                                    <label
                                        htmlFor="payment-amount"
                                        className="mb-2 block text-sm font-medium text-stone-700"
                                    >
                                        Payment Amount
                                    </label>

                                    <input
                                        id="payment-amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            paymentType === 'full'
                                                ? getMemberAllTimeDue(
                                                    selectedMember.name
                                                )
                                                : paymentAmount
                                        }
                                        onChange={(event) =>
                                            setPaymentAmount(event.target.value)
                                        }
                                        disabled={paymentType === 'full'}
                                        placeholder="Enter payment amount"
                                        required={paymentType === 'partial'}
                                        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-stone-100"
                                    />

                                    {paymentType === 'full' && (
                                        <p className="mt-1 text-xs text-stone-500">
                                            Full outstanding amount will be paid.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Payment Date */}
                            <div>
                                <label
                                    htmlFor="payment-date"
                                    className="mb-2 block text-sm font-medium text-stone-700"
                                >
                                    Payment Date
                                </label>

                                <input
                                    id="payment-date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(event) =>
                                        setPaymentDate(event.target.value)
                                    }
                                    required
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                                />
                            </div>

                            {/* Payment Information */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                                {paymentType === 'monthly'
                                    ? 'Only the selected months will be paid. Other months will remain unchanged.'
                                    : 'Payment will automatically be allocated to the oldest unpaid penalty entries first, across all months.'}
                            </div>

                            {paymentError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {paymentError}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    disabled={isPaying}
                                    className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        isPaying ||
                                        (paymentType === 'monthly' &&
                                            (selectedMonths.length === 0 ||
                                                selectedMonthsTotal <= 0))
                                    }
                                    className="flex-1 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isPaying
                                        ? 'Processing...'
                                        : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}