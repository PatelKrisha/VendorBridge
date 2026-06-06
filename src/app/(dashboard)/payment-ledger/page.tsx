'use client';

import { useState } from 'react';
import { Search, Download, Plus, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';

export default function PaymentLedgerPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const records = [
    { id: '1', refNumber: 'TXN-90210293', invoiceNumber: 'INV-2026-000011', amount: '2,60,544', date: '2026-06-04', method: 'NEFT', recorder: 'Vikram Joshi' },
    { id: '2', refNumber: 'TXN-40810482', invoiceNumber: 'INV-2026-000009', amount: '1,50,000', date: '2026-05-25', method: 'RTGS', recorder: 'Vikram Joshi' },
  ];

  const filteredRecords = records.filter(r =>
    r.refNumber.includes(searchTerm) || r.invoiceNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payment Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Review ledger logs and record bank transaction receipts.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs shadow-md shadow-accent/10 transition-colors cursor-pointer self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Ledger overview card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">Total Cleared Value</h3>
            <p className="text-xl font-bold text-slate-800 mt-1">₹4,10,544</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">Total Outstanding Balance</h3>
            <p className="text-xl font-bold text-slate-800 mt-1">₹18,79,740</p>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search txn ref or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-55 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Reference No</th>
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Txn Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800 font-mono text-xs">{rec.refNumber}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{rec.invoiceNumber}</td>
                  <td className="px-6 py-4">{rec.date}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">₹{rec.amount}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-semibold">
                      {rec.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{rec.recorder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
