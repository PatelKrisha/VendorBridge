'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowUpRight, MoreVertical, X, Check, Ban, Trash2, Eye } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  gst: string;
  pan: string;
  category: string;
  status: string;
  score: number;
  email: string;
  phone: string;
  address: string;
}

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  // Vendor list state
  const [vendorsList, setVendorsList] = useState<Vendor[]>([
    { 
      id: 'VND-2026-001', 
      name: 'Supernova Logistics & Trading', 
      gst: '27AAASL5678B1Z2', 
      pan: 'AAASL5678B', 
      category: 'Logistics', 
      status: 'ACTIVE', 
      score: 94.5,
      email: 'logistics@supernova.com',
      phone: '+91 98765 43210',
      address: 'Building 4B, Sector 3, Vashi, Navi Mumbai, MH, 400703'
    },
    { 
      id: 'VND-2026-002', 
      name: 'Apex Industrial Supplies', 
      gst: '27AAAAP9999C1Z3', 
      pan: 'AAAAP9999C', 
      category: 'Hardware', 
      status: 'ACTIVE', 
      score: 98.2,
      email: 'sales@apexsupplies.com',
      phone: '+91 99887 76655',
      address: 'Phase 2, Industrial Area, Hinjewadi, Pune, MH, 411057'
    },
    { 
      id: 'VND-2026-003', 
      name: 'Zenith Tech Systems', 
      gst: '27AAAZT8888D1Z4', 
      pan: 'AAAZT8888D', 
      category: 'IT Hardware', 
      status: 'ACTIVE', 
      score: 91.8,
      email: 'support@zenithtech.in',
      phone: '+91 98223 34455',
      address: 'Tower C, DLF Cyber City, Phase 3, Gurugram, HR, 122002'
    },
    { 
      id: 'VND-2026-004', 
      name: 'Vanguard Electronics', 
      gst: '27AAVE1111E1Z5', 
      pan: 'AAAVE1111E', 
      category: 'Electronics', 
      status: 'PENDING', 
      score: 100.0,
      email: 'contact@vanguard.com',
      phone: '+91 91122 33445',
      address: 'Plot No. 12, Electronics City Phase 1, Bangalore, KA, 560100'
    },
    { 
      id: 'VND-2026-005', 
      name: 'Titanium Steel Corp', 
      gst: '27AAATC2222F1Z6', 
      pan: 'AAATC2222F', 
      category: 'Raw Materials', 
      status: 'SUSPENDED', 
      score: 85.0,
      email: 'procure@titaniumsteel.com',
      phone: '+91 95555 66666',
      address: 'Steel Yard Compound, Kalamboli, Navi Mumbai, MH, 410218'
    },
  ]);

  // Form states for onboarding
  const [formName, setFormName] = useState('');
  const [formGst, setFormGst] = useState('27AAAB' + Math.floor(1000 + Math.random() * 9000) + 'C1Z' + Math.floor(1 + Math.random() * 9));
  const [formPan, setFormPan] = useState('AAAB' + Math.floor(1000 + Math.random() * 9000) + 'C');
  const [formCategory, setFormCategory] = useState('Logistics');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('+91 98333 44555');
  const [formAddress, setFormAddress] = useState('Industrial Estate, Mumbai, MH, 400011');
  
  // Close actions dropdown on click outside
  useEffect(() => {
    function handleClickOutside() {
      setActiveMenuId(null);
    }
    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // Add Vendor Onboard Submission
  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVendor: Vendor = {
      id: `VND-2026-00${vendorsList.length + 1}`,
      name: formName,
      gst: formGst,
      pan: formPan,
      category: formCategory,
      status: 'PENDING',
      score: 100.0,
      email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '')}@company.com`,
      phone: formPhone,
      address: formAddress
    };

    setVendorsList([...vendorsList, newVendor]);
    setShowOnboardModal(false);
    
    // Reset form fields
    setFormName('');
    setFormEmail('');
  };

  // Status transitions & deletes
  const handleStatusChange = (id: string, newStatus: string) => {
    setVendorsList(vendorsList.map(v => v.id === id ? { ...v, status: newStatus } : v));
    setActiveMenuId(null);
    if (selectedVendor && selectedVendor.id === id) {
      setSelectedVendor({ ...selectedVendor, status: newStatus });
    }
  };

  const handleDeleteVendor = (id: string) => {
    setVendorsList(vendorsList.filter(v => v.id !== id));
    setActiveMenuId(null);
    if (selectedVendor && selectedVendor.id === id) {
      setSelectedVendor(null);
    }
  };

  const filteredVendors = vendorsList.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.gst.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendors Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, evaluate, and onboard corporate vendors.</p>
        </div>
        <button
          onClick={() => setShowOnboardModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs shadow-md shadow-accent/10 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Onboard Vendor
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by company name or GST..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent focus:bg-white transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Company Details</th>
                <th className="px-6 py-4">Tax IDs</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Perf. Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{vendor.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {vendor.id}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <p>GST: {vendor.gst}</p>
                    <p className="text-slate-400">PAN: {vendor.pan}</p>
                  </td>
                  <td className="px-6 py-4">{vendor.category}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{vendor.score}%</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        vendor.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : vendor.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedVendor(vendor)}
                        className="p-1.5 text-slate-400 hover:text-accent rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                        title="View Vendor Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === vendor.id ? null : vendor.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-750 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                        title="Actions Menu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Simple Actions Dropdown Menu */}
                    {activeMenuId === vendor.id && (
                      <div className="absolute right-6 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-left text-xs text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
                        {vendor.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(vendor.id, 'ACTIVE')}
                            className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-750 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </button>
                        )}
                        {vendor.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleStatusChange(vendor.id, 'SUSPENDED')}
                            className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-amber-650 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-600 border-t border-slate-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Vendor Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Onboard New Corporate Vendor</h2>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Titan Steel Ltd"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">GSTIN</label>
                  <input
                    type="text"
                    required
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">PAN</label>
                  <input
                    type="text"
                    required
                    value={formPan}
                    onChange={(e) => setFormPan(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:border-accent"
                >
                  <option value="Logistics">Logistics & Trading</option>
                  <option value="Hardware">Hardware Supplies</option>
                  <option value="IT Hardware">IT Infrastructure</option>
                  <option value="Electronics">Electrical & Electronics</option>
                  <option value="Raw Materials">Raw Materials & Steel</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-xs shadow-md shadow-accent/10 cursor-pointer transition-all"
                >
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Profile Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Vendor Profile Details</h2>
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-650">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Company Name</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedVendor.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">GSTIN</p>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedVendor.gst}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">PAN</p>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedVendor.pan}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Category</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedVendor.category}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Compliance Score</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedVendor.score}%</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Contact Details</p>
                <p>Email: <span className="font-medium text-slate-800">{selectedVendor.email}</span></p>
                <p>Phone: <span className="font-medium text-slate-800">{selectedVendor.phone}</span></p>
                <p>Address: <span className="font-medium text-slate-800">{selectedVendor.address}</span></p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                      selectedVendor.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : selectedVendor.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {selectedVendor.status}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {selectedVendor.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleStatusChange(selectedVendor.id, 'ACTIVE')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded cursor-pointer transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  {selectedVendor.status !== 'SUSPENDED' && (
                    <button
                      onClick={() => handleStatusChange(selectedVendor.id, 'SUSPENDED')}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded cursor-pointer transition-colors"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
