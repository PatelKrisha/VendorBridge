'use client';

import { useState } from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight, Building, HelpCircle, Save } from 'lucide-react';

export default function SettingsPage() {
  const [minVendors, setMinVendors] = useState(3);
  const [selfReg, setSelfReg] = useState(true);
  const [mfaAdmin, setMfaAdmin] = useState(true);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Configurations</h1>
        <p className="text-sm text-slate-500 mt-1">Configure global ERP settings, compliance constraints, and policies.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 divide-y divide-slate-100">
        
        {/* RFQ settings */}
        <div className="p-6 space-y-4">
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
                onChange={(e) => setMinVendors(parseInt(e.target.value))}
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
        <button className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-semibold text-xs shadow-md shadow-teal-500/10 transition-colors cursor-pointer">
          <Save className="w-4 h-4" />
          Save Configurations
        </button>
      </div>
    </div>
  );
}
