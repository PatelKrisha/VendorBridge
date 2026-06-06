'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

const CATEGORIES = [
  'Logistics & Trading',
  'Hardware Supplies',
  'IT Infrastructure',
  'Electrical & Electronics',
  'Raw Materials & Steel',
  'Industrial Equipment',
  'Software & Services',
  'Office Supplies',
  'Pharmaceuticals',
  'Construction & Civil',
];

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, icon, children, hint }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
      {hint && <p className="mt-1 text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

export default function VendorRegisterPage() {
  const router = useRouter();

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [pan, setPan] = useState('');
  const [category, setCategory] = useState('Logistics & Trading');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength indicator
  const pwChecks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const pwStrength = Object.values(pwChecks).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          gstNumber: gstNumber.toUpperCase(),
          pan: pan.toUpperCase(),
          category,
          contactPerson,
          email,
          password,
          phone,
          address,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Store access token and redirect to vendor portal
      document.cookie = `access_token=${data.data.accessToken}; path=/; max-age=900; SameSite=Strict`;
      setSuccess(true);

      // Brief pause so the user sees the success state, then redirect
      setTimeout(() => {
        router.push('/vendor-portal');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="max-w-md w-full text-center space-y-5 relative z-10">
          <div className="flex justify-center">
            <div className="p-4 bg-teal-500/10 rounded-full border border-teal-500/30">
              <CheckCircle2 className="w-10 h-10 text-teal-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Account Created!</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your vendor account is registered and <span className="text-amber-400 font-semibold">pending approval</span>. You will be redirected to your portal shortly.
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-1 bg-teal-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Back to login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors mb-6 group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Login
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-700/50 bg-slate-900/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 flex-shrink-0">
                <Building2 className="w-7 h-7 text-teal-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Vendor Registration
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Join <span className="text-teal-400 font-semibold">VendorBridge ERP</span> — Create your vendor portal account
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div className="mt-5 flex items-center gap-2 px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-[11px] text-amber-300 leading-snug">
                Your account will be <strong>pending review</strong> after registration. The procurement team will activate it shortly.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Section: Company Info */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                Company Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Company Name *" icon={<Building2 className="w-4 h-4" />}>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Titan Steel Industries Pvt. Ltd."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors"
                    />
                  </Field>
                </div>

                <Field label="GSTIN *" icon={<FileText className="w-4 h-4" />} hint="15-character GST Identification Number">
                  <input
                    id="gstNumber"
                    type="text"
                    required
                    maxLength={15}
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="27AAABC1234D1Z5"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors font-mono tracking-wide"
                  />
                </Field>

                <Field label="PAN *" icon={<FileText className="w-4 h-4" />} hint="10-character Permanent Account Number">
                  <input
                    id="pan"
                    type="text"
                    required
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="AAABC1234D"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors font-mono tracking-wide"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Business Category *" icon={<Tag className="w-4 h-4" />}>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors appearance-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-800">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/50" />

            {/* Section: Contact Info */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                Contact Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Person *" icon={<User className="w-4 h-4" />}>
                  <input
                    id="contactPerson"
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors"
                  />
                </Field>

                <Field label="Business Email *" icon={<Mail className="w-4 h-4" />}>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@yourcompany.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors"
                  />
                </Field>

                <Field label="Phone Number" icon={<Phone className="w-4 h-4" />}>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors"
                  />
                </Field>

                <Field label="Registered Address" icon={<MapPin className="w-4 h-4" />}>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State, PIN"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors"
                  />
                </Field>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/50" />

            {/* Section: Password */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                Set Portal Password
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Password *" icon={<Lock className="w-4 h-4" />}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 12 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>

                <Field label="Confirm Password *" icon={<Lock className="w-4 h-4" />}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/70 focus:bg-slate-700 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
              </div>

              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="mt-3 space-y-2">
                  {/* Strength bar */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= pwStrength
                            ? pwStrength === 1
                              ? 'bg-rose-500'
                              : pwStrength === 2
                              ? 'bg-amber-500'
                              : pwStrength === 3
                              ? 'bg-yellow-400'
                              : 'bg-teal-400'
                            : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Requirement chips */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'length', label: '12+ chars' },
                      { key: 'uppercase', label: 'Uppercase' },
                      { key: 'digit', label: 'Number' },
                      { key: 'symbol', label: 'Symbol' },
                    ].map(({ key, label }) => (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                          pwChecks[key as keyof typeof pwChecks]
                            ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                            : 'bg-slate-700/60 text-slate-500 border border-slate-600/40'
                        }`}
                      >
                        {pwChecks[key as keyof typeof pwChecks] ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full border border-current opacity-50" />
                        )}
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              id="registerSubmit"
              type="submit"
              disabled={loading || pwStrength < 4}
              className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-950 disabled:text-slate-400 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/10 transition-all group"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Vendor Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
