export interface EmailContent {
  greeting: string;
  openingLine: string;
  contextLine: string;
  companyBlurb: string;
  pitchLine: string;
  bullets: string[];
  caseStudyLabel: string;
  testimonialsLabel: string;
  closingLine: string;
  ctaLine: string;
  senderName: string;
}

export interface EmailResources {
  caseStudiesUrl: string;
  testimonialsUrl: string;
  companyWebsiteUrl: string;
  brochureUrl: string;
  logoUrl: string;
  linkedInUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  contactEmail: string;
  contactPhone: string;
  privacyPolicyUrl: string;
  brandName: string;
  footerText: string;
}

export const escapeEmailHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character] || character));
