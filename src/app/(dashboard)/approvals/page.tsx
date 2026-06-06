'use client';

import { useState } from 'react';
import { AlertCircle, Clock, Check, X, ShieldAlert } from 'lucide-react';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([
    { id: '1', rfqNumber: 'RFQ-2026-000001', vendor: 'Supernova Logistics', total: '12,70,000', initiator: 'Ritu Sharma', slaHours: 24, conflict: false },
    { id: '2', rfqNumber: 'RFQ-2026-000003', vendor: 'Zenith Tech Systems', total: '8,40,000', initiator: 'Ritu Sharma', slaHours: 4, conflict: true },
    { id: '3', rfqNumber: 'RFQ-2026-000004', vendor: 'Titanium Steel Corp', total: '24,50,000', initiator: 'Ritu Sharma', slaHours: 42, conflict: false },
  ]);

  const handleApprove = (id: string) => {
    setApprovals(approvals.filter(a => a.id !== id));
  };

  const handleReject = (id: string) => {
    setApprovals(approvals.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Approvals Queue</h1>
        <p className="text-sm text-slate-500 mt-1">Review, authorize, or reject purchase awards and workflows.</p>
      </div>

      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center text-slate-500">
            No pending approvals found in your queue.
          </div>
        ) : (
          approvals.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              {app.conflict && (
                <div className="absolute top-0 left-0 h-full w-1.5 bg-rose-500"></div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">{app.rfqNumber}</span>
                  {app.conflict && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Conflict of Interest Detected
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  Award recommendation for <span className="text-accent">{app.vendor}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <p>Value: <span className="font-semibold text-slate-700">₹{app.total}</span></p>
                  <span>•</span>
                  <p>Proposed by: {app.initiator}</p>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-amber-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{app.slaHours}h SLA remaining</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReject(app.id)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <X className="w-4 h-4 text-slate-500" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(app.id)}
                  disabled={app.conflict}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-white" />
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
