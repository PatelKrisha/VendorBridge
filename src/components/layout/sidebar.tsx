'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  FileCheck,
  CreditCard,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'OFFICER' | 'APPROVER' | 'FINANCE' | 'VENDOR';
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Define menu items and associate them with allowed roles
  const menuItems = [
    {
      name: 'Dashboard',
      href: role === 'VENDOR' ? '/vendor-portal' : '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OFFICER', 'APPROVER', 'FINANCE', 'VENDOR'],
    },
    {
      name: 'Vendors',
      href: '/vendors',
      icon: Users,
      roles: ['ADMIN', 'OFFICER'],
    },
    {
      name: 'RFQs',
      href: '/rfqs',
      icon: FileText,
      roles: ['ADMIN', 'OFFICER', 'APPROVER'],
    },
    {
      name: 'Approvals',
      href: '/approvals',
      icon: CheckSquare,
      roles: ['ADMIN', 'APPROVER'],
    },
    {
      name: 'Purchase Orders',
      href: '/purchase-orders',
      icon: FileCheck,
      roles: ['ADMIN', 'OFFICER', 'APPROVER', 'VENDOR'],
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: CreditCard,
      roles: ['ADMIN', 'OFFICER', 'APPROVER', 'FINANCE', 'VENDOR'],
    },
    {
      name: 'Payment Ledger',
      href: '/payment-ledger',
      icon: CreditCard,
      roles: ['ADMIN', 'FINANCE'],
    },
    {
      name: 'Activity Logs',
      href: '/activity-logs',
      icon: History,
      roles: ['ADMIN'],
    },
    {
      name: 'Reports & Analytics',
      href: '/reports',
      icon: BarChart3,
      roles: ['ADMIN', 'OFFICER', 'APPROVER', 'FINANCE'],
    },
    {
      name: 'System Settings',
      href: '/settings',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/v1/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-20 h-screen bg-primary text-white flex flex-col justify-between transition-all duration-300 border-r border-slate-700/50 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Toggle Button */}
      <div>
        <div className="flex items-center justify-between px-4 py-6 border-b border-slate-700/50 h-16">
          {!collapsed ? (
            <div className="flex items-center gap-2 font-bold text-lg tracking-wider text-teal-400">
              <Building2 className="w-6 h-6 text-teal-400" />
              <span>VendorBridge</span>
            </div>
          ) : (
            <div className="mx-auto">
              <Building2 className="w-8 h-8 text-teal-400" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="mt-6 px-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile & Logout Action */}
      <div className="p-4 border-t border-slate-700/50">
        {!collapsed && (
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold truncate text-slate-200">{userName}</p>
            <p className="text-xs text-teal-400 font-medium capitalize mt-0.5">{role.toLowerCase()}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
