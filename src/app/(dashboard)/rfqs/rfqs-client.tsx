'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Calendar, DollarSign, ArrowUpRight, X, Check, Ban } from 'lucide-react';
import { createRfq } from '@/app/actions/rfqs';
import { useRouter } from 'next/navigation';

interface DbRFQItem {
  id: string;
  rfqId: string;
  itemName: string;
  quantity: number;
  unit: string;
  hsnCode: string | null;
  specifications: string | null;
  targetPrice: string | null;
  benchmarkPrice: string;
}

interface DbVendor {
  id: string;
  companyName: string;
  status: string;
}

interface DbRFQ {
  id: string;
  rfqNumber: string;
  title: string;
  description: string | null;
  deadline: Date;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'AWARDED' | 'CANCELLED';
  totalBudget: string | null;
  createdById: string;
  creatorName?: string | null;
  items: DbRFQItem[];
  assignedVendors?: { vendorId: string; companyName: string }[];
}

interface RfqsClientProps {
  initialRfqs: DbRFQ[];
  vendors: DbVendor[];
  userRole: string;
}

interface RFQFormItem {
  description: string;
  qty: number;
  unit: string;
}

export default function RfqsClient({ initialRfqs, vendors, userRole }: RfqsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<DbRFQ | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating RFQ
  const [formTitle, setFormTitle] = useState('');
  const [formBudget, setFormBudget] = useState('500000');
  const [formDeadline, setFormDeadline] = useState('2026-07-15');
  const [formDescription, setFormDescription] = useState('');
  const [formItems, setFormItems] = useState<RFQFormItem[]>([
    { description: 'Standard Developer Workspace Monitors 27"', qty: 10, unit: 'Units' }
  ]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

  // Auto-select all active vendors by default
  useEffect(() => {
    if (showCreateModal) {
      const activeIds = vendors
        .filter(v => v.status === 'ACTIVE')
        .map(v => v.id);
      setSelectedVendorIds(activeIds);
    }
  }, [showCreateModal, vendors]);

  // Add Item to Form
  const handleAddItem = () => {
    setFormItems([...formItems, { description: '', qty: 1, unit: 'Units' }]);
  };

  // Remove Item from Form
  const handleRemoveItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  // Update Item in Form
  const handleUpdateItem = (index: number, key: keyof RFQFormItem, val: string | number) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      [key]: val
    } as RFQFormItem;
    setFormItems(updated);
  };

  // Toggle vendor selection
  const handleToggleVendor = (vendorId: string) => {
    setSelectedVendorIds(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  // Submit RFQ Form
  const handleCreateRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedVendorIds.length === 0) {
      alert('Please assign at least one vendor to this RFQ.');
      return;
    }

    const res = await createRfq({
      title: formTitle,
      description: formDescription,
      deadline: formDeadline,
      totalBudget: formBudget,
      items: formItems.map(item => ({
        itemName: item.description,
        quantity: item.qty,
        unit: item.unit,
        benchmarkPrice: String(Number(formBudget) / formItems.length), // simple benchmark split
      })),
      vendorIds: selectedVendorIds,
    });

    if (res.success) {
      setShowCreateModal(false);
      setFormTitle('');
      setFormDescription('');
      setFormItems([{ description: 'Standard Developer Workspace Monitors 27"', qty: 10, unit: 'Units' }]);
      router.refresh();
    } else {
      alert(res.error || 'Failed to create RFQ');
    }
  };

  const filteredRfqs = initialRfqs.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.rfqNumber.includes(searchTerm)
  );

  const activeVendors = vendors.filter(v => v.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Request for Quotations (RFQs)</h1>
          <p className="text-sm text-slate-500 mt-1">Publish item requirements and solicit bids from vendors.</p>
        </div>
        {(userRole === 'ADMIN' || userRole === 'OFFICER') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs shadow-md shadow-accent/10 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create RFQ
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
            placeholder="Search by RFQ number or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRfqs.map((rfq) => {
          const formattedBudget = Number(rfq.totalBudget || 0).toLocaleString('en-IN');
          const formattedDeadline = new Date(rfq.deadline).toLocaleDateString('en-IN');
          const bidCount = rfq.status === 'AWARDED' ? 1 : (rfq.status === 'CLOSED' ? 3 : 0);

          return (
            <div key={rfq.id} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{rfq.rfqNumber}</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      rfq.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : rfq.status === 'DRAFT'
                        ? 'bg-slate-100 text-slate-700'
                        : rfq.status === 'CLOSED'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {rfq.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base mt-2.5 line-clamp-1">{rfq.title}</h3>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Due: {formattedDeadline}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span>Budget: ₹{formattedBudget}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">{bidCount} Bids Received</span>
                <button
                  onClick={() => setSelectedRfq(rfq)}
                  className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredRfqs.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400">
            No RFQs found.
          </div>
        )}
      </div>

      {/* Create RFQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Create New RFQ</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRfqSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">RFQ Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Expansion Infrastructure"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Estimated Budget (INR)</label>
                  <input
                    type="number"
                    required
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Submission Deadline</label>
                  <input
                    type="date"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Scope / Description</label>
                <textarea
                  placeholder="Describe details and specification criteria..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Vendor Assignment Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Assign Vendors</label>
                {activeVendors.length === 0 ? (
                  <p className="text-slate-400 italic">No active vendors found to assign.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2 bg-slate-50">
                    {activeVendors.map(vendor => (
                      <label key={vendor.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVendorIds.includes(vendor.id)}
                          onChange={() => handleToggleVendor(vendor.id)}
                          className="rounded text-accent focus:ring-accent"
                        />
                        <span className="text-slate-700">{vendor.companyName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Requirements</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    + Add Requirement
                  </button>
                </div>

                <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Item description / specs"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
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
                      <div className="w-20">
                        <input
                          type="text"
                          required
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
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
                  Save RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFQ Detail Modal */}
      {selectedRfq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">{selectedRfq.rfqNumber}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedRfq.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : selectedRfq.status === 'DRAFT'
                      ? 'bg-slate-100 text-slate-700'
                      : selectedRfq.status === 'CLOSED'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {selectedRfq.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedRfq(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-650">
              <div>
                <h3 className="text-base font-bold text-slate-800">{selectedRfq.title}</h3>
                <p className="mt-2 text-slate-500 leading-relaxed">{selectedRfq.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-150">
                <div>
                  <p className="text-slate-400 font-medium">Estimated Budget</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">₹{Number(selectedRfq.totalBudget || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Deadline Date</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{new Date(selectedRfq.deadline).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Requirements Table */}
              <div className="space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Specifications / Bill of Materials</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="px-4 py-2.5">Item Description</th>
                        <th className="px-4 py-2.5 text-center w-24">Required Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {selectedRfq.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{item.itemName}</td>
                          <td className="px-4 py-2.5 text-center">{item.quantity} {item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assigned Vendors Details */}
              {selectedRfq.assignedVendors && selectedRfq.assignedVendors.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Assigned Vendors</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRfq.assignedVendors.map(vendor => (
                      <span key={vendor.vendorId} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                        {vendor.companyName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
