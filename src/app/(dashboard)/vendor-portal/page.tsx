'use client';

export default function VendorPortalPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vendor Portal Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome to the self-service vendor portal.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50">
          <h3 className="text-sm font-semibold text-slate-700">Open RFQs</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">3</p>
          <p className="text-xs text-slate-400 mt-1">Ready for bidding</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50">
          <h3 className="text-sm font-semibold text-slate-700">Active Purchase Orders</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">5</p>
          <p className="text-xs text-slate-400 mt-1">In progress / Delivery pending</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50">
          <h3 className="text-sm font-semibold text-slate-700">Pending Invoices</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">2</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting approval or payment</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50">
        <h2 className="text-base font-bold text-slate-800">Recent Purchase Orders</h2>
        <p className="text-xs text-slate-400 mt-1">View recently received purchase orders below.</p>
        <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          No recent POs to show. You will be notified when a new PO is issued to you.
        </div>
      </div>
    </div>
  );
}
