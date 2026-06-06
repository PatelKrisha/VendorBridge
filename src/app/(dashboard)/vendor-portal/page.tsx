import { getDashboardStats } from '@/app/actions/dashboard';
import { getPurchaseOrders } from '@/app/actions/purchase-orders';
import Link from 'next/link';
import { ArrowUpRight, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VendorPortalPage() {
  const [statsResponse, posResponse] = await Promise.all([
    getDashboardStats(),
    getPurchaseOrders(),
  ]);

  const stats = statsResponse?.stats || [
    { name: 'Assigned RFQs', value: '0', change: 'Open for bidding', href: '/rfqs' },
    { name: 'Active POs', value: '0', change: 'In progress', href: '/purchase-orders' },
    { name: 'Pending Invoices', value: '0', change: 'Awaiting payment', href: '/invoices' },
  ];

  const recentPos = (posResponse?.data || []).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vendor Portal Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome to the self-service vendor portal.</p>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.slice(0, 3).map((stat) => (
          <Link 
            key={stat.name}
            href={stat.href}
            className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 hover:shadow-md transition-all block"
          >
            <h3 className="text-sm font-semibold text-slate-500">{stat.name}</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>{stat.change}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Purchase Orders */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Recent Purchase Orders</h2>
            <p className="text-xs text-slate-400 mt-1">View recently received purchase orders below.</p>
          </div>
          <Link 
            href="/purchase-orders" 
            className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
          >
            View All POs
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-6">
          {recentPos.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No recent POs to show. You will be notified when a new PO is issued to you.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-500 font-bold border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-2.5">PO Number</th>
                    <th className="px-4 py-2.5">Issued Date</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  {recentPos.map((po) => {
                    const formattedDate = po.issuedAt 
                      ? new Date(po.issuedAt).toLocaleDateString('en-IN') 
                      : 'N/A';

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/20">
                        <td className="px-4 py-3 font-semibold text-slate-800">{po.poNumber}</td>
                        <td className="px-4 py-3">{formattedDate}</td>
                        <td className="px-4 py-3 font-semibold">₹{po.total}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              po.status === 'ISSUED'
                                ? 'bg-blue-50 text-blue-700'
                                : po.status === 'ACKNOWLEDGED'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href="/purchase-orders"
                            className="text-accent hover:underline font-semibold"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
