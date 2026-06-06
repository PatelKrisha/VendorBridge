'use client';

import { useState } from 'react';
import { Search, Plus, Calendar, DollarSign, Filter, ArrowUpRight } from 'lucide-react';

export default function RfqsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const rfqs = [
    { id: '1', rfqNumber: 'RFQ-2026-000001', title: 'Acme IT Infrastructure Upgrade', deadline: '2026-06-20', budget: '15,00,000', status: 'PUBLISHED', bids: 3 },
    { id: '2', rfqNumber: 'RFQ-2026-000002', title: 'Office Furniture Procurement', deadline: '2026-06-15', budget: '3,50,000', status: 'DRAFT', bids: 0 },
    { id: '3', rfqNumber: 'RFQ-2026-000003', title: 'Data Center Primary Cooling Units', deadline: '2026-05-30', budget: '8,00,000', status: 'CLOSED', bids: 5 },
    { id: '4', rfqNumber: 'RFQ-2026-000004', title: 'Corporate Laptop Procurement (Q3)', deadline: '2026-07-10', budget: '25,00,000', status: 'PUBLISHED', bids: 2 },
  ];

  const filteredRfqs = rfqs.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.rfqNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Request for Quotations (RFQs)</h1>
          <p className="text-sm text-slate-500 mt-1">Publish item requirements and solicit bids from vendors.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs shadow-md shadow-accent/10 transition-colors cursor-pointer self-start sm:self-auto">
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
              <button className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer">
                View Details
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
