'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface DbActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorName: string | null;
  actorRole: string;
  timestamp: Date;
}

interface ActivityLogsClientProps {
  logs: DbActivityLog[];
}

export default function ActivityLogsClient({ logs }: ActivityLogsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => 
    (l.actorName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.entityType.toLowerCase().includes(searchTerm.toLowerCase())
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
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Action Details</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredLogs.map((log) => {
                const formattedDate = new Date(log.timestamp).toLocaleString('en-IN');
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-850">{log.actorName || 'System'}</p>
                      <p className="text-[10px] text-teal-600 font-semibold uppercase">{log.actorRole}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold uppercase font-mono">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{log.action}</td>
                    <td className="px-6 py-4 text-xs text-slate-450">{formattedDate}</td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
