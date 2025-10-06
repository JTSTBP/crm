import { useState, useEffect } from "react";
import axios from "axios";

const url = import.meta.env.VITE_BACKEND_URL;

const API_URL = `${url}/api/users`;

// Get token from localStorage (or wherever you store it after login)
const getAuthToken = () => localStorage.getItem("token");

export const useUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (data: any) => {
    const res = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    await fetchUsers();
  };

  const updateUser = async (id: string, data: any) => {
    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
  };

  const toggleUserStatus = async (id: string) => {
    const res = await axios.patch(`${API_URL}/${id}/status`, null, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
  };

  const deleteUser = async (id: string) => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    setUsers((prev) => prev.filter((u) => u._id !== id));
  };

  return {
    users,
    loading,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
  };
};
