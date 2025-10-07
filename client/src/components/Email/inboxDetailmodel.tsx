import React from "react";
import { X, Mail, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface InboxDetailedProps {
  email: any;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (email: any) => void;
}

const InboxDetailed: React.FC<InboxDetailedProps> = ({
  email,
  isOpen,
  onClose,
  onDelete,
}) => {
  if (!email || !isOpen) return null;

  const handleDeleteEmail = () => {
    if (window.confirm("Are you sure you want to delete this email?")) {
      try {
        onDelete(email);
        onClose();
      } catch (err: any) {
        toast.error("Failed to delete email");
      }
    }
  };
console.log(email,"eee")
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Mail className="w-6 h-6" />
            <h2 className="text-2xl font-bold">
              {email.subject || "(No Subject)"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-sm text-gray-300">From</p>
            <p className="text-white font-semibold">{email.from}</p>
          </div>

          <div className="bg-white rounded-xl p-6 text-gray-900">
            {/* <div className="whitespace-pre-wrap">
              {email.body || "(No Content)"}
            </div> */}
            <div className="text-black">
              {(email.body || "(No Content)").split("\n").map((line, i) => {
                const parts = line.split(/(https?:\/\/[^\s]+)/g); // split URLs
                return (
                  <p key={i}>
                    {parts.map((part, idx) =>
                      part.match(/https?:\/\/[^\s]+/) ? (
                        <a
                          key={idx}
                          href={part}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline"
                        >
                          {part}
                        </a>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/20 p-6 flex justify-end space-x-3">
          <button
            onClick={handleDeleteEmail}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
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

export default InboxDetailed;
