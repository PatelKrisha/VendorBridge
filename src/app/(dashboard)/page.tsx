'use client';

import Link from 'next/link';
import { FileText, CheckSquare, FileCheck, AlertCircle, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { name: 'Active RFQs', value: '12', change: '+2 this week', icon: FileText, color: 'text-blue-600 bg-blue-50', href: '/rfqs' },
    { name: 'Pending Approvals', value: '4', change: '2 SLA warning', icon: CheckSquare, color: 'text-amber-600 bg-amber-50', href: '/approvals' },
    { name: 'Issued POs', value: '28', change: '₹14.2L total value', icon: FileCheck, color: 'text-teal-600 bg-teal-50', href: '/purchase-orders' },
    { name: 'Overdue Invoices', value: '3', change: 'Escalated to admin', icon: AlertCircle, color: 'text-danger bg-rose-50', href: '/invoices' },
  ];

  const recentActivities = [
    { id: 1, action: 'RFQ-2026-000001 published', user: 'Ritu Sharma', time: '10 mins ago', type: 'rfq' },
    { id: 2, action: 'Quotation Q-2026-0412 submitted by Supernova Logistics', user: 'Mohammed Farhan', time: '1 hour ago', type: 'quote' },
    { id: 3, action: 'PO-2026-000104 approved by Priya Mehta', user: 'Priya Mehta', time: '4 hours ago', type: 'approval' },
    { id: 4, action: 'Invoice INV-2026-000012 marked as PAID', user: 'Vikram Joshi', time: '1 day ago', type: 'invoice' },
  ];

  const quickActions = [
    { label: 'Create New RFQ', href: '/rfqs', description: 'Publish a new request for quotation' },
    { label: 'Onboard New Vendor', href: '/vendors', description: 'Register and verify a supplier' },
    { label: 'View Approvals Queue', href: '/approvals', description: 'Review pending approval items' },
    { label: 'View Payment Ledger', href: '/payment-ledger', description: 'Check outstanding payments' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, Aishwarya</h1>
        <p className="text-sm text-slate-500 mt-1">Here is a summary of your procurement dashboard today.</p>
      </div>

      {/* KPI Stats Grid — each card is clickable and navigates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white p-6 rounded-xl premium-card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" />
                  12%
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-400">{stat.name}</h3>
                <p className="text-2xl font-bold text-slate-700 mt-1">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">{stat.change}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main dashboard content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Feed */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Recent Activity Log</h2>
            <Link
              href="/activity-logs"
              className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              View Audit Trail
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== recentActivities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center ring-8 ring-white text-xs font-bold text-slate-600">
                          {activity.user[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-slate-600 font-medium">
                            {activity.action} <span className="text-[10px] text-slate-400 font-normal">by {activity.user}</span>
                          </p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-400">
                          <time>{activity.time}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Quick Actions</h2>
            <p className="text-xs text-slate-400 mt-1">Accelerate your procurement workflow in single clicks.</p>
            <div className="mt-6 space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="w-full text-left px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-accent/5 hover:border-accent/30 hover:text-accent transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="block">{action.label}</span>
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5 group-hover:text-accent/70">{action.description}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-accent flex-shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-teal-50/50 border border-teal-100 rounded-xl flex items-start gap-3">
            <Users className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-teal-800">Vendor Registrations Open</p>
              <p className="text-[10px] text-teal-700 mt-0.5 leading-normal">
                Self-registration portal is active. You have 3 pending KYC approvals to verify.
              </p>
              <Link
                href="/vendors"
                className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-teal-700 hover:text-teal-900 underline"
              >
                Review Vendors <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
