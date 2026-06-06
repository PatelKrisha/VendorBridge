'use client';

import { useState } from 'react';
import { Search, FileDown, Eye, Filter } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const orders = [
    { id: '1', poNumber: 'PO-2026-000101', vendor: 'Supernova Logistics', total: '10,53,000', issuedDate: '2026-06-01', status: 'ISSUED' },
    { id: '2', poNumber: 'PO-2026-000102', vendor: 'Apex Industrial Supplies', total: '2,20,800', issuedDate: '2026-06-03', status: 'ACKNOWLEDGED' },
    { id: '3', poNumber: 'PO-2026-000103', vendor: 'Zenith Tech Systems', total: '5,40,000', issuedDate: '2026-05-28', status: 'FULLY_RECEIVED' },
    { id: '4', poNumber: 'PO-2026-000104', vendor: 'Titanium Steel Corp', total: '14,20,000', issuedDate: '2026-06-05', status: 'ISSUED' },
  ];

  const filteredOrders = orders.filter(o => 
    o.poNumber.includes(searchTerm) || o.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Review, print, and track corporate purchase commitments.</p>
        </div>
      </div>

      <div className="flex bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search PO number or vendor..."
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
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Issued Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{order.poNumber}</td>
                  <td className="px-6 py-4">{order.vendor}</td>
                  <td className="px-6 py-4">{order.issuedDate}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">₹{order.total}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'ISSUED'
                          ? 'bg-blue-50 text-blue-700'
                          : order.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-slate-400 hover:text-accent rounded-lg hover:bg-slate-50 transition-all cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer">
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
