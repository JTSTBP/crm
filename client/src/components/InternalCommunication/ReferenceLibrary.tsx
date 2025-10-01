import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Download,
  Eye,
  Trash2,
  FileText,
  File,
  Image,
  Calendar,
  User,
  Upload,
  Folder
} from 'lucide-react'
import { useReferenceLibrary } from '../../hooks/useReferenceLibrary'
import { useAuth } from '../../contexts/AuthContext'
import UploadDocumentModal from './UploadDocumentModal'
import DocumentPreviewModal from './DocumentPreviewModal'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ReferenceLibrary: React.FC = () => {
  const { documents, loading, deleteDocument, incrementDownloadCount } = useReferenceLibrary()
  const { profile } = useAuth()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const categories = ['All', 'Contracts', 'Terms', 'Policies', 'Training Material', 'Templates']

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />
    if (fileType.includes('word') || fileType.includes('document')) return <File className="w-6 h-6 text-blue-500" />
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <File className="w-6 h-6 text-green-500" />
    if (fileType.includes('image')) return <Image className="w-6 h-6 text-purple-500" />
    return <File className="w-6 h-6 text-gray-500" />
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

  const handleDownload = async (document: any) => {
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

  const handleDeleteDocument = async (documentId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteDocument(documentId)
        toast.success('Document deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete document')
      }
    }
  }

  // Only Admin and Manager can manage documents
  const canManageDocuments = profile?.role === 'Admin' || profile?.role === 'Manager'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reference Library</h2>
          <p className="text-gray-300 mt-1">Access important documents, templates, and resources</p>
        </div>
        {canManageDocuments && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="gradient-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {categories.slice(1).map(category => (
          <div key={category} className="glass rounded-xl p-4 border border-white/30 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <p className="text-lg font-bold text-white">
              {documents.filter(d => d.category === category).length}
            </p>
            <p className="text-gray-300 text-sm">{category}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-6 border border-white/30 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-300" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <div 
            key={document.id} 
            className="glass rounded-xl p-6 border border-white/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  {getFileIcon(document.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">{document.title}</h3>
                  <p className="text-gray-300 text-sm">{document.fileName}</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                {document.category}
              </span>
            </div>

            {document.description && (
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                {document.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-400">File Size</p>
                <p className="text-white font-medium">{formatFileSize(document.fileSize)}</p>
              </div>
              <div>
                <p className="text-gray-400">Downloads</p>
                <p className="text-white font-medium">{document.downloadCount}</p>
              </div>
              <div>
                <p className="text-gray-400">Uploaded By</p>
                <p className="text-white font-medium">{document.uploadedByName}</p>
              </div>
              <div>
                <p className="text-gray-400">Date</p>
                <p className="text-white font-medium">
                  {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedDocument(document)}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/20 rounded-lg"
                  title="Preview Document"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDownload(document)}
                  className="p-2 text-gray-400 hover:text-green-400 transition-colors hover:bg-white/20 rounded-lg"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {canManageDocuments && document.uploadedBy === profile?.id && (
                <button
                  onClick={() => handleDeleteDocument(document.id, document.title)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/20 rounded-lg"
                  title="Delete Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="glass rounded-xl border border-white/30 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-3">No documents found</h3>
          <p className="text-gray-300 text-lg mb-6">
            {searchTerm || categoryFilter !== 'All'
              ? 'Try adjusting your search or filters' 
              : 'No documents have been uploaded yet'}
          </p>
          {canManageDocuments && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Upload First Document
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {isUploadModalOpen && (
        <UploadDocumentModal 
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}

      {selectedDocument && (
        <DocumentPreviewModal 
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  )
}

export default ReferenceLibrary