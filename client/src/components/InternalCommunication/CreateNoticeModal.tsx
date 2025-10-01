import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  X, 
  MessageSquare, 
  Star, 
  AlertCircle, 
  Bell,
  Bold,
  Italic,
  List,
  Link,
  Eye
} from 'lucide-react'
import { useNoticeBoard } from '../../hooks/useNoticeBoard'
import toast from 'react-hot-toast'

interface CreateNoticeModalProps {
  isOpen: boolean
  onClose: () => void
}

interface NoticeFormData {
  title: string
  content: string
  category: 'Targets' | 'Policy' | 'General' | 'News'
  sendNotification: boolean
}

const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({ isOpen, onClose }) => {
  const { createNotice } = useNoticeBoard()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [content, setContent] = useState('')

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<NoticeFormData>({
    defaultValues: {
      category: 'General',
      sendNotification: false
    }
  })

  const watchedCategory = watch('category')

  const onSubmit = async (data: NoticeFormData) => {
    setLoading(true)
    try {
      await createNotice({
        title: data.title,
        content: content,
        category: data.category
      })
      
      if (data.sendNotification) {
        // Simulate sending notifications
        toast.success('Notice created and notifications sent!')
      } else {
        toast.success('Notice created successfully!')
      }
      
      reset()
      setContent('')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create notice')
    } finally {
      setLoading(false)
    }
  }

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText || 'bold text'}</strong>`
        break
      case 'italic':
        formattedText = `<em>${selectedText || 'italic text'}</em>`
        break
      case 'list':
        formattedText = `<ul>\n<li>${selectedText || 'list item'}</li>\n</ul>`
        break
      case 'link':
        formattedText = `<a href="https://example.com">${selectedText || 'link text'}</a>`
        break
      case 'heading':
        formattedText = `<h3>${selectedText || 'heading text'}</h3>`
        break
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end)
    setContent(newContent)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Targets': return <Star className="w-5 h-5 text-blue-400" />
      case 'Policy': return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'General': return <MessageSquare className="w-5 h-5 text-gray-400" />
      case 'News': return <Bell className="w-5 h-5 text-green-400" />
      default: return <MessageSquare className="w-5 h-5 text-gray-400" />
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
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Notice</h2>
                <p className="text-blue-100 mt-1">Post announcement for the team</p>
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
          {!showPreview ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Notice Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
                  placeholder="Enter notice title"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-300">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Targets', 'Policy', 'General', 'News'].map((category) => (
                    <label key={category} className="cursor-pointer">
                      <input
                        {...register('category', { required: 'Category is required' })}
                        type="radio"
                        value={category}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                        watchedCategory === category
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-white/20 bg-white/10 hover:border-white/40'
                      }`}>
                        <div className="flex justify-center mb-2">
                          {getCategoryIcon(category)}
                        </div>
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
                  Content *
                </label>
                
                {/* Rich Text Toolbar */}
                <div className="bg-white/10 rounded-t-xl p-3 border border-white/20 border-b-0">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => insertFormatting('heading')}
                      className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Heading"
                    >
                      <span className="text-sm font-bold">H3</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('bold')}
                      className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('italic')}
                      className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('list')}
                      className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('link')}
                      className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Link"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                    <div className="border-l border-white/20 h-6 mx-2"></div>
                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  id="content-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-b-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 resize-none"
                  placeholder="Enter notice content... You can use HTML tags for formatting."
                  required
                />
                <p className="mt-2 text-xs text-gray-400">
                  Tip: Use HTML tags like &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;h3&gt; for formatting
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    {...register('sendNotification')}
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-white font-medium">Send notification to all team members</span>
                </label>
                <p className="text-gray-400 text-sm mt-2 ml-8">
                  Team members will receive email/WhatsApp notification about this notice
                </p>
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
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-300 font-semibold"
                >
                  Preview
                </button>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Creating...' : 'Create Notice'}
                </button>
              </div>
            </form>
          ) : (
            /* Preview Mode */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Notice Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  Back to Edit
                </button>
              </div>

              {/* Preview Content */}
              <div className="bg-white rounded-xl p-6 text-gray-900">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{watch('title') || 'Notice Title'}</h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      watchedCategory === 'Targets' ? 'bg-blue-100 text-blue-800' :
                      watchedCategory === 'Policy' ? 'bg-red-100 text-red-800' :
                      watchedCategory === 'News' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getCategoryIcon(watchedCategory)}
                      <span className="ml-1">{watchedCategory}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>Posted by: Admin User</span>
                    <span>Date: {format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </div>
                <div 
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: content || '<p>No content yet...</p>' }}
                />
              </div>

              {/* Preview Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-6 py-3 border border-white/30 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 font-semibold"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                  className="flex-1 gradient-primary text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Creating...' : 'Publish Notice'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateNoticeModal