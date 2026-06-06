'use client';

import { useState } from 'react';
import { Search, Plus, Calendar, DollarSign, ArrowUpRight, X, Check, Ban } from 'lucide-react';

interface RFQItem {
  description: string;
  qty: number;
  unit: string;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  deadline: string;
  budget: string;
  status: string;
  bids: number;
  description: string;
  items: RFQItem[];
}

export default function RfqsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // RFQ List State
  const [rfqsList, setRfqsList] = useState<RFQ[]>([
    {
      id: '1',
      rfqNumber: 'RFQ-2026-000001',
      title: 'Acme IT Infrastructure Upgrade',
      deadline: '2026-06-20',
      budget: '15,00,000',
      status: 'PUBLISHED',
      bids: 3,
      description: 'Procurement of enterprise server racks and L3 network switches for the core data center upgrade.',
      items: [
        { description: 'Enterprise Server Rack 2U (Xeon 32-Core, 256GB RAM)', qty: 3, unit: 'Units' },
        { description: 'Managed L3 Network Switch 48-Port PoE+', qty: 2, unit: 'Units' }
      ]
    },
    {
      id: '2',
      rfqNumber: 'RFQ-2026-000002',
      title: 'Office Furniture Procurement',
      deadline: '2026-06-15',
      budget: '3,50,000',
      status: 'DRAFT',
      bids: 0,
      description: 'Ergonomic workstation desks and executive office chairs for the BKC head office renovation.',
      items: [
        { description: 'Ergonomic Office Workstation Desks', qty: 10, unit: 'Desks' },
        { description: 'High-back Ergonomic Task Chairs', qty: 10, unit: 'Chairs' }
      ]
    },
    {
      id: '3',
      rfqNumber: 'RFQ-2026-000003',
      title: 'Data Center Primary Cooling Units',
      deadline: '2026-05-30',
      budget: '8,00,000',
      status: 'CLOSED',
      bids: 5,
      description: 'Precision air conditioning (PAC) units with custom compressor staging for the main server room.',
      items: [
        { description: 'Data Center PAC Unit (15 Ton capacity)', qty: 1, unit: 'Unit' }
      ]
    },
    {
      id: '4',
      rfqNumber: 'RFQ-2026-000004',
      title: 'Corporate Laptop Procurement (Q3)',
      deadline: '2026-07-10',
      budget: '25,00,000',
      status: 'PUBLISHED',
      bids: 2,
      description: 'Standard developer profile laptops with 32GB RAM, 1TB SSD, and 3-year onsite warranty.',
      items: [
        { description: 'Developer Profile Laptop (Intel Core Ultra 7, 32GB RAM)', qty: 15, unit: 'Units' }
      ]
    },
  ]);

  // Form states for creating RFQ
  const [formTitle, setFormTitle] = useState('');
  const [formBudget, setFormBudget] = useState('5,00,000');
  const [formDeadline, setFormDeadline] = useState('2026-07-15');
  const [formDescription, setFormDescription] = useState('');
  const [formItems, setFormItems] = useState<RFQItem[]>([
    { description: 'Standard Developer Workspace Monitors 27"', qty: 10, unit: 'Units' }
  ]);

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
  const handleUpdateItem = (index: number, key: keyof RFQItem, val: string | number) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      [key]: val
    } as RFQItem;
    setFormItems(updated);
  };

  // Submit RFQ Form
  const handleCreateRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRfq: RFQ = {
      id: String(rfqsList.length + 1),
      rfqNumber: `RFQ-2026-00000${rfqsList.length + 1}`,
      title: formTitle,
      deadline: formDeadline,
      budget: formBudget,
      status: 'DRAFT',
      bids: 0,
      description: formDescription,
      items: formItems
    };

    setRfqsList([...rfqsList, newRfq]);
    setShowCreateModal(false);

    // Reset forms
    setFormTitle('');
    setFormDescription('');
    setFormItems([{ description: 'Standard Developer Workspace Monitors 27"', qty: 10, unit: 'Units' }]);
  };

  // Actions transitions
  const handlePublishRfq = (id: string) => {
    setRfqsList(rfqsList.map(r => r.id === id ? { ...r, status: 'PUBLISHED' } : r));
    if (selectedRfq && selectedRfq.id === id) {
      setSelectedRfq({ ...selectedRfq, status: 'PUBLISHED' });
    }
  };

  const handleCloseRfq = (id: string) => {
    setRfqsList(rfqsList.map(r => r.id === id ? { ...r, status: 'CLOSED' } : r));
    if (selectedRfq && selectedRfq.id === id) {
      setSelectedRfq({ ...selectedRfq, status: 'CLOSED' });
    }
  };

  const filteredRfqs = rfqsList.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.rfqNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Request for Quotations (RFQs)</h1>
          <p className="text-sm text-slate-500 mt-1">Publish item requirements and solicit bids from vendors.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs shadow-md shadow-accent/10 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create RFQ
        </button>
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
        {filteredRfqs.map((rfq) => (
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
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {rfq.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-base mt-2.5 line-clamp-1">{rfq.title}</h3>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Due: {rfq.deadline}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>Budget: ₹{rfq.budget}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">{rfq.bids} Bids Received</span>
              <button
                onClick={() => setSelectedRfq(rfq)}
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
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

            <form onSubmit={handleCreateRfqSubmit} className="p-6 space-y-4">
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
                    type="text"
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
                  Save RFQ Draft
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
                      : 'bg-rose-50 text-rose-700'
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
                  <p className="text-sm font-bold text-slate-800 mt-0.5">₹{selectedRfq.budget}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Deadline Date</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedRfq.deadline}</p>
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
                          <td className="px-4 py-2.5 font-medium text-slate-800">{item.description}</td>
                          <td className="px-4 py-2.5 text-center">{item.qty} {item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">{selectedRfq.bids} Active Quotations Submitted</span>
                <div className="flex gap-1.5">
                  {selectedRfq.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublishRfq(selectedRfq.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Publish RFQ
                    </button>
                  )}
                  {selectedRfq.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleCloseRfq(selectedRfq.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Close Submissions
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
