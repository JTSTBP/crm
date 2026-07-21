// EmailSendingCompanyDetails.tsx – Exact visual copy of the Company Details view (Leads page)
// This component mirrors the JSX, Tailwind classes, and layout used in Leads.tsx.
// Data fetching URLs have been switched to the Email Sending API endpoints.

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Upload,
  LayoutPanelTop,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Globe,
  AlertCircle,
  Briefcase,
  CheckSquare,
  Square,
  X,
  Trash2,
  Edit2,
  User,
  Mail
} from 'lucide-react';
import { API_BASE_URL } from '../../config.ts';
import SendEmailModal from '../../components/modals/SendEmailModal';
import BulkUploadLeadModal from '../../components/modals/BulkUploadLeadModal';
import toast from 'react-hot-toast';
import LeadModal from '../../components/modals/LeadModal';

// Interfaces (identical to Lead interfaces, renamed for clarity)
interface PointOfContact {
  _id?: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  linkedin_url?: string;

  is_verified?: boolean;
  approvalStatus?: string;
}

interface CompanyDetail {
  _id: string;
  company_name: string;
  company_email: string;
  website_url: string;
  company_size: string;
  industry_name: string;
  linkedin_link?: string;
  stage: string;
  points_of_contact: PointOfContact[];
  assignedBy: { _id: string; name: string };
  created_at: string;
  createdAt: string;
  source: string;
}

const STAGES = [
  'New',
  'Contacted',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'Onboarded',
  'No vendor',
  'Future Reference'
];
const POC_STAGES = ['New', 'Contacted', 'Busy', 'No Answer', 'Wrong Number'];

const EmailSendingCompanyDetails: React.FC = () => {
  // -------------------- State (mirrored from Leads.tsx) --------------------
  const [companies, setCompanies] = useState<CompanyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    leadStage: '',
    pocStage: '',
    assignedBy: '',
    startDate: '',
    endDate: ''
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAllSelectedGlobal, setIsAllSelectedGlobal] = useState(false);
  const [bucketCount, setBucketCount] = useState(0);
  const isPageSelected = selectedIds.length === companies.length && companies.length > 0;
 const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);


// Modal state for company details view
const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
const [selectedLeadSource, setSelectedLeadSource] = useState<string>('email_sending');
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
const [selectedPoc, setSelectedPoc] = useState<PointOfContact | null>(null);
const [selectedEmailCompany, setSelectedEmailCompany] = useState<CompanyDetail | null>(null);
const [showSendEmailModal, setShowSendEmailModal] = useState(false);

// Function to open modal
const handleOpenModal = (
  id: string,
  mode: 'view' | 'edit' | 'create' = 'view',
  source: string = 'email_sending'
) => {
  setSelectedLeadId(id === 'new' ? null : id);
  setSelectedLeadSource(source);
  setModalMode(mode);
  setIsModalOpen(true);
};

const openSendEmail = (poc: PointOfContact, company?: CompanyDetail) => {
  const resolvedCompany = company || (selectedLeadId ? companies.find(c => String(c._id) === String(selectedLeadId)) || null : null);
  console.log('Selected Company', resolvedCompany);
  console.log('Company POCs', resolvedCompany?.points_of_contact);
  console.log('Selected POC ID', poc?._id);
  console.log('Matched POC', resolvedCompany?.points_of_contact?.find(p => String(p._id) === String(poc?._id)) || poc);
  if (resolvedCompany) {
    setSelectedLeadId(resolvedCompany._id);
    setSelectedLeadSource(resolvedCompany.source || 'email_sending');
  }
  setSelectedEmailCompany(resolvedCompany);
  setSelectedPoc(poc);
  setShowSendEmailModal(true);
};

const closeSendEmail = () => {
  setShowSendEmailModal(false);
  setSelectedPoc(null);
  setSelectedEmailCompany(null);
};

  const currentUserRole = JSON.parse(localStorage.getItem('user') || '{}')?.role;
  const canReassign = currentUserRole === 'Admin' || currentUserRole === 'Manager';

  const [searchParams, setSearchParams] = useSearchParams();

  // -------------------- Effects (identical, just endpoint changes) --------------------
  useEffect(() => {
    const openLeadId = searchParams.get('openLead');
    if (openLeadId) {
      // placeholder – modal handling can be added later
      setSearchParams({}, { replace: true });
    }
    const stageParam = searchParams.get('stage');
    if (stageParam && STAGES.includes(stageParam)) {
      setFilters(prev => ({ ...prev, leadStage: stageParam }));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // reset selections when pagination or filters change
    setSelectedIds([]);
    setIsAllSelectedGlobal(false);
  }, [page, debouncedTerm, filters]);

  useEffect(() => {
    setPage(1);
  }, [debouncedTerm, filters]);

  useEffect(() => {
    fetchCompanies();
  }, [page, debouncedTerm, filters]);

  useEffect(() => {
    fetchUsers();
    fetchBucketCount();
  }, []);

  // -------------------- Data fetching (email‑specific endpoints) --------------------
  const fetchBucketCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/poc-bucket`, {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setBucketCount(data.length);
      }
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/users/list`, {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) setUsers(await response.json());
    } catch {}
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: debouncedTerm
      });
      if (filters.leadStage) params.append('leadStage', filters.leadStage);
      if (filters.pocStage) params.append('pocStage', filters.pocStage);
      if (filters.assignedBy) params.append('assignedBy', filters.assignedBy);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const [resLeads, resEmailLeads] = await Promise.all([
        fetch(`${API_BASE_URL}/api/leads?${params.toString()}`, {
          headers: { 'x-auth-token': token || '' }
        }),
        fetch(`${API_BASE_URL}/api/email-leads?${params.toString()}`, {
          headers: { 'x-auth-token': token || '' }
        })
      ]);

      if (!resLeads.ok) throw new Error('Failed to fetch regular leads');
      if (!resEmailLeads.ok) throw new Error('Failed to fetch email leads');

      const dataLeads = await resLeads.json();
      const dataEmailLeads = await resEmailLeads.json();

      const combined = [
        ...(dataLeads.leads ?? []).map((l: any) => ({ ...l, source: l.source || 'regular' })),
        ...(dataEmailLeads.leads ?? []).map((l: any) => ({ ...l, source: l.source || 'email_sending' }))
      ];

      const sorted = combined.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setCompanies(sorted);
      setTotalCompanies((dataLeads.totalLeads ?? 0) + (dataEmailLeads.totalLeads ?? 0));
      setTotalPages(Math.max(dataLeads.totalPages ?? 1, dataEmailLeads.totalPages ?? 1));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAssigneeChange = async (companyId: string, newAssigneeId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/leads/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ assignedBy: newAssigneeId })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reassign');
      }
      toast.success('Company reassigned');
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Delete lead handler --------------------
const handleDeleteLead = async (company: CompanyDetail) => {
  if (!window.confirm(`Delete company "${company.company_name}"? This cannot be undone.`)) return;

  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const deleteEndpoint = company.source === 'email_sending'
      ? `${API_BASE_URL}/api/email-leads/${company._id}`
      : `${API_BASE_URL}/api/leads/${company._id}`;
    const response = await fetch(deleteEndpoint, {
      method: 'DELETE',
      headers: { 'x-auth-token': token || '' },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete company');
    }

    toast.success('Company deleted');
    await fetchCompanies();
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};


  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'New':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Contacted':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Won':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Lost':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Negotiation':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const toggleSelectAllPage = () => {
    if (selectedIds.length === companies.length) {
      setSelectedIds([]);
      setIsAllSelectedGlobal(false);
    } else {
      setSelectedIds(companies.map(c => c._id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    setIsAllSelectedGlobal(false);
  };

  // -------------------- Render (pixel‑perfect copy) --------------------
  return (
    <div className="h-full w-full min-w-0 overflow-x-hidden overflow-y-auto pr-0 sm:pr-1 sm:-mr-1 custom-scrollbar pb-20 sm:pb-10">
      <div className="flex flex-col space-y-4 lg:space-y-6 min-h-full min-w-0">
        {/* Header – identical to Leads page */}
        <div className="bg-[#f8fafc] lg:pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6 min-w-0">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f1c2e] tracking-tight">Company Details</h1>
              <p className="text-sm text-slate-500 mt-1">Manage and track your business prospects.</p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={fetchCompanies}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm min-h-11">
                <RefreshCw size={18} className={loading && companies.length === 0 ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm min-h-11">
                <Upload size={18} />
                <span className="hidden sm:inline">Bulk Upload</span>
              </button>
              <button onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-amber-500 hover:bg-amber-50 transition-all shadow-sm relative min-h-11" title="View Pipeline">
                <LayoutPanelTop size={18} />
                <span className="hidden sm:inline">Pipeline</span>
                {bucketCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                    {bucketCount}
                  </span>
                )}
              </button>
<button onClick={() => handleOpenModal('new', 'create', 'email_sending')}
  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-[#0ea5e9] text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:bg-[#0284c7] shadow-lg text-sm min-h-11">
  <Plus size={20} />
  <span>Add Company</span>
</button>
            </div>
          </div>
        </div>
        {/* Toolbar – search + filter toggle */}
        <div className="flex flex-col lg:flex-row gap-4 min-w-0">
          <form onSubmit={e => e.preventDefault()} className="relative flex-1 group">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-[#0ea5e9]' : 'text-slate-400 group-focus-within:text-[#0ea5e9]'}`} size={18} />
            <input type="text" placeholder="Search company or domain..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-10 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#0ea5e9]/5 focus:border-[#0ea5e9] transition-all shadow-sm" />
            {loading && companies.length > 0 && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-[#0ea5e9]/20 border-t-[#0ea5e9] rounded-full animate-spin"></div></div>
            )}
            {!loading && searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors bg-white p-0.5 rounded-md">
                <X size={16} />
              </button>
            )}
          </form>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border whitespace-nowrap shadow-sm ${showFilters ? 'bg-sky-50 border-sky-100 text-[#0ea5e9]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}` }>
              <Filter size={18} />
              Filters
              {(filters.leadStage || filters.pocStage || filters.assignedBy || filters.startDate || filters.endDate) && (
                <div className="flex items-center justify-center w-4 h-4 bg-rose-500 text-white rounded-full text-[10px]">!</div>
              )}
            </button>
          </div>
        </div>
        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-4"><Filter size={16} className="text-[#0ea5e9]" /><h2 className="text-xs font-bold text-[#0f1c2e] uppercase tracking-wider">Advanced Filters</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Lead Stage */}
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider ml-1">Lead Stage</label>
                <div className="relative">
                  <select value={filters.leadStage} onChange={e => setFilters({ ...filters, leadStage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-[#0f1c2e] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/10 appearance-none cursor-pointer">
                    <option value="">All Stages</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                </div>
              </div>
              {/* POC Stage */}
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider ml-1">POC Stage</label>
                <div className="relative">
                  <select value={filters.pocStage} onChange={e => setFilters({ ...filters, pocStage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-[#0f1c2e] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/10 appearance-none cursor-pointer">
                    <option value="">All Statuses</option>
                    {POC_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                </div>
              </div>
              {/* Assigned To (hide for BD Executive) */}
              {currentUserRole !== 'BD Executive' && (
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider ml-1">Assigned To</label>
                  <div className="relative">
                    <select value={filters.assignedBy} onChange={e => setFilters({ ...filters, assignedBy: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-[#0f1c2e] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/10 appearance-none cursor-pointer">
                      <option value="">All Users</option>
                      {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  </div>
                </div>
              )}
              {/* Added From */}
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider ml-1">Added From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="date" value={filters.startDate}
                    onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-[#0f1c2e] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/10" />
                </div>
              </div>
              {/* Added To */}
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider ml-1">Added To</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="date" value={filters.endDate}
                    onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-[#0f1c2e] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/10" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Table / Card view */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[500px] flex flex-col relative min-w-0">
          {/* Select‑all banner */}
          {selectedIds.length === companies.length && companies.length < totalCompanies && (
            <div className={`p-2.5 flex items-center justify-center gap-4 text-xs font-bold ${isAllSelectedGlobal ? 'bg-sky-500 text-white' : 'bg-sky-50 text-[#0ea5e9] border-b border-sky-100'}`}>
              <div className="flex items-center gap-2"><AlertCircle size={14} />{isAllSelectedGlobal ? `All ${totalCompanies} companies in this view are selected.` : `All ${companies.length} companies on this page are selected.`}</div>
              {!isAllSelectedGlobal && (
                <button onClick={() => setIsAllSelectedGlobal(true)} className="underline hover:text-[#0284c7]">Select all {totalCompanies} companies</button>
              )}
              {isAllSelectedGlobal && (
                <button onClick={() => { setSelectedIds([]); setIsAllSelectedGlobal(false); }} className="underline hover:text-white/80">Clear Selection</button>
              )}
            </div>
          )}
          {/* Mobile card layout */}
          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {loading && companies.length === 0 ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 animate-pulse space-y-4">
                  <div className="flex gap-3"><div className="w-12 h-12 bg-slate-200 rounded-xl"></div><div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 rounded w-1/2"></div><div className="h-3 bg-slate-100 rounded w-3/4"></div></div></div>
                  <div className="flex justify-between border-t border-slate-100 pt-3"><div className="h-6 bg-slate-200 rounded-full w-20"></div><div className="h-6 bg-slate-200 rounded-lg w-20"></div></div>
                </div>
              ))
            ) : companies.length > 0 ? (
              companies.map((company, index) => (
                <div key={company._id} className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition-all min-w-0 ${selectedIds.includes(company._id) ? 'border-[#0ea5e9] bg-sky-50/20' : 'border-slate-100'}`}
                  style={{ animationDelay: `${index * 50}ms` }} onClick={() => handleOpenModal(company._id, 'view', company.source)}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex gap-3 sm:gap-4 min-w-0">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0ea5e9] border border-slate-100 shadow-sm transition-transform hover:scale-110"><Briefcase size={22} /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-[#0f1c2e] line-clamp-2 break-words cursor-pointer" onClick={e=>{e.stopPropagation(); handleOpenModal(company._id, 'view', company.source);}}>{company.company_name}</h3>
                          {company.source === 'email_sending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 select-none">
                              Email Sending
                            </span>
                          ) }
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {company.website_url && (
                            <a href={company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[0.65rem] font-bold text-[#0ea5e9] underline flex items-center gap-1 min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                              <Globe size={11} className="shrink-0" />
                              <span className="truncate min-w-0">{company.website_url}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleSelectId(company._id); }} className={`p-1 ${selectedIds.includes(company._id) ? 'text-[#0ea5e9]' : 'text-slate-200'}`}>
                      {selectedIds.includes(company._id) ? <CheckSquare size={22} /> : <Square size={22} />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 shadow-sm">
                      <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Stage</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[0.6rem] font-bold border ${getStageColor(company.stage)}`}>{company.stage}</span>
                    </div>
                    {company.company_size && (
                      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 shadow-sm">
                        <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest mb-1">Company Size</p>
                        <div className="flex items-center gap-1.5 text-[0.65rem] font-extrabold text-slate-600"><Users size={12} className="text-[#0ea5e9]" />{company.company_size}</div>
                      </div>
                    )}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
                      <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest mb-1">Industry</p>
                      <p className="text-[0.65rem] font-extrabold text-slate-600 break-words">{company.industry_name || 'General Industry'}</p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 shadow-sm col-span-2">
                      <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest mb-2">POC Details</p>
                      <div className="space-y-2">
                        {(company.points_of_contact || [])
                          .filter((p: any) => p.approvalStatus !== 'pending')
                          .slice(0, 3)
                          .map((poc: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-2 min-w-0">
                              <div className="min-w-0">
                                <p className="text-[0.7rem] font-bold text-[#0f1c2e] truncate">{poc.name || 'Unnamed POC'}</p>
                                {poc.email && <p className="text-[0.65rem] text-slate-500 truncate">{poc.email}</p>}
                              </div>
                              {poc.email && (
                                <button
                                  onClick={e => { e.stopPropagation(); openSendEmail(poc, company); }}
                                  className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                                  title="Send Email"
                                >
                                  <Mail size={15} />
                                </button>
                              )}
                            </div>
                          ))}
                        {company.points_of_contact?.length > 3 && (
                          <span className="text-[0.6rem] text-[#0ea5e9]">+{company.points_of_contact.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 border-2 border-white flex items-center justify-center text-emerald-600 text-[0.6rem] font-bold shadow-sm" title="Approved POCs">
                        {(company.points_of_contact?.filter(p => p.approvalStatus !== 'pending').length ?? 0)}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-400 shadow-sm" title={`Assigned to ${company.assignedBy?.name || 'Unassigned'}`}>
                        <User size={12} />
                      </div>
                    </div>
                    <div className="flex-1 w-full sm:w-auto sm:mx-3" onClick={e => canReassign ? e.stopPropagation() : undefined}>
                      {canReassign ? (
                        <select value={company.assignedBy?._id || ''} onChange={e => handleDirectAssigneeChange(company._id, e.target.value)}
                          className="w-full sm:max-w-[180px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-[0.65rem] font-bold text-[#0f1c2e] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20">
                          <option value="">Unassigned</option>
                          {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                      ) : (
                        <div className="flex flex-col"><span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assigned To</span><span className="text-[0.65rem] font-extrabold text-[#0f1c2e]">{company.assignedBy?.name || 'Unassigned'}</span></div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end" onClick={e => e.stopPropagation()}>
                      {company.source === 'email_sending' && (
                        <button onClick={e => { e.stopPropagation(); handleOpenModal(company._id, 'edit', company.source); }} className="p-2.5 bg-sky-50 text-[#0ea5e9] rounded-xl hover:bg-[#0ea5e9] hover:text-white transition-all shadow-sm"><Edit2 size={16} /></button>
                      )}
                      {currentUserRole !== 'BD Executive' && (
                        <button onClick={e => { e.stopPropagation(); handleDeleteLead(company); }} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center"><div className="p-4 bg-slate-50 inline-block rounded-full mb-3"><Briefcase size={32} className="text-slate-200" /></div><p className="text-slate-400 font-bold text-sm">No results found.</p></div>
            )}
          </div>
          {/* Desktop Table View */}
<div className="hidden lg:block overflow-x-auto flex-1">
    <table className="w-full min-w-[1120px] text-left border-collapse table-fixed">
        <thead className="sticky top-0 z-20 bg-white">
            <tr className="bg-slate-50/50 border-b border-slate-200/60">
                <th className="px-6 py-4 w-12">
                    <button
                        onClick={toggleSelectAllPage}
                        className={`transition-colors ${isPageSelected ? 'text-[#0ea5e9]' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                        {isPageSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                </th>
                <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider w-[260px]">Company</th>
                <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider w-[230px]">POC Details</th>
                <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider w-[180px]">Information</th>
                <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider w-[110px]">Stage</th>
                <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider w-[150px]">Assigned By</th>
                <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider w-[110px]">Date</th>
                <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider text-right w-[110px]">Actions</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 relative">
            {/* Loading Overlay */}
            {loading && companies.length > 0 && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center transition-all">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#0ea5e9]/20 border-t-[#0ea5e9] rounded-full animate-spin" />
                        <span className="text-[0.65rem] font-extrabold text-[#0ea5e9] uppercase tracking-[0.2em] animate-pulse">Synchronizing...</span>
                    </div>
                </div>
            )}

            {loading && companies.length === 0 ? (
                Array(8).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="w-6 h-6 bg-slate-100 rounded" /></td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-24" />
                                    <div className="h-3 bg-slate-50 rounded w-32" />
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-20" />
                                <div className="h-3 bg-slate-50 rounded w-24" />
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-20" />
                                <div className="h-3 bg-slate-50 rounded w-24" />
                            </div>
                        </td>
                        <td className="px-6 py-4"><div className="h-3 w-12 bg-slate-100 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-3 w-12 bg-slate-100 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-3 w-12 bg-slate-100 rounded" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-3 w-12 bg-slate-100 rounded" /></td>
                    </tr>
                ))
            ) : (
                companies.map((company, index) => (
                    <tr key={company._id} className={`bg-white ${selectedIds.includes(company._id) ? 'border-[#0ea5e9] bg-sky-50/20' : ''}`} style={{ animationDelay: `${index * 50}ms` }} onClick={() => handleOpenModal(company._id, 'view', company.source)}>
                        <td className="px-6 py-4">
                            <button onClick={e => { e.stopPropagation(); toggleSelectId(company._id); }} className={`transition-colors ${selectedIds.includes(company._id) ? 'text-[#0ea5e9]' : 'text-slate-200'}`}>
                                {selectedIds.includes(company._id) ? <CheckSquare size={18} /> : <Square size={18} />}
                            </button>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-start gap-4 min-w-0">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0ea5e9] border border-slate-100 shadow-sm">
                                    <Briefcase size={22} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <h3 className="text-base font-extrabold text-[#0f1c2e] line-clamp-1 cursor-pointer" onClick={e => { e.stopPropagation(); handleOpenModal(company._id, 'view', company.source); }}>{company.company_name}</h3>
                                        {company.source === 'email_sending' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 select-none">
                                                Email Sending
                                            </span>
                                        ) }
                                    </div>
                                    {company.website_url && (
                                        <a href={company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`} target="_blank" rel="noopener noreferrer" className="text-[0.65rem] font-bold text-[#0ea5e9] underline flex items-center gap-1 min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                            <Globe size={11} className="shrink-0" />
                                            <span className="truncate min-w-0">{company.website_url}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
  <div className="flex flex-col gap-1.5">
    {(company.points_of_contact || [])
      .filter((p: any) => p.approvalStatus !== 'pending')
      .slice(0, 3)
      .map((poc: any, idx: number) => (
        <div key={idx} className="flex flex-col min-w-0">
          <span className="text-[0.7rem] font-bold text-[#0f1c2e] truncate">{poc.name}</span>
          <div className="flex items-center gap-2 min-w-0">
            {poc.email && (
              <a href={`mailto:${poc.email}`} className="text-[0.65rem] text-[#0ea5e9] underline truncate min-w-0">
                {poc.email}
              </a>
            )}
            {poc.email && (
              <button
                onClick={e => { e.stopPropagation(); openSendEmail(poc, company); }}
                className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                title="Send Email"
              >
                <Mail size={12} />
              </button>
            )}
          </div>
        </div>
      ))}
    {company.points_of_contact?.length > 3 && (
      <span className="text-[0.6rem] text-[#0ea5e9]">+{company.points_of_contact.length - 3} more</span>
    )}
  </div>
</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {company.company_size && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                <Users size={12} className="text-[#0ea5e9]" />
                                {company.company_size} Employees
                              </div>
                            )}
                            <div className="text-[0.65rem] text-slate-400 font-semibold tracking-wide uppercase italic">
                              {company.industry_name || 'General Industry'}
                            </div>
                          </div>
                        </td>
                            
                             
                        <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[0.6rem] font-bold border ${getStageColor(company.stage)}`}>{company.stage}</span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5" title={`Assigned by ${company.assignedBy?.name || 'Unassigned'}`}>
                                <User size={12} className="text-[#0ea5e9]" />
                                <span className="text-[0.65rem] font-extrabold text-[#0f1c2e] truncate">{company.assignedBy?.name || 'Unassigned'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-[0.65rem] font-medium text-slate-600">{new Date(company.created_at || company.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex gap-1.5 justify-end" onClick={e => e.stopPropagation()}>
                                {company.source === 'email_sending' && (
                                  <button onClick={e => { e.stopPropagation(); handleOpenModal(company._id, 'edit', company.source); }} className="p-2.5 bg-sky-50 text-[#0ea5e9] rounded-xl hover:bg-[#0ea5e9] hover:text-white transition-all shadow-sm">
                                    <Edit2 size={16} />
                                  </button>
                                )}
                                {currentUserRole !== 'BD Executive' && (
                                  <button onClick={e => { e.stopPropagation(); handleDeleteLead(company); }} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                    <Trash2 size={16} />
                                  </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))
            )}
        </tbody>
    </table>
</div>

          {/* Pagination */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span>Showing <span className="text-[#0f1c2e]">{companies.length}</span> of <span className="text-[#0f1c2e]">{totalCompanies}</span> leads</span>
                  <span className="hidden sm:inline mx-2 text-slate-300">|</span>
                  <span>Page</span>
                  <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={page}
                      onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= totalPages) setPage(val);
                      }}
                      className="w-12 px-1.5 py-1 text-center border border-slate-200 rounded-md text-[#0f1c2e] font-bold focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 bg-slate-50 hover:bg-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      title="Type page number"
                  />
                  <span>of <span className="text-[#0f1c2e]">{totalPages}</span></span>
              </div>
              <div className="flex gap-2">
                  <button
                      disabled={page === 1 || loading}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-[#0ea5e9] hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronLeft size={20} />
                  </button>
                  <button
                      disabled={page === totalPages || loading}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-[#0ea5e9] hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronRight size={20} />
                  </button>
              </div>
          </div>
        </div>
      </div>
            {/* Lead Modal for company details */}
            <LeadModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              leadId={selectedLeadId}
              initialMode={modalMode}
              onUpdate={fetchCompanies}
        source={selectedLeadSource}
        isEmailSending={selectedLeadSource === 'email_sending'}
        onSendEmail={openSendEmail}
            />
            <BulkUploadLeadModal
              isOpen={isBulkModalOpen}
              onClose={() => setIsBulkModalOpen(false)}
              onUploadSuccess={fetchCompanies}
              source="email_sending"
            />
           
      
      {showSendEmailModal && selectedPoc && (
  <SendEmailModal
   open={showSendEmailModal}
    poc={selectedPoc}
  company={selectedEmailCompany || (selectedLeadId ? companies.find(c => String(c._id) === String(selectedLeadId)) || null : null)}
              onClose={closeSendEmail}
  />
)}
    </div>
  );
};

export default EmailSendingCompanyDetails;
