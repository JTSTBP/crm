import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Send,
  Mail,
  MessageCircle,
  Download,
  Calendar,
  Building2,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useProposals } from "../../hooks/useProposals";
import { useAuth } from "../../contexts/AuthContext";
import CreateProposalModal from "./CreateProposalModal";
import ProposalDetailModal from "./ProposalDetailModal";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useLeadsContext } from "../../contexts/leadcontext";
import { useUsers } from "../../hooks/useUsers";

const ProposalsList: React.FC = () => {
  const { loading, updateProposal, sendProposal } = useProposals();
  const { profile, user } = useAuth();
  const { users } = useUsers();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const { deleteProposal, proposals, getAllProposals } = useLeadsContext();


  const statuses = ["All", "Draft", "Sent", "Viewed", "Accepted", "Rejected"];
  const dateRanges = ["All", "Today", "Last 7 Days", "Last 30 Days"];

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.lead_id?.company_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      proposal.template_used.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.lead_id?.contact_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || proposal.status === statusFilter;
    
    const matchesUser =
      userFilter === "All" || proposal.user_id._id === userFilter;
    
   let matchesDate = true;
   if (dateFilter !== "All") {
     const proposalDate = new Date(proposal.createdAt || proposal.created_at);
     const now = new Date();
 

     // normalize both to midnight
     const proposalDay = new Date(
       proposalDate.getFullYear(),
       proposalDate.getMonth(),
       proposalDate.getDate()
     );
     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

     switch (dateFilter) {
       case "Today":
         matchesDate = proposalDay.getTime() === today.getTime();
         break;

       case "Last 7 Days":
         matchesDate =
           proposalDay >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
         console.log(
           matchesDate,
           new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
         );
         break;

       case "Last 30 Days":
         matchesDate =
           proposalDay >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
         break;
     }
   }

    return matchesSearch && matchesStatus && matchesUser && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Viewed":
        return "bg-purple-100 text-purple-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <Edit3 className="w-4 h-4" />;
      case "Sent":
        return <Send className="w-4 h-4" />;
      case "Viewed":
        return <Eye className="w-4 h-4" />;
      case "Accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSentViaIcon = (sentVia: string) => {
    switch (sentVia) {
      case "Email":
        return <Mail className="w-4 h-4 text-blue-500" />;
      case "WhatsApp":
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case "Both":
        return (
          <div className="flex space-x-1">
            <Mail className="w-3 h-3 text-blue-500" />
            <MessageCircle className="w-3 h-3 text-green-500" />
          </div>
        );
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleQuickSend = async (
    proposalId: string,
    method: "email" | "whatsapp"
  ) => {
    try {
      await sendProposal(proposalId, method);
      toast.success(
        `Proposal sent via ${method === "email" ? "Email" : "WhatsApp"}!`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to send proposal");
    }
  };

  const handleDeleteProposal = async (
    proposalId: string,
    companyName: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete the proposal for ${companyName}?`
      )
    ) {
      try {
        await deleteProposal(proposalId);
        toast.success("Proposal deleted successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete proposal");
      }
    }
  };

  const exportProposals = (format: "csv" | "excel") => {
    const exportData = filteredProposals.map((proposal) => ({
      "Proposal ID": proposal._id,
      Company: proposal.lead_id?.company_name || "N/A",
      Contact: proposal.lead_id?.contact_name || "N/A",
      Template: proposal.template_used,
      "Rate Card": proposal.rate_card_version,
      "Sent Via": proposal.sent_via,
      Status: proposal.status,
      "Created Date": format(new Date(proposal.created_at), "yyyy-MM-dd"),
      "Sent Date": proposal.sent_at
        ? format(new Date(proposal.sent_at), "yyyy-MM-dd")
        : "Not sent",
      Owner: proposal.user?.name || "N/A",
    }));

    const csvContent = [
      Object.keys(exportData[0] || {}).join(","),
      ...exportData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposals-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Proposals exported as ${format.toUpperCase()}`);
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
            Proposals Management
          </h1>
          <p className="text-gray-300 mt-2 text-lg">
            Track and manage all proposals across your organization
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => exportProposals("csv")}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="gradient-primary text-white px-6 py-4 rounded-2xl flex items-center space-x-3 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Create Proposal</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">
                Total Proposals
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {proposals.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">
                Sent Proposals
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {proposals.filter((p) => p.status !== "Draft").length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500">
              <Send className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">Accepted</p>
              <p className="text-3xl font-bold text-white mt-2">
                {proposals.filter((p) => p.status === "Accepted").length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">
                Acceptance Rate
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                {proposals.filter((p) => p.status !== "Draft").length > 0
                  ? Math.round(
                      (proposals.filter((p) => p.status === "Accepted").length /
                        proposals.filter((p) => p.status !== "Draft").length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border border-white/30 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option className="bg-gray-700 text-white" value="">
                Select a user
              </option>
              {statuses.map((status) => (
                <option
                  className="bg-gray-700 text-white"
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
          >
            <option className="bg-gray-700 text-white" value="">
              Select a user
            </option>
            {users.map((user) => (
              <option
                className="bg-gray-700 text-white"
                key={user._id}
                value={user._id}
              >
                {user.name}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
          >
            

            {dateRanges.map((range) => (
              <option
                className="bg-gray-700 text-white"
                key={range}
                value={range}
              >
                {range}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="glass rounded-2xl border border-white/30 overflow-hidden shadow-xl">
        {filteredProposals.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-3">
              No proposals found
            </h3>
            <p className="text-gray-300 text-lg">
              {searchTerm ||
              statusFilter !== "All" ||
              userFilter !== "All" ||
              dateFilter !== "All"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first proposal"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Proposal Details
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Company & Contact
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Template & Version
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Sent Via
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Dates
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-white">
                    Owner
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProposals.map((proposal) => (
                  <tr
                    key={proposal._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            #{proposal._id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-300">
                            {proposal.template_used}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-white">
                          {proposal.lead_id?.company_name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-300">
                          {proposal.lead_id?.contact_name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {proposal.lead_id?.contact_email || "N/A"}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white font-medium">
                          {proposal.template_used}
                        </p>
                        <p className="text-sm text-gray-300">
                          Rate Card: {proposal.rate_card_version}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {getSentViaIcon(proposal.sent_via)}
                        <span className="text-white text-sm">
                          {proposal.sent_via}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            proposal.status
                          )}`}
                        >
                          {getStatusIcon(proposal.status)}
                          <span className="ml-1">{proposal.status}</span>
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <p className="text-white">
                          Created:{" "}
                          {format(new Date(proposal.createdAt), "MMM dd, yyyy")}
                        </p>
                        {proposal.sent_at && (
                          <p className="text-gray-300">
                            Sent:{" "}
                            {format(new Date(proposal.sent_at), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 gradient-success rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {proposal.user_id?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {proposal.user_id?.name || "N/A"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {proposal.user_id?.role || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedProposal(proposal)}
                          className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {proposal.status === "Draft" && (
                          <>
                            <button
                              onClick={() =>
                                handleQuickSend(proposal._id, "email")
                              }
                              className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                              title="Send via Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleQuickSend(proposal._id, "whatsapp")
                              }
                              className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                              title="Send via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {(profile?.role === "Admin" ||
                          proposal.user_id === user?.id) && (
                          <>
                            <button
                              onClick={() => {
                                // Edit proposal functionality
                                toast.info(
                                  "Edit proposal functionality coming soon!"
                                );
                              }}
                              className="p-2 text-gray-400 hover:text-purple-400 transition-colors hover:bg-white/20 rounded-lg"
                              title="Edit Proposal"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {profile?.role === "Admin" && (
                              <button
                                onClick={() =>
                                  handleDeleteProposal(
                                    proposal._id,
                                    proposal.lead?.company_name || "Unknown"
                                  )
                                }
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                                title="Delete Proposal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateProposalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          isOpen={!!selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
};

export default ProposalsList;
