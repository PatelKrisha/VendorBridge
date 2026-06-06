'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, DollarSign, Wallet, X } from 'lucide-react';
import { recordPayment } from '@/app/actions/payments';
import { useRouter } from 'next/navigation';

interface DbPaymentRecord {
  id: string;
  paymentDate: Date;
  amount: string;
  method: 'NEFT' | 'RTGS' | 'CHEQUE' | 'CARD' | 'UPI';
  referenceNumber: string;
  notes: string | null;
  invoiceNumber: string;
  poNumber: string;
  vendorName: string;
  recorderName: string | null;
}

interface DbInvoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  total: string;
  status: string;
}

interface PaymentLedgerClientProps {
  records: DbPaymentRecord[];
  unpaidInvoices: DbInvoice[];
}

export default function PaymentLedgerClient({ records, unpaidInvoices }: PaymentLedgerClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Form states
  const [formInvoiceId, setFormInvoiceId] = useState('');
  const [formAmount, setFormAmount] = useState(0);
  const [formMethod, setFormMethod] = useState<'NEFT' | 'RTGS' | 'CHEQUE' | 'CARD' | 'UPI'>('NEFT');
  const [formDate, setFormDate] = useState('2026-06-06');
  const [formReference, setFormReference] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Set default form values
  useEffect(() => {
    if (showRecordModal && unpaidInvoices.length > 0) {
      const firstInv = unpaidInvoices[0];
      setFormInvoiceId(firstInv.id);
      setFormAmount(Number(firstInv.total));
      setFormReference(`TXN-${Math.floor(10000000 + Math.random() * 90000000)}`);
    }
  }, [showRecordModal, unpaidInvoices]);

  // Adjust amount when invoice changes
  useEffect(() => {
    if (formInvoiceId) {
      const inv = unpaidInvoices.find(i => i.id === formInvoiceId);
      if (inv) {
        setFormAmount(Number(inv.total));
      }
    }
  }, [formInvoiceId, unpaidInvoices]);

  // Submit record payment form
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formInvoiceId) {
      alert('Please select an invoice.');
      return;
    }

    const res = await recordPayment({
      invoiceId: formInvoiceId,
      amount: String(formAmount),
      method: formMethod,
      referenceNumber: formReference,
      notes: formNotes,
    });

    if (res.success) {
      setShowRecordModal(false);
      setFormNotes('');
      router.refresh();
    } else {
      alert(res.error || 'Failed to record payment');
    }
  };

  // Calculations
  const totalCleared = records.reduce((acc, r) => acc + Number(r.amount), 0);
  const totalOutstanding = unpaidInvoices.reduce((acc, i) => acc + Number(i.total), 0);

  const filteredRecords = records.filter(r =>
    r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payment Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Review ledger logs and record bank transaction receipts.</p>
        </div>
        <button
          onClick={() => setShowRecordModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs shadow-md shadow-accent/10 transition-all cursor-pointer self-start sm:self-auto"
        >
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
            <p className="text-xl font-bold text-slate-800 mt-1">₹{totalCleared.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">Total Outstanding Balance</h3>
            <p className="text-xl font-bold text-slate-800 mt-1">₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
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
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Reference No</th>
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Txn Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredRecords.map((rec) => {
                const formattedDate = new Date(rec.paymentDate).toLocaleDateString('en-IN');
                const formattedAmount = Number(rec.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 font-mono text-xs">{rec.referenceNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{rec.invoiceNumber}</td>
                    <td className="px-6 py-4">{formattedDate}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">₹{formattedAmount}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-semibold">
                        {rec.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{rec.recorderName || 'Finance'}</td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Record Transaction Receipt</h2>
              <button
                onClick={() => setShowRecordModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Invoice Ref</label>
                {unpaidInvoices.length === 0 ? (
                  <p className="text-rose-500 mt-2 font-semibold">No unpaid invoices available to clear.</p>
                ) : (
                  <select
                    value={formInvoiceId}
                    onChange={(e) => setFormInvoiceId(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:border-accent"
                  >
                    {unpaidInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.invoiceNumber} ({inv.vendorName} - ₹{Number(inv.total).toLocaleString('en-IN')})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Cleared Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Transaction Reference</label>
                <input
                  type="text"
                  required
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Method</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:border-accent"
                  >
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="CARD">CARD</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Value Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Memo / Notes</label>
                <input
                  type="text"
                  placeholder="Additional receipt remarks..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unpaidInvoices.length === 0}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-xs shadow-md shadow-accent/10 cursor-pointer transition-all disabled:opacity-50"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
