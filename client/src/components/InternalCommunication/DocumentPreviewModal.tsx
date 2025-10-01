import React from 'react'
import { 
  X, 
  Download, 
  FileText, 
  File,
  Image,
  Calendar,
  User,
  Folder,
  BarChart3,
  Share2,
  ExternalLink
} from 'lucide-react'
import { useReferenceLibrary } from '../../hooks/useReferenceLibrary'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface DocumentPreviewModalProps {
  document: any
  isOpen: boolean
  onClose: () => void
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document, isOpen, onClose }) => {
  const { incrementDownloadCount } = useReferenceLibrary()

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
    if (fileType.includes('word') || fileType.includes('document')) return <File className="w-8 h-8 text-blue-500" />
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <File className="w-8 h-8 text-green-500" />
    if (fileType.includes('image')) return <Image className="w-8 h-8 text-purple-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Contracts': return 'bg-blue-100 text-blue-800'
      case 'Terms': return 'bg-purple-100 text-purple-800'
      case 'Policies': return 'bg-red-100 text-red-800'
      case 'Training Material': return 'bg-green-100 text-green-800'
      case 'Templates': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = async () => {
    try {
      await incrementDownloadCount(document.id)
      
      // Simulate download
      const link = document.createElement('a')
      link.href = document.fileUrl
      link.download = document.fileName
      link.click()
      
      toast.success(`Downloading ${document.fileName}`)
    } catch (error: any) {
      toast.error('Failed to download document')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: document.description || `Check out this document: ${document.title}`,
        url: document.fileUrl
      })
    } else {
      navigator.clipboard.writeText(document.fileUrl)
      toast.success('Document link copied to clipboard')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                {getFileIcon(document.fileType)}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{document.title}</h2>
                <p className="text-blue-100 mt-1">{document.fileName}</p>
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
          {/* Document Information */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Document Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Folder className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Category</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(document.category)}`}>
                    {document.category}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <File className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">File Size</p>
                  <p className="text-white font-semibold">{formatFileSize(document.fileSize)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Uploaded By</p>
                  <p className="text-white font-semibold">{document.uploadedByName}</p>
                  <p className="text-gray-400 text-xs">{document.uploadedByRole}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Upload Date</p>
                  <p className="text-white font-semibold">
                    {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {format(new Date(document.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Downloads</p>
                  <p className="text-white font-semibold">{document.downloadCount} times</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <p className="text-gray-300 leading-relaxed">{document.description}</p>
            </div>
          )}

          {/* Document Preview */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Document Preview</h3>
            
            {document.fileType.includes('pdf') ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">PDF Document Preview</p>
                <p className="text-sm text-gray-500">
                  Click "Open in New Tab" to view the full document
                </p>
              </div>
            ) : document.fileType.includes('image') ? (
              <div className="bg-white rounded-xl p-4">
                <img 
                  src={document.fileUrl} 
                  alt={document.title}
                  className="max-w-full h-auto rounded-lg mx-auto"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center">
                {getFileIcon(document.fileType)}
                <p className="text-gray-600 mt-4 mb-2">{document.fileName}</p>
                <p className="text-sm text-gray-500">
                  Preview not available for this file type. Download to view.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/20 p-6">
          <div className="flex justify-between">
            <div className="flex space-x-3">
              <button
                onClick={handleDownload}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              
              <button
                onClick={handleShare}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in New Tab</span>
              </a>
            </div>
            
            <button
              onClick={onClose}
              className="px-6 py-2 border border-white/30 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-300 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentPreviewModal