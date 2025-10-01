import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const url = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${url}/api/leads`;
const task_url = `${url}/api/tasks`;
const proposals_url = `${url}/api/proposals`;
const getAuthToken = () => localStorage.getItem("token");

interface Proposal {
  _id: string;
  lead_id: string;
  template_id: string;
  template_used: string;
  rate_card_version: string;
  sent_via: "Email" | "WhatsApp" | "Both";
  status: "Draft" | "Sent";
  user_id?: string;
  createdAt: string;
  updatedAt: string;
}

interface Remark {
  _id: string;
  content: string;
  type: "text" | "voice" | "file";
  fileUrl?: string;
  voiceUrl?: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
  };
}

interface Lead {
  _id: string;
  company_name: string;
  contact_name: string;
  remarks?: Remark[];
  // add other fields as needed
}

interface LeadsContextType {
  leads: Lead[];
  loading: boolean;
  fetchLeads: () => void;

  createLead: (data: any) => Promise<void>;
  updateLead: (id: string, data: any) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;

  addRemark: (leadId: string, remark: Partial<Remark>) => Promise<void>;
  deleteRemark: (leadId: string, remarkId: string) => Promise<void>;
  getAllRemarks: (leadId: string) => Promise<Remark[]>;

  createTask: (data: any) => Promise<void>;

  createProposal: (data: any) => Promise<void>;
  getAllProposals: () => Promise<Proposal[]>;
  getProposalsByLead: (leadId: string) => Promise<Proposal[]>;
  proposals: Proposal[];
}

const activities_url = `${url}/api/activitylogs`;

interface ActivityLog {
  _id: string;
  entityId: string;
  entityName: string;
  entity: "Lead" | "Task";
  action: "create" | "update" | "delete";
  leadId?: string;
  updatedFields: object;
  timestamp: string;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export const LeadsProvider = ({ children }: { children: React.ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState([]);
  const [alltasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalLoading] = useState(true);
   const { profile } = useAuth();
console.log(profile, "profile");
 
  // const fetchLeads = async () => {
  //   try {
  //     setLoading(true);
  //     const res = await axios.get(API_URL, {
  //       headers: { Authorization: `Bearer ${getAuthToken()}` },
  //     });
  //     setLeads(res.data);
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Get leads, optionally filtered by assignedBy
  // const getLeads = async (assignedBy?: string): Promise<Lead[]> => {
  //   try {
  //     const query = assignedBy ? `?assignedBy=${assignedBy}` : "";
  //     const res = await axios.get(`${url}/api/leads${query}`, {
  //       headers: { Authorization: `Bearer ${getAuthToken()}` },
  //     });
  //     setLeads(res.data);
  //     return res.data; // returns array of leads
  //   } catch (err) {
  //     console.error("Error fetching leads:", err);
  //     return [];
  //   }
  // };

  const fetchLeads = async (assignedBy?: string): Promise<Lead[]> => {
    try {
      setLoading(true);
      console.log(assignedBy);
      const query = assignedBy ? `?assignedBy=${assignedBy}` : "";
      const res = await axios.get(`${API_URL}${query}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setLeads(res.data);
      return res.data;
    } catch (err) {
      console.error("Error fetching leads:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const bulkUploadLeads = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/upload-csv`, formData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "multipart/form-data",
        },
      });
      fetchLeads(profile.role === "BD Executive" ? profile.id : undefined);
      return res.data;
    } catch (err) {
      console.error("Error uploading bulk leads:", err);
    }
  };

  const createLead = async (data: any) => {
    const res = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setLeads((prev) => [res.data, ...prev]);
  };

  const updateLead = async (id: string, data: any) => {
    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setLeads((prev) => prev.map((lead) => (lead._id === id ? res.data : lead)));
  };

  const deleteLead = async (id: string) => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setLeads((prev) => prev.filter((l) => l._id !== id));
  };

  // ============================
  // 🚀 Remarks Handlers
  // ============================
  const addRemark = async (leadId: string, remark: Partial<Remark>) => {
    const res = await axios.post(`${API_URL}/${leadId}/addnewremark`, remark, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    setLeads((prev) =>
      prev.map((lead) =>
        lead._id === leadId ? { ...lead, remarks: res.data.remarks } : lead
      )
    );
  };

  const deleteRemark = async (leadId: string, remarkId: string) => {
    const res = await axios.delete(`${API_URL}/${leadId}/remarks/${remarkId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    setLeads((prev) =>
      prev.map((lead) =>
        lead._id === leadId ? { ...lead, remarks: res.data.remarks } : lead
      )
    );
  };

  // ✅ Get all remarks for a lead
  const getAllRemarks = async (leadId: string): Promise<Remark[]> => {
    try {
      const res = await axios.get(`${API_URL}/${leadId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return res.data; // returns array of remarks
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // inside your existing LeadsContext.tsx, add this:

  // const getAllTasks = async () => {
  //   try {
  //     console.log("r");
  //     const res = await axios.get(`${url}/api/tasks`, {
  //       headers: { Authorization: `Bearer ${getAuthToken()}` },
  //     });

  //     setAllTasks(res.data);
  //     return res.data;
  //     // returns array of tasks for this lead
  //   } catch (err) {
  //     console.error("Error fetching tasks by lead:", err);
  //     return [];
  //   }
  // };

  const getAllTasks = async (userId?: string): Promise<Task[]> => {
    try {
      const query = userId ? `?userId=${userId}` : "";
      const res = await axios.get(`${url}/api/tasks${query}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setAllTasks(res.data);
      return res.data;
    } catch (err) {
      console.error("Error fetching tasks:", err);
      return [];
    }
  };

  const createTask = async (data: any) => {
    try {
      const res = await axios.post(`${task_url}`, data, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      getAllTasks();
      // optionally, you can store tasks in state if needed
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };
  const getTasksByLead = async (leadId: string): Promise<Task[]> => {
    try {
      const res = await axios.get(`${url}/api/tasks/lead/${leadId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return res.data; // returns array of tasks for this lead
    } catch (err) {
      console.error("Error fetching tasks by lead:", err);
      return [];
    }
  };

  const updateTask = async (id: string, data: any) => {
    try {
      const res = await axios.put(`${url}/api/tasks/${id}`, data, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      return res.data;
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };
  const deletetask = async (id: string) => {
    await axios.delete(`${url}/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
  };

  // activitylogs retrive all
  // Fetch all activities
  const getAllActivities = async (): Promise<ActivityLog[]> => {
    try {
      const res = await axios.get(`${activities_url}/activities`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setActivities(res.data);
      return res.data;
    } catch (err) {
      console.error("Error fetching activities:", err);
      return [];
    }
  };

  // proposals
  const createProposal = async (data: any) => {
    try {
      console.log(data, "data");
      const res = await axios.post(`${proposals_url}`, data, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setProposals((prev) => [res.data, ...prev]);
    } catch (err: any) {
      console.error("Error creating proposal:", err);
    }
  };
  // const getAllProposals = async (): Promise<Proposal[]> => {
  //   try {
  //     setProposalLoading(true);
  //     const res = await axios.get(`${proposals_url}`, {
  //       headers: { Authorization: `Bearer ${getAuthToken()}` },
  //     });

  //     setProposals(res.data);
  //     setProposalLoading(false);
  //     return res.data;
  //   } catch (err) {
  //     console.error("Error fetching proposals:", err);
  //     return [];
  //   }
  // };
const getAllProposals = async (userId?: string): Promise<Proposal[]> => {
  try {
    setProposalLoading(true);
    const query = userId ? `?userId=${userId}` : "";
    const res = await axios.get(`${proposals_url}${query}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setProposals(res.data);
    setProposalLoading(false);
    return res.data;
  } catch (err) {
    console.error("Error fetching proposals:", err);
    setProposalLoading(false);
    return [];
  }
};

  const updateProposal = async (id: string, data: Partial<Proposal>) => {
    try {
      const res = await axios.put(`${proposals_url}/${id}`, data, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      // Update local state with the new proposal data
      setProposals((prev) =>
        prev.map((proposal) => (proposal._id === id ? res.data : proposal))
      );

      return res.data;
    } catch (err) {
      console.error("Error updating proposal:", err);
      throw err;
    }
  };

  const deleteProposal = async (id: string) => {
    try {
      await axios.delete(`${proposals_url}/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      // Update local state after delete
      setProposals((prev) => prev.filter((proposal) => proposal._id !== id));
    } catch (err) {
      console.error("Error deleting proposal:", err);
      throw err;
    }
  };

 useEffect(() => {
   if (!profile) return;
const userId = profile.role === "BD Executive" ? profile.id : undefined;

   fetchLeads(userId);
   getAllActivities();
   getAllProposals(userId);
   getAllTasks(userId);
 }, [profile]);

  return (
    <LeadsContext.Provider
      value={{
        leads,
        loading,
        fetchLeads,

        bulkUploadLeads,
        createLead,
        updateLead,
        deleteLead,
        getAllRemarks,
        addRemark,
        deleteRemark,
        createTask,
        getAllTasks,
        getTasksByLead,
        alltasks,
        updateTask,
        deletetask,
        activities,
        getAllActivities,
        createProposal,
        proposals,
        getAllProposals,
        proposalsLoading,
        updateProposal,
        deleteProposal,
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeadsContext = () => {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error("useLeadsContext must be used within LeadsProvider");
  }
  return context;
};
