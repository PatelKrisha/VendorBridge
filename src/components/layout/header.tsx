'use client';

import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  userName: string;
  userEmail: string;
  role: string;
}

export default function Header({ userName, userEmail, role }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ name: string; type: string; href: string }[] | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!searchQuery.trim()) {
        setSearchResults(null);
        return;
      }
      const q = searchQuery.toLowerCase();
      const mockItems = [
        { name: 'Supernova Logistics & Trading', type: 'Vendor', href: '/vendors' },
        { name: 'Apex Industrial Supplies', type: 'Vendor', href: '/vendors' },
        { name: 'Zenith Tech Systems', type: 'Vendor', href: '/vendors' },
        { name: 'INV-2026-000010', type: 'Invoice', href: '/invoices' },
        { name: 'INV-2026-000011', type: 'Invoice', href: '/invoices' },
        { name: 'INV-2026-000012', type: 'Invoice', href: '/invoices' },
        { name: 'PO-2026-000101', type: 'Purchase Order', href: '/purchase-orders' },
        { name: 'PO-2026-000102', type: 'Purchase Order', href: '/purchase-orders' },
        { name: 'PO-2026-000103', type: 'Purchase Order', href: '/purchase-orders' },
        { name: 'RFQ-2026-000001', type: 'RFQ', href: '/rfqs' },
      ];
      const matches = mockItems.filter(
        (item) => item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
      );
      setSearchResults(matches);
    }
  };

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

  const notifications = [
    { id: 1, title: 'New RFQ Assigned', message: 'You have been assigned to RFQ-2026-000001', time: '10 min ago', unread: true },
    { id: 2, title: 'Approval Required', message: 'PO-2026-000104 requires your approval', time: '2 hours ago', unread: true },
    { id: 3, title: 'Invoice Paid', message: 'INV-2026-000012 has been marked as PAID', time: '1 day ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200/80 shadow-sm shadow-slate-100/50">
      {/* Search Input Bar */}
      <div className="relative w-80 hidden md:block" ref={searchRef}>
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search ERP (RFQs, vendors, orders...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent focus:bg-white transition-colors"
        />

        {/* Search Results Dropdown */}
        {searchResults && (
          <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30 divide-y divide-slate-50">
            <div className="px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-450 uppercase">
              Search Results ({searchResults.length})
            </div>
            <div className="max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchResults(null);
                      window.location.href = item.href;
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-medium">
                      {item.type}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-400 text-center">
                  No matching results found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="md:hidden font-semibold text-primary">VendorBridge</div>

      {/* Action controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-slate-500 hover:text-primary rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-danger rounded-full ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <span className="font-semibold text-sm text-slate-700">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-accent font-medium hover:underline cursor-pointer">
                    Mark all read
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      n.unread ? 'bg-blue-50/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className={`text-xs font-semibold text-slate-700 ${n.unread ? 'text-blue-600' : ''}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-slate-200"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-700 leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none capitalize">{role.toLowerCase()}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{userEmail}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    window.location.href = '/settings';
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-rose-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
