import React, { useState } from 'react'
import { 
  X, 
  Mail, 
  Building2, 
  Calendar,
  Paperclip,
  Download,
  Reply,
  Forward,
  Trash2,
  Star,
  User,
  Clock,
  CheckCircle,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { useEmails } from '../../hooks/useEmails'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useEmail } from '../../hooks/myhooks/useEmail'

interface EmailDetailModalProps {
  email: any
  isOpen: boolean
  onClose: () => void
  onReply: () => void
}

// const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ email, isOpen, onClose, onReply }) => {
//   const { deleteEmail } = useEmails()
//   const [loading, setLoading] = useState(false)

//   const handleDeleteEmail = async () => {
//     if (window.confirm('Are you sure you want to delete this email?')) {
//       setLoading(true)
//       try {
//         await deleteEmail(email.id, email.folder)
//         onClose()
//       } catch (error: any) {
//         toast.error('Failed to delete email')
//       } finally {
//         setLoading(false)
//       }
//     }
//   }

//   const handleDownloadAttachment = (attachment: any) => {
//     // Simulate download
//     toast.success(`Downloading ${attachment.name}`)
//   }

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'Sent':
//         return <Clock className="w-4 h-4 text-blue-500" />
//       case 'Delivered':
//         return <CheckCircle className="w-4 h-4 text-green-500" />
//       case 'Opened':
//         return <Eye className="w-4 h-4 text-purple-500" />
//       case 'Bounced':
//         return <AlertTriangle className="w-4 h-4 text-red-500" />
//       case 'Read':
//         return <Eye className="w-4 h-4 text-green-500" />
//       case 'Unread':
//         return <Mail className="w-4 h-4 text-blue-500" />
//       default:
//         return <Mail className="w-4 h-4 text-gray-500" />
//     }
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'Sent': return 'text-blue-500'
//       case 'Delivered': return 'text-green-500'
//       case 'Opened': return 'text-purple-500'
//       case 'Bounced': return 'text-red-500'
//       case 'Read': return 'text-green-500'
//       case 'Unread': return 'text-blue-500'
//       default: return 'text-gray-500'
//     }
//   }

//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//       <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
//         {/* Header */}
//         <div className="gradient-primary p-6 text-white">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
//                 <Mail className="w-6 h-6" />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold tracking-tight">{email.subject}</h2>
//                 <div className="flex items-center space-x-4 mt-1 text-blue-100">
//                   <span>
//                     {email.folder === 'Inbox' ? 'From' : 'To'}: {email.folder === 'Inbox' ? email.from : email.to.join(', ')}
//                   </span>
//                   <div className="flex items-center space-x-1">
//                     {getStatusIcon(email.status)}
//                     <span className={`text-sm font-medium ${getStatusColor(email.status)}`}>
//                       {email.status}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
//           {/* Email Metadata */}
//           <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-300 font-medium">From</p>
//                 <p className="text-white font-semibold">{email.from}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-300 font-medium">To</p>
//                 <p className="text-white font-semibold">{email.to.join(', ')}</p>
//               </div>
//               {email.cc && email.cc.length > 0 && (
//                 <div>
//                   <p className="text-sm text-gray-300 font-medium">CC</p>
//                   <p className="text-white font-semibold">{email.cc.join(', ')}</p>
//                 </div>
//               )}
//               <div>
//                 <p className="text-sm text-gray-300 font-medium">
//                   {email.folder === 'Inbox' ? 'Received' : 'Sent'}
//                 </p>
//                 <p className="text-white font-semibold">
//                   {format(new Date(email.receivedAt || email.sentAt || email.createdAt), 'MMM dd, yyyy HH:mm')}
//                 </p>
//               </div>
//               {email.companyName && (
//                 <div>
//                   <p className="text-sm text-gray-300 font-medium">Company</p>
//                   <div className="flex items-center space-x-2">
//                     <Building2 className="w-4 h-4 text-blue-400" />
//                     <p className="text-white font-semibold">{email.companyName}</p>
//                   </div>
//                 </div>
//               )}
//               {email.leadName && (
//                 <div>
//                   <p className="text-sm text-gray-300 font-medium">Contact</p>
//                   <div className="flex items-center space-x-2">
//                     <User className="w-4 h-4 text-green-400" />
//                     <p className="text-white font-semibold">{email.leadName}</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Attachments */}
//           {email.attachments && email.attachments.length > 0 && (
//             <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
//               <h3 className="text-lg font-semibold text-white mb-4">Attachments</h3>
//               <div className="space-y-3">
//                 {email.attachments.map((attachment: any) => (
//                   <div key={attachment.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
//                     <div className="flex items-center space-x-3">
//                       <Paperclip className="w-5 h-5 text-blue-400" />
//                       <div>
//                         <p className="text-white font-medium">{attachment.name}</p>
//                         <p className="text-gray-400 text-sm">{(attachment.size / 1024).toFixed(1)} KB</p>
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => handleDownloadAttachment(attachment)}
//                       className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
//                     >
//                       <Download className="w-4 h-4" />
//                       <span>Download</span>
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Email Content */}
//           <div className="bg-white rounded-xl p-6 text-gray-900">
//             <div className="whitespace-pre-wrap">{email.body}</div>
//           </div>
//         </div>

//         {/* Footer Actions */}
//         <div className="border-t border-white/20 p-6">
//           <div className="flex justify-between">
//             <div className="flex space-x-3">
//               {email.folder === 'Inbox' && (
//                 <>
//                   <button
//                     onClick={() => {
//                       onClose()
//                       onReply()
//                     }}
//                     className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
//                   >
//                     <Reply className="w-4 h-4" />
//                     <span>Reply</span>
//                   </button>
//                   <button
//                     onClick={() => {
//                       toast.info('Forward functionality coming soon')
//                     }}
//                     className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
//                   >
//                     <Forward className="w-4 h-4" />
//                     <span>Forward</span>
//                   </button>
//                 </>
//               )}
//             </div>
            
//             <div className="flex space-x-3">
//               <button
//                 onClick={handleDeleteEmail}
//                 disabled={loading}
//                 className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 <span>Delete</span>
//               </button>
              
//               <button
//                 onClick={onClose}
//                 className="px-6 py-2 border border-white/30 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-300 font-medium"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  email,
  isOpen,
  onClose,
  onReply,
}) => {
  const { deleteEmail } = useEmail();
  const [loading, setLoading] = useState(false);

  if (!email) return null;

  // Normalize fields
 const emailId = email._id;
 const emailToArray = Array.isArray(email.to) ? email.to : [email.to];
 const emailBody = email.content || "";
 const emailDate = email.date || email.sentAt || email.createdAt;
 const emailStatus = email.status || "Sent";
 const emailFolder = email.folder || (email.type === "sent" ? "Sent" : "Inbox");
 const emailFrom = email.userEmail || email.from || "Unknown";

  const handleDeleteEmail = async () => {
    if (window.confirm("Are you sure you want to delete this email?")) {
      setLoading(true);
      try {
        await deleteEmail(emailId, emailFolder);
        onClose();
      } catch (error: any) {
        toast.error("Failed to delete email");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadAttachment = (attachment: any) => {
    toast.success(`Downloading ${attachment.name}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Sent":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "Delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Opened":
        return <Eye className="w-4 h-4 text-purple-500" />;
      case "Bounced":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "Read":
        return <Eye className="w-4 h-4 text-green-500" />;
      case "Unread":
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sent":
        return "text-blue-500";
      case "Delivered":
        return "text-green-500";
      case "Opened":
        return "text-purple-500";
      case "Bounced":
        return "text-red-500";
      case "Read":
        return "text-green-500";
      case "Unread":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
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
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {email.subject}
                </h2>
                <div className="flex items-center space-x-4 mt-1 text-blue-100">
                  <span>
                    {emailFolder === "Inbox" ? "From" : "To"}:{" "}
                    {emailFolder === "Inbox"
                      ? email.from
                      : emailToArray.join(", ")}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(emailStatus)}
                    <span
                      className={`text-sm font-medium ${getStatusColor(
                        emailStatus
                      )}`}
                    >
                      {emailStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {/* Email Metadata */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-300 font-medium">From</p>
                <p className="text-white font-semibold">{emailFrom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-300 font-medium">To</p>
                <p className="text-white font-semibold">
                  {emailToArray.join(", ")}
                </p>
              </div>
              {email.cc && email.cc.length > 0 && (
                <div>
                  <p className="text-sm text-gray-300 font-medium">CC</p>
                  <p className="text-white font-semibold">
                    {email.cc.join(", ")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-300 font-medium">
                  {emailFolder === "Inbox" ? "Received" : "Sent"}
                </p>
                <p className="text-white font-semibold">
                  {format(new Date(emailDate), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
              {email.companyName && (
                <div>
                  <p className="text-sm text-gray-300 font-medium">Company</p>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <p className="text-white font-semibold">
                      {email.companyName}
                    </p>
                  </div>
                </div>
              )}
              {email.leadName && (
                <div>
                  <p className="text-sm text-gray-300 font-medium">Contact</p>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-green-400" />
                    <p className="text-white font-semibold">{email.leadName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className="bg-white rounded-xl p-6 text-gray-900">
            <div
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: emailBody }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/20 p-6 flex justify-end space-x-3">
          <button
            onClick={handleDeleteEmail}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-white/30 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailDetailModal