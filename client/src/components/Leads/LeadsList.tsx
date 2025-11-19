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
import toast from "react-hot-toast";

const LeadsList: React.FC = () => {
  // const { leads, loading } = useLeads()
  const { fetchLeads, leads, loading, createLead, updateLead, deleteLead } =
    useLeadsContext();
  const { users } = useUsers();
  const { profile } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [pocStageFilter, setPocStageFilter] = useState("All");
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const url = import.meta.env.VITE_BACKEND_URL;
  const [bulkStage, setBulkStage] = useState("");

  const pageSize = 5;

  const pocStages = [
    "All",
    "New",
    "Contacted",
    "Busy",
    "No Answer",
    "Wrong Number",
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stageFilter, userFilter, pocStageFilter, dateFilter]);

  const stages = [
    "All",
    "New",
    "Contacted",
    "Proposal Sent",
    "Negotiation",
    "Won",
    "Lost",
    "Onboarded",
    "No vendor",
  ];

  const filteredLeads = leads.filter((lead) => {
    const lowerSearch = searchTerm.toLowerCase();

    // 🔹 Search matches company name, email, or any POC's phone/alternate_num
    const matchesSearch =
      lead.company_name.toLowerCase().includes(lowerSearch) ||
      lead.contact_email?.toLowerCase().includes(lowerSearch) ||
      lead.points_of_contact?.some(
        (poc) =>
          poc.phone?.toLowerCase().includes(lowerSearch) ||
          poc.alternate_phone?.toLowerCase().includes(lowerSearch)
      );

    const matchesStage = stageFilter === "All" || lead.stage === stageFilter;

    const matchesUser =
      userFilter === "All" ||
      (userFilter === "Unassigned" && !lead.assignedBy) ||
      lead.assignedBy?._id === userFilter;

    const matchesPocStage =
      pocStageFilter === "All" ||
      lead.points_of_contact?.some((poc) => poc.stage === pocStageFilter);

    const matchesDate =
      !dateFilter ||
      new Date(lead.createdAt).toDateString() ===
        new Date(dateFilter).toDateString();

    return (
      matchesSearch &&
      matchesStage &&
      matchesUser &&
      matchesPocStage &&
      matchesDate
    );
  });

  console.log(filteredLeads.length, "filteredLeads length");
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

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      alert("Please select at least one lead");
      return;
    }

    try {
      setIsBulkAssigning(true);

      const bodyData: any = { leadIds: selectedLeads };

      // ✅ Only include assignedBy if user selected someone
      if (bulkAssignee) bodyData.assignedBy = bulkAssignee;

      // ✅ Only include stage if chosen
      if (bulkStage) bodyData.stage = bulkStage;

      // Send API request to update multiple leads
      const response = await fetch(`${url}/api/leads/bulk-assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      fetchLeads();
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to assign");

      toast.success("Leads assigned successfully!");
      setBulkAssignee("");
      setBulkStage("");
      // Optionally update local state (instant UI update)
      const updatedUser = users.find((u) => u._id === bulkAssignee);
      if (updatedUser) {
        const updatedLeads = filteredLeads.map((lead) =>
          selectedLeads.includes(lead._id)
            ? { ...lead, assignedBy: updatedUser }
            : lead
        );
        // update context if possible

        setSelectedLeads([]);
        setSelectAll(false);
      }
    } catch (error) {
      toast.error(error.message || "Error assigning leads");
    } finally {
      setIsBulkAssigning(false);
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
          {/* 🔹 Search Bar */}
          <div className="relative flex flex-col flex-[2]">
            <span className="text-xs text-gray-300 mb-1 pl-1">Search</span>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads / Phone Numbers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              />
            </div>
          </div>

          {/* 🔹 Stage Filter */}
          <div className="flex flex-col flex-[0.8]">
            <span className="text-xs text-gray-300 mb-1 pl-1">Lead Status</span>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-300" />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                {stages.map((stage) => (
                  <option
                    key={stage}
                    value={stage}
                    className="bg-gray-700 text-white"
                  >
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 🔹 User Filter */}
          <div className="flex flex-col flex-[0.8]">
            <span className="text-xs text-gray-300 mb-1 pl-1">User</span>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-300" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
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

          {/* 🔹 POC Stage Filter */}
          <div className="flex flex-col flex-[0.8]">
            <span className="text-xs text-gray-300 mb-1 pl-1">POC Stage</span>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-300" />
              <select
                value={pocStageFilter}
                onChange={(e) => setPocStageFilter(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                {pocStages.map((stage) => (
                  <option
                    key={stage}
                    value={stage}
                    className="bg-gray-700 text-white"
                  >
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 🔹 Date Filter */}
          <div className="flex flex-col flex-[0.8]">
            <span className="text-xs text-gray-300 mb-1 pl-1">Date</span>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-300" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Global Select All / Deselect All */}
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          checked={
            filteredLeads.length > 0 &&
            selectedLeads.length === filteredLeads.length
          }
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              // ✅ Select all filtered leads
              setSelectedLeads(filteredLeads.map((lead) => lead._id));
            } else {
              // ❌ Deselect all
              setSelectedLeads([]);
            }
          }}
        />
        <span className="text-white font-medium">
          {selectedLeads.length === filteredLeads.length &&
          filteredLeads.length > 0
            ? "Deselect All Leads"
            : "Select All Leads"}
        </span>
      </div>
      {selectedLeads.length > 0 && (
        <div className="glass p-4 rounded-xl flex items-center justify-between border border-white/20 mt-4">
          <div className="flex items-center space-x-3">
            <span className="text-white font-semibold">
              Assign {selectedLeads.length} selected lead(s) to:
            </span>
            <select
              value={bulkAssignee}
              onChange={(e) => setBulkAssignee(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option
                  key={user._id}
                  value={user._id}
                  className="bg-gray-700 text-white"
                >
                  {user.name}
                </option>
              ))}
            </select>

            {/* 🔹 Add this new dropdown for stage change */}
            <select
              value={bulkStage || ""}
              onChange={(e) => setBulkStage(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Stage</option>
              {stages
                .filter((stage) => stage !== "All")
                .map((stage) => (
                  <option
                    key={stage}
                    value={stage}
                    className="bg-gray-700 text-white"
                  >
                    {stage}
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={handleBulkAssign}
            disabled={(!bulkAssignee && !bulkStage) || isBulkAssigning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {isBulkAssigning ? "Assigning..." : "Assign Selected"}
          </button>
        </div>
      )}

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
            {/* Page-wise Select All */}
            <div className="flex items-center space-x-2 p-4 bg-white/5 border-b border-white/10">
              <input
                type="checkbox"
                checked={paginatedLeads.every((lead) =>
                  selectedLeads.includes(lead._id)
                )}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const currentPageIds = paginatedLeads.map((lead) => lead._id);

                  if (checked) {
                    // ✅ Add only current page’s leads to selected list
                    setSelectedLeads((prev) => [
                      ...new Set([...prev, ...currentPageIds]),
                    ]);
                  } else {
                    // ❌ Remove only current page’s leads from selection
                    setSelectedLeads((prev) =>
                      prev.filter((id) => !currentPageIds.includes(id))
                    );
                  }
                }}
              />
              <span className="text-white font-medium">
                Select All on This Page ({paginatedLeads.length})
              </span>
            </div>

            {paginatedLeads.map((lead) => (
              <div
                key={lead._id}
                className="p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-center justify-between overflow-auto  sm:gap-[30px]">
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead._id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedLeads((prev) =>
                        checked
                          ? [...prev, lead._id]
                          : prev.filter((id) => id !== lead._id)
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />

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
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-sm text-gray-400 flex items-center space-x-1 font-medium">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(lead.createdAt).toLocaleString("en-US", {
                            month: "long",
                          })}
                        </span>
                      </div>
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
