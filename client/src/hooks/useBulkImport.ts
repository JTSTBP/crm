import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface ImportSummary {
  totalRows: number
  inserted: number
  skipped: number
  errors: Array<{ line: number; reason: string; data?: any }>
}

export const useBulkImport = () => {
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  const validateLinkedIn = (url: string): boolean => {
    if (!url) return true // Optional field
    return url.startsWith('https://www.linkedin.com/')
  }

  const validateWebsite = (url: string): boolean => {
    if (!url) return true // Optional field
    return url.startsWith('http://') || url.startsWith('https://')
  }

  const validateHiringNeeds = (needs: string[]): boolean => {
    if (!needs || needs.length === 0) return true // Optional field
    const validNeeds = ['IT', 'Non-IT', 'Volume', 'Leadership']
    return needs.every(need => validNeeds.includes(need))
  }

  const validateCompanySize = (size: string): boolean => {
    if (!size) return true // Optional field
    const validSizes = ['1-10', '11-50', '51-100', '101-500', '501-1000', '1000+']
    return validSizes.includes(size)
  }

  const validateLeadSource = (source: string): boolean => {
    if (!source) return true // Optional field
    const validSources = ['LinkedIn', 'Reference', 'Cold Call', 'Campaign', 'Website', 'Event', 'Other']
    return validSources.includes(source)
  }

  const validateStage = (stage: string): boolean => {
    const validStages = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']
    return validStages.includes(stage)
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = { _line: index + 2 }
      
      headers.forEach((header, i) => {
        // Normalize header names
        const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '')
        if (normalizedHeader.includes('company')) {
          if (normalizedHeader.includes('info')) {
            row.companyInfo = values[i] || ''
          } else if (normalizedHeader.includes('size')) {
            row.companySize = values[i] || ''
          } else {
            row.companyName = values[i] || ''
          }
        } else if (normalizedHeader.includes('website')) {
          row.websiteUrl = values[i] || ''
        } else if (normalizedHeader.includes('hiring')) {
          row.hiringNeeds = values[i] ? values[i].split(',').map((s: string) => s.trim()) : []
        } else if (normalizedHeader.includes('points') || normalizedHeader.includes('contact')) {
          if (normalizedHeader.includes('points')) {
            // Parse points of contact format: "Name1|Designation1|Phone1|Email1;Name2|Designation2|Phone2|Email2"
            const contactsStr = values[i] || ''
            if (contactsStr) {
              row.pointsOfContact = contactsStr.split(';').map((contact: string) => {
                const [name, designation, phone, email] = contact.split('|')
                return { name: name?.trim(), designation: designation?.trim(), phone: phone?.trim(), email: email?.trim() }
              }).filter((contact: any) => contact.name && contact.email)
            }
          } else if (normalizedHeader.includes('name')) {
            row.contactName = values[i] || ''
          } else if (normalizedHeader.includes('email')) {
            row.contactEmail = values[i] || ''
          } else if (normalizedHeader.includes('phone')) {
            row.contactPhone = values[i] || ''
          } else if (normalizedHeader.includes('designation')) {
            row.contactDesignation = values[i] || ''
          }
        } else if (normalizedHeader.includes('lead') && normalizedHeader.includes('source')) {
          row.leadSource = values[i] || ''
        } else if (normalizedHeader.includes('contact') && normalizedHeader.includes('name')) {
          row.contactName = values[i] || ''
        } else if (normalizedHeader.includes('email')) {
          row.contactEmail = values[i] || ''
        } else if (normalizedHeader.includes('phone')) {
          row.contactPhone = values[i] || ''
        } else if (normalizedHeader.includes('designation')) {
          row.contactDesignation = values[i] || ''
        } else if (normalizedHeader.includes('linkedin')) {
          row.linkedinLink = values[i] || ''
        } else if (normalizedHeader.includes('industry')) {
          row.industryName = values[i] || ''
        } else if (normalizedHeader.includes('stage')) {
          row.stage = values[i] || 'New'
        } else if (normalizedHeader.includes('assigned')) {
          row.assignedTo = values[i] || ''
        }
      })
      
      return row
    })

    return data
  }

  const importLeads = async (formData: FormData): Promise<ImportSummary> => {
    if (!user || !profile) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    
    try {
      const file = formData.get('file') as File
      const assignmentOption = formData.get('assignmentOption') as string
      const assignedTo = formData.get('assignedTo') as string

      if (!file) {
        throw new Error('No file provided')
      }

      // Read file content
      const text = await file.text()
      const data = parseCSV(text)

      if (data.length === 0) {
        throw new Error('No valid data found in file')
      }

      const summary: ImportSummary = {
        totalRows: data.length,
        inserted: 0,
        skipped: 0,
        errors: []
      }

      // Check if we're in demo mode
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
        // Demo mode - simulate import
        await simulateImport(data, assignmentOption, assignedTo, summary)
      } else {
        // Real Supabase import
        await performRealImport(data, assignmentOption, assignedTo, summary)
      }

      return summary
    } catch (error) {
      console.error('Import error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const simulateImport = async (
    data: any[], 
    assignmentOption: string, 
    assignedTo: string, 
    summary: ImportSummary
  ) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    const bdExecutives = ['bd-1', 'bd-2', 'bd-3', 'bd-4']
    let currentBDIndex = 0

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      // Validate required fields
      if (!row.companyName || !row.contactName || !row.contactEmail || !row.contactPhone || !row.contactDesignation || !row.industryName) {
        summary.errors.push({
          line: row._line,
          reason: 'Missing required fields (companyName, contactName, contactEmail, contactPhone, contactDesignation, industryName)',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate email format
      if (!validateEmail(row.contactEmail)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid email format',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate phone format
      if (!validatePhone(row.contactPhone)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid phone format (must be 8-15 digits)',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate LinkedIn URL
      if (row.linkedinLink && !validateLinkedIn(row.linkedinLink)) {
        summary.errors.push({
          line: row._line,
          reason: 'LinkedIn URL must start with https://www.linkedin.com/',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate website URL
      if (row.websiteUrl && !validateWebsite(row.websiteUrl)) {
        summary.errors.push({
          line: row._line,
          reason: 'Website URL must start with http:// or https://',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate hiring needs
      if (row.hiringNeeds && !validateHiringNeeds(row.hiringNeeds)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid hiring needs. Valid options: IT, Non-IT, Volume, Leadership',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate company size
      if (row.companySize && !validateCompanySize(row.companySize)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid company size. Valid options: 1-10, 11-50, 51-100, 101-500, 501-1000, 1000+',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate lead source
      if (row.leadSource && !validateLeadSource(row.leadSource)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid lead source. Valid options: LinkedIn, Reference, Cold Call, Campaign, Website, Event, Other',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate stage
      if (row.stage && !validateStage(row.stage)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid stage value',
          data: row
        })
        summary.skipped++
        continue
      }

      // Simulate duplicate check (randomly skip some)
      if (Math.random() < 0.1) {
        summary.errors.push({
          line: row._line,
          reason: 'Duplicate email found',
          data: row
        })
        summary.skipped++
        continue
      }

      // Assign BD Executive
      let finalAssignedTo = assignedTo
      if (assignmentOption === 'auto' || !assignedTo) {
        finalAssignedTo = bdExecutives[currentBDIndex]
        currentBDIndex = (currentBDIndex + 1) % bdExecutives.length
      }

      // Simulate successful insert
      summary.inserted++
    }

    // Log activity
    console.log('Bulk import completed:', {
      userId: user?.id,
      role: profile?.role,
      action: 'Bulk Import',
      fileName: 'demo-file.csv',
      totalRows: summary.totalRows,
      inserted: summary.inserted,
      skipped: summary.skipped
    })
  }

  const performRealImport = async (
    data: any[], 
    assignmentOption: string, 
    assignedTo: string, 
    summary: ImportSummary
  ) => {
    // Get existing emails to check for duplicates
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('contact_email')

    const existingEmails = new Set(existingLeads?.map(lead => lead.contact_email.toLowerCase()) || [])

    // Get BD Executives for auto-assignment
    const { data: bdExecutives } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'BD Executive')

    let currentBDIndex = 0
    const validLeads = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      // Validate required fields
      if (!row.companyName || !row.contactName || !row.contactEmail || !row.contactPhone || !row.contactDesignation || !row.industryName) {
        summary.errors.push({
          line: row._line,
          reason: 'Missing required fields',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate email format
      if (!validateEmail(row.contactEmail)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid email format',
          data: row
        })
        summary.skipped++
        continue
      }

      // Check for duplicates
      if (existingEmails.has(row.contactEmail.toLowerCase())) {
        summary.errors.push({
          line: row._line,
          reason: 'Duplicate email found',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate phone format
      if (!validatePhone(row.contactPhone)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid phone format (must be 8-15 digits)',
          data: row
        })
        summary.skipped++
        continue
      }

      // Validate LinkedIn URL
      if (row.linkedinLink && !validateLinkedIn(row.linkedinLink)) {
        summary.errors.push({
          line: row._line,
          reason: 'LinkedIn URL must start with https://www.linkedin.com/',
          data: row
        })
        summary.skipped++
        continue
      }
      // Validate stage
      if (row.stage && !validateStage(row.stage)) {
        summary.errors.push({
          line: row._line,
          reason: 'Invalid stage value',
          data: row
        })
        summary.skipped++
        continue
      }

      // Assign BD Executive
      let finalAssignedTo = assignedTo
      if (assignmentOption === 'auto' || !assignedTo) {
        if (bdExecutives && bdExecutives.length > 0) {
          finalAssignedTo = bdExecutives[currentBDIndex % bdExecutives.length].id
          currentBDIndex++
        } else {
          finalAssignedTo = user.id // Fallback to current user
        }
      }

      validLeads.push({
        company_name: row.companyName,
        company_info: row.companyInfo || null,
        company_size: row.companySize || null,
        website_url: row.websiteUrl || null,
        hiring_needs: row.hiringNeeds || null,
        points_of_contact: row.pointsOfContact || null,
        lead_source: row.leadSource || null,
        contact_name: row.contactName,
        contact_email: row.contactEmail,
        contact_phone: row.contactPhone,
        contact_designation: row.contactDesignation,
        linkedin_link: row.linkedinLink || null,
        industry_name: row.industryName,
        stage: row.stage || 'New',
        assigned_to: finalAssignedTo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      existingEmails.add(row.contactEmail.toLowerCase())
    }

    // Bulk insert valid leads
    if (validLeads.length > 0) {
      const { error } = await supabase
        .from('leads')
        .insert(validLeads)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      summary.inserted = validLeads.length
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'Bulk Import',
        details: `Imported ${summary.inserted} leads from file. Total rows: ${summary.totalRows}, Skipped: ${summary.skipped}`
      })
  }

  return {
    importLeads,
    loading
  }
}