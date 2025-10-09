import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Get token from localStorage (or wherever you store it after login)
const getAuthToken = () => localStorage.getItem("token");

export const useEmail = () => {
  const [loading, setLoading] = useState(false);
  const [fetchmails, setfetchmails] = useState(false);

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

      // Use FormData to support attachments
      const formData = new FormData();
      formData.append("fromEmail", fromEmail);
      formData.append("appPassword", appPassword);
      formData.append("toEmail", toEmail);
      formData.append("subject", subject);
      formData.append("content", content);
      if (senderName) formData.append("senderName", senderName);
      if (receiverName) formData.append("receiverName", receiverName);

      // Append attachments only if files exist
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

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
      console.log(res);
      setSentEmails(res.data || []);
    } catch (err: any) {
      console.error("Fetch Sent Error:", err);
      setError("Failed to fetch sent emails");
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH INBOX EMAILS ---

  const fetchInboxEmails = async (fromEmail, appPassword) => {
    try {
      setfetchmails(true);
      const res = await axios.post(`${BACKEND_URL}/api/emails/fetch-emails`, {
        email: fromEmail,
        appPassword,
      });

      setInboxEmails(res.data.emails || []);
      setfetchmails(false);
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
      setInboxEmails([]);
      alert("Failed to fetch emails. Check credentials or internet.");
    }
  };

  // const fetchInboxEmails = (fromEmail, appPassword) => {
  //   setfetchmails(true);
  //   setInboxEmails([]); // clear previous emails

  //   const eventSource = new EventSource(
  //     `${BACKEND_URL}/api/emails/fetch-emails?email=${encodeURIComponent(
  //       fromEmail
  //     )}&appPassword=${encodeURIComponent(appPassword)}`
  //   );

  //   eventSource.addEventListener("batch", (event) => {
  //     const data = JSON.parse(event.data);
  //     setInboxEmails((prev) => [...prev, ...data.emails]);
  //   });

  //   eventSource.addEventListener("done", () => {
  //     setfetchmails(false);
  //     eventSource.close();
  //   });

  //   eventSource.addEventListener("error", (err) => {
  //     console.error("SSE error:", err);
  //     setfetchmails(false);
  //     eventSource.close();
  //   });
  // };
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
    console.log(email.email);
    fetchSentEmails(email.email);
    fetchInboxEmails(email.email, email.appPassword);
  }, []);

  return {
    loading,
    error,
    sentEmails,
    inboxEmails,
    sendEmail,
    fetchSentEmails,
    fetchInboxEmails,
    fetchmails,

    deleteEmail,
    searchEmails,
  };
};

export const useSendmessage = () => {
  const sendToWhatsApp = (phone: string, message: string) => {
    if (!phone) {
      alert("Phone number is missing!");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, ""); // remove any + or spaces
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    // Opens WhatsApp Web or Mobile
    window.open(whatsappUrl, "_blank");
  };
  return {
    sendToWhatsApp,
  };
};
