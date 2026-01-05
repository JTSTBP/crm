import { useState, useEffect } from "react";
import axios from "axios";

const url = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${url}/api/leads`;

// Get token from localStorage (or wherever you store it after login)
const getAuthToken = () => localStorage.getItem("token");

export const useLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      // Handle both old and new response formats
      if (res.data.leads) {
        setLeads(res.data.leads);
      } else {
        setLeads(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);
  useEffect(() => {

  }, [loading]);


  const createLead = async (data: any) => {

    const res = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    await fetchLeads();
    // setLeads((prev) => [res.data, ...prev]);
  };

  const updateLead = async (id: string, data: any) => {
    setLoading(true);

    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setLeads((prev) => prev.map((lead) => (lead._id === id ? res.data : lead)));

    setLoading(false);
    return res.data;
    // setLeads((prev) => prev.map((l) => (l._id === id ? res.data : l)));
  };

  const deleteLead = async (id: string) => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setLeads((prev) => prev.filter((l) => l._id !== id));
  };

  const toggleLeadStatus = async (id: string) => {
    const res = await axios.patch(`${API_URL}/${id}/status`, null, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setLeads((prev) => prev.map((l) => (l._id === id ? res.data : l)));
  };

  return {
    leads,
    loading,
    createLead,
    updateLead,
    toggleLeadStatus,
    deleteLead,
  };
};
