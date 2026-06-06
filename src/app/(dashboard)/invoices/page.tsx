'use client';

import { useState, useEffect } from 'react';
import { Search, FileDown, Eye, X, Plus, Trash2, Check, Ban } from 'lucide-react';

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  tax: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  poNumber: string;
  vendor: string;
  vendorGst: string;
  vendorAddress: string;
  dueDate: string;
  status: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  items: InvoiceItem[];
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Initial Invoices List
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-2026-000010',
      poNumber: 'PO-2026-000101',
      vendor: 'Supernova Logistics & Trading',
      vendorGst: '27AAASL5678B1Z2',
      vendorAddress: 'Building 4B, Sector 3, Vashi, Navi Mumbai, MH, 400703',
      dueDate: '2026-06-30',
      status: 'ISSUED',
      subtotal: 1053000,
      cgst: 94770,
      sgst: 94770,
      igst: 0,
      total: 1242540,
      items: [
        { name: 'Enterprise Server Rack 2U (Dual Xeon 32-Core, 256GB RAM, 8TB SSD)', qty: 3, price: 350000, tax: 18 }
      ]
    },
    {
      id: '2',
      invoiceNumber: 'INV-2026-000011',
      poNumber: 'PO-2026-000102',
      vendor: 'Apex Industrial Supplies',
      vendorGst: '27AAAAP9999C1Z3',
      vendorAddress: 'Phase 2, Industrial Area, Hinjewadi, Pune, MH, 411057',
      dueDate: '2026-06-25',
      status: 'PAID',
      subtotal: 220800,
      cgst: 19872,
      sgst: 19872,
      igst: 0,
      total: 260544,
      items: [
        { name: 'Managed L3 Network Switch 48-Port PoE+ (10G SFP+ Uplinks)', qty: 2, price: 110400, tax: 18 }
      ]
    },
    {
      id: '3',
      invoiceNumber: 'INV-2026-000012',
      poNumber: 'PO-2026-000103',
      vendor: 'Zenith Tech Systems',
      vendorGst: '27AAAZT8888D1Z4',
      vendorAddress: 'Tower C, DLF Cyber City, Phase 3, Gurugram, HR, 122002',
      dueDate: '2026-06-05',
      status: 'OVERDUE',
      subtotal: 540000,
      cgst: 48600,
      sgst: 48600,
      igst: 0,
      total: 637200,
      items: [
        { name: 'Standard Office Workstation Desks', qty: 10, price: 54000, tax: 18 }
      ]
    },
  ]);

  // Form State for Creating Invoice
  const [formInvoiceNumber, setFormInvoiceNumber] = useState(`INV-2026-0000${invoicesList.length + 10}`);
  const [formPoNumber, setFormPoNumber] = useState('PO-2026-000104');
  const [formVendor, setFormVendor] = useState('');
  const [formVendorGst, setFormVendorGst] = useState('27AAASL5678B1Z2');
  const [formVendorAddress, setFormVendorAddress] = useState('Building 4B, Sector 3, Vashi, Navi Mumbai, MH, 400703');
  const [formDueDate, setFormDueDate] = useState('2026-07-15');
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { name: 'Dual Intel Xeon Core Scalable Server CPU v4', qty: 2, price: 125000, tax: 18 }
  ]);

  // Add Item to Form
  const handleAddItem = () => {
    setFormItems([...formItems, { name: '', qty: 1, price: 0, tax: 18 }]);
  };

  // Remove Item from Form
  const handleRemoveItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  // Update Item in Form
  const handleUpdateItem = (index: number, key: keyof InvoiceItem, val: string | number) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      [key]: val
    };
    setFormItems(updated);
  };

  // Decode access token cookie on load to identify current user role
  useEffect(() => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1];
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        setUserRole(payload.role);
        
        // Auto-fill vendor name if logged in as VENDOR
        if (payload.role === 'VENDOR') {
          setFormVendor('Supernova Logistics & Trading');
        }
      }
    } catch (e) {
      console.error('Failed to parse role from access token:', e);
    }
  }, []);

  // Submit Invoice Creation Form
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    const subtotal = formItems.reduce((acc, item) => acc + item.qty * item.price, 0);
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);
    const total = subtotal + cgst + sgst;

    const newInv: Invoice = {
      id: String(invoicesList.length + 1),
      invoiceNumber: formInvoiceNumber,
      poNumber: formPoNumber,
      vendor: formVendor || 'Apex Industrial Supplies',
      vendorGst: formVendorGst,
      vendorAddress: formVendorAddress,
      dueDate: formDueDate,
      status: 'ISSUED',
      subtotal,
      cgst,
      sgst,
      igst: 0,
      total,
      items: formItems
    };

    setInvoicesList([...invoicesList, newInv]);
    setShowCreateModal(false);
    
    // Reset form states
    setFormInvoiceNumber(`INV-2026-0000${invoicesList.length + 11}`);
    setFormItems([{ name: 'Dual Intel Xeon Core Scalable Server CPU v4', qty: 2, price: 125000, tax: 18 }]);
  };

  // State modification handlers (CRUD Actions)
  const handleApproveInvoice = (id: string) => {
    setInvoicesList(
      invoicesList.map((inv) => (inv.id === id ? { ...inv, status: 'PAID' } : inv))
    );
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice({ ...selectedInvoice, status: 'PAID' });
    }
  };

  const handleCancelInvoice = (id: string) => {
    setInvoicesList(
      invoicesList.map((inv) => (inv.id === id ? { ...inv, status: 'CANCELLED' } : inv))
    );
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice({ ...selectedInvoice, status: 'CANCELLED' });
    }
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoicesList(invoicesList.filter((inv) => inv.id !== id));
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice(null);
    }
  };

  // Role Filtering: Vendors see only their own invoices; internal users see all
  const roleFilteredInvoices = userRole === 'VENDOR'
    ? invoicesList.filter((i) => i.vendor.toLowerCase().includes('supernova'))
    : invoicesList;

  const filteredInvoices = roleFilteredInvoices.filter(
    (i) =>
      i.invoiceNumber.includes(searchTerm) ||
      i.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate dynamic PDF download URL
  const getDownloadUrl = (inv: Invoice) => {
    // If it is one of the static backend mock IDs, request it directly
    if (inv.id === '1' || inv.id === '2' || inv.id === '3') {
      return `/api/v1/invoices/download?id=${inv.id}`;
    }
    // Otherwise, serialize invoice data as JSON for the dynamic endpoint
    return `/api/v1/invoices/download?id=custom&data=${encodeURIComponent(JSON.stringify(inv))}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">Track bills, verify tax allocations, and reconcile payments.</p>
        </div>
        <button
          onClick={() => {
            if (userRole === 'VENDOR') {
              setFormVendor('Supernova Logistics & Trading');
              setFormVendorGst('27AAASL5678B1Z2');
              setFormVendorAddress('Building 4B, Sector 3, Vashi, Navi Mumbai, MH, 400703');
            } else {
              setFormVendor('');
            }
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-xs shadow-md shadow-accent/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Invoice</span>
        </button>
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
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-400 mt-0.5">PO: {inv.poNumber}</p>
                  </td>
                  <td className="px-6 py-4">{inv.vendor}</td>
                  <td className="px-6 py-4">{inv.dueDate}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">₹{inv.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : inv.status === 'ISSUED'
                          ? 'bg-blue-50 text-blue-700'
                          : inv.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-650'
                          : 'bg-rose-50 text-rose-700 animate-pulse'
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
                      
                      {inv.status === 'ISSUED' && (
                        <button
                          onClick={() => handleApproveInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                          title="Pay / Approve Invoice"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                        <button
                          onClick={() => handleCancelInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                          title="Cancel Invoice"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <a
                        href={getDownloadUrl(inv)}
                        download
                        className="p-1.5 text-slate-400 hover:text-indigo-650 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                        title="Download Invoice PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
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

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 flex-1">
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
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">PO Reference</label>
                  <input
                    type="text"
                    required
                    value={formPoNumber}
                    onChange={(e) => setFormPoNumber(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Vendor / Company</label>
                  <input
                    type="text"
                    required
                    disabled={userRole === 'VENDOR'}
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="e.g. Apex Industrial Supplies"
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent disabled:opacity-70"
                  />
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
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items</h3>
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
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-xs shadow-md shadow-accent/10 cursor-pointer transition-all"
                >
                  Save & Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Fidelity Tax Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">Viewer:</span>
                <span className="text-sm font-bold text-slate-800">{selectedInvoice.invoiceNumber}</span>
                <span
                  className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedInvoice.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700'
                      : selectedInvoice.status === 'ISSUED'
                      ? 'bg-blue-50 text-blue-700'
                      : selectedInvoice.status === 'CANCELLED'
                      ? 'bg-slate-100 text-slate-650'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedInvoice.status === 'ISSUED' && (
                  <button
                    onClick={() => handleApproveInvoice(selectedInvoice.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Pay</span>
                  </button>
                )}

                {selectedInvoice.status !== 'CANCELLED' && selectedInvoice.status !== 'PAID' && (
                  <button
                    onClick={() => handleCancelInvoice(selectedInvoice.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel Invoice</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <a
                  href={getDownloadUrl(selectedInvoice)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer ml-1"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invoice Layout Sheet */}
            <div className="p-8 space-y-8 flex-1 select-text">
              {/* Header Title */}
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
                    <p className="font-semibold text-slate-800">{selectedInvoice.vendor}</p>
                    <p>{selectedInvoice.vendorAddress}</p>
                    <p className="font-semibold text-slate-700 mt-1">GSTIN: {selectedInvoice.vendorGst}</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">✓ Verified Supplier</p>
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
                  <p className="font-bold text-slate-700 mt-0.5">{selectedInvoice.dueDate}</p>
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

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-center w-16">Qty</th>
                      <th className="px-4 py-3 text-right w-32">Unit Price</th>
                      <th className="px-4 py-3 text-center w-20">Tax</th>
                      <th className="px-4 py-3 text-right w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                        <td className="px-4 py-3 text-center">{item.qty}</td>
                        <td className="px-4 py-3 text-right">₹{item.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">{item.tax}%</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          ₹{(item.qty * item.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax Breakdowns and Summary */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="text-[10px] text-slate-400 space-y-1 max-w-sm">
                  <p className="font-bold uppercase tracking-wider text-slate-500">Declaration & Terms</p>
                  <p>We declare that this invoice shows the actual price of the goods or services described and that all particulars are true and correct.</p>
                  <p>Subject to Mumbai jurisdiction. Standard 30-day payment terms apply unless specified in the PO agreement.</p>
                </div>

                <div className="w-full md:w-80 space-y-2.5 text-xs border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>CGST (9%):</span>
                    <span>₹{selectedInvoice.cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SGST (9%):</span>
                    <span>₹{selectedInvoice.sgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>IGST (0%):</span>
                    <span>₹{selectedInvoice.igst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-800">
                    <span>Grand Total:</span>
                    <span className="text-accent">₹{selectedInvoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
              Thank you for your business. This is a computer-generated tax invoice and requires no physical signature.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
