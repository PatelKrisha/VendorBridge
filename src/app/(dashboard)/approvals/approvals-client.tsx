'use client';

import { useState } from 'react';
import { Clock, Check, X, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { submitApprovalDecision } from '@/app/actions/approvals';
import { useRouter } from 'next/navigation';

interface DbApprovalRequest {
  id: string;
  currentLevel: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'DELEGATED' | 'CONFLICT_SKIPPED';
  initiatedAt: Date;
  quotationId: string;
  totalAmount: string | null;
  vendorName: string;
  vendorId: string;
  rfqNumber: string;
  rfqTitle: string;
  rfqId: string;
  initiatorName: string | null;
}

interface ApprovalsClientProps {
  requests: DbApprovalRequest[];
}

export default function ApprovalsClient({ requests }: ApprovalsClientProps) {
  const router = useRouter();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const handleAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    setSubmitting(prev => ({ ...prev, [requestId]: true }));
    
    const decisionRemarks = remarks[requestId] || `Actioned: ${action} from Approver Dashboard`;
    const res = await submitApprovalDecision({
      requestId,
      action,
      remarks: decisionRemarks,
    });

    setSubmitting(prev => ({ ...prev, [requestId]: false }));

    if (res.success) {
      // Clear remarks field
      setRemarks(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
      router.refresh();
    } else {
      alert(res.error || 'Failed to submit approval decision');
    }
  };

  const pendingApprovals = requests.filter((a) => a.status === 'PENDING');
  const decidedApprovals = requests.filter((a) => a.status === 'APPROVED' || a.status === 'REJECTED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Approvals Queue</h1>
        <p className="text-sm text-slate-500 mt-1">Review, authorize, or reject purchase awards and workflows.</p>
      </div>

      {/* Pending approvals */}
      <div className="space-y-4">
        {pendingApprovals.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center text-slate-500">
            No pending approvals found in your queue.
          </div>
        ) : (
          pendingApprovals.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">{app.rfqNumber}</span>
                  {/* Mock conflict trigger for specific vendor for demo fidelity */}
                  {app.vendorName.includes('Zenith') && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Conflict of Interest Detected
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  Award recommendation for <span className="text-accent">{app.vendorName}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <p>Value: <span className="font-semibold text-slate-700">₹{Number(app.totalAmount || 0).toLocaleString('en-IN')}</span></p>
                  <span>•</span>
                  <p>Proposed by: {app.initiatorName || 'Officer'}</p>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-amber-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>24h SLA remaining</span>
                  </div>
                </div>
              </div>

              {/* Remarks/Comments field */}
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Enter approval/rejection remarks..."
                  value={remarks[app.id] || ''}
                  onChange={(e) => setRemarks(prev => ({ ...prev, [app.id]: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  disabled={submitting[app.id]}
                  onClick={() => handleAction(app.id, 'REJECTED')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-slate-500" />
                  Reject
                </button>
                <button
                  disabled={submitting[app.id]}
                  onClick={() => handleAction(app.id, 'APPROVED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-white" />
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decided items history */}
      {decidedApprovals.length > 0 && (
        <div className="space-y-3 pt-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Actioned History</h2>
          {decidedApprovals.map((app) => {
            const isApproved = app.status === 'APPROVED';
            return (
              <div key={app.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-85">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">{app.rfqNumber}</span>
                  <h3 className="font-semibold text-slate-600 text-sm">
                    Award recommendation for {app.vendorName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Value: ₹{Number(app.totalAmount || 0).toLocaleString('en-IN')} • Proposed by: {app.initiatorName || 'Officer'}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                  isApproved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isApproved
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Approved</>
                    : <><XCircle className="w-3.5 h-3.5" /> Rejected</>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
