import type { EmailResources } from './types';
import { escapeEmailHtml } from './types';

export const buildEmailFooter = (resources: EmailResources) => {
  const socialLinks = [
    { label: 'LinkedIn', url: resources.linkedInUrl },
    { label: 'Twitter / X', url: resources.twitterUrl },
    { label: 'Facebook', url: resources.facebookUrl },
    { label: 'Instagram', url: resources.instagramUrl },
  ];
  const referenceLinks = [
    { label: 'Website', url: resources.companyWebsiteUrl },
    { label: 'Case Studies', url: resources.caseStudiesUrl },
    { label: 'Testimonials', url: resources.testimonialsUrl },
    { label: 'Brochure', url: resources.brochureUrl },
    { label: 'Privacy Policy', url: resources.privacyPolicyUrl },
  ];
  const linkStyle = 'display:inline-block;color:#475569;text-decoration:none;font-size:11px;font-weight:700;margin:4px 8px;';
  const phoneHref = resources.contactPhone.replace(/[^+0-9]/g, '');
  return `
    <a href="${escapeEmailHtml(resources.companyWebsiteUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-bottom:14px;">
      <img src="${escapeEmailHtml(resources.logoUrl)}" alt="${escapeEmailHtml(resources.brandName)}" width="150" style="display:block;max-width:150px;height:auto;border:0;" />
    </a>
    <div style="margin-bottom:8px;">${socialLinks.map(link => `<a href="${escapeEmailHtml(link.url)}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">${link.label}</a>`).join('')}</div>
    <div style="margin-bottom:8px;">${referenceLinks.map(link => `<a href="${escapeEmailHtml(link.url)}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">${link.label}</a>`).join('')}</div>
    <div style="margin-bottom:10px;">
      <a href="mailto:${escapeEmailHtml(resources.contactEmail)}" style="${linkStyle}">${escapeEmailHtml(resources.contactEmail)}</a>
      <a href="tel:${escapeEmailHtml(phoneHref)}" style="${linkStyle}">${escapeEmailHtml(resources.contactPhone)}</a>
    </div>
    <div style="font-size:11px;color:#94a3b8;">${escapeEmailHtml(resources.footerText)}</div>`;
};
