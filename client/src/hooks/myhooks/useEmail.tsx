import { useState } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Get token from localStorage (or wherever you store it after login)
const getAuthToken = () => localStorage.getItem("token");

export const useEmail = () => {
  const [loading, setLoading] = useState(false);

  const sendEmail = async ({
    toEmail,
    subject,
    content,
  }: {
    toEmail: string;
    subject: string;
    content: string;
  }) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${BACKEND_URL}/api/send-email`,
        { toEmail, subject, content },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      return res.data;
    } catch (err: any) {
      console.error(err);
      throw new Error(err?.response?.data?.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendEmail,
  };
};
