import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface ReferenceDocument {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  category: 'Contracts' | 'Terms' | 'Policies' | 'Training Material' | 'Templates'
  description?: string
  uploadedBy: string
  uploadedByName: string
  uploadedByRole: string
  downloadCount: number
  createdAt: string
  updatedAt: string
}

// Demo reference documents data
const demoDocuments: ReferenceDocument[] = [
  {
    id: 'doc-1',
    title: 'Standard Service Agreement Template',
    fileName: 'service-agreement-template.pdf',
    fileUrl: 'https://example.com/docs/service-agreement-template.pdf',
    fileSize: 245760,
    fileType: 'application/pdf',
    category: 'Contracts',
    description: 'Standard template for client service agreements. Use this for all new client contracts.',
    uploadedBy: 'demo-admin',
    uploadedByName: 'Admin User',
    uploadedByRole: 'Admin',
    downloadCount: 45,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'doc-2',
    title: 'Client Onboarding Checklist',
    fileName: 'client-onboarding-checklist.pdf',
    fileUrl: 'https://example.com/docs/client-onboarding-checklist.pdf',
    fileSize: 156432,
    fileType: 'application/pdf',
    category: 'Training Material',
    description: 'Step-by-step checklist for onboarding new clients. Follow this process for all new client acquisitions.',
    uploadedBy: 'demo-manager',
    uploadedByName: 'Manager User',
    uploadedByRole: 'Manager',
    downloadCount: 67,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'doc-3',
    title: 'Terms and Conditions - 2025',
    fileName: 'terms-conditions-2025.pdf',
    fileUrl: 'https://example.com/docs/terms-conditions-2025.pdf',
    fileSize: 389120,
    fileType: 'application/pdf',
    category: 'Terms',
    description: 'Updated terms and conditions for 2025. All team members must be familiar with these terms.',
    uploadedBy: 'demo-admin',
    uploadedByName: 'Admin User',
    uploadedByRole: 'Admin',
    downloadCount: 89,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'doc-4',
    title: 'Sales Process Training Manual',
    fileName: 'sales-process-training.pdf',
    fileUrl: 'https://example.com/docs/sales-process-training.pdf',
    fileSize: 1024000,
    fileType: 'application/pdf',
    category: 'Training Material',
    description: 'Comprehensive training manual covering our entire sales process from lead generation to client onboarding.',
    uploadedBy: 'demo-manager',
    uploadedByName: 'Manager User',
    uploadedByRole: 'Manager',
    downloadCount: 34,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'doc-5',
    title: 'Email Templates Collection',
    fileName: 'email-templates-collection.docx',
    fileUrl: 'https://example.com/docs/email-templates-collection.docx',
    fileSize: 78432,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'Templates',
    description: 'Collection of approved email templates for different scenarios: initial contact, follow-up, proposal submission, etc.',
    uploadedBy: 'demo-manager',
    uploadedByName: 'Manager User',
    uploadedByRole: 'Manager',
    downloadCount: 56,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'doc-6',
    title: 'Data Privacy and Security Policy',
    fileName: 'data-privacy-security-policy.pdf',
    fileUrl: 'https://example.com/docs/data-privacy-security-policy.pdf',
    fileSize: 567890,
    fileType: 'application/pdf',
    category: 'Policies',
    description: 'Comprehensive data privacy and security guidelines. Mandatory reading for all team members.',
    uploadedBy: 'demo-admin',
    uploadedByName: 'Admin User',
    uploadedByRole: 'Admin',
    downloadCount: 78,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'doc-7',
    title: 'Proposal Writing Best Practices',
    fileName: 'proposal-writing-guide.pdf',
    fileUrl: 'https://example.com/docs/proposal-writing-guide.pdf',
    fileSize: 234567,
    fileType: 'application/pdf',
    category: 'Training Material',
    description: 'Best practices guide for writing compelling proposals that convert. Includes examples and templates.',
    uploadedBy: 'demo-manager',
    uploadedByName: 'Manager User',
    uploadedByRole: 'Manager',
    downloadCount: 42,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export const useReferenceLibrary = () => {
  const [documents, setDocuments] = useState<ReferenceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  const fetchDocuments = async () => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - return demo data
      setTimeout(() => {
        setDocuments(demoDocuments)
        setLoading(false)
      }, 500)
      return
    }

    try {
      // In real implementation, this would fetch from a documents table
      setDocuments([])
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
    setLoading(false)
  }

  const uploadDocument = async (documentData: Partial<ReferenceDocument>, file: File) => {
    if (!user || !profile) return

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate uploading document
      const newDocument: ReferenceDocument = {
        id: `doc-${Date.now()}`,
        title: documentData.title || file.name,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        fileType: file.type,
        category: documentData.category || 'Training Material',
        description: documentData.description || '',
        uploadedBy: user.id,
        uploadedByName: profile.name,
        uploadedByRole: profile.role,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setDocuments(prev => [newDocument, ...prev])
      return
    }

    try {
      // In real implementation, this would upload to storage and create database record
      await fetchDocuments()
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  const deleteDocument = async (id: string) => {
    if (!user || !profile) return

    // Check permissions - only Admin and Manager can delete documents
    if (profile.role !== 'Admin' && profile.role !== 'Manager') {
      throw new Error('You do not have permission to delete documents')
    }

    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate deleting document
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      return
    }

    try {
      // In real implementation, this would delete from storage and database
      await fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  const incrementDownloadCount = async (id: string) => {
    // Check if we're in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      // Demo mode - simulate incrementing download count
      setDocuments(prev => prev.map(doc => 
        doc.id === id 
          ? { ...doc, downloadCount: doc.downloadCount + 1 }
          : doc
      ))
      return
    }

    try {
      // In real implementation, this would update the download count
      await fetchDocuments()
    } catch (error) {
      console.error('Error updating download count:', error)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [user, profile])

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    incrementDownloadCount,
    refetch: fetchDocuments
  }
}