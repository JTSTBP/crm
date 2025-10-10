import React from "react";
import {
  Send,
  Paperclip,
  Building2,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useEmails } from "../../hooks/useEmails";
import { format, isToday, isYesterday } from "date-fns";
import toast from "react-hot-toast";
import { useEmail } from "../../contexts/EmailContext";

interface SentListProps {
  searchTerm: string;
  onEmailSelect: (email: any) => void;
}

const SentList: React.FC<SentListProps> = ({ searchTerm, onEmailSelect }) => {
  const { sentEmails, loading, deleteEmail, searchEmails, fetchSentEmails } =
    useEmail();
  console.log(loading, "loading");
const filteredEmails = searchTerm
  ? sentEmails.filter((email) => {
      // Ensure email.to is always an array
      const toArray = Array.isArray(email.to) ? email.to : [email.to];

      // Optional: include cc in search
      const ccArray = Array.isArray(email.cc) ? email.cc : [];

      // Combine all recipients
      const recipients = [...toArray, ...ccArray];

      // Check if search term matches recipient or subject
      return (
        recipients.some((r) =>
          r?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || email.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  : sentEmails;


  const handleDeleteEmail = async (
    emailId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this sent email?")) {
      try {
        await deleteEmail(emailId, "Sent");
      } catch (error: any) {
        toast.error("Failed to delete email");
      }
    }
  };

  const handleResendEmail = async (email: any, event: React.MouseEvent) => {
    event.stopPropagation();
    // Resend functionality
    toast.info("Resend functionality coming soon");
  };

  const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM dd");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Sent":
        return <Send className="w-4 h-4 text-blue-500" />;
      case "Delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Opened":
        return <Eye className="w-4 h-4 text-purple-500" />;
      case "Bounced":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  console.log(filteredEmails, "filteredEmails");
  return (
    <div className="glass rounded-2xl border border-white/30 overflow-hidden shadow-xl">
      {filteredEmails.length === 0 ? (
        <div className="p-8 text-center">
          <Send className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-3">
            {searchTerm ? "No sent emails found" : "No sent emails"}
          </h3>
          <p className="text-gray-300 text-lg">
            {searchTerm
              ? "Try adjusting your search term"
              : "Sent emails will appear here"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {/* {filteredEmails.map((email) => (
            <div
              key={email.id}
              className="p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
              onClick={() => onEmailSelect(email)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(email.status)}
                    {email.attachments.length > 0 && (
                      <Paperclip className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <p className="font-semibold text-white">
                          To: {email.leadName || email.to[0]}
                        </p>
                        {email.companyName && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400 text-sm">
                              {email.companyName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(email.status)}
                          <span
                            className={`text-sm font-medium ${getStatusColor(
                              email.status
                            )}`}
                          >
                            {email.status}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm font-medium">
                          {formatEmailDate(email.sentAt || email.createdAt)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg text-white font-medium mb-2">
                      {email.subject}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-2">
                      {email.body.substring(0, 150)}...
                    </p>

                    <div className="flex items-center space-x-4 mt-3 text-xs">
                      <span className="text-gray-500">
                        To:{" "}
                        {email.to.length > 1
                          ? `${email.to[0]} +${email.to.length - 1} more`
                          : email.to[0]}
                      </span>
                      {email.cc && email.cc.length > 0 && (
                        <span className="text-gray-500">
                          CC: {email.cc.length}
                        </span>
                      )}
                      {email.attachments.length > 0 && (
                        <span className="text-blue-400 flex items-center space-x-1">
                          <Paperclip className="w-3 h-3" />
                          <span>
                            {email.attachments.length} attachment
                            {email.attachments.length > 1 ? "s" : ""}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmailSelect(email);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="View Email"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleResendEmail(email, e)}
                    className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="Resend"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteEmail(email.id, e)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))} */}

          {filteredEmails.map((email) => {
            const emailToArray = Array.isArray(email.to)
              ? email.to
              : [email.to];
            const emailBody = email.content || "";
            const emailDate = email.date || email.createdAt;
            const emailStatus = email.status || "Sent";

            return (
              <div
                key={email._id}
                className="p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                onClick={() => onEmailSelect(email)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(emailStatus)}
                      {email.attachments?.length > 0 && (
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <p className="font-semibold text-white">
                            To: {email.receiverName || emailToArray[0]}
                          </p>
                          {email.companyName && (
                            <div className="flex items-center space-x-1">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 text-sm">
                                {email.companyName}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
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
                          <span className="text-gray-400 text-sm font-medium">
                            {formatEmailDate(emailDate)}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg text-white font-medium mb-2">
                        {email.subject}
                      </h3>

                      <div
                        className="text-gray-400 text-sm line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: emailBody.substring(0, 150) + "...",
                        }}
                      ></div>

                      <div className="flex items-center space-x-4 mt-3 text-xs">
                        <span className="text-gray-500">
                          To:{" "}
                          {emailToArray.length > 1
                            ? `${emailToArray[0]} +${
                                emailToArray.length - 1
                              } more`
                            : emailToArray[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEmailSelect(email);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="View Email"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleResendEmail(email, e)}
                      className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="Resend"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteEmail(email._id, e)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SentList;
