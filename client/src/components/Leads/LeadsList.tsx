import React, { useEffect, useState } from "react";
import {
  Plus,
  Upload,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  Calendar,
  Edit3,
  Eye,
} from "lucide-react";
import { useLeads } from "../../hooks/useLeads";
import { useAuth } from "../../contexts/AuthContext";
import CreateLeadModal from "./CreateLeadModal";
import BulkImportModal from "./BulkImportModal";
import LeadDetailModal from "./LeadDetailModal";
import ScheduleModal from "../Scheduling/ScheduleModal";
import { useLeadsContext } from "../../contexts/leadcontext";
import { useUsers } from "../../hooks/useUsers";

const LeadsList: React.FC = () => {
  // const { leads, loading } = useLeads()
  const { leads, loading, createLead, updateLead, deleteLead } =
    useLeadsContext();
  const { users } = useUsers();
  const { profile } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");

  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);


   const [currentPage, setCurrentPage] = useState(1);
   const pageSize = 5;
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, stageFilter, userFilter]);

  const stages = [
    "All",
    "New",
    "Contacted",
    "Proposal Sent",
    "Negotiation",
    "Won",
    "Lost",
    "Onboarded",
  ];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = stageFilter === "All" || lead.stage === stageFilter;

  const matchesUser =
    userFilter === "All" ||
    (userFilter === "Unassigned" && !lead.assignedBy) ||
    lead.assignedBy?._id === userFilter;


    return matchesSearch && matchesStage && matchesUser;
  });

  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "New":
        return "bg-blue-100 text-blue-800";
      case "Contacted":
        return "bg-yellow-100 text-yellow-800";
      case "Proposal Sent":
        return "bg-purple-100 text-purple-800";
      case "Negotiation":
        return "bg-orange-100 text-orange-800";
      case "Won":
        return "bg-green-100 text-green-800";
      case "Lost":
        return "bg-red-100 text-red-800";
      case "Onboarded":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Leads Management
          </h1>
          <p className="text-gray-300 mt-2 text-lg">
            {profile?.role === "BD Executive"
              ? "Your assigned leads"
              : "All company leads"}
          </p>
        </div>
        <div className="flex space-x-4">
          {(profile?.role === "Admin" || profile?.role === "Manager") && (
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4 rounded-2xl flex items-center space-x-3 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Upload className="w-5 h-5" />
              <span>Bulk Import</span>
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="gradient-primary text-white px-6 py-4 rounded-2xl flex items-center space-x-3 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {stages.map((stage) => (
                <option
                  className="bg-gray-700 text-white"
                  key={stage}
                  value={stage}
                >
                  {stage}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option value="All" className="bg-gray-700 text-white">
                All Users
              </option>
              {users.map((user) => (
                <option
                  key={user._id}
                  value={user._id}
                  className="bg-gray-700 text-white"
                >
                  {user.name}
                </option>
              ))}
              <option value="Unassigned" className="bg-gray-700 text-white">
                Unassigned Users
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="glass rounded-2xl border border-white/30 overflow-hidden shadow-xl">
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-3">
              No leads found
            </h3>
            <p className="text-gray-300 text-lg">
              {searchTerm || stageFilter !== "All"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first lead"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {paginatedLeads.map((lead) => (
              <div
                key={lead._id}
                className="p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-center justify-between overflow-auto  sm:gap-[30px]">
                  <div className="flex-1 ">
                    <div
                      className="flex items-center space-x-3 mb-2 "
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsLeadDetailOpen(true);
                      }}
                    >
                      <h3 className="text-xl font-bold text-white whitespace-nowrap">
                        {lead.company_name}
                      </h3>
                      <span
                        className={`px-3 py-2 text-xs font-bold rounded-full shadow-lg ${getStageColor(
                          lead.stage
                        )}`}
                      >
                        {lead.stage}
                      </span>
                      {lead.locked && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                          <span className="text-red-300 text-xs font-medium">
                            Locked
                          </span>
                        </div>
                      )}
                    </div>
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium whitespace-nowrap">
                          {lead.contact_name} •{" "}
                          {lead.contact_designation || "No designation"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium">
                          {lead.contact_email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">
                          {lead.contact_phone}
                        </span>
                      </div>
                    </div> */}
                    <div className="mt-2 text-sm text-gray-400 space-y-1">
                      <div>
                        <span className="font-medium">Industry:</span>{" "}
                        {lead.industry_name || "Not specified"} •
                        <span className="font-medium ml-2">Owner:</span>{" "}
                        {lead.assignedBy?.name || "Unassigned"}
                      </div>
                      <div className="flex items-center space-x-4">
                        {lead.company_size && (
                          <span>
                            <span className="font-medium">Size:</span>{" "}
                            {lead.company_size}
                          </span>
                        )}
                        {lead.lead_source && (
                          <span>
                            <span className="font-medium">Source:</span>{" "}
                            {lead.lead_source}
                          </span>
                        )}
                        {lead.hiring_needs && lead.hiring_needs.length > 0 && (
                          <span>
                            <span className="font-medium">Needs:</span>{" "}
                            {lead.hiring_needs.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    {(lead.no_of_designations || lead.no_of_positions) && (
                      <div className="mt-3 text-sm font-bold text-green-400">
                        {lead.no_of_designations
                          ? `Designations: ${lead.no_of_designations}`
                          : `Positions: ${lead.no_of_positions || 0}`}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-sm text-gray-400 flex items-center space-x-1 font-medium">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(lead.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                          setIsLeadDetailOpen(true); // open details only here
                        }}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead); // Keep the lead selected
                          setIsScheduleModalOpen(true); // OPEN the ScheduleModal
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-400 transition-colors hover:bg-white/20 rounded-lg"
                        title="Schedule Meeting"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                          setIsEditModalOpen(true); // Open Edit Modal
                        }}
                        className="p-2 text-gray-400 hover:text-purple-400 transition-colors hover:bg-white/20 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4">
            {/* Prev button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-[#667eea] text-white hover:bg-[#764ba2] disabled:opacity-50 transition"
            >
              &lt;
            </button>

            {/* Page buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page, idx, arr) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        page === currentPage
                          ? "bg-gradient-to-r from-[#db2777] via-[#a855f7] to-[#667eea] text-white shadow-lg"
                          : "bg-[#764ba2] text-white hover:bg-[#a855f7]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  Math.abs(page - currentPage) === 2 &&
                  arr[idx - 1] !== "..."
                ) {
                  return (
                    <span key={page} className="px-2 text-[#a855f7]">
                      ...
                    </span>
                  );
                } else {
                  return null;
                }
              }
            )}

            {/* Next button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-[#667eea] text-white hover:bg-[#764ba2] disabled:opacity-50 transition"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateLeadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {isBulkImportOpen && (
        <BulkImportModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
        />
      )}

      {isLeadDetailOpen && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={isLeadDetailOpen}
          onClose={() => {
            setIsLeadDetailOpen(false);
            setSelectedLead(null);
          }}
        />
      )}

      {selectedLead && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          lead={selectedLead}
        />
      )}

      {isEditModalOpen && selectedLead && (
        <CreateLeadModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          lead={selectedLead} // ✅ this provides the value
        />
      )}
    </div>
  );
};

export default LeadsList;
