import type { EmailResources } from './types';

export const emptyEmailResources: EmailResources = {
  caseStudiesUrl: '', testimonialsUrl: '', companyWebsiteUrl: '', brochureUrl: '', logoUrl: '',
  linkedInUrl: '', twitterUrl: '', facebookUrl: '', instagramUrl: '', contactEmail: '',
  contactPhone: '', privacyPolicyUrl: '', brandName: '', footerText: '',
};

const safeUrl = (value: unknown) => {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch { return ''; }
};
const safeEmail = (value: unknown) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? value.trim() : '';
const safePhone = (value: unknown) => typeof value === 'string' && /^\+?[0-9 ()-]{7,25}$/.test(value.trim()) ? value.trim() : '';
const safeText = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export const parseEmailResources = (data: Record<string, unknown> | null | undefined): EmailResources => ({
  caseStudiesUrl: safeUrl(data?.caseStudiesUrl), testimonialsUrl: safeUrl(data?.testimonialsUrl),
  companyWebsiteUrl: safeUrl(data?.companyWebsiteUrl), brochureUrl: safeUrl(data?.brochureUrl),
  logoUrl: safeUrl(data?.logoUrl), linkedInUrl: safeUrl(data?.linkedInUrl), twitterUrl: safeUrl(data?.twitterUrl),
  facebookUrl: safeUrl(data?.facebookUrl), instagramUrl: safeUrl(data?.instagramUrl),
  contactEmail: safeEmail(data?.contactEmail), contactPhone: safePhone(data?.contactPhone),
  privacyPolicyUrl: safeUrl(data?.privacyPolicyUrl), brandName: safeText(data?.brandName), footerText: safeText(data?.footerText),
});
