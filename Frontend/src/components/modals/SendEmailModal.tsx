
import React, { useEffect, useRef, useState } from 'react';
import { Mail, Pencil, X, Send, Save, AlertTriangle, Plus, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';
import type { EmailContent, EmailResources } from '../email/types';
import { emptyEmailResources, parseEmailResources } from '../email/emailBrandingConfiguration';
import { buildEmailHtml } from '../email/emailHtmlTemplate';

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  company: Company | null;
  poc: PointOfContact | null;
}

interface Company {
  _id?: string;
  company_name?: string;
  company_size?: string;
  industry_name?: string;
  website_url?: string;
  linkedin_link?: string;
}

interface PointOfContact {
  _id?: string;
  name?: string;
  designation?: string;
  phone?: string;
  email?: string;
  linkedin_url?: string;
  linkedin_link?: string;
}

interface DailyEmailLimit {
  dailyLimit: number;
  emailsSentToday: number;
  emailsRemaining: number;
  canSend: boolean;
}

type EditablePocSnapshot = {
  name?: string;
  designation?: string;
  phone?: string;
  email?: string;
  linkedin_url?: string;
};

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const firstNameOf = (value = '') => value.trim().split(/\s+/)[0] || '';
const toDisplayName = (value = '') => value.trim().replace(/\b([a-z])/g, char => char.toUpperCase());

const nameFromGreeting = (greeting: string, fallback = '') => {
  const stripped = String(greeting || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^\s*(hi|hello|dear)\s+/i, '')
    .replace(/[,\n\r].*$/s, '')
    .trim();
  return stripped || fallback || '';
};

const normalizeGreetingDisplayName = (greeting = '', targetName = '') => String(greeting || '').replace(
  /^(\s*(?:hi|hello|dear)\s+)([^,\n\r]+)(.*)$/i,
  (_match, prefix, name, suffix) => `${prefix}${toDisplayName(targetName || name)}${suffix || ','}`
);

const shouldUseGreetingAsEditedName = (greetingName: string, originalName = '') => {
  const current = greetingName.trim();
  const original = originalName.trim();
  if (!current) return false;
  if (!original) return true;
  const originalFirstName = firstNameOf(original);
  if (current.toLowerCase() === original.toLowerCase()) return false;
  if (current.toLowerCase() === originalFirstName.toLowerCase()) return false;

  // A generated greeting is often a single lowercase first name. Do not let that
  // rewrite the selected POC card/header. Full-name edits like "Rahul Sharma"
  // are treated as intentional POC-name overrides.
  if (!/\s/.test(current) && current === current.toLowerCase()) return false;

  return true;
};

const replaceIfChanged = (text = '', original = '', current = '') => {
  if (!original || !current || original.trim() === current.trim()) return text;
  return text.replace(new RegExp(escapeRegExp(original.trim()), 'gi'), current.trim());
};

const applyPocSnapshotToText = (text = '', originalPoc: PointOfContact | null, currentPoc: EditablePocSnapshot) => {
  let output = String(text || '');
  const originalName = originalPoc?.name || '';
  const currentName = currentPoc.name || originalName;
  const originalFirst = firstNameOf(originalName);
  const currentFirst = firstNameOf(currentName);
  output = output
    .replace(/\{\{\s*POC_NAME\s*\}\}/gi, currentName)
    .replace(/\{\{\s*POC_FIRST_NAME\s*\}\}/gi, currentFirst)
    .replace(/\{\{\s*POC_EMAIL\s*\}\}/gi, currentPoc.email || originalPoc?.email || '')
    .replace(/\{\{\s*POC_DESIGNATION\s*\}\}/gi, currentPoc.designation || originalPoc?.designation || '')
    .replace(/\{\{\s*POC_PHONE\s*\}\}/gi, currentPoc.phone || originalPoc?.phone || '')
    .replace(/\{\{\s*POC_LINKEDIN\s*\}\}/gi, currentPoc.linkedin_url || originalPoc?.linkedin_url || originalPoc?.linkedin_link || '');
  output = replaceIfChanged(output, originalName, currentName);
  output = replaceIfChanged(output, originalFirst, currentFirst);
  output = replaceIfChanged(output, originalPoc?.email, currentPoc.email);
  output = replaceIfChanged(output, originalPoc?.designation, currentPoc.designation);
  output = replaceIfChanged(output, originalPoc?.phone, currentPoc.phone);
  output = replaceIfChanged(output, originalPoc?.linkedin_url || originalPoc?.linkedin_link, currentPoc.linkedin_url);
  return output;
};

const applyPocSnapshotToContent = (draft: EmailContent, originalPoc: PointOfContact | null, currentPoc: EditablePocSnapshot): EmailContent => ({
  ...draft,
  greeting: normalizeGreetingDisplayName(applyPocSnapshotToText(draft.greeting, originalPoc, currentPoc), currentPoc.name || originalPoc?.name || ''),
  openingLine: applyPocSnapshotToText(draft.openingLine, originalPoc, currentPoc),
  contextLine: applyPocSnapshotToText(draft.contextLine, originalPoc, currentPoc),
  companyBlurb: applyPocSnapshotToText(draft.companyBlurb, originalPoc, currentPoc),
  pitchLine: applyPocSnapshotToText(draft.pitchLine, originalPoc, currentPoc),
  bullets: draft.bullets.map(point => applyPocSnapshotToText(point, originalPoc, currentPoc)),
  closingLine: applyPocSnapshotToText(draft.closingLine, originalPoc, currentPoc),
  ctaLine: applyPocSnapshotToText(draft.ctaLine, originalPoc, currentPoc),
  senderName: applyPocSnapshotToText(draft.senderName, originalPoc, currentPoc)
});

const buildCompanyBlurb = (company: Company | null, poc: PointOfContact | null) => {
  const name = company?.company_name || 'This company';
  const parts: string[] = [];

  let sentence = name;
  if (company?.company_size) sentence += ` is a ${company.company_size}-person company`;
  else sentence += ' is a company';
  if (company?.industry_name) sentence += ` in the ${company.industry_name} industry`;
  sentence += '.';
  parts.push(sentence);

  if (poc?.name || poc?.designation) {
    let pocSentence = 'Our point of contact is';
    if (poc?.name) pocSentence += ` ${poc.name}`;
    if (poc?.designation) pocSentence += `, ${poc.designation}`;
    pocSentence += '.';
    parts.push(pocSentence);
  }

  return parts.join(' ');
};

const createDefaultContent = (company: Company | null, poc: PointOfContact | null): EmailContent => ({
  greeting: `Hi ${poc?.name || 'there'},`,
  openingLine: `Hope you're doing well! I came across ${company?.company_name || 'your company'} and wanted to explore how we could support your hiring needs.`,
  contextLine: `${poc?.designation ? `As ${poc.designation} at ${company?.company_name || 'your company'}` : `At ${company?.company_name || 'your company'}`}, finding people who can make a genuine impact matters.`,
  companyBlurb: buildCompanyBlurb(company, poc),
  pitchLine: `Jobs Territory is a Bengaluru-based recruitment firm specializing in mid-to-senior Non-IT hiring across Sales, Marketing, Business Development, and Operations, with quality shortlists delivered in 48–72 hours.`,
  bullets: ['Pre-screened professionals across domains', 'Shortlists delivered within 48–72 hours', 'Culture-fit screening', 'Flexible hiring support'],
  caseStudyLabel: 'View Our Case Studies',
  testimonialsLabel: 'Read Client Testimonials',
  closingLine: `We'd love the opportunity to support your team with relevant, carefully screened talent.`,
  ctaLine: `Can we connect for a quick 15-minute call this week to discuss your hiring priorities?`,
  senderName: 'Business Development Team — Jobs Territory',
});

const createDefaultSubject = (company: Company | null) => `Your Next Great Hire — Jobs Territory × ${company?.company_name || 'Your Company'}`;
const SendEmailModal: React.FC<SendEmailModalProps> = ({ open, onClose, company, poc }) => {
  const [editMode, setEditMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStage, setSendStage] = useState<'idle' | 'preparing' | 'sending'>('idle');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [isAiDraft, setIsAiDraft] = useState(false);
  const [aiPreviewHtml, setAiPreviewHtml] = useState('');
  const [emailResources, setEmailResources] = useState<EmailResources>(emptyEmailResources);
  const [dailyLimit, setDailyLimit] = useState<DailyEmailLimit | null>(null);
  const [dailyLimitLoading, setDailyLimitLoading] = useState(false);
  const requestSequence = useRef(0);
  const activeGenerationRef = useRef('');
  const [to, setTo] = useState(poc?.email || '');
  const [subject, setSubject] = useState(() => createDefaultSubject(company));
  const [content, setContent] = useState<EmailContent>(() => createDefaultContent(company, poc));
  const getEditedPocSnapshot = (draft: EmailContent = content): EditablePocSnapshot => {
    const originalName = poc?.name || '';
    const greetingName = nameFromGreeting(draft.greeting, originalName);
    const name = toDisplayName(shouldUseGreetingAsEditedName(greetingName, originalName) ? greetingName : originalName);
    return {
      name,
      designation: poc?.designation,
      phone: poc?.phone,
      email: to || poc?.email || '',
      linkedin_url: poc?.linkedin_url || poc?.linkedin_link || ''
    };
  };
  const getSendReadyContent = (draft: EmailContent = content) =>
    applyPocSnapshotToContent(draft, poc, getEditedPocSnapshot(draft));

  const generateEmail = async (regenerate = false, refreshResearch = false) => {
    if (!company?._id || !poc?._id) return;
    const generationKey = `${company._id}:${poc._id}:${regenerate}:${refreshResearch}`;
    if (activeGenerationRef.current === generationKey) return;
    activeGenerationRef.current = generationKey;
    const requestId = ++requestSequence.current;
    setGenerating(true);
    setGenerationError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/email-leads/generate-ai-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ leadId: company._id, pocId: poc._id, regenerate, refreshResearch, requestId: `${Date.now()}-${requestId}` })
      });
      const data = await response.json();
      const resources = parseEmailResources(data.resources);
      const requiredFields: (keyof EmailResources)[] = [
        'caseStudiesUrl',
        'testimonialsUrl',
        'companyWebsiteUrl',
        'logoUrl',
        'linkedInUrl',
        'contactEmail',
        'brandName',
        'footerText'
      ];
      const hasRequiredResources = requiredFields.every(field =>
        typeof resources?.[field] === 'string' && resources[field].trim()
      );
      if (hasRequiredResources) setEmailResources(resources);
      if (!response.ok) throw new Error(data.message || 'Unable to generate an AI email.');
      if (typeof data.subject !== 'string' || !data.content || !Array.isArray(data.content.bullets)) {
        throw new Error('The AI service returned an invalid email draft.');
      }
      if (!hasRequiredResources) {
        throw new Error('The AI response is missing configured email resource links.');
      }
      if (requestId !== requestSequence.current) return;
      const defaults = createDefaultContent(company, poc);
      const generatedContent = applyPocSnapshotToContent({
        ...defaults,
        greeting: data.content.greeting || defaults.greeting,
        openingLine: data.content.openingLine || defaults.openingLine,
        contextLine: data.content.contextLine || defaults.contextLine,
        companyBlurb: data.content.companyBlurb || defaults.companyBlurb,
        pitchLine: data.content.pitchLine || defaults.pitchLine,
        bullets: data.content.bullets.length ? data.content.bullets : defaults.bullets,
        closingLine: data.content.closingLine || defaults.closingLine,
        ctaLine: data.content.ctaLine || defaults.ctaLine,
        senderName: data.content.senderName || defaults.senderName
      }, poc, {
        name: toDisplayName(poc?.name || nameFromGreeting(data.content.greeting, defaults.greeting)),
        designation: poc?.designation,
        phone: poc?.phone,
        email: to || poc?.email || '',
        linkedin_url: poc?.linkedin_url || poc?.linkedin_link || ''
      });
      setSubject(data.subject);
      setContent(generatedContent);
      setEmailResources(resources);
      setAiPreviewHtml(typeof data.htmlBody === 'string' ? data.htmlBody : '');
      setIsAiDraft(true);
      setEditMode(false);
      if (regenerate) toast.success('AI email regenerated');
    } catch (error: unknown) {
      if (requestId !== requestSequence.current) return;
      setGenerationError(error instanceof Error ? error.message : 'Unable to generate an AI email.');
      setIsAiDraft(false);
      setAiPreviewHtml('');
    } finally {
      if (activeGenerationRef.current === generationKey) activeGenerationRef.current = '';
      if (requestId === requestSequence.current) setGenerating(false);
    }
  };

  const loadDailyLimit = async () => {
    setDailyLimitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/email-leads/daily-limit`, {
        headers: { 'x-auth-token': token || '' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load daily email usage.');
      setDailyLimit(data);
    } catch {
      setDailyLimit(null);
    } finally {
      setDailyLimitLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      requestSequence.current += 1;
      return;
    }
    setTo(poc?.email || '');
    setSubject(createDefaultSubject(company));
    setContent(createDefaultContent(company, poc));
    setEmailResources(emptyEmailResources);
    setEditMode(false);
    setIsAiDraft(false);
    setAiPreviewHtml('');
    setGenerationError('');
    setDailyLimit(null);
    loadDailyLimit();
    if (company?._id && poc?._id) generateEmail(false);
    // The IDs define a compose target; other object changes must not overwrite user edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company?._id, poc?._id]);

  const handleRegenerate = () => {
    if (editMode && !window.confirm('Regenerating will replace your current edits. Continue?')) return;
    generateEmail(true);
  };

  const handleRefreshResearch = () => {
    if (editMode && !window.confirm('Fresh research will replace your current edits. Continue?')) return;
    generateEmail(true, true);
  };

  const renderEmailHtml = () => isAiDraft && aiPreviewHtml
    ? aiPreviewHtml
    : buildEmailHtml({
      content: getSendReadyContent(content),
      companyName: company?.company_name,
      recipientEmail: to,
      resources: emailResources,
    });

  const updateBullet = (idx: number, val: string) => {
    const updated = [...content.bullets];
    updated[idx] = val;
    setContent({ ...content, bullets: updated });
  };
  const addBullet = () => setContent({ ...content, bullets: [...content.bullets, ''] });
  const removeBullet = (idx: number) => setContent({ ...content, bullets: content.bullets.filter((_, i) => i !== idx) });

  const handleSend = async () => {
    if (!to) { toast.error('Recipient email is required'); return; }
    try {
      setSending(true);
      setSendStage('preparing');
      const token = localStorage.getItem('token');
      let htmlBody = renderEmailHtml();
      let plainText = '';
      const sendReadyContent = getSendReadyContent(content);
      const editedPocSnapshot = getEditedPocSnapshot(sendReadyContent);
      if (isAiDraft) {
        const renderResponse = await fetch(`${API_BASE_URL}/api/email-leads/render-ai-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
          body: JSON.stringify({
            leadId: company?._id,
            pocId: poc?._id,
            content: sendReadyContent,
            pointOfContactOverrides: editedPocSnapshot
          })
        });
        const rendered = await renderResponse.json();
        if (!renderResponse.ok || typeof rendered.htmlBody !== 'string') {
          throw new Error(rendered.message || 'Unable to prepare the email.');
        }
        htmlBody = rendered.htmlBody;
        plainText = typeof rendered.plainText === 'string' ? rendered.plainText : '';
      }
      setSendStage('sending');
      const res = await fetch(`${API_BASE_URL}/api/email-leads/send-mails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({
          to,
          subject,
          htmlBody,
          plainText,
          pointOfContactOverrides: editedPocSnapshot,
          leadId: company?._id,
          pocId: poc?._id
        })
      });
      const data = await res.json();
      if (res.status === 429) {
        if (data.code === 'GMAIL_DAILY_LIMIT_EXCEEDED') {
          toast.error(data.message || 'Gmail daily sending limit exceeded for this sender account.');
          loadDailyLimit();
          return;
        }
        setDailyLimit({
          dailyLimit: data.dailyLimit ?? 50,
          emailsSentToday: data.emailsSentToday ?? 50,
          emailsRemaining: 0,
          canSend: false
        });
        toast.error('Daily email limit reached. You can send more emails tomorrow.');
        return;
      }
      if (res.ok) {
        setDailyLimit(current => current ? {
          dailyLimit: data.dailyLimit ?? current.dailyLimit,
          emailsSentToday: data.emailsSentToday ?? current.emailsSentToday + 1,
          emailsRemaining: data.emailsRemaining ?? Math.max(0, current.emailsRemaining - 1),
          canSend: (data.emailsRemaining ?? current.emailsRemaining - 1) > 0
        } : current);
        toast.success('Email sent successfully!');
        onClose();
      } else toast.error(data.message || 'Failed to send email');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
      setSendStage('idle');
    }
  };

  if (!open) return null;

  const fieldClass = `w-full px-4 py-3 rounded-2xl border border-[#0ea5e9] bg-white ring-4 ring-[#0ea5e9]/10 text-sm text-[#0f1c2e] outline-none transition-all`;
  const viewFieldClass = `w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-[#0f1c2e] outline-none`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 overflow-x-hidden">
      <div className="bg-white w-[95vw] sm:w-[90vw] lg:w-[60vw] max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden min-w-0">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[#0f1c2e]">Compose Email</h2>
              <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest truncate">Email Sending Tab</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            {company?._id && poc?._id && (
              <button
                onClick={handleRefreshResearch}
                disabled={generating}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-50 min-h-10"
                title="Discard cached research and check current career/job sources"
              >
                <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                Refresh Research
              </button>
            )}
            {company?._id && poc?._id && (
              <button
                onClick={handleRegenerate}
                disabled={generating}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 transition-all disabled:opacity-50 min-h-10"
              >
                <Sparkles size={13} className={generating ? 'animate-pulse' : ''} />
                {generating ? 'Regenerating…' : '✨ Regenerate Email'}
              </button>
            )}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-10 ${
                editMode ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-amber-200 hover:text-amber-600'
              }`}
            >
              <Pencil size={13} />
              {editMode ? 'Editing' : 'Edit'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 min-h-10 min-w-10 justify-self-end">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5 space-y-4 min-w-0">

          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-black uppercase tracking-widest text-sky-700">Today's Email Usage</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {dailyLimitLoading ? 'Loading usage…' : dailyLimit
                    ? `${dailyLimit.emailsSentToday} / ${dailyLimit.dailyLimit} Emails Sent`
                    : 'Usage unavailable'}
                </p>
              </div>
              {dailyLimit && (
                <p className="text-xs font-black text-sky-700">Remaining: {dailyLimit.emailsRemaining}</p>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-sky-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${dailyLimit?.emailsRemaining === 0 ? 'bg-rose-500' : 'bg-sky-500'}`}
                style={{ width: `${dailyLimit ? Math.min(100, (dailyLimit.emailsSentToday / dailyLimit.dailyLimit) * 100) : 0}%` }}
              />
            </div>
            {dailyLimit?.emailsRemaining === 0 && (
              <p className="mt-2 text-xs font-bold text-rose-600">
                You have reached today's email sending limit. The limit resets automatically tomorrow.
              </p>
            )}
          </div>

          {generating && (
            <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
              <Sparkles size={16} className="text-violet-500 animate-pulse shrink-0" />
              <p className="text-xs font-bold text-violet-700">Generating personalized email…</p>
            </div>
          )}

          {!generating && isAiDraft && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <Sparkles size={16} className="text-emerald-500 shrink-0" />
              <p className="text-xs font-bold text-emerald-700">AI draft ready — review and edit it before sending.</p>
            </div>
          )}

          {!generating && generationError && (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-amber-700">{generationError} The standard template is available below.</p>
              </div>
              <button disabled={generating} onClick={() => generateEmail(false)} className="text-xs font-black text-amber-700 hover:underline shrink-0 disabled:opacity-50 self-start sm:self-auto">Try again</button>
            </div>
          )}

          {!poc?.email && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs font-bold text-amber-700">This contact has no email — please enter one below before sending.</p>
            </div>
          )}

          {/* To */}
          <div className="space-y-1.5">
            <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">To</label>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all min-w-0 ${editMode || !poc?.email ? 'border-[#0ea5e9] bg-white ring-4 ring-[#0ea5e9]/10' : 'border-slate-200 bg-slate-50'}`}>
              <Mail size={15} className="text-slate-400 shrink-0" />
              <input
                type="email"
                value={to}
                disabled={!!poc?.email && !editMode}
                onChange={e => setTo(e.target.value)}
                placeholder="Enter recipient email"
                className="flex-1 min-w-0 bg-transparent text-sm font-bold text-[#0f1c2e] placeholder-slate-300 outline-none"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Subject</label>
            <input
              type="text"
              value={subject}
              disabled={!editMode}
              onChange={e => setSubject(e.target.value)}
              className={editMode ? fieldClass : viewFieldClass}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[0.6rem] font-bold text-slate-300 uppercase tracking-widest">
              {editMode ? 'Edit Email Sections' : 'Email Preview'}
            </span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* EDIT MODE — friendly section fields */}
          {editMode ? (
            <div className="space-y-5 min-w-0">

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Greeting</label>
                <input type="text" value={content.greeting} onChange={e => setContent({...content, greeting: e.target.value})} className={fieldClass} placeholder="Hi John," />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Opening Line</label>
                <textarea rows={5} value={content.openingLine} onChange={e => setContent({...content, openingLine: e.target.value})} className={`${fieldClass} resize-y min-h-32`} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Context / Company Insight</label>
                <textarea rows={4} value={content.contextLine} onChange={e => setContent({...content, contextLine: e.target.value})} className={`${fieldClass} resize-y min-h-28`} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">About The Company (short blurb)</label>
                <textarea rows={3} value={content.companyBlurb} onChange={e => setContent({...content, companyBlurb: e.target.value})} className={`${fieldClass} resize-y min-h-24`} placeholder="A couple of plain sentences about the company" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Our Pitch</label>
                <textarea rows={4} value={content.pitchLine} onChange={e => setContent({...content, pitchLine: e.target.value})} className={`${fieldClass} resize-y min-h-28`} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Value Points</label>
                  <button onClick={addBullet} className="flex items-center gap-1 text-[0.65rem] font-bold text-[#0ea5e9] hover:underline">
                    <Plus size={12} /> Add Point
                  </button>
                </div>
                <div className="space-y-2">
                  {content.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center text-[0.6rem] font-black shrink-0">{i + 1}</span>
                      <input type="text" value={b} onChange={e => updateBullet(i, e.target.value)} className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#0ea5e9] bg-white ring-2 ring-[#0ea5e9]/10 text-sm text-[#0f1c2e] outline-none" placeholder={`Value point ${i + 1}`} />
                      {content.bullets.length > 1 && (
                        <button onClick={() => removeBullet(i)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Case Study Button Label</label>
                  <input type="text" value={content.caseStudyLabel} onChange={e => setContent({...content, caseStudyLabel: e.target.value})} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Testimonials Button Label</label>
                  <input type="text" value={content.testimonialsLabel} onChange={e => setContent({...content, testimonialsLabel: e.target.value})} className={fieldClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Closing Paragraph</label>
                <textarea rows={3} value={content.closingLine} onChange={e => setContent({...content, closingLine: e.target.value})} className={`${fieldClass} resize-y min-h-24`} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Call to Action Line</label>
                <input type="text" value={content.ctaLine} onChange={e => setContent({...content, ctaLine: e.target.value})} className={fieldClass} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Sender Name / Sign-off</label>
                <input type="text" value={content.senderName} onChange={e => setContent({...content, senderName: e.target.value})} className={fieldClass} />
              </div>

            </div>
          ) : (
            /* VIEW MODE — rendered email preview */
            <div
              className="w-full max-w-full border border-slate-200 rounded-2xl overflow-x-auto overflow-y-auto max-h-[62vh] bg-white"
              dangerouslySetInnerHTML={{ __html: renderEmailHtml() }}
            />
          )}

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            {editMode ? '✏️ Edit mode — modify sections above' : '👁 View mode — click Edit to modify'}
          </p>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
            {editMode && (
              <button onClick={() => setEditMode(false)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all min-h-11">
                <Save size={13} /> Save
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all min-h-11">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || generating || dailyLimit?.emailsRemaining === 0}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold hover:bg-[#0284c7] transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 min-h-11 min-[420px]:col-span-2 sm:col-span-1"
            >
              {sending ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={13} />}
              {dailyLimit?.emailsRemaining === 0
                ? 'Daily Limit Reached'
                : sending ? (sendStage === 'preparing' ? 'Preparing email...' : 'Sending...') : generating ? 'Generating...' : 'Send Email'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SendEmailModal;

