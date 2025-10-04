// import React, { useState, useCallback, useRef } from 'react'
// import { useDropzone } from 'react-dropzone'
// import { 
//   X, 
//   Upload, 
//   FileText, 
//   AlertCircle, 
//   CheckCircle, 
//   Download,
//   Users,
//   Settings
// } from 'lucide-react'
// import { useAuth } from '../../contexts/AuthContext'
// import { useBulkImport } from '../../hooks/useBulkImport'
// import toast from 'react-hot-toast'
// import { useLeadsContext } from '../../contexts/leadcontext'
// import { useUsers } from '../../hooks/useUsers'

// interface BulkImportModalProps {
//   isOpen: boolean
//   onClose: () => void
// }

// interface ImportSummary {
//   totalRows: number
//   inserted: number
//   skipped: number
//   errors: Array<{ line: number; reason: string; data?: any }>
// }

// const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
//   const { profile } = useAuth();
//   const { users } = useUsers();
//   const { importLeads, loading } = useBulkImport();
//   const [file, setFile] = useState<File | null>(null);
//   const [previewData, setPreviewData] = useState<any[]>([]);
//   const [assignmentOption, setAssignmentOption] = useState<"manual" | "auto">(
//     "auto"
//   );
//   const [selectedAssignee, setSelectedAssignee] = useState("");
//   const [importSummary, setImportSummary] = useState<ImportSummary | null>(
//     null
//   );
//   const [step, setStep] = useState<"upload" | "preview" | "results">("upload");
//   const { bulkUploadLeads } = useLeadsContext();
//   const stepRef = useRef<"upload" | "preview" | "results">("upload");

//   stepRef.current = step; // update on every render

//   // Mock BD Executives data - in real app, this would come from API
//   const bdExecutives = users;

//   const onDrop = useCallback((acceptedFiles: File[]) => {
//     const uploadedFile = acceptedFiles[0];
//     if (uploadedFile) {
//       setFile(uploadedFile);
//       parseFilePreview(uploadedFile);
//     }
//   }, []);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       "text/csv": [".csv"],
//       "application/vnd.ms-excel": [".xls"],
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
//         ".xlsx",
//       ],
//     },
//     maxSize: 5 * 1024 * 1024, // 5MB
//     multiple: false,
//   });

//   const parseFilePreview = (file: File) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const text = e.target?.result as string;
//       const lines = text.split("\n").filter((line) => line.trim());

//       if (lines.length < 2) {
//         toast.error("File must contain at least a header row and one data row");
//         return;
//       }

//       const headers = lines[0]
//         .split(",")
//         .map((h) => h.trim().replace(/"/g, ""));
//       const preview = lines.slice(1, 6).map((line, index) => {
//         const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
//         const row: any = { _line: index + 2 };
//         headers.forEach((header, i) => {
//           row[header] = values[i] || "";
//         });
//         return row;
//       });

//       setPreviewData(preview);
//       setStep("preview");
//     };
//     reader.readAsText(file);
//   };

//   const handleImport = async () => {
//     if (!file) return;

//     try {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("assignmentOption", assignmentOption);
//       if (assignmentOption === "manual" && selectedAssignee) {
//         formData.append("assignedTo", selectedAssignee);
//       }

//       const result = await bulkUploadLeads(formData);
//       // normalize result shape so UI never crashes
//       const normalized = {
//         totalRows: result.totalRows ?? 0,
//         inserted: result.inserted ?? 0,
//         skipped: result.skipped ?? 0,
//         errors: result.errors ?? [],
//       };

//       setImportSummary(normalized);
//       setStep("results");
//       console.log(normalized, "normalized", step, "step");

//       if (result.inserted > 0) {
//         toast.success(`Successfully imported ${result.inserted} leads!`);
//       }
//     } catch (error: any) {
//       toast.error(error.message || "Import failed");
//     }
//   };
//   React.useEffect(() => {
//     console.log("Current step:", step);
//   }, [step]);

//   const downloadErrorReport = () => {
//     if (!importSummary?.errors.length) return;

//     const csvContent = [
//       "Line,Error,Company Name,Contact Name,Email,Phone",
//       ...importSummary.errors.map(
//         (error) =>
//           `${error.line},"${error.reason}","${
//             error.data?.companyName || ""
//           }","${error.data?.contactName || ""}","${
//             error.data?.contactEmail || ""
//           }","${error.data?.contactPhone || ""}"`
//       ),
//     ].join("\n");

//     const blob = new Blob([csvContent], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "import-errors.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const resetModal = () => {
//     setFile(null);
//     setPreviewData([]);
//     setAssignmentOption("auto");
//     setSelectedAssignee("");
//     setImportSummary(null);
//     setStep("upload");
//   };

//   const handleClose = () => {
//     resetModal();
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//       <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
//         {/* Header */}
//         <div className="gradient-primary p-6 text-white">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
//                 <Upload className="w-6 h-6" />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold tracking-tight">
//                   Bulk Import Leads
//                 </h2>
//                 <p className="text-blue-100 mt-1">
//                   Upload CSV or Excel file with lead data
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={handleClose}
//               className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>

//           {/* Progress Steps */}
//           <div className="flex items-center space-x-4 mt-6">
//             {["upload", "preview", "results"].map((stepName, index) => (
//               <div key={stepName} className="flex items-center">
//                 <div
//                   className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
//                     step === stepName
//                       ? "bg-white text-blue-600"
//                       : ["upload", "preview", "results"].indexOf(step) > index
//                       ? "bg-white/30 text-white"
//                       : "bg-white/10 text-white/60"
//                   }`}
//                 >
//                   {index + 1}
//                 </div>
//                 {index < 2 && (
//                   <div
//                     className={`w-12 h-0.5 mx-2 ${
//                       ["upload", "preview", "results"].indexOf(step) > index
//                         ? "bg-white/30"
//                         : "bg-white/10"
//                     }`}
//                   />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
//           {/* Step 1: Upload */}
//           {step === "upload" && (
//             <div className="space-y-6">
//               <div className="text-center">
//                 <h3 className="text-xl font-bold text-white mb-2">
//                   Upload Your File
//                 </h3>
//                 <p className="text-gray-300">
//                   Supported formats: CSV, XLS, XLSX (Max 5MB)
//                 </p>
//               </div>

//               <div
//                 {...getRootProps()}
//                 className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
//                   isDragActive
//                     ? "border-blue-400 bg-blue-500/10"
//                     : "border-white/30 hover:border-white/50 hover:bg-white/5"
//                 }`}
//               >
//                 <input {...getInputProps()} />
//                 <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//                 {isDragActive ? (
//                   <p className="text-blue-400 text-lg font-medium">
//                     Drop the file here...
//                   </p>
//                 ) : (
//                   <div>
//                     <p className="text-white text-lg font-medium mb-2">
//                       Drag & drop your file here, or click to browse
//                     </p>
//                     <p className="text-gray-400 text-sm">
//                       CSV, XLS, XLSX files up to 5MB
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {file && (
//                 <div className="bg-white/10 rounded-xl p-4 flex items-center space-x-3">
//                   <FileText className="w-8 h-8 text-blue-400" />
//                   <div>
//                     <p className="text-white font-medium">{file.name}</p>
//                     <p className="text-gray-400 text-sm">
//                       {(file.size / 1024).toFixed(1)} KB
//                     </p>
//                   </div>
//                 </div>
//               )}

//               <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
//                 <h4 className="text-blue-400 font-semibold mb-2">
//                   Required CSV Format:
//                 </h4>
//                 <div className="text-sm text-gray-300 space-y-1">
//                   <p>
//                     <strong>Headers:</strong> companyName, companyInfo,
//                     companySize, websiteUrl, hiringNeeds, pointsOfContact,
//                     leadSource, contactName, contactEmail, contactPhone,
//                     contactDesignation, linkedinLink, industryName, stage,
//                     assignedTo
//                   </p>
//                   <p>
//                     <strong>Stage values:</strong> New, Contacted, Proposal
//                     Sent, Negotiation, Won, Lost
//                   </p>
//                   <p>
//                     <strong>Company Size:</strong> 1-10, 11-50, 51-100, 101-500,
//                     501-1000, 1000+
//                   </p>
//                   <p>
//                     <strong>Hiring Needs:</strong> IT,Non-IT,Volume,Leadership
//                     (comma-separated)
//                   </p>
//                   <p>
//                     <strong>Lead Source:</strong> LinkedIn, Reference, Cold
//                     Call, Campaign, Website, Event, Other
//                   </p>
//                   <p>
//                     <strong>LinkedIn:</strong> Must start with
//                     https://www.linkedin.com/
//                   </p>
//                   <p>
//                     <strong>Website:</strong> Must start with http:// or
//                     https://
//                   </p>
//                   <p>
//                     <strong>Phone:</strong> 8-15 digits only
//                   </p>
//                   <p>
//                     <strong>Points of Contact:</strong>{" "}
//                     "Name1|Designation1|Phone1|Email1;Name2|Designation2|Phone2|Email2"
//                   </p>
//                   <p>
//                     <strong>assignedTo:</strong> Leave blank for auto-assignment
//                     or specify BD Executive email
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Step 2: Preview */}
//           {step === "preview" && (
//             <div className="space-y-6">
//               <div className="text-center">
//                 <h3 className="text-xl font-bold text-white mb-2">
//                   Preview & Configure
//                 </h3>
//                 <p className="text-gray-300">
//                   Review the first 5 rows and configure assignment
//                 </p>
//               </div>

//               {/* Assignment Options */}
//               <div className="bg-white/10 rounded-xl p-6 space-y-4">
//                 <h4 className="text-white font-semibold flex items-center space-x-2">
//                   <Settings className="w-5 h-5" />
//                   <span>Assignment Options</span>
//                 </h4>

//                 <div className="space-y-3">
//                   <label className="flex items-center space-x-3 cursor-pointer">
//                     <input
//                       type="radio"
//                       name="assignment"
//                       value="auto"
//                       checked={assignmentOption === "auto"}
//                       onChange={(e) =>
//                         setAssignmentOption(e.target.value as "auto")
//                       }
//                       className="w-4 h-4 text-blue-600"
//                     />
//                     <span className="text-white">
//                       Auto-assign evenly to BD Executives
//                     </span>
//                   </label>

//                   <label className="flex items-center space-x-3 cursor-pointer">
//                     <input
//                       type="radio"
//                       name="assignment"
//                       value="manual"
//                       checked={assignmentOption === "manual"}
//                       onChange={(e) =>
//                         setAssignmentOption(e.target.value as "manual")
//                       }
//                       className="w-4 h-4 text-blue-600"
//                     />
//                     <span className="text-white">
//                       Assign to specific BD Executive
//                     </span>
//                   </label>
//                 </div>

//                 {assignmentOption === "manual" && (
//                   <select
//                     value={selectedAssignee}
//                     onChange={(e) => setSelectedAssignee(e.target.value)}
//                     className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
//                   >
//                     <option value="">Select BD Executive</option>
//                     {bdExecutives.map((exec) => (
//                       <option key={exec.id} value={exec.id}>
//                         {exec.name}
//                       </option>
//                     ))}
//                   </select>
//                 )}
//               </div>

//               {/* Preview Table */}
//               <div className="bg-white/10 rounded-xl overflow-hidden">
//                 <div className="p-4 border-b border-white/20">
//                   <h4 className="text-white font-semibold">
//                     Data Preview (First 5 rows)
//                   </h4>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-white/5">
//                       <tr>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Company
//                         </th>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Size
//                         </th>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Source
//                         </th>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Contact
//                         </th>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Email
//                         </th>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Phone
//                         </th>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Designation
//                         </th>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Industry
//                         </th>
//                         <th className="px-4 py-3 text-left text-gray-300 font-medium">
//                           Stage
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-white/10">
//                       {previewData.map((row, index) => (
//                         <tr key={index} className="hover:bg-white/5">
//                           <td className="px-4 py-3 text-white">
//                             {row.companyName || row.company_name || ""}
//                           </td>
//                           <td className="px-4 py-3 text-white">
//                             {row.companySize || row.company_size || ""}
//                           </td>
//                           <td className="px-4 py-3 text-white">
//                             {row.leadSource || row.lead_source || ""}
//                           </td>
//                           <td className="px-4 py-3 text-white">
//                             {row.contactName || row.contact_name || ""}
//                           </td>
//                           <td className="px-4 py-3 text-white">
//                             {row.contactEmail || row.contact_email || ""}
//                           </td>
//                           <td className="px-4 py-3 text-white">
//                             {row.contactPhone || row.contact_phone || ""}
//                           </td>
//                           <td className="px-4 py-3 text-white">
//                             {row.contactDesignation ||
//                               row.contact_designation ||
//                               ""}
//                           </td>
//                           <td className="px-4 py-3 text-white">
//                             {row.industryName || row.industry_name || ""}
//                           </td>
//                           <td className="px-4 py-3 text-white">
//                             {row.stage || "New"}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               <div className="flex space-x-4">
//                 <button
//                   onClick={() => setStep("upload")}
//                   className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
//                 >
//                   Back
//                 </button>
//                 <button
//                   onClick={handleImport}
//                   disabled={
//                     loading ||
//                     (assignmentOption === "manual" && !selectedAssignee)
//                   }
//                   className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
//                 >
//                   {loading ? "Importing..." : "Import Leads"}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Step 3: Results */}
//           {step === "results" && importSummary && (
//             <div className="space-y-6">
//               <div className="text-center">
//                 <h3 className="text-xl font-bold text-white mb-2">
//                   Import Complete
//                 </h3>
//                 <p className="text-gray-300">Here's a summary of your import</p>
//               </div>

//               {/* Summary Cards */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
//                   <div className="text-2xl font-bold text-blue-400">
//                     {importSummary.totalRows}
//                   </div>
//                   <div className="text-blue-300 text-sm">Total Rows</div>
//                 </div>
//                 <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
//                   <div className="text-2xl font-bold text-green-400">
//                     {importSummary.inserted}
//                   </div>
//                   <div className="text-green-300 text-sm">
//                     Successfully Imported
//                   </div>
//                 </div>
//                 <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
//                   <div className="text-2xl font-bold text-red-400">
//                     {importSummary.skipped}
//                   </div>
//                   <div className="text-red-300 text-sm">Skipped/Errors</div>
//                 </div>
//               </div>

//               {/* Success Message */}
//               {importSummary.inserted > 0 && (
//                 <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center space-x-3">
//                   <CheckCircle className="w-6 h-6 text-green-400" />
//                   <div>
//                     <p className="text-green-400 font-semibold">
//                       Import Successful!
//                     </p>
//                     <p className="text-green-300 text-sm">
//                       {importSummary.inserted} leads have been added to your
//                       system
//                     </p>
//                   </div>
//                 </div>
//               )}

//               {/* Errors */}
//               {importSummary.errors.length > 0 && (
//                 <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
//                   <div className="flex items-center justify-between mb-3">
//                     <div className="flex items-center space-x-2">
//                       <AlertCircle className="w-5 h-5 text-red-400" />
//                       <h4 className="text-red-400 font-semibold">
//                         Import Errors
//                       </h4>
//                     </div>
//                     <button
//                       onClick={downloadErrorReport}
//                       className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm transition-colors"
//                     >
//                       <Download className="w-4 h-4" />
//                       <span>Download Report</span>
//                     </button>
//                   </div>
//                   <div className="max-h-40 overflow-y-auto space-y-2">
//                     {importSummary.errors.slice(0, 10).map((error, index) => (
//                       <div key={index} className="text-sm text-red-300">
//                         <strong>Line {error.line}:</strong> {error.reason}
//                       </div>
//                     ))}
//                     {importSummary.errors.length > 10 && (
//                       <div className="text-sm text-red-400">
//                         ... and {importSummary.errors.length - 10} more errors
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               <div className="flex space-x-4">
//                 <button
//                   onClick={resetModal}
//                   className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
//                 >
//                   Import Another File
//                 </button>
//                 <button
//                   onClick={handleClose}
//                   className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
//                 >
//                   Done
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default BulkImportModal


import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Users,
  Settings,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useBulkImport } from "../../hooks/useBulkImport";
import toast from "react-hot-toast";
import { useLeadsContext } from "../../contexts/leadcontext";
import { useUsers } from "../../hooks/useUsers";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportSummary {
  totalRows: number;
  inserted: number;
  skipped: number;
  errors: Array<{ line: number; reason: string; data?: any }>;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile } = useAuth();
  const { users } = useUsers();
  const { importLeads, loading } = useBulkImport();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [assignmentOption, setAssignmentOption] = useState<"manual" | "auto">(
    "auto"
  );
  const [selectedAssignee, setSelectedAssignee] = useState("");
const [importSummary, setImportSummary] = useState<ImportSummary>({
  totalRows: 0,
  inserted: 0,
  skipped: 0,
  errors: [],
});

  const [step, setStep] = useState<"upload" | "preview" | "results">("upload");
  const { bulkUploadLeads } = useLeadsContext();
  const stepRef = useRef<"upload" | "preview" | "results">("upload");

  stepRef.current = step; // update on every render

  // Mock BD Executives data - in real app, this would come from API
  const bdExecutives = users;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseFilePreview(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const parseFilePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error("File must contain at least a header row and one data row");
        return;
      }

      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));
      const preview = lines.slice(1, 6).map((line, index) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: any = { _line: index + 2 };
        headers.forEach((header, i) => {
          row[header] = values[i] || "";
        });
        return row;
      });

      setPreviewData(preview);
      setStep("preview");
    };
    reader.readAsText(file);
  };

const handleImport = async () => {
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentOption", assignmentOption);
    if (assignmentOption === "manual" && selectedAssignee) {
      formData.append("assignedTo", selectedAssignee);
    }

    const result = await bulkUploadLeads(formData);

    console.log("bulkUploadLeads response:", result);

    const normalized = {
      totalRows: result?.totalRows ?? 0,
      inserted: result?.inserted ?? 0,
      skipped: result?.skipped ?? 0,
      errors: result?.errors ?? [],
    };

    console.log("Normalized result:", normalized);
const mockResult = {
  totalRows: 5,
  inserted: 3,
  skipped: 2,
  errors: [{ line: 3, reason: "Invalid email" }],
};
setImportSummary(mockResult);
setStep("results");

   // must happen after setting importSummary
  } catch (error: any) {
    console.error(error);
    toast.error(error?.message || "Import failed");
  }
};

React.useEffect(() => {
  console.log("Step changed:", step, importSummary);
}, [step, importSummary]);


  const downloadErrorReport = () => {
    if (!importSummary?.errors.length) return;

    const csvContent = [
      "Line,Error,Company Name,Contact Name,Email,Phone",
      ...importSummary.errors.map(
        (error) =>
          `${error.line},"${error.reason}","${
            error.data?.companyName || ""
          }","${error.data?.contactName || ""}","${
            error.data?.contactEmail || ""
          }","${error.data?.contactPhone || ""}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setFile(null);
    setPreviewData([]);
    setAssignmentOption("auto");
    setSelectedAssignee("");
    setImportSummary(null);
    setStep("upload");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Bulk Import Leads
                </h2>
                <p className="text-blue-100 mt-1">
                  Upload CSV or Excel file with lead data
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            {["upload", "preview", "results"].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === stepName
                      ? "bg-white text-blue-600"
                      : ["upload", "preview", "results"].indexOf(step) > index
                      ? "bg-white/30 text-white"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      ["upload", "preview", "results"].indexOf(step) > index
                        ? "bg-white/30"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  Upload Your File
                </h3>
                <p className="text-gray-300">
                  Supported formats: CSV, XLS, XLSX (Max 5MB)
                </p>
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                  isDragActive
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-white/30 hover:border-white/50 hover:bg-white/5"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-400 text-lg font-medium">
                    Drop the file here...
                  </p>
                ) : (
                  <div>
                    <p className="text-white text-lg font-medium mb-2">
                      Drag & drop your file here, or click to browse
                    </p>
                    <p className="text-gray-400 text-sm">
                      CSV, XLS, XLSX files up to 5MB
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <div className="bg-white/10 rounded-xl p-4 flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h4 className="text-blue-400 font-semibold mb-2">
                  Required CSV Format:
                </h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    <strong>Headers:</strong> companyName, companyInfo,
                    companySize, websiteUrl, hiringNeeds, pointsOfContact,
                    leadSource, linkedinLink, industryName, stage, assignedBy
                  </p>
                  <p>
                    <strong>Stage values:</strong> New, Contacted, Proposal
                    Sent, Negotiation, Won, Lost
                  </p>
                  <p>
                    <strong>Company Size:</strong> 1-10, 11-50, 51-100, 101-500,
                    501-1000, 1000+
                  </p>
                  <p>
                    <strong>Hiring Needs:</strong> IT,Non-IT,Volume,Leadership
                    (comma-separated)
                  </p>
                  <p>
                    <strong>Lead Source:</strong> LinkedIn, Reference, Cold
                    Call, Campaign, Website, Event, Other
                  </p>
                  <p>
                    <strong>LinkedIn:</strong> Must start with
                    https://www.linkedin.com/
                  </p>
                  <p>
                    <strong>Website:</strong> Must start with http:// or
                    https://
                  </p>
                  <p>
                    <strong>Phone:</strong> 8-15 digits only
                  </p>
                  <p>
                    <strong>Points of Contact:</strong>{" "}
                    "Name1|Designation1|Phone1|Email1;Name2|Designation2|Phone2|Email2"
                  </p>
                  <p>
                    <strong>assignedTo:</strong> Leave blank for auto-assignment
                    or specify BD Executive email
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  Preview & Configure
                </h3>
                <p className="text-gray-300">
                  Review the first 5 rows and configure assignment
                </p>
              </div>

              {/* Assignment Options */}
              <div className="bg-white/10 rounded-xl p-6 space-y-4">
                <h4 className="text-white font-semibold flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Assignment Options</span>
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="assignment"
                      value="auto"
                      checked={assignmentOption === "auto"}
                      onChange={(e) =>
                        setAssignmentOption(e.target.value as "auto")
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-white">
                      Auto-assign evenly to BD Executives
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="assignment"
                      value="manual"
                      checked={assignmentOption === "manual"}
                      onChange={(e) =>
                        setAssignmentOption(e.target.value as "manual")
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-white">
                      Assign to specific BD Executive
                    </span>
                  </label>
                </div>

                {assignmentOption === "manual" && (
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    <option value="">Select BD Executive</option>
                    {bdExecutives.map((exec) => (
                      <option key={exec.id} value={exec.id}>
                        {exec.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Preview Table */}
              <div className="bg-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/20">
                  <h4 className="text-white font-semibold">
                    Data Preview (First 5 rows)
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                          Email
                        </th>

                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                          Industry
                        </th>
                        <th className="px-4 py-3 text-left text-gray-300 font-medium">
                          Stage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {previewData.map((row, index) => (
                        <tr key={index} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-white">
                            {row.companyName || row.company_name || ""}
                          </td>
                          <td className="px-4 py-3 text-white">
                            {row.companySize || row.company_size || ""}
                          </td>
                          <td className="px-4 py-3 text-white">
                            {row.leadSource || row.lead_source || ""}
                          </td>
                          <td className="px-4 py-3 text-white">
                            {row.companyEmail || row.company_email || ""}
                          </td>

                          <td className="px-4 py-3 text-white">
                            {row.industryName || row.industry_name || ""}
                          </td>
                          <td className="px-4 py-3 text-white">
                            {row.stage || "New"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep("upload")}
                  className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={
                    loading ||
                    (assignmentOption === "manual" && !selectedAssignee)
                  }
                  className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? "Importing..." : "Import Leads"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === "results" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  Import Complete
                </h3>
                <p className="text-gray-300">Here's a summary of your import</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {importSummary.totalRows}
                  </div>
                  <div className="text-blue-300 text-sm">Total Rows</div>
                </div>
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {importSummary.inserted}
                  </div>
                  <div className="text-green-300 text-sm">
                    Successfully Imported
                  </div>
                </div>
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {importSummary.skipped}
                  </div>
                  <div className="text-red-300 text-sm">Skipped/Errors</div>
                </div>
              </div>

              {/* Success Message */}
              {importSummary.inserted > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-green-400 font-semibold">
                      Import Successful!
                    </p>
                    <p className="text-green-300 text-sm">
                      {importSummary.inserted} leads have been added to your
                      system
                    </p>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importSummary.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <h4 className="text-red-400 font-semibold">
                        Import Errors
                      </h4>
                    </div>
                    <button
                      onClick={downloadErrorReport}
                      className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Report</span>
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {importSummary.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-red-300">
                        <strong>Line {error.line}:</strong> {error.reason}
                      </div>
                    ))}
                    {importSummary.errors.length > 10 && (
                      <div className="text-sm text-red-400">
                        ... and {importSummary.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={resetModal}
                  className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
                >
                  Import Another File
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;