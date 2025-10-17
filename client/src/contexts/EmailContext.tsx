import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// --- Get token helper
const getAuthToken = () => localStorage.getItem("token");

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  content: string;
  attachments?: any[];
  createdAt?: string;
}

interface EmailContextType {
  sentEmails: Email[];
  inboxEmails: Email[];
  loading: boolean;
  error: string | null;
  sendEmail: (data: {
    fromEmail: string;
    appPassword: string;
    toEmail: string;
    subject: string;
    content: string;
    senderName?: string;
    receiverName?: string;
    attachments?: File[];
  }) => Promise<any>;
  fetchSentEmails: (userEmail?: string) => Promise<void>;
  deleteEmail: (emailId: string, type: "Sent" | "Inbox") => Promise<void>;
  searchEmails: (term: string, type: "Sent" | "Inbox") => Email[];
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (!context) throw new Error("useEmail must be used within EmailProvider");
  return context;
};

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(false);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [inboxEmails, setInboxEmails] = useState<Email[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* -----------------------------
   Fetch All Call Activities
------------------------------ */
  const fetchAllCallActivities = async () => {
    try {
      console.log("callllll");
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return res.data.calls || [];
    } catch (err: any) {
      console.error("Failed to fetch call activities:", err);
      toast.error("Failed to fetch call activities");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCalls = async (userId: string) => {
    try {
      // optional: show loader if you have one
      // setLoading(true);

      const res = await axios.get(`${BACKEND_URL}/api/users/calls/${userId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }, // if using auth
      });

      return res.data || []; // return array of call logs
    } catch (err: any) {
      console.error("Failed to fetch calls:", err);
      toast.error("Failed to fetch user calls");
      return [];
    }
  };

  const logCallActivity = async ({
    userId,
    leadId,
    phone,
  }: {
    userId: string;
    leadId: string;
    phone: string;
  }) => {
    try {
      console.log("hit");
      const response = await fetch(`${BACKEND_URL}/api/users/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, leadId, phone }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to log call");
      }

      return await response.json();
    } catch (error) {
      console.error("Error logging call activity:", error);
      throw error;
    }
  };

  /* -----------------------------
     Fetch Sent Emails
  ------------------------------ */
  const fetchSentEmails = async (userEmail?: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/emails/sent`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        params: { userEmail },
      });
      setSentEmails(res.data || []);
    } catch (err: any) {
      console.error("Fetch Sent Error:", err);
      setError("Failed to fetch sent emails");
      toast.error("Failed to fetch sent emails");
    } finally {
      setLoading(false);
    }
  };

  const allemails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/emails/all`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return res.data
    } catch (err: any) {
      console.error("Fetch Sent Error:", err);
      setError("Failed to fetch sent emails");
      toast.error("Failed to fetch sent emails");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Send Email
  ------------------------------ */
  const sendEmail = async ({
    fromEmail,
    appPassword,
    toEmail,
    subject,
    content,
    senderName,
    receiverName,
    attachments = [],
  }: {
    fromEmail: string;
    appPassword: string;
    toEmail: string;
    subject: string;
    content: string;
    senderName?: string;
    receiverName?: string;
    attachments?: File[];
  }) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("fromEmail", fromEmail);
      formData.append("appPassword", appPassword);
      formData.append("toEmail", toEmail);
      formData.append("subject", subject);
      formData.append("content", content);
      if (senderName) formData.append("senderName", senderName);
      if (receiverName) formData.append("receiverName", receiverName);

      attachments.forEach((file) => formData.append("attachments", file));

      const res = await axios.post(
        `${BACKEND_URL}/api/emails/send-email`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const profile_user = localStorage.getItem("profile");
      const emailgiv = JSON.parse(profile_user).email;
      fetchSentEmails(emailgiv);
      toast.success("Email sent successfully!");
      return res.data;
    } catch (err: any) {
      console.error("Send Email Error:", err);
      setError(err?.response?.data?.message || "Failed to send email");
      toast.error(err?.response?.data?.message || "Failed to send email");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Delete Email
  ------------------------------ */
  const deleteEmail = async (emailId: string, type: "Sent" | "Inbox") => {
    try {
      setLoading(true);
      await axios.delete(`${BACKEND_URL}/api/emails/${emailId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      if (type === "Sent")
        setSentEmails((prev) => prev.filter((e) => e._id !== emailId));
      else setInboxEmails((prev) => prev.filter((e) => e.id !== emailId));

      toast.success("Email deleted successfully!");
    } catch (err) {
      console.error("Delete Email Error:", err);
      setError("Failed to delete email");
      toast.error("Failed to delete email");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Search Emails
  ------------------------------ */
  const searchEmails = (term: string, type: "Sent" | "Inbox") => {
    const list = type === "Sent" ? sentEmails : inboxEmails;
    return list.filter(
      (email) =>
        email.subject?.toLowerCase().includes(term.toLowerCase()) ||
        email.content?.toLowerCase().includes(term.toLowerCase()) ||
        email.from?.toLowerCase().includes(term.toLowerCase()) ||
        email.to?.some((t: string) =>
          t.toLowerCase().includes(term.toLowerCase())
        )
    );
  };

  /* -----------------------------
     Initial Fetch (optional)
  ------------------------------ */
  useEffect(() => {
    const user = localStorage.getItem("profile");
    if (user) {
      const email = JSON.parse(user).email;
      fetchSentEmails(email);
    }
  }, []);

  return (
    <EmailContext.Provider
      value={{
        loading,
        error,
        sentEmails,
        inboxEmails,
        sendEmail,
        allemails,
        fetchSentEmails,
        deleteEmail,
        searchEmails,
        fetchAllCallActivities,
        fetchUserCalls,
        logCallActivity,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
};
