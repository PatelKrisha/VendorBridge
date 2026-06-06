'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in cookies/localStorage or redirect
      // Set access_token cookie for middleware access
      document.cookie = `access_token=${data.data.accessToken}; path=/; max-age=900; SameSite=Strict`;
      
      // Redirect based on role
      if (data.data.user.role === 'VENDOR') {
        window.location.href = '/vendor-portal';
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-6 py-12 relative overflow-hidden">
      {/* Background visual gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full space-y-8 glassmorphism-dark p-8 md:p-10 rounded-2xl border border-slate-800/40 relative z-10">
        {/* Branding header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <Building2 className="w-8 h-8 text-teal-400" />
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
            VendorBridge ERP
          </h2>
          <p className="mt-2 text-xs text-slate-400 leading-normal">
            Procurement & Vendor Management Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="mt-1.5 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-750 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:bg-slate-800 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] font-semibold text-teal-400 hover:underline cursor-pointer">
                  Forgot Password?
                </span>
              </div>
              <div className="mt-1.5 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-750 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:bg-slate-800 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/10 cursor-pointer disabled:opacity-50 transition-all group"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/60 text-center space-y-3">
          <p className="text-[11px] text-slate-400">
            New vendor?{' '}
            <Link
              href="/register"
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              Create a Vendor Account
            </Link>
          </p>
          <p className="text-[10px] text-slate-500 leading-normal">
            By signing in, you agree to our terms. Secure 256-bit encryption verified.
          </p>
        </div>
      </div>
    </div>
  );
}
