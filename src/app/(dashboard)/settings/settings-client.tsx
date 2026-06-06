'use client';

import { useState } from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight, Building, Save, CheckCircle, User, Key, ShieldAlert } from 'lucide-react';
import { changePassword } from '@/app/actions/settings';

interface DbUser {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OFFICER' | 'APPROVER' | 'FINANCE' | 'VENDOR';
  orgId: string;
}

interface SettingsClientProps {
  currentUser: DbUser;
}

export default function SettingsClient({ currentUser }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'system'>('profile');

  // System Configurations state
  const [minVendors, setMinVendors] = useState(3);
  const [selfReg, setSelfReg] = useState(true);
  const [mfaAdmin, setMfaAdmin] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Change Password state
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleSaveSystemConfig = () => {
    setIsSaving(true);
    setShowSuccess(false);

    // Simulate saving delay
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);

      // Hide success notification after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      setPwError('All fields are required.');
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      setPwError('New password and confirm password do not match.');
      return;
    }

    if (passwordForm.new.length < 8) {
      setPwError('Password must be at least 8 characters long.');
      return;
    }

    setIsSavingPw(true);
    const res = await changePassword({
      current: passwordForm.current,
      new: passwordForm.new,
    });
    setIsSavingPw(false);

    if (res.success) {
      setPwSuccess(true);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setPwSuccess(false);
      }, 3000);
    } else {
      setPwError(res.error || 'Failed to change password');
    }
  };

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile, security, and global configuration preferences.</p>
      </div>

      {/* Tab Navigation (only visible to ADMIN) */}
      {isAdmin && (
        <div className="border-b border-slate-200">
          <div className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`pb-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'system'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              System Configurations
            </button>
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* User Info Details */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Profile Information</h3>
                <p className="text-xs text-slate-400 mt-0.5">Your primary login and system credentials.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500">Full Name</label>
                <input
                  type="text"
                  value={currentUser.name}
                  disabled
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500">Access Level / Role</label>
                <div className="mt-1.5 flex items-center">
                  <span className="inline-block px-3 py-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 rounded-full uppercase tracking-wider">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500">Organization ID</label>
                <input
                  type="text"
                  value={currentUser.orgId}
                  disabled
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Change Password Panel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Change Password</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ensure your account is protected with a strong, secure password.</p>
              </div>
            </div>

            {pwSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in duration-300">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Your password has been changed successfully.</span>
              </div>
            )}

            {pwError && (
              <div className="p-4 bg-rose-50 border border-rose-250 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-semibold animate-in fade-in duration-300">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-750 focus:outline-none focus:border-accent focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">New Password</label>
                  <input
                    type="password"
                    placeholder="Min 8 chars"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-755 focus:outline-none focus:border-accent focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-760 focus:outline-none focus:border-accent focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingPw}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs shadow-md shadow-accent/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>{isSavingPw ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM CONFIGURATIONS TAB */}
      {activeTab === 'system' && isAdmin && (
        <div className="space-y-6">
          {showSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in duration-300">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>System configurations have been saved successfully and applied globally.</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 divide-y divide-slate-100">
            {/* RFQ settings */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Procurement Settings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Enforce standard sourcing guidelines on RFQ creations.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Minimum Vendors per RFQ</label>
                  <input
                    type="number"
                    value={minVendors}
                    onChange={(e) => setMinVendors(parseInt(e.target.value) || 1)}
                    className="mt-1.5 w-full max-w-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Onboarding settings */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-700">Vendor Self-Registration Portal</h3>
                  <p className="text-xs text-slate-400">Allows suppliers to register public profiles and upload PAN/GST docs.</p>
                </div>
                <button
                  onClick={() => setSelfReg(!selfReg)}
                  className="text-slate-400 hover:text-accent transition-colors cursor-pointer"
                >
                  {selfReg ? (
                    <ToggleRight className="w-10 h-10 text-teal-600" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-350" />
                  )}
                </button>
              </div>
            </div>

            {/* Security Settings */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Compliance & Security Policies</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage data security and two-factor configurations.</p>
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">Enforce MFA for Bank updates</p>
                    <p className="text-[10px] text-slate-400">Requires OTP authentication whenever vendor banking is changed.</p>
                  </div>
                  <button
                    onClick={() => setMfaAdmin(!mfaAdmin)}
                    className="text-slate-400 hover:text-accent transition-colors cursor-pointer"
                  >
                    {mfaAdmin ? (
                      <ToggleRight className="w-10 h-10 text-teal-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-350" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleSaveSystemConfig}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-semibold text-xs shadow-md shadow-teal-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configurations'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
