import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { 
  X, 
  Upload, 
  FileText, 
  File,
  Image,
  Folder,
  AlertCircle
} from 'lucide-react'
import { useReferenceLibrary } from '../../hooks/useReferenceLibrary'
import toast from 'react-hot-toast'

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DocumentFormData {
  title: string
  category: 'Contracts' | 'Terms' | 'Policies' | 'Training Material' | 'Templates'
  description: string
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ isOpen, onClose }) => {
  const { uploadDocument } = useReferenceLibrary()
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<DocumentFormData>({
    defaultValues: {
      category: 'Training Material'
    }
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }
      setUploadedFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  })

  const onSubmit = async (data: DocumentFormData) => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload')
      return
    }

    setLoading(true)
    try {
      await uploadDocument({
        title: data.title,
        category: data.category,
        description: data.description
      }, uploadedFile)
      
      toast.success('Document uploaded successfully!')
      reset()
      setUploadedFile(null)
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
    if (file.type.includes('word') || file.type.includes('document')) return <File className="w-8 h-8 text-blue-500" />
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return <File className="w-8 h-8 text-green-500" />
    if (file.type.includes('image')) return <Image className="w-8 h-8 text-purple-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/30">
        {/* Header */}
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Upload Document</h2>
                <p className="text-blue-100 mt-1">Add document to reference library</p>
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Select File *
              </label>
              
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                    isDragActive 
                      ? 'border-blue-400 bg-blue-500/10' 
                      : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-blue-400 text-lg font-medium">Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="text-white text-lg font-medium mb-2">
                        Drag & drop your file here, or click to browse
                      </p>
                      <p className="text-gray-400 text-sm">
                        PDF, DOC, DOCX, XLS, XLSX, TXT, Images (Max 50MB)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between border border-white/20">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(uploadedFile)}
                    <div>
                      <p className="text-white font-medium">{uploadedFile.name}</p>
                      <p className="text-gray-400 text-sm">{formatFileSize(uploadedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Document Details */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Document Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                placeholder="Enter document title"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-300">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Category *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['Contracts', 'Terms', 'Policies', 'Training Material', 'Templates'].map((category) => (
                  <label key={category} className="cursor-pointer">
                    <input
                      {...register('category', { required: 'Category is required' })}
                      type="radio"
                      value={category}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                      register('category').name === category
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/10 hover:border-white/40'
                    }`}>
                      <Folder className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">{category}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="mt-2 text-sm text-red-300">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
                placeholder="Brief description of the document..."
              />
            </div>

            {/* File Guidelines */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                <h4 className="text-blue-400 font-semibold">Upload Guidelines</h4>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• Maximum file size: 50MB</p>
                <p>• Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, Images</p>
                <p>• Use descriptive titles for easy searching</p>
                <p>• Add detailed descriptions for better categorization</p>
                <p>• Ensure documents don't contain sensitive personal information</p>
              </div>
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
                disabled={loading || !uploadedFile}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UploadDocumentModal