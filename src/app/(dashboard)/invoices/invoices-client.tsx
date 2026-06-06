'use client';

import { useState, useEffect } from 'react';
import { Search, FileDown, Eye, X, Plus, Trash2, Check, Ban } from 'lucide-react';
import { createInvoice } from '@/app/actions/invoices';
import { recordPayment } from '@/app/actions/payments'; // Can also approve/pay invoice directly
import { useRouter } from 'next/navigation';

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  tax: number;
}

interface DbInvoice {
  id: string;
  invoiceNumber: string;
  poNumber: string;
  poId: string;
  vendorName: string;
  vendorGst: string;
  vendorAddress?: string;
  dueDate: Date;
  status: 'DRAFT' | 'ISSUED' | 'SENT' | 'ACKNOWLEDGED' | 'PAID' | 'OVERDUE';
  subtotal: string;
  cgst: string;
  sgst: string;
  igst: string;
  total: string;
}

interface DbPurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorGst: string;
  bankDetails: any;
  total: string;
  items: any[];
}

interface InvoicesClientProps {
  initialInvoices: DbInvoice[];
  purchaseOrders: DbPurchaseOrder[];
  userRole: string;
}

export default function InvoicesClient({ initialInvoices, purchaseOrders, userRole }: InvoicesClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<DbInvoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  // Form State for Creating Invoice
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [selectedPoId, setSelectedPoId] = useState('');
  const [formDueDate, setFormDueDate] = useState('2026-07-15');
  
  // Custom manual items if needed (defaults loaded from selected PO)
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { name: 'Dual Intel Xeon Core Scalable Server CPU v4', qty: 2, price: 125000, tax: 18 }
  ]);

  // Auto-generate invoice number when modal opens
  useEffect(() => {
    if (showCreateModal) {
      const dateStr = new Date().getFullYear();
      const seq = Math.floor(1000 + Math.random() * 9000);
      setFormInvoiceNumber(`INV-${dateStr}-${seq}`);
      
      // Select first PO by default if available
      if (purchaseOrders.length > 0) {
        setSelectedPoId(purchaseOrders[0].id);
      }
    }
  }, [showCreateModal, purchaseOrders]);

  // Load items from selected PO
  useEffect(() => {
    if (selectedPoId) {
      const po = purchaseOrders.find(p => p.id === selectedPoId);
      if (po && po.items && po.items.length > 0) {
        const poItemsMapped = po.items.map(item => ({
          name: item.itemName,
          qty: item.quantity,
          price: Number(item.unitPrice),
          tax: Number(item.taxRate),
        }));
        setFormItems(poItemsMapped);
      }
    }
  }, [selectedPoId, purchaseOrders]);

  const handleAddItem = () => {
    setFormItems([...formItems, { name: '', qty: 1, price: 0, tax: 18 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  const handleUpdateItem = (index: number, key: keyof InvoiceItem, val: string | number) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      [key]: val
    } as InvoiceItem;
    setFormItems(updated);
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPoId) {
      alert('Please select a purchase order reference.');
      return;
    }

    const subtotal = formItems.reduce((acc, item) => acc + item.qty * item.price, 0);
    // Simple 9% CGST + 9% SGST split
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);
    const total = subtotal + cgst + sgst;

    const res = await createInvoice({
      poId: selectedPoId,
      invoiceNumber: formInvoiceNumber,
      subtotal: String(subtotal),
      cgst: String(cgst),
      sgst: String(sgst),
      igst: '0.00',
      total: String(total),
      dueDate: formDueDate,
    });

    if (res.success) {
      setShowCreateModal(false);
      router.refresh();
    } else {
      alert(res.error || 'Failed to issue invoice');
    }
  };

  // Finance records payment to approve/pay
  const handleApproveInvoice = async (invoiceId: string) => {
    const inv = initialInvoices.find(i => i.id === invoiceId);
    if (!inv) return;

    if (userRole !== 'FINANCE' && userRole !== 'ADMIN') {
      alert('Forbidden: Only Finance or Admins can record payments.');
      return;
    }

    setSubmitting(prev => ({ ...prev, [invoiceId]: true }));
    // Record real payment to change invoice status to PAID
    const res = await recordPayment({
      invoiceId,
      amount: inv.total,
      method: 'NEFT',
      referenceNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: `Automated settlement from Invoices panel.`,
    });
    setSubmitting(prev => ({ ...prev, [invoiceId]: false }));

    if (res.success) {
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({ ...selectedInvoice, status: 'PAID' });
      }
      router.refresh();
    } else {
      alert(res.error || 'Failed to record payment');
    }
  };

  const filteredInvoices = initialInvoices.filter(
    (i) =>
      i.invoiceNumber.includes(searchTerm) ||
      i.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDownloadUrl = (inv: DbInvoice) => {
    return `/api/v1/invoices/download?id=${inv.id}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">Track bills, verify tax allocations, and reconcile payments.</p>
        </div>
        {(userRole === 'VENDOR' || userRole === 'ADMIN' || userRole === 'OFFICER') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-xs shadow-md shadow-accent/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Invoice</span>
          </button>
        )}
      </div>

      <div className="flex bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search invoice number or vendor..."
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
                <th className="px-6 py-4">Invoice Details</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredInvoices.map((inv) => {
                const formattedDate = new Date(inv.dueDate).toLocaleDateString('en-IN');
                const formattedTotal = Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">PO: {inv.poNumber}</p>
                    </td>
                    <td className="px-6 py-4">{inv.vendorName}</td>
                    <td className="px-6 py-4">{formattedDate}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">₹{formattedTotal}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : inv.status === 'ISSUED'
                            ? 'bg-blue-50 text-blue-700'
                            : inv.status === 'SENT' || inv.status === 'ACKNOWLEDGED'
                            ? 'bg-slate-150 text-slate-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-accent rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                          title="View Invoice Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {inv.status === 'ISSUED' && (userRole === 'FINANCE' || userRole === 'ADMIN') && (
                          <button
                            disabled={submitting[inv.id]}
                            onClick={() => handleApproveInvoice(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                            title="Pay / Approve Invoice"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <a
                          href={getDownloadUrl(inv)}
                          download
                          className="p-1.5 text-slate-400 hover:text-indigo-650 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                          title="Download Invoice Details"
                        >
                          <FileDown className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-450">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal: Create / Issue Invoice */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-base font-bold text-slate-800">Issue New Tax Invoice</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-250 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="p-6 space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Invoice Number</label>
                  <input
                    type="text"
                    required
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Select PO Reference</label>
                  {purchaseOrders.length === 0 ? (
                    <p className="text-rose-500 mt-2 font-medium">No purchase orders available to invoice.</p>
                  ) : (
                    <select
                      value={selectedPoId}
                      onChange={(e) => setSelectedPoId(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-accent"
                    >
                      {purchaseOrders.map(po => (
                        <option key={po.id} value={po.id}>{po.poNumber} ({po.vendorName} - ₹{Number(po.total).toLocaleString('en-IN')})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Due Date</label>
                <input
                  type="date"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items (Loaded from PO)</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-lg border border-slate-150">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Description"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(idx, 'qty', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          required
                          min={0}
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-right"
                        />
                      </div>
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseOrders.length === 0}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-xs shadow-md shadow-accent/10 cursor-pointer transition-all disabled:opacity-50"
                >
                  Save & Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-sm font-semibold text-slate-500">Viewer:</span>
                <span className="text-sm font-bold text-slate-800">{selectedInvoice.invoiceNumber}</span>
                <span
                  className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedInvoice.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700'
                      : selectedInvoice.status === 'ISSUED'
                      ? 'bg-blue-50 text-blue-700'
                      : selectedInvoice.status === 'SENT' || selectedInvoice.status === 'ACKNOWLEDGED'
                      ? 'bg-sky-50 text-sky-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedInvoice.status === 'ISSUED' && (userRole === 'FINANCE' || userRole === 'ADMIN') && (
                  <button
                    disabled={submitting[selectedInvoice.id]}
                    onClick={() => handleApproveInvoice(selectedInvoice.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Pay</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invoice Layout Sheet */}
            <div className="p-8 space-y-8 flex-1 select-text text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">TAX INVOICE</h2>
                  <p className="text-xs text-slate-400 mt-1">VendorBridge ERP Generated</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Invoice Number</p>
                  <p className="text-sm font-bold text-slate-800">{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>

              {/* Parties Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buyer (Bill To):</h3>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">Acme Global Corporation</p>
                    <p>101, Business Tower, Bandra Kurla Complex</p>
                    <p>Mumbai, Maharashtra, 400051</p>
                    <p className="font-semibold text-slate-700 mt-1">GSTIN: 27AAACA1234A1Z1</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller (Bill From):</h3>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">{selectedInvoice.vendorName}</p>
                    <p>{selectedInvoice.vendorAddress || 'Registered Supplier Address'}</p>
                    <p className="font-semibold text-slate-700 mt-1">GSTIN: {selectedInvoice.vendorGst}</p>
                  </div>
                </div>
              </div>

              {/* Metadata Block */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-150 text-xs">
                <div>
                  <p className="text-slate-400">Issue Date</p>
                  <p className="font-bold text-slate-700 mt-0.5">2026-06-06</p>
                </div>
                <div>
                  <p className="text-slate-400">Due Date</p>
                  <p className="font-bold text-slate-700 mt-0.5">{new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-slate-400">PO Reference</p>
                  <p className="font-bold text-slate-700 mt-0.5">{selectedInvoice.poNumber}</p>
                </div>
                <div>
                  <p className="text-slate-400">Tax Type</p>
                  <p className="font-bold text-slate-700 mt-0.5">Intra-State GST (CGST+SGST)</p>
                </div>
              </div>

              {/* Tax Breakdowns and Summary */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="text-[10px] text-slate-400 space-y-1 max-w-sm">
                  <p className="font-bold uppercase tracking-wider text-slate-500">Declaration & Terms</p>
                  <p>We declare that this invoice shows the actual price of the goods or services described and that all particulars are true and correct.</p>
                </div>

                <div className="w-full md:w-80 space-y-2.5 text-xs border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{Number(selectedInvoice.subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>CGST (9%):</span>
                    <span>₹{Number(selectedInvoice.cgst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SGST (9%):</span>
                    <span>₹{Number(selectedInvoice.sgst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-800">
                    <span>Grand Total:</span>
                    <span className="text-accent">₹{Number(selectedInvoice.total).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
