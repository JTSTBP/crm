
import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Get token from localStorage (or wherever you store it after login)
const getAuthToken = () => localStorage.getItem("token");

export const useEmail = () => {
  const [loading, setLoading] = useState(false);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [inboxEmails, setInboxEmails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- SEND EMAIL ---
  const sendEmail = async ({
    fromEmail,
    appPassword,
    toEmail,
    subject,
    content,
    senderName,
    receiverName,
  }: {
    fromEmail: string;
    appPassword: string;
    toEmail: string;
    subject: string;
    content: string;
    senderName?: string;
    receiverName?: string;
  }) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${BACKEND_URL}/api/emails/send-email`,
        {
          fromEmail,
          appPassword,
          toEmail,
          subject,
          content,
          senderName,
          receiverName,
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setSentEmails((prev) => [res.data.email, ...prev]);
      return res.data;
    } catch (err: any) {
      console.error("Send Email Error:", err);
      setError(err?.response?.data?.message || "Failed to send email");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH SENT EMAILS ---
  const fetchSentEmails = async (userEmail?: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/emails/sent`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        params: { userEmail },
      });
      console.log(res)
      setSentEmails(res.data || []);
    } catch (err: any) {
      console.error("Fetch Sent Error:", err);
      setError("Failed to fetch sent emails");
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH INBOX EMAILS ---
  const fetchInboxEmails = async (userEmail?: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/emails/inbox`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        params: { userEmail },
      });
      setInboxEmails(res.data.inboxEmails || []);
    } catch (err: any) {
      console.error("Fetch Inbox Error:", err);
      setError("Failed to fetch inbox emails");
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE EMAIL ---
  const deleteEmail = async (emailId: string, type: "Sent" | "Inbox") => {
    try {
      setLoading(true);
      await axios.delete(`${BACKEND_URL}/api/emails/${emailId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      if (type === "Sent")
        setSentEmails((prev) => prev.filter((e) => e.id !== emailId));
      else setInboxEmails((prev) => prev.filter((e) => e.id !== emailId));
    } catch (err) {
      console.error("Delete Email Error:", err);
      setError("Failed to delete email");
    } finally {
      setLoading(false);
    }
  };

  // --- SEARCH EMAILS ---
  const searchEmails = (term: string, type: "Sent" | "Inbox") => {
    const list = type === "Sent" ? sentEmails : inboxEmails;
    return list.filter(
      (email) =>
        email.subject?.toLowerCase().includes(term.toLowerCase()) ||
        email.body?.toLowerCase().includes(term.toLowerCase()) ||
        email.from?.toLowerCase().includes(term.toLowerCase()) ||
        email.to?.some((t: string) =>
          t.toLowerCase().includes(term.toLowerCase())
        )
    );
  };

  // --- INITIAL FETCH ---
  useEffect(() => {
    const userEmail = localStorage.getItem("profile");
    // optional
    const email = JSON.parse(userEmail);
    console.log(email.email)
    fetchSentEmails(email.email);
    fetchInboxEmails(userEmail);
  }, []);

  return {
    loading,
    error,
    sentEmails,
    inboxEmails,
    sendEmail,
    fetchSentEmails,
    fetchInboxEmails,
    deleteEmail,
    searchEmails,
  };
};
