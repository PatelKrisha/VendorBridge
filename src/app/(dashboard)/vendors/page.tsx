'use client';

import { useState } from 'react';
import { Search, Plus, Filter, ArrowUpRight, MoreVertical } from 'lucide-react';

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const vendors = [
    { id: '1', name: 'Supernova Logistics & Trading', gst: '27AAASL5678B1Z2', pan: 'AAASL5678B', category: 'Logistics', status: 'ACTIVE', score: 94.5 },
    { id: '2', name: 'Apex Industrial Supplies', gst: '27AAAAP9999C1Z3', pan: 'AAAAP9999C', category: 'Hardware', status: 'ACTIVE', score: 98.2 },
    { id: '3', name: 'Zenith Tech Systems', gst: '27AAAZT8888D1Z4', pan: 'AAAZT8888D', category: 'IT Hardware', status: 'ACTIVE', score: 91.8 },
    { id: '4', name: 'Vanguard Electronics', gst: '27AAVE1111E1Z5', pan: 'AAAVE1111E', category: 'Electronics', status: 'PENDING', score: 100.0 },
    { id: '5', name: 'Titanium Steel Corp', gst: '27AAATC2222F1Z6', pan: 'AAATC2222F', category: 'Raw Materials', status: 'SUSPENDED', score: 85.0 },
  ];

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.gst.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendors Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, evaluate, and onboard corporate vendors.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs shadow-md shadow-accent/10 transition-colors cursor-pointer self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Onboard Vendor
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by company name or GST..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent focus:bg-white transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-55 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Company Details</th>
                <th className="px-6 py-4">Tax IDs</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Perf. Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{vendor.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {vendor.id}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <p>GST: {vendor.gst}</p>
                    <p className="text-slate-400">PAN: {vendor.pan}</p>
                  </td>
                  <td className="px-6 py-4">{vendor.category}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{vendor.score}%</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        vendor.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : vendor.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-slate-400 hover:text-accent rounded-lg hover:bg-slate-50 transition-all cursor-pointer">
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
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
