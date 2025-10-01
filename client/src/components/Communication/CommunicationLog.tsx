import React from 'react'
import { Mail, MessageCircle, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { CommunicationLog as CommunicationLogType } from '../../hooks/useCommunication'
import { format } from 'date-fns'

interface CommunicationLogProps {
  logs: CommunicationLogType[]
}

const CommunicationLog: React.FC<CommunicationLogProps> = ({ logs }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'opened':
      case 'read':
        return <Eye className="w-4 h-4 text-purple-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-blue-500'
      case 'delivered':
        return 'text-green-500'
      case 'opened':
      case 'read':
        return 'text-purple-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center space-x-2 text-gray-400 mb-2">
          <Mail className="w-6 h-6" />
          <MessageCircle className="w-6 h-6" />
        </div>
        <p className="text-gray-400">No communications sent yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              log.type === 'email' ? 'bg-blue-500/20' : 'bg-green-500/20'
            }`}>
              {log.type === 'email' ? (
                <Mail className="w-5 h-5 text-blue-400" />
              ) : (
                <MessageCircle className="w-5 h-5 text-green-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-white">
                    {log.type === 'email' ? 'Email' : 'WhatsApp'} - {log.template}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(log.status)}
                    <span className={`text-sm font-medium capitalize ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                </span>
              </div>
              
              {log.metadata?.subject && (
                <p className="text-sm font-medium text-gray-300 mb-1">
                  Subject: {log.metadata.subject}
                </p>
              )}
              
              <p className="text-sm text-gray-400 mb-2">
                To: {log.recipient}
              </p>
              
              <div className="bg-white/5 rounded-lg p-3 mt-2">
                <p className="text-sm text-gray-300 line-clamp-3 whitespace-pre-wrap">
                  {log.content}
                </p>
              </div>
              
              {log.metadata?.mediaUrl && (
                <div className="mt-2 text-xs text-blue-400">
                  📎 Media attachment included
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CommunicationLog