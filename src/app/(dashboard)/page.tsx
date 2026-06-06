import Link from 'next/link';
import { FileText, CheckSquare, FileCheck, AlertCircle, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import { getDashboardStats } from '@/app/actions/dashboard';
import { getCurrentUser } from '@/lib/auth-context';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  let firstName = 'Aishwarya';
  const userRole = user?.role || 'ADMIN';

  if (user) {
    try {
      const [dbUser] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, user.userId))
        .limit(1);
      if (dbUser?.name) {
        firstName = dbUser.name.split(' ')[0];
      }
    } catch (e) {
      console.warn('Error fetching user name for dashboard, using email fallback:', e);
      const mockNames: Record<string, string> = {
        'admin@acme.com': 'Aishwarya Nair',
        'officer@acme.com': 'Ritu Sharma',
        'approver@acme.com': 'Priya Mehta',
        'finance@acme.com': 'Vikram Joshi',
        'vendor@supernova.com': 'Mohammed Farhan',
      };
      const fullName = mockNames[user.email] || user.email.split('@')[0];
      firstName = fullName.split(' ')[0];
    }
  }

  const statsResponse = await getDashboardStats();
  const statsData = statsResponse?.stats || [
    { name: 'Active RFQs', value: '0', change: 'Loading...', icon: FileText, color: 'text-blue-600 bg-blue-50', href: '/rfqs' },
    { name: 'Pending Approvals', value: '0', change: 'Loading...', icon: CheckSquare, color: 'text-amber-600 bg-amber-50', href: '/approvals' },
    { name: 'Issued POs', value: '0', change: 'Loading...', icon: FileCheck, color: 'text-teal-600 bg-teal-50', href: '/purchase-orders' },
    { name: 'Overdue Invoices', value: '0', change: 'Loading...', icon: AlertCircle, color: 'text-danger bg-rose-50', href: '/invoices' },
  ];

  const recentActivities = statsResponse?.recentActivities || [];

  // Map icon and color to stats from getDashboardStats response
  const iconMap: Record<string, any> = {
    'Active RFQs': FileText,
    'Assigned RFQs': FileText,
    'Pending Approvals': CheckSquare,
    'Queue checklist items': CheckSquare,
    'Issued POs': FileCheck,
    'Active POs': FileCheck,
    'Overdue Invoices': AlertCircle,
    'Pending Invoices': AlertCircle,
  };

  const colorMap: Record<string, string> = {
    'Active RFQs': 'text-blue-600 bg-blue-50',
    'Assigned RFQs': 'text-blue-600 bg-blue-50',
    'Pending Approvals': 'text-amber-600 bg-amber-50',
    'Queue checklist items': 'text-amber-600 bg-amber-50',
    'Issued POs': 'text-teal-600 bg-teal-50',
    'Active POs': 'text-teal-600 bg-teal-50',
    'Overdue Invoices': 'text-danger bg-rose-50',
    'Pending Invoices': 'text-danger bg-rose-50',
  };

  const allowedStatsByRole: Record<string, string[]> = {
    'ADMIN': ['Active RFQs', 'Pending Approvals', 'Issued POs', 'Overdue Invoices'],
    'OFFICER': ['Active RFQs', 'Issued POs'],
    'APPROVER': ['Pending Approvals', 'Issued POs'],
    'FINANCE': ['Issued POs', 'Overdue Invoices', 'Pending Invoices'],
    'VENDOR': ['Assigned RFQs', 'Active POs', 'Pending Invoices', 'Overdue Invoices']
  };

  const roleStats = allowedStatsByRole[userRole] || ['Issued POs'];
  const stats = statsData
    .filter(stat => roleStats.includes(stat.name))
    .map(stat => ({
      ...stat,
      icon: iconMap[stat.name] || FileText,
      color: colorMap[stat.name] || 'text-blue-600 bg-blue-50',
    }));

  const allQuickActions = [
    { label: 'Create New RFQ', href: '/rfqs', description: 'Publish a new request for quotation', allowedRoles: ['ADMIN', 'OFFICER'] },
    { label: 'Onboard New Vendor', href: '/vendors', description: 'Register and verify a supplier', allowedRoles: ['ADMIN', 'OFFICER'] },
    { label: 'View Approvals Queue', href: '/approvals', description: 'Review pending approval items', allowedRoles: ['ADMIN', 'APPROVER'] },
    { label: 'View Payment Ledger', href: '/payment-ledger', description: 'Check outstanding payments', allowedRoles: ['ADMIN', 'FINANCE'] },
  ];

  const quickActions = allQuickActions.filter((action) => action.allowedRoles.includes(userRole));

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {firstName}</h1>
        <p className="text-sm text-slate-500 mt-1">Here is a summary of your procurement dashboard today.</p>
      </div>

      {/* KPI Stats Grid */}
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
            {(userRole === 'ADMIN' || userRole === 'OFFICER') && (
              <Link
                href="/activity-logs"
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                View Audit Trail
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          
          <div className="flow-root">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No recent activity logged in this organization.
              </div>
            ) : (
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
                            {activity.user ? activity.user[0] : 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-xs text-slate-600 font-medium">
                              {activity.action} <span className="text-[10px] text-slate-400 font-normal">by {activity.user || 'System'}</span>
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
            )}
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
                Self-registration portal is active. Verify KYC approvals directly from the directory.
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
