'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X, Check, Ban, Trash2, Eye } from 'lucide-react';
import { createVendor, updateVendorStatus, deleteVendor } from '@/app/actions/vendors';
import { useRouter } from 'next/navigation';

interface DbVendor {
  id: string;
  orgId: string;
  companyName: string;
  gstNumber: string;
  pan: string;
  category: string[];
  bankDetails: any;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED';
  contactPerson: string | null;
  contactEmail: string | null;
  performanceScore: string | null;
  createdAt: Date;
}

interface VendorsClientProps {
  initialVendors: DbVendor[];
}

export default function VendorsClient({ initialVendors }: VendorsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState<DbVendor | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  // Form states for onboarding
  const [formName, setFormName] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formCategory, setFormCategory] = useState('Logistics');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('+91 98333 44555');
  const [formAddress, setFormAddress] = useState('Industrial Estate, Mumbai, MH, 400011');
  const [formContactPerson, setFormContactPerson] = useState('');

  // Auto-generate some GST/PAN default values when modal opens to assist testing
  useEffect(() => {
    if (showOnboardModal) {
      setFormGst('27AAAB' + Math.floor(1000 + Math.random() * 9000) + 'C1Z' + Math.floor(1 + Math.random() * 9));
      setFormPan('AAAB' + Math.floor(1000 + Math.random() * 9000) + 'C');
    }
  }, [showOnboardModal]);

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
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await createVendor({
      companyName: formName,
      gstNumber: formGst,
      pan: formPan,
      category: [formCategory],
      contactPerson: formContactPerson || 'Point of Contact',
      contactEmail: formEmail || `${formName.toLowerCase().replace(/\s+/g, '')}@company.com`,
      phone: formPhone,
      address: formAddress,
    });

    if (res.success) {
      setShowOnboardModal(false);
      setFormName('');
      setFormEmail('');
      setFormContactPerson('');
      router.refresh();
    } else {
      alert(res.error || 'Failed to onboard vendor');
    }
  };

  // Status transitions
  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updateVendorStatus(id, newStatus as any);
    if (res.success) {
      setActiveMenuId(null);
      if (selectedVendor && selectedVendor.id === id) {
        setSelectedVendor({ ...selectedVendor, status: newStatus as any });
      }
      router.refresh();
    } else {
      alert(res.error || 'Failed to update vendor status');
    }
  };

  // Delete vendor
  const handleDeleteVendor = async (id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      const res = await deleteVendor(id);
      if (res.success) {
        setActiveMenuId(null);
        if (selectedVendor && selectedVendor.id === id) {
          setSelectedVendor(null);
        }
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete vendor');
      }
    }
  };

  const filteredVendors = initialVendors.filter((v) => {
    const matchesSearch =
      v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.gstNumber.includes(searchTerm);
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
            <option value="BLACKLISTED">Blacklisted</option>
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
                    <p className="font-semibold text-slate-800">{vendor.companyName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {vendor.id.substring(0, 8)}...</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <p>GST: {vendor.gstNumber}</p>
                    <p className="text-slate-400">PAN: {vendor.pan}</p>
                  </td>
                  <td className="px-6 py-4">{vendor.category ? vendor.category.join(', ') : ''}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{vendor.performanceScore || '100'}%</td>
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

                    {/* Actions Dropdown Menu */}
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

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Sharma"
                  value={formContactPerson}
                  onChange={(e) => setFormContactPerson(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. contact@titansteel.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
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

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Phone</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Address</label>
                <textarea
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-750 focus:outline-none focus:border-accent resize-none"
                />
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
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedVendor.companyName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">GSTIN</p>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedVendor.gstNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">PAN</p>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedVendor.pan}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Category</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedVendor.category ? selectedVendor.category.join(', ') : ''}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Compliance Score</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedVendor.performanceScore || '100'}%</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Contact Details</p>
                <p>Contact Person: <span className="font-medium text-slate-800">{selectedVendor.contactPerson}</span></p>
                <p>Email: <span className="font-medium text-slate-800">{selectedVendor.contactEmail}</span></p>
                <p>Phone: <span className="font-medium text-slate-800">{selectedVendor.bankDetails?.phone || '+91 98765 43210'}</span></p>
                <p>Address: <span className="font-medium text-slate-800">{selectedVendor.bankDetails?.address || 'Registered Address'}</span></p>
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
