import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Building2,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  CheckSquare,
  Activity,
  Mic,
  Paperclip,
  Send,
  Globe,
  Users,
  MapPin,
  MessageCircle,
  Briefcase,
} from "lucide-react";

import { useProposals } from "../../hooks/useProposals";
import { useCommunication } from "../../hooks/useCommunication";
import EmailModal from "../Communication/EmailModal";
import CommunicationLog from "../Communication/CommunicationLog";
import WhatsAppModal from "../Communication/WhatsAppModal";
import ScheduleModal from "../Scheduling/ScheduleModal";
import EventsList from "../Scheduling/EventsList";
import CreateProposalModal from "../Proposals/CreateProposalModal";
import ProposalDetailModal from "../Proposals/ProposalDetailModal";
import { useAuth } from "../../contexts/AuthContext";
import LeadTasksSection from "./LeadTasksSection";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useLeadsContext } from "../../contexts/leadcontext";
import { FiEdit, FiX, FiCheck } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";
import axios from "axios";

interface LeadDetailModalProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
}) => {
  if (!lead || !isOpen) return null;

  // const { proposals: leadProposals = [], loading: proposalsLoading } =
  //   useProposals();
  const getAuthToken = () => localStorage.getItem("token");

  const url = import.meta.env.VITE_BACKEND_URL;
  const API_URL = `${url}/api/leads`;
  const { getCommunicationLogs } = useCommunication();
  const {
    updateLead,
    addRemark,
    deleteRemark,
    getAllRemarks,
    activities,
    getAllActivities,
    createProposal,
    proposals,
    proposalsLoading,
    getAllProposals,
  } = useLeadsContext();
  const { user } = useAuth();
  const [newRemark, setNewRemark] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCreateProposalModalOpen, setIsCreateProposalModalOpen] =
    useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [localLead, setLocalLead] = useState(lead);
  const [localPOCs, setLocalPOCs] = useState(lead.points_of_contact || []);
  const { profile } = useAuth();
  const [isEditingPOCs, setIsEditingPOCs] = useState(false);
  const [remarks, setRemarks] = useState<Remark[]>([]);

  const stages = [
    "New",
    "Contacted",
    "Proposal Sent",
    "Negotiation",
    "Won",
    "Lost",
    "Onboarded",
    "No vendor",
  ];

  const communicationLogs = getCommunicationLogs(lead._id) || [];
  useEffect(() => {
    getAllProposals();
    getAllActivities();
  }, []);

  useEffect(() => {
    const fetchRemarks = async () => {
      const data = await getAllRemarks(lead._id);
      setRemarks(data);
    };

    if (lead._id) {
      fetchRemarks();
    }
  }, [lead._id, getAllRemarks]);

  // Safe filter for proposals
  const filteredProposals = (proposals || []).filter(
    (proposal) => proposal.lead_id._id === lead._id
  );

  const handleStageUpdate = async (newStage: string) => {
    try {
      await updateLead(localLead._id, { stage: newStage });
      setLocalLead({
        ...localLead,
        stage: newStage,
        updated_at: new Date().toISOString(),
      });
      toast.success(`Lead stage updated to ${newStage}`);
    } catch (error: any) {
      toast.error(error.response.data.message || "Failed to update stage");
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;

    try {
      // await addRemark("text", newRemark);
      await addRemark(localLead._id, {
        content: newRemark,
        type: "text",
        profile,
      });

      setNewRemark("");
      toast.success("Remark added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add remark");
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "New":
        return "bg-blue-500";
      case "Contacted":
        return "bg-yellow-500";
      case "Proposal Sent":
        return "bg-purple-500";
      case "Negotiation":
        return "bg-orange-500";
      case "Won":
        return "bg-green-500";
      case "Lost":
        return "bg-red-500";
      case "Onboarded":
        return "bg-emerald-500";
   
      default:
        return "bg-gray-500";
    }
  };

  const getProposalStatusColor = (status: string) => {
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const file = new File([blob], `voice_${Date.now()}.webm`, {
            type: "audio/webm",
          });

          // Use FormData to upload
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "voice");
          formData.append("profile", JSON.stringify(profile));

          try {
            const response = await axios.post(
              `${API_URL}/${localLead._id}/upload-remark-voice`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${getAuthToken()}`,
                },
              }
            );

            toast.success("Voice note uploaded successfully!");
            // Update local remarks
            setRemarks(response.data.remarks);
          } catch (error: any) {
            toast.error(error.message || "Failed to upload voice note");
          }
        };

        recorder.start();
        setIsRecording(true);
      } catch (error) {
        toast.error("Microphone access denied or not available");
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileUrl = reader.result as string;
      try {
        await addRemark(localLead._id, {
          type: "file",
          fileUrl,
          fileName: file.name,
          profile,
        });
        toast.success("File uploaded as remark!");
      } catch (error: any) {
        toast.error(error.message || "Failed to upload file");
      } finally {
        setUploadingFile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLeadUpdate = async (field: string, value: any) => {
    try {
      await updateLead(lead._id, { [field]: value });
      toast.success(`${field} updated successfully`);
    } catch (error: any) {
      toast.error(error.response.data.message || `Failed to update ${field}`);
    }
  };

  const handlePOCUpdate = (index: number, field: string, value: string) => {
    const updatedPOCs = [...lead.points_of_contact];
    updatedPOCs[index][field] = value;
    handleLeadUpdate("points_of_contact", updatedPOCs);
  };

  const handlePOCChange = (index: number, field: string, value: string) => {
    const updatedPOCs = [...localPOCs];
    updatedPOCs[index][field] = value;
    setLocalPOCs(updatedPOCs);
  };
  const handleAddPOC = () => {
    setLocalPOCs([
      ...localPOCs,
      {
        name: "",
        designation: "",
        phone: "",
        email: "",
        linkedin_url: "",
        stage: "Contacted",
      },
    ]);
  };

  const handleRemovePOC = (index: number) => {
    const updatedPOCs = [...localPOCs];
    updatedPOCs.splice(index, 1);
    setLocalPOCs(updatedPOCs);
  };
  const handleSavePOCs = async () => {
    try {
      await updateLead(lead._id, { points_of_contact: localPOCs });
      toast.success("Points of Contact updated successfully!");
    } catch (error: any) {
      toast.error(
        error.response.data.message || "Failed to update Points of Contact"
      );
    }
  };
  const handleDelete = async (remarkId: string) => {
    await deleteRemark(localLead._id, remarkId);
  };

  // handle to get the activity changes clearly
  const formatUpdatedFields = (updatedFields: any) => {
    if (!updatedFields) return null;

    return Object.entries(updatedFields)
      .filter(([key, value]) => {
        // ignore big/complex fields
        return !["remarks", "points_of_contact", "files", "documents"].includes(
          key
        );
      })
      .map(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          // if it's a create action, value may be the whole object
          return (
            <span key={key}>
              {key}: {value?.company_name || value?.title || "[object]"};{" "}
            </span>
          );
        }
        return (
          <span key={key}>
            {key}: {value};{" "}
          </span>
        );
      });
  };

  const filteredActivities = activities?.filter(
    (activity) => activity.entityId === lead._id || activity.leadId === lead._id
  );
// Sort descending (latest first)
const sortedRemarks = remarks.sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
);

console.log(sortedRemarks);
  console.log(remarks, "remarks");

  return (
    <div
      style={{ marginTop: "0px" }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 "
    >
      <audio ref={audioRef} hidden />
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col ">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{lead.company_name || "-"}</h2>

              <div className="mt-4">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Lead Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {stages.map((stage) => {
                    const isCurrent = stage === localLead.stage;
                    const isLocked =
                      localLead.locked && localLead.locked_by !== profile?.id;
                    const canUpdate =
                      (profile?.role === "BD Executive" ||
                        profile?.role === "Admin") &&
                      !isLocked;

                    return (
                      <div
                        key={stage}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200
            ${
              isCurrent
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-200 text-gray-800"
            }
            ${
              canUpdate
                ? "cursor-pointer hover:bg-gray-300"
                : "opacity-60 cursor-not-allowed"
            }
          `}
                        onClick={() => {
                          if (canUpdate) {
                            handleStageUpdate(stage);
                          }
                        }}
                      >
                        {stage}
                        {isCurrent && localLead.updated_at && (
                          <>
                            {" "}
                            – Latest Update:{" "}
                            {format(
                              new Date(localLead.updated_at),
                              "MMM dd, yyyy"
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {lead.locked && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-200 text-sm font-medium">
                    Lead Locked
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6 px-6">
            {[
              { id: "overview", label: "Overview", icon: Building2 },
              { id: "remarks", label: "Remarks", icon: MessageSquare },
              { id: "proposals", label: "Proposals", icon: FileText },
              { id: "tasks", label: "Tasks", icon: CheckSquare },
              {
                id: "communications",
                label: "Communications",
                icon: MessageCircle,
              },
              { id: "activity", label: "Activity", icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Company Information
                </h3>
                <div className="space-y-4">
                  {lead.company_info && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        About Company
                      </p>
                      <p className="text-gray-900 mt-1">{lead.company_info}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {lead.company_size && (
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Company Size</p>
                          <p className="font-medium text-gray-900">
                            {lead.company_size} employees
                          </p>
                        </div>
                      </div>
                    )}
                    {lead.website_url && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Website</p>
                          <a
                            href={lead.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      </div>
                    )}
                    {lead.lead_source && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Lead Source</p>
                          <p className="font-medium text-gray-900">
                            {lead.lead_source}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {lead.hiring_needs && lead.hiring_needs.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-2">
                        Hiring Needs
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lead.hiring_needs.map(
                          (need: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                            >
                              {need}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Points of Contact */}

              <div className="space-y-3 bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Points of Contact
                  </h3>

                  {(profile?.role === "BD Executive" ||
                    profile?.role === "Admin") && (
                    <button
                      onClick={() => setIsEditingPOCs(!isEditingPOCs)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition"
                      title={isEditingPOCs ? "Cancel Edit" : "Edit Contacts"}
                    >
                      {isEditingPOCs ? <FiX size={18} /> : <FiEdit size={18} />}
                    </button>
                  )}
                </div>
                <div className="overflow-auto">
                  {isEditingPOCs ? (
                    localPOCs.map((contact, index) => (
                      <div
                        key={index}
                        className="flex  items-center gap-2 bg-gray-50 p-2 rounded-lg "
                      >
                        <>
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">
                              Name
                            </label>
                            <input
                              value={contact.name}
                              onChange={(e) =>
                                handlePOCChange(index, "name", e.target.value)
                              }
                              placeholder="Name"
                              className="px-3 py-2 border rounded-lg text-sm w-30"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">
                              Designation
                            </label>
                            <input
                              value={contact.designation}
                              onChange={(e) =>
                                handlePOCChange(
                                  index,
                                  "designation",
                                  e.target.value
                                )
                              }
                              placeholder="Designation"
                              className="px-3 py-2 border rounded-lg text-sm w-28"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">
                              Phone
                            </label>
                            <input
                              value={contact.phone}
                              onChange={(e) =>
                                handlePOCChange(index, "phone", e.target.value)
                              }
                              placeholder="Phone"
                              className="px-3 py-2 border rounded-lg text-sm w-28"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">
                              Email
                            </label>
                            <input
                              value={contact.email}
                              onChange={(e) =>
                                handlePOCChange(index, "email", e.target.value)
                              }
                              placeholder="Email"
                              className="px-3 py-2 border rounded-lg text-sm w-28"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">
                              LinkedIn URL
                            </label>
                            <input
                              value={contact.linkedin_url}
                              onChange={(e) =>
                                handlePOCChange(
                                  index,
                                  "linkedin_url",
                                  e.target.value
                                )
                              }
                              placeholder="LinkedIn URL"
                              className="px-3 py-2 border rounded-lg text-sm w-32"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">
                              Stage
                            </label>

                            <select
                              value={contact.stage}
                              onChange={(e) =>
                                handlePOCChange(index, "stage", e.target.value)
                              }
                              className="px-3 py-2 border rounded-lg text-sm w-34"
                            >
                              <option value="Contacted">Contacted</option>
                              <option value="Busy">Busy</option>
                              <option value="No Answer">No Answer</option>
                              <option value="Wrong Number">Wrong Number</option>
                            </select>
                          </div>
                          {/* Remove Contact */}
                          <button
                            onClick={() => handleRemovePOC(index)}
                            className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            title="Remove Contact"
                          >
                            &times;
                          </button>
                        </>
                      </div>
                    ))
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="border-separate border-spacing-x-6 border-spacing-y-2 w-full ">
                        <thead>
                          <tr className="border-b border-purple-200">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Name
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Designation
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Phone
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Email
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Linkdin url
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                              Stage
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {localPOCs.map((contact, index) => (
                            <tr
                              key={index}
                              className="border-b border-purple-100 gap-4 whitespace-nowrap"
                            >
                              <td className="">{contact.name}</td>
                              <td>{contact.designation || "-"}</td>
                              <td>{contact.phone || "-"}</td>
                              <td>
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {contact.email}
                                </a>
                              </td>
                              <td>
                                <a
                                  href={contact.linkedin_url}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {contact.linkedin_url}
                                </a>
                              </td>
                              <td>{contact.stage || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {isEditingPOCs &&
                  (profile?.role === "BD Executive" ||
                    profile?.role === "Admin") && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleAddPOC}
                        className="bg-green-500 text-white px-4 py-1 rounded-lg hover:bg-green-600 transition"
                      >
                        + Add Contact
                      </button>
                      <button
                        onClick={handleSavePOCs}
                        className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">
                        {lead.contact_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">
                        {lead.contact_phone}
                      </p>
                    </div>
                  </div> */}
                  {/* <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Designation</p>
                      <p className="font-medium text-gray-900">
                        {lead.contact_designation || "Not specified"}
                      </p>
                    </div>
                  </div> */}
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Industry</p>
                      <p className="font-medium text-gray-900">
                        {lead.industry_name || "Not specified"}
                      </p>
                    </div>
                  </div>
                  {lead.linkedin_link && (
                    <div className="flex items-center space-x-3 md:col-span-2">
                      <Activity className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">
                          LinkedIn Profile
                        </p>
                        <a
                          href={lead.linkedin_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 underline"
                        >
                          View LinkedIn Profile
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Contact Owner</p>
                      <p className="font-medium text-gray-900">
                        {lead.assignedBy
                          ? `${lead.assignedBy.role} - ${lead.assignedBy.name}`
                          : "Unassigned"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {(lead.no_of_designations || lead.no_of_positions) && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Lead Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lead.no_of_designations && (
                      <div>
                        <p className="text-sm text-gray-600">Designations</p>
                        <p className="text-2xl font-bold text-green-600">
                          {lead.no_of_designations}
                        </p>
                      </div>
                    )}
                    {lead.no_of_positions && (
                      <div>
                        <p className="text-sm text-gray-600">Positions</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {lead.no_of_positions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors">
                  <Phone className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-blue-600">
                    Call
                  </span>
                </button>
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors"
                >
                  <Mail className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-purple-600">
                    Email
                  </span>
                </button>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-center transition-colors"
                >
                  <Calendar className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-indigo-600">
                    Schedule
                  </span>
                </button>
                <button
                  onClick={() => setIsWhatsAppModalOpen(true)}
                  className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-center transition-colors"
                >
                  <MessageCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-green-600">
                    WhatsApp
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "remarks" && (
            <div className="space-y-4">
              {(profile?.role === "BD Executive" ||
                profile?.role === "Admin") && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Add Remark
                  </h3>
                  <div className="flex space-x-3">
                    <textarea
                      value={newRemark}
                      onChange={(e) => setNewRemark(e.target.value)}
                      placeholder="Add a remark..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={handleAddRemark}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleVoiceRecord}
                        className={`p-2 rounded-lg transition-colors ${
                          isRecording
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                        title="Record Voice Note"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <label
                        className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                        title="Upload File"
                      >
                        <Paperclip className="w-5 h-5" />
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Remarks Timeline
                </h3>

                {sortedRemarks.map((remark) => (
                  <div key={remark._id} className="flex space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {remark.profile?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {remark.profile?.name || "User"}
                        </h4>
                        <div className="flex flex-col gap-2 justify-center items-center">
                          <span className="text-xs text-gray-500">
                            {format(
                              new Date(remark.created_at),
                              "MMM dd, yyyy HH:mm"
                            )}
                          </span>
                          {(profile?.role === "BD Executive" ||
                            profile?.role === "Admin") && (
                            <FaTrash
                              style={{ cursor: "pointer", color: "red" }}
                              onClick={() => handleDelete(remark._id)}
                              title="Delete remark"
                            />
                          )}
                        </div>
                      </div>

                      {/* Show remark text */}
                      {remark.content && (
                        <p className="text-gray-700">{remark.content}</p>
                      )}

                      {/* Show voice or file */}
                      {remark.type !== "text" && (
                        <div className="mt-2 text-sm text-blue-600">
                          <div className="flex items-center space-x-2">
                            {remark.type === "voice" ? (
                              <>
                                <div className="mt-2 text-sm text-blue-600">
                                  <audio controls>
                                    <source
                                      src={`${url}/${remark.voiceUrl}`}
                                      type="audio/webm"
                                    />
                                    Your browser does not support the audio
                                    element.
                                  </audio>
                                </div>
                              </>
                            ) : (
                              <>
                                <Paperclip className="w-4 h-4" />
                                <span>File Attachment</span>
                                <a
                                  href={remark.fileUrl}
                                  download
                                  className="text-blue-600 hover:text-blue-800 underline text-xs"
                                >
                                  Download
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {remarks.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      No remarks yet. Add the first remark above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "proposals" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Proposals for {lead.company_name}
                </h3>
                <button
                  onClick={() => setIsCreateProposalModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Create Proposal</span>
                </button>
              </div>

              {/* Proposals List */}
              {proposalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No proposals yet</p>
                  <p className="text-sm text-gray-500">
                    Create your first proposal for this lead
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              #{proposal._id.slice(-8)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {proposal.template_used}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getProposalStatusColor(
                            proposal.status
                          )}`}
                        >
                          {proposal.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Template:</span>
                          <span className="text-gray-900 ml-2 font-medium">
                            {proposal.template_used}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Rate Card:</span>
                          <span className="text-gray-900 ml-2 font-medium">
                            {proposal.rate_card_version}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sent Via:</span>
                          <span className="text-gray-900 ml-2 font-medium">
                            {proposal.sent_via}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-900 ml-2 font-medium">
                            {format(
                              new Date(proposal.createdAt),
                              "MMM dd, yyyy HH:mm"
                            )}
                          </span>
                        </div>
                        {proposal.sent_at && (
                          <div>
                            <span className="text-gray-500">Sent:</span>
                            <span className="text-gray-900 ml-2 font-medium">
                              {format(
                                new Date(proposal.sent_at),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedProposal(proposal)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          View Details
                        </button>
                        {proposal.status === "Draft" && (
                          <button
                            onClick={() => {
                              toast.info(
                                "Send proposal functionality available in proposal details"
                              );
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Send Proposal
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "communications" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Communication History
                </h3>
              </div>
              <CommunicationLog logs={communicationLogs} />
            </div>
          )}

          {activeTab === "tasks" && <LeadTasksSection leadId={lead._id} />}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Activity Timeline
              </h3>
              <div className="space-y-4">
                {filteredActivities.map((activity, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">
                          {activity.action}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">
                        {activity.entity}: {activity.entityName}
                      </p>
                      {activity.action === "create" && (
                        <p className="text-sm text-gray-600">
                          {activity.entity} Created: {activity.entityName}
                        </p>
                      )}

                      {activity.action !== "create" &&
                        activity.updatedFields && (
                          <p className="text-sm text-gray-600">
                            Changes:{" "}
                            {formatUpdatedFields(activity.updatedFields)}
                          </p>
                        )}

                      {activity.remarks &&
                        activity.remarks.map((remark: any) => (
                          <div
                            key={remark._id}
                            className="text-xs text-gray-500 mt-1"
                          >
                            {remark.type}:{" "}
                            {remark.content ||
                              remark.fileUrl ||
                              remark.voiceUrl}
                          </div>
                        ))}

                      {activity.leadId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Linked Lead: {lead.company_name || activity.leadId}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {filteredActivities.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No Activities yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        lead={lead}
      />
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        lead={lead}
      />
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        lead={lead}
      />
      {isCreateProposalModalOpen && (
        <CreateProposalModal
          isOpen
          onClose={() => setIsCreateProposalModalOpen(false)}
          leadId={lead.id}
        />
      )}
      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          isOpen
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
};

export default LeadDetailModal;
