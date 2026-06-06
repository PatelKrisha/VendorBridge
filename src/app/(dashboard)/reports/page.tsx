'use client';

import { BarChart3, TrendingDown, DollarSign, Clock, Download } from 'lucide-react';

export default function ReportsPage() {
  const cards = [
    { title: 'Total Spend (YTD)', value: '₹42,80,500', change: '+14% vs last year', icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
    { title: 'Weighted Savings', value: '₹5,12,000', change: 'Avg 8.4% per RFQ', icon: TrendingDown, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Avg Approval Speed', value: '18.4 hours', change: 'SLA threshold is 48h', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Analyze procurement trends, spend insights, and vendor KPIs.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto">
          <Download className="w-4 h-4" />
          Export All Data
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-400">{card.title}</h3>
                <p className="text-xl font-bold text-slate-800 mt-1.5">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{card.change}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics chart panels mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 h-80 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Spend by Vendor Category</h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribution of YTD corporate expenditures.</p>
          </div>
          <div className="flex-1 flex items-end justify-between gap-4 px-4 mt-6">
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-blue-500/80 hover:bg-blue-500 rounded-t-lg h-36 transition-all"></div>
              <span className="text-[10px] text-slate-400 font-semibold truncate w-full text-center">Logistics</span>
            </div>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-blue-500/80 hover:bg-blue-500 rounded-t-lg h-24 transition-all"></div>
              <span className="text-[10px] text-slate-400 font-semibold truncate w-full text-center">IT Hardware</span>
            </div>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-blue-500/80 hover:bg-blue-500 rounded-t-lg h-12 transition-all"></div>
              <span className="text-[10px] text-slate-400 font-semibold truncate w-full text-center">Hardware</span>
            </div>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-blue-500/80 hover:bg-blue-500 rounded-t-lg h-44 transition-all"></div>
              <span className="text-[10px] text-slate-400 font-semibold truncate w-full text-center">Raw Materials</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 h-80 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Monthly RFQ Activity</h2>
            <p className="text-xs text-slate-400 mt-0.5">Volume of RFQs issued and quotes completed.</p>
          </div>
          <div className="flex-1 flex items-end justify-between gap-4 px-4 mt-6">
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-teal-500/85 hover:bg-teal-500 rounded-t-lg h-20 transition-all"></div>
              <span className="text-[10px] text-slate-400 font-semibold text-center">March</span>
            </div>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-teal-500/85 hover:bg-teal-500 rounded-t-lg h-32 transition-all"></div>
              <span className="text-[10px] text-slate-400 font-semibold text-center">April</span>
            </div>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-teal-500/85 hover:bg-teal-500 rounded-t-lg h-40 transition-all"></div>
              <span className="text-[10px] text-slate-400 font-semibold text-center">May</span>
            </div>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-teal-500/85 hover:bg-teal-500 rounded-t-lg h-48 transition-all"></div>
              <span className="text-[10px] text-slate-400 font-semibold text-center">June</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
