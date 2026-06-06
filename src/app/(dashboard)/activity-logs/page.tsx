'use client';

import { useState } from 'react';
import { Search, History, ShieldAlert } from 'lucide-react';

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const logs = [
    { id: '1', actor: 'Aishwarya Nair', role: 'ADMIN', action: 'USER_LOGIN', entity: 'USER', details: 'admin@acme.com authenticated successfully', ip: '192.168.1.5', time: '2026-06-06 10:30' },
    { id: '2', actor: 'Ritu Sharma', role: 'OFFICER', action: 'RFQ_PUBLISHED', entity: 'RFQ', details: 'RFQ-2026-000001 published to 3 vendors', ip: '192.168.1.12', time: '2026-06-06 10:20' },
    { id: '3', actor: 'Mohammed Farhan', role: 'VENDOR', action: 'QUOTE_SUBMITTED', entity: 'QUOTATION', details: 'Quotation Q-2026-0412 submitted for RFQ-2026-000001', ip: '103.54.21.90', time: '2026-06-06 09:30' },
    { id: '4', actor: 'Priya Mehta', role: 'APPROVER', action: 'PO_APPROVED', entity: 'APPROVAL', details: 'Approved purchase order recommendation PO-2026-000104', ip: '192.168.1.18', time: '2026-06-06 06:30' },
  ];

  const filteredLogs = logs.filter(l => 
    l.actor.toLowerCase().includes(searchTerm.toLowerCase()) || l.action.includes(searchTerm) || l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Immutable Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">Review system activity, actions, and security compliance logs.</p>
      </div>

      <div className="flex bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search logs by actor, action, details..."
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
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-850">{log.actor}</p>
                    <p className="text-[10px] text-teal-600 font-semibold uppercase">{log.role}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-semibold font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{log.details}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{log.ip}</td>
                  <td className="px-6 py-4 text-xs text-slate-450">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
