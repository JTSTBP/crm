

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Building2 } from 'lucide-react'
import { useLeads } from '../../hooks/useLeads'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { useUsers } from '../../hooks/useUsers'
import { useLeadsContext } from "../../contexts/leadcontext";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: any; // optional lead for editing
}


interface LeadFormData {
  company_name: string;
  company_info: string;
  company_size: string;
  website_url: string;

  company_email: string;
  hiring_needs: string[];
  points_of_contact: Array<{
    name: string;
    designation: string;
    phone: string;
    email: string;
    linkedin_url: string;
    stage: "Contacted" | "Busy" | "No Answer" | "Wrong Number";
  }>;

  lead_source: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_designation: string;
  linkedin_link: string;
  industry_name: string;
  no_of_designations?: number;
  no_of_positions?: number;
  stage: "New" | "Contacted" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  // const { createLead, updateLead } = useLeads();
    const {  createLead, updateLead } =
      useLeadsContext();
   const { users} = useUsers()
  const { user } = useAuth();
  const [selectedHiringNeeds, setSelectedHiringNeeds] = useState<string[]>([]);
const [pointsOfContact, setPointsOfContact] = useState([
  {
    name: "",
    designation: "",
    phone: "",
    email: "",
    linkedin_url: "",
    stage: "Busy",
  },
]);

  const [noOfPositions, setNoOfPositions] = useState<number | "">("");
  const [assignedBy, setAssignedBy] = useState<string>("");

console.log(lead, "lead", assignedBy);

  const hiringNeedsOptions = ["IT", "Non-IT", "Volume", "Leadership"];
  const companySizeOptions = [
    "1-10",
    "11-50",
    "51-100",
    "101-500",
    "501-1000",
    "1000+",
  ];
  const leadSourceOptions = [
    "LinkedIn",
    "Reference",
    "Cold Call",
    "Campaign",
    "Website",
    "Event",
    "Other",
  ];
 

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LeadFormData>({
    defaultValues: lead
      ? {
          ...lead,
          points_of_contact: lead.points_of_contact || [
            { name: "", designation: "", phone: "", email: "" },
          ],
          hiring_needs: lead.hiring_needs || [],
        }
      : {
          stage: "New",
        },
  });
useEffect(() => {
  if (lead) {
    reset(lead);
    setSelectedHiringNeeds(lead.hiring_needs || []);
    setPointsOfContact(
      lead.points_of_contact || [
        { name: "", designation: "", phone: "", email: "" },
      ]
    );
    setNoOfPositions(lead.no_of_positions || "");

    // Set assignedBy value in both state and react-hook-form
    setAssignedBy(lead.assignedBy || "");
    setValue("assignedBy", lead.assignedBy || "");
  }
}, [lead, reset, setValue]);
const addPointOfContact = () => {
  setPointsOfContact([
    ...pointsOfContact,
    {
      name: "",
      designation: "",
      phone: "",
      email: "",
      linkedin_url: "",
      stage: "Busy",
    },
  ]);
};


  const removePointOfContact = (index: number) => {
    if (pointsOfContact.length > 1) {
      setPointsOfContact(pointsOfContact.filter((_, i) => i !== index));
    }
  };

  const updatePointOfContact = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...pointsOfContact];
    updated[index] = { ...updated[index], [field]: value };
    setPointsOfContact(updated);
  };

  const toggleHiringNeed = (need: string) => {
    setSelectedHiringNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };
  const onSubmit = async (data: LeadFormData) => {
    try {

       const validContacts = pointsOfContact.filter(
         (c) => c.name.trim() !== "" && c.email.trim() !== ""
       );

       if (validContacts.length === 0) {
         toast.error("At least one point of contact is required");
         return;
       }
      if (lead) {
        // EDIT MODE
        await updateLead(lead._id, {
          ...data,
          hiring_needs: selectedHiringNeeds,
          points_of_contact: pointsOfContact.filter((c) => c.name && c.email),
          no_of_designations: data.no_of_designations || null,
          no_of_positions: noOfPositions || null,
        });
        toast.success("Lead updated successfully!");
      } else {
        // CREATE MODE
        await createLead({
          ...data,
          hiring_needs: selectedHiringNeeds,
          points_of_contact: pointsOfContact.filter((c) => c.name && c.email),
         
          no_of_designations: data.no_of_designations || null,
          no_of_positions: noOfPositions || null,
        });
        toast.success("Lead created successfully!");
      }

      reset();
      setSelectedHiringNeeds([]);
      setPointsOfContact([{ name: "", designation: "", phone: "", email: "" }]);
      setNoOfPositions("");
      onClose();
    } catch (error: any) {
      toast.error(error.response.data.message || "Failed to save lead");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 ">
      <div className="glass rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30 ">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {lead ? "Edit Lead" : "Add New Lead"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Company Name *
            </label>
            <input
              {...register("company_name", {
                required: "Company name is required",
              })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <p className="mt-2 text-sm text-red-300">
                {errors.company_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Company Information
            </label>
            <textarea
              {...register("company_info")}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
              placeholder="Brief description of the company..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Company Size
              </label>
              <select
                {...register("company_size")}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                <option className="bg-gray-700 text-white" value="">
                  Select company size
                </option>
                {companySizeOptions.map((size) => (
                  <option
                    className="bg-gray-700 text-white"
                    key={size}
                    value={size}
                  >
                    {size} employees
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Lead Source
              </label>
              <select
                {...register("lead_source")}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              >
                <option className="bg-gray-700 text-white" value="">
                  Select lead source
                </option>
                {leadSourceOptions.map((source) => (
                  <option
                    className="bg-gray-700 text-white"
                    key={source}
                    value={source}
                  >
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Assigned By *
            </label>
            <select
              {...register("assignedBy", { required: "Please select a user" })}
              value={assignedBy._id}
              onChange={(e) => {
                setValue("assignedBy", e.target.value);
                setAssignedBy(e.target.value);
              }}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white 
               focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
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
            {errors.assignedBy && (
              <p className="mt-2 text-sm text-red-300">
                {errors.assignedBy.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Website URL *
            </label>
            <input
              {...register("website_url", {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: "Website URL must start with http:// or https://",
                },
                required: "Website URL is required",
              })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="https://www.company.com"
            />
            {errors.website_url && (
              <p className="mt-2 text-sm text-red-300">
                {errors.website_url.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Company Email *
            </label>
            <input
              {...register("company_email", {
                required: "Company email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="info@company.com"
            />
            {errors.company_email && (
              <p className="mt-2 text-sm text-red-300">
                {errors.company_email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Hiring Needs
            </label>
            <div className="grid grid-cols-2 gap-2">
              {hiringNeedsOptions.map((need) => (
                <label
                  key={need}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedHiringNeeds.includes(need)}
                    onChange={() => toggleHiringNeed(need)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-white text-sm">{need}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-white">
                Points of Contact *
              </label>
              <button
                type="button"
                onClick={addPointOfContact}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                + Add Contact
              </button>
            </div>
            <div className="space-y-3">
              {pointsOfContact.map((contact, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-sm font-medium">
                      Contact {index + 1}
                    </span>
                    {pointsOfContact.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePointOfContact(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={contact.name}
                      onChange={(e) =>
                        updatePointOfContact(index, "name", e.target.value)
                      }
                      placeholder="Contact name *"
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    />
                    <input
                      value={contact.designation}
                      onChange={(e) =>
                        updatePointOfContact(
                          index,
                          "designation",
                          e.target.value
                        )
                      }
                      placeholder="Designation"
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    />
                    <input
                      value={contact.phone}
                      onChange={(e) =>
                        updatePointOfContact(index, "phone", e.target.value)
                      }
                      placeholder="Phone number"
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    />
                    <input
                      value={contact.email}
                      onChange={(e) =>
                        updatePointOfContact(index, "email", e.target.value)
                      }
                      placeholder="Email address *"
                      type="email"
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    />
                    <input
                      value={contact.linkedin_url}
                      onChange={(e) =>
                        updatePointOfContact(
                          index,
                          "linkedin_url",
                          e.target.value
                        )
                      }
                      placeholder="LinkedIn Profile URL"
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white 
             placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    />

                    <select
                      value={contact.stage}
                      onChange={(e) =>
                        updatePointOfContact(index, "stage", e.target.value)
                      }
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white 
             focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    >
                      <option
                        className="bg-gray-700 text-white"
                        value="Contacted"
                      >
                        Contacted
                      </option>
                      <option className="bg-gray-700 text-white" value="Busy">
                        Busy
                      </option>
                      <option
                        className="bg-gray-700 text-white"
                        value="No Answer"
                      >
                        No Answer
                      </option>
                      <option
                        className="bg-gray-700 text-white"
                        value="Wrong Number"
                      >
                        Wrong Number
                      </option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              LinkedIn Profile
            </label>
            <input
              {...register("linkedin_link", {
                pattern: {
                  value: /^https:\/\/www\.linkedin\.com\/.+/,
                  message:
                    "LinkedIn URL must start with https://www.linkedin.com/",
                },
              })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="https://www.linkedin.com/in/username"
            />
            {errors.linkedin_link && (
              <p className="mt-2 text-sm text-red-300">
                {errors.linkedin_link.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Industry Name *
            </label>
            <input
              {...register("industry_name", {
                required: "Industry name is required",
              })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              placeholder="e.g., Technology, Healthcare, Finance"
            />
            {errors.industry_name && (
              <p className="mt-2 text-sm text-red-300">
                {errors.industry_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              No. of Designations *
            </label>
            <input
              {...register("no_of_designations", {
                required: "No. of designations is required",
                min: { value: 1, message: "Must be at least 1" },
              })}
              type="number"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white 
               placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
               focus:bg-white/20 transition-all duration-300"
              placeholder="Enter number of designations"
            />
            {errors.no_of_designations && (
              <p className="mt-2 text-sm text-red-300">
                {errors.no_of_designations.message}
              </p>
            )}
          </div>

          {/* 🔄 No. of Positions */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              No. of Positions *
            </label>
            <input
              type="number"
              value={noOfPositions}
              onChange={(e) =>
                setNoOfPositions(e.target.value ? Number(e.target.value) : "")
              }
              min="1"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white 
               placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
               focus:bg-white/20 transition-all duration-300"
              placeholder="Enter number of positions"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Initial Stage
            </label>
            <select
              {...register("stage")}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              <option className="bg-gray-700 text-white" value="New">
                New
              </option>
              <option className="bg-gray-700 text-white" value="Contacted">
                Contacted
              </option>
              <option className="bg-gray-700 text-white" value="Proposal Sent">
                Proposal Sent
              </option>
              <option className="bg-gray-700 text-white" value="Negotiation">
                Negotiation
              </option>
              <option className="bg-gray-700 text-white" value="Won">
                Won
              </option>
              <option className="bg-gray-700 text-white" value="Onboarded">
                Onboarded
              </option>
              <option className="bg-gray-700 text-white" value="No vendor">
                No vendor
              </option>
            </select>
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl"
            >
              {lead ? "Update Lead" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeadModal