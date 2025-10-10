import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Paperclip,
  FileText,
  Plus,
  Minus,
  Upload,
} from "lucide-react";
import { useLeadsContext } from "../../contexts/leadcontext";
import { useAuth } from "../../contexts/AuthContext";
import { useEmail } from "../../contexts/EmailContext";
import { useCommunication, EmailTemplate } from "../../hooks/useCommunication";
import toast from "react-hot-toast";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: any;
  leadId?: string;
}

interface ComposeFormData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  leadId?: string;
}

const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  replyTo,
  leadId,
}) => {
  const { leads } = useLeadsContext();
  const { profile } = useAuth();
  const { sendEmail } = useEmail();
  const { getEmailTemplates } = useCommunication();

  const emailTemplates: EmailTemplate[] = getEmailTemplates();

  const [pointsOfContact, setPointsOfContact] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState<ComposeFormData>({
    to: [""],
    cc: [],
    bcc: [],
    subject: "",
    body: "",
    leadId: leadId || "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, string>
  >({});
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  useEffect(() => {
    if (formData.leadId) {
      const lead = leads.find((l) => l._id === formData.leadId);
      setPointsOfContact(lead?.points_of_contact || []);
    }
  }, [formData.leadId, leads]);

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate && formData.leadId) {
      const lead = leads.find((l) => l._id === formData.leadId);
      if (!lead) return;

      const values = {
        company_name: lead.company_name || "",
        contact_name: selectedContact?.name || "",
        contact_email: selectedContact?.email || "",
        consultant_name: profile?.name || "",
      };

      setPlaceholderValues(values);

      const subjectTemplate = selectedTemplate.subject || "";
      const bodyTemplate = selectedTemplate.body || "";

      const appliedSubject = subjectTemplate.replace(
        /\{\{(.*?)\}\}/g,
        (_, key) => values[key.trim()] || ""
      );
      const appliedBody = bodyTemplate.replace(
        /\{\{(.*?)\}\}/g,
        (_, key) => values[key.trim()] || ""
      );

      setFormData((prev) => ({
        ...prev,
        subject: appliedSubject,
        body: appliedBody,
      }));
    }
  }, [selectedTemplate, selectedContact, formData.leadId, leads, profile]);
  useEffect(() => {
    if (selectedTemplate) {
      const templateSubject = selectedTemplate.subject || "";
      const templateContent = selectedTemplate.content || "";

      // Apply placeholders
      let appliedSubject = templateSubject;
      let appliedContent = templateContent;

      Object.entries(placeholderValues).forEach(([key, value]) => {
        const safeValue = value || "";
        const regex = new RegExp(`{{${key}}}`, "g");
        appliedSubject = appliedSubject.replace(regex, safeValue);
        appliedContent = appliedContent.replace(regex, safeValue);
      });

      setFormData((prev) => ({
        ...prev,
        subject: appliedSubject,
        body: appliedContent,
      }));
    }
  }, [selectedTemplate, placeholderValues]);

  const handleContactSelect = (contactId: string) => {
    const contact = pointsOfContact.find((c) => c._id === contactId);
    if (!contact?.email) {
      toast.error("Selected contact has no email.");
      setSelectedContact(null);
      return;
    }
    setSelectedContact(contact);
    setFormData((prev) => ({ ...prev, to: [contact.email] }));
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
  };

  const addRecipient = (field: "to" | "cc" | "bcc") => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeRecipient = (field: "to" | "cc" | "bcc", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateRecipient = (
    field: "to" | "cc" | "bcc",
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((recipient, i) =>
        i === index ? value : recipient
      ),
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => file.size <= 25 * 1024 * 1024);
    if (validFiles.length !== files.length)
      toast.error("Some files were too large (max 25MB per file)");
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    try {
      const validTo = formData.to.filter(
        (email) => email.trim() && email.includes("@")
      );
      const validCc = formData.cc.filter(
        (email) => email.trim() && email.includes("@")
      );
      const validBcc = formData.bcc.filter(
        (email) => email.trim() && email.includes("@")
      );

      if (validTo.length === 0)
        return toast.error("Please add at least one valid recipient");
      if (!formData.subject.trim()) return toast.error("Please add a subject");
      if (!formData.body.trim()) return toast.error("Please add email content");

      const allRecipients = [...validTo, ...validCc, ...validBcc];

      await Promise.all(
        allRecipients.map((recipient) =>
          sendEmail({
            fromEmail: profile?.email || "",
            appPassword: profile?.appPassword || "",
            toEmail: recipient,
            subject: formData.subject,
            content: formData.body,
            senderName: profile?.name,
            receiverName: recipient,
            attachments,
          })
        )
      );

      toast.success("Email(s) sent successfully!");
      setFormData({
        to: [""],
        cc: [],
        bcc: [],
        subject: "",
        body: "",
        leadId: "",
      });
      setAttachments([]);
      setSelectedTemplate(null);
      setPlaceholderValues({});
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to send email");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        <div className="gradient-primary p-6 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            {replyTo ? "Reply to Email" : "Compose New Email"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Template Selection */}
          {!replyTo && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email Template
              </label>
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {emailTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 rounded-xl border-2 cursor-pointer ${
                      selectedTemplate?.id === template.id
                        ? "border-blue-400 bg-blue-500/20"
                        : "border-white/20 bg-white/10 hover:border-white/40"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-white">
                        {template.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {template.subject}
                    </p>
                  </div>
                ))}
              </div> */}

              <div className="w-full max-w-md">
                <label
                  htmlFor="templateSelect"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Select Email Template
                </label>

                <select
                  id="templateSelect"
                  value={selectedTemplate?.id || ""}
                  onChange={(e) => {
                    const selected = emailTemplates.find(
                      (template) => template.id === e.target.value
                    );
                    handleTemplateSelect(selected);
                  }}
                  className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-xl p-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option className="bg-gray-700 text-white" value="" disabled>
                    -- Choose a template --
                  </option>
                  {emailTemplates.map((template) => (
                    <option
                      className="bg-gray-700 text-white"
                      key={template.id}
                      value={template.id}
                    >
                      {template.name} — {template.subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Lead & Contact */}
          {!replyTo && (
            <>
              <select
                value={formData.leadId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, leadId: e.target.value }))
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              >
                <option className="bg-gray-700 text-white" value="">
                  Select a lead
                </option>
                {leads.map((lead) => (
                  <option
                    className="bg-gray-700 text-white"
                    key={lead._id}
                    value={lead._id}
                  >
                    {lead.company_name}
                  </option>
                ))}
              </select>

              <select
                value={selectedContact?._id || ""}
                onChange={(e) => handleContactSelect(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white mt-2"
              >
                <option className="bg-gray-700 text-white" value="">
                  -- Select Contact --
                </option>
                {pointsOfContact.map((contact) => (
                  <option
                    className="bg-gray-700 text-white"
                    key={contact._id}
                    value={contact._id}
                  >
                    {contact.name}{" "}
                    {contact.email ? `(${contact.email})` : "(No Email)"}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Recipients */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              To *
            </label>
            {formData.to.map((recipient, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => updateRecipient("to", index, e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  placeholder="Enter email address"
                />
                {formData.to.length > 1 && (
                  <button
                    onClick={() => removeRecipient("to", index)}
                    className="text-red-400"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addRecipient("to")}
              className="text-blue-400 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Recipient</span>
            </button>
          </div>

          {/* Subject */}
          <div>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              placeholder="Subject"
            />
          </div>

          {/* Body */}
          <div>
            <textarea
              value={formData.body}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, body: e.target.value }))
              }
              rows={12}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              placeholder="Email content..."
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Attachments
            </label>
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-white/30 rounded-xl cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white/10 rounded-lg p-3 border border-white/20 mt-2"
              >
                <div className="flex items-center space-x-3">
                  <Paperclip className="w-4 h-4 text-blue-400" />
                  <p className="text-white text-sm">{file.name}</p>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Send Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
