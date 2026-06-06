'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, Settings, CheckCheck, Check, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  userName: string;
  userEmail: string;
  role: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  href: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'vendorbridge_notifications_read';

function loadReadNotifications(): Record<number, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveReadNotification(id: number) {
  if (typeof window === 'undefined') return;
  try {
    const read = loadReadNotifications();
    read[id] = true;
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(read));
  } catch (e) {
    console.error(e);
  }
}

function saveAllReadNotifications(ids: number[]) {
  if (typeof window === 'undefined') return;
  try {
    const read = loadReadNotifications();
    ids.forEach(id => {
      read[id] = true;
    });
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(read));
  } catch (e) {
    console.error(e);
  }
}

export default function Header({ userName, userEmail, role }: HeaderProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ name: string; type: string; href: string }[] | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'New RFQ Assigned', message: 'You have been assigned to RFQ-2026-000001', time: '10 min ago', unread: true, href: '/rfqs' },
    { id: 2, title: 'Approval Required', message: 'PO-2026-000104 requires your approval', time: '2 hours ago', unread: true, href: '/approvals' },
    { id: 3, title: 'Invoice Paid', message: 'INV-2026-000012 has been marked as PAID', time: '1 day ago', unread: false, href: '/invoices' },
    { id: 4, title: 'Vendor KYC Pending', message: 'Vanguard Electronics awaiting verification', time: '2 days ago', unread: true, href: '/vendors' },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Load persisted notification read status on mount
  useEffect(() => {
    const readMap = loadReadNotifications();
    setNotifications((prev) =>
      prev.map((n) => (readMap[n.id] ? { ...n, unread: false } : n))
    );
  }, []);

  // Close dropdowns when clicking outside
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

  // Instant search as the user types
  useEffect(() => {
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
      { name: 'RFQ-2026-000002', type: 'RFQ', href: '/rfqs' },
    ];
    const matches = mockItems.filter(
      (item) => item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
    );
    setSearchResults(matches);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults && searchResults.length > 0) {
        const firstResult = searchResults[0];
        setSearchResults(null);
        setSearchQuery('');
        router.push(firstResult.href);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (_) {
      // Ignore logout API errors
    }
    router.push('/login');
  };

  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    saveAllReadNotifications(ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markOneRead = (id: number) => {
    saveReadNotification(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const dismissNotification = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200/80 shadow-sm shadow-slate-100/50">
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
          <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-50">
            <div className="px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Search Results ({searchResults.length})
            </div>
            <div className="max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.href);
                      setTimeout(() => {
                        setSearchResults(null);
                        setSearchQuery('');
                      }, 50);
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
                <div className="px-4 py-5 text-xs text-slate-400 text-center">
                  No matching results found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="md:hidden font-semibold text-primary">VendorBridge</div>

      {/* Action controls */}
      <div className="flex items-center gap-3">

        {/* Notifications Popover */}
        <div className="relative" ref={notifyRef}>
          <button
            id="notifications-bell"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-slate-500 hover:text-primary rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-accent font-semibold hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center text-xs text-slate-400">
                    🎉 You're all caught up!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markOneRead(n.id);
                        router.push(n.href);
                        setTimeout(() => {
                          setShowNotifications(false);
                        }, 50);
                      }}
                      className={`relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 ${
                        n.unread ? 'bg-blue-50/30' : 'bg-white'
                      }`}
                    >
                      {/* Unread dot */}
                      {n.unread && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 pl-2">
                        <p className={`text-xs font-semibold truncate ${n.unread ? 'text-slate-800' : 'text-slate-500'}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {n.unread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markOneRead(n.id);
                            }}
                            className="p-1 text-slate-300 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => dismissNotification(e, n.id)}
                          className="p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          aria-label="Dismiss notification"
                          title="Dismiss notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Panel Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
                <Link
                  href={role === 'VENDOR' ? '/vendor-portal' : '/activity-logs'}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(role === 'VENDOR' ? '/vendor-portal' : '/activity-logs');
                    setTimeout(() => {
                      setShowNotifications(false);
                    }, 50);
                  }}
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  View full activity log →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-menu-button"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-accent/80 to-primary text-white text-xs font-bold border border-accent/20">
              {userName ? userName[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-700 leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none capitalize">{role.toLowerCase()}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{userEmail}</p>
                <span className="inline-block mt-1.5 text-[9px] font-bold text-white bg-accent px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {role}
                </span>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link
                  href={role === 'VENDOR' ? '/vendor-portal' : '/settings'}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(role === 'VENDOR' ? '/vendor-portal' : '/settings');
                    setTimeout(() => {
                      setShowProfileMenu(false);
                    }, 50);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Account Settings
                </Link>
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
