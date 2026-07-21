import { buildEmailFooter } from './emailFooterBuilder';
import type { EmailContent, EmailResources } from './types';
import { escapeEmailHtml } from './types';

interface EmailTemplateInput {
  content: EmailContent;
  companyName?: string;
  recipientEmail: string;
  resources: EmailResources;
}

const buildResourceLinks = (resources: EmailResources) => {
  const links = [
    { label: 'Case Studies', url: resources.caseStudiesUrl, color: '#0ea5e9', background: '#f0f9ff', border: '#bae6fd' },
    { label: 'Testimonials', url: resources.testimonialsUrl, color: '#16a34a', background: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Company Website', url: resources.companyWebsiteUrl, color: '#334155', background: '#f8fafc', border: '#cbd5e1' },
    { label: 'Company Brochure', url: resources.brochureUrl, color: '#7c3aed', background: '#f5f3ff', border: '#ddd6fe' },
  ].filter(link => link.url);
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr>${links.map(link => `
    <td style="padding:6px;vertical-align:top;"><a href="${escapeEmailHtml(link.url)}" target="_blank" rel="noopener noreferrer" style="display:block;background:${link.background};border:1px solid ${link.border};border-radius:12px;padding:16px;text-align:center;color:${link.color};text-decoration:none;font-size:12px;font-weight:800;">${link.label}</a></td>`).join('')}</tr></table>`;
};

export const buildEmailHtml = ({ content: rawContent, companyName, recipientEmail, resources }: EmailTemplateInput) => {
  const content = {
    ...rawContent,
    ...Object.fromEntries(Object.entries(rawContent).filter(([key]) => key !== 'bullets').map(([key, value]) => [key, escapeEmailHtml(String(value))])),
    bullets: rawContent.bullets.map(escapeEmailHtml),
  } as EmailContent;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#0f1c2e 0%,#1e3a5f 60%,#0ea5e9 100%);border-radius:20px 20px 0 0;padding:40px 48px;text-align:center;">
    <div style="display:inline-block;background:rgba(14,165,233,0.15);border:1px solid rgba(14,165,233,0.3);border-radius:50px;padding:6px 18px;margin-bottom:20px;"><span style="font-size:11px;font-weight:700;color:#7dd3fc;letter-spacing:2px;text-transform:uppercase;">Recruitment Partner</span></div>
    <div style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1.1;">Jobs<span style="color:#38bdf8;">Territory</span></div>
    <div style="font-size:12px;color:#94a3b8;margin-top:8px;letter-spacing:3px;text-transform:uppercase;">Talent · Growth · Results</div>
    <div style="margin-top:28px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:20px 24px;text-align:left;">
      <div style="font-size:13px;color:#cbd5e1;line-height:1.7;">${content.greeting.replace(/\n/g, '<br/>')}</div>
      <div style="font-size:15px;font-weight:600;color:#f1f5f9;line-height:1.7;margin-top:10px;">${content.openingLine.replace(/\n/g, '<br/>')}</div>
    </div>
  </td></tr>
  <tr><td style="background:#0ea5e9;padding:16px 48px;"><div style="font-size:13px;color:#e0f2fe;line-height:1.7;font-style:italic;">${content.contextLine.replace(/\n/g, '<br/>')}</div></td></tr>
  <tr><td style="background:#ffffff;padding:28px 48px 0 48px;"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0ea5e9;border-radius:0 12px 12px 0;padding:18px 24px;">
    <div style="font-size:10px;font-weight:800;color:#0ea5e9;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">About ${escapeEmailHtml(companyName || 'Your Company')}</div>
    <div style="font-size:13px;color:#374151;line-height:1.7;">${content.companyBlurb.replace(/\n/g, '<br/>')}</div>
  </div></td></tr>
  <tr><td style="background:#ffffff;padding:28px 48px 40px 48px;">
    <div style="font-size:11px;font-weight:800;color:#0ea5e9;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Why Jobs Territory?</div>
    <div style="font-size:15px;color:#374151;line-height:1.8;margin-bottom:28px;">${content.pitchLine.replace(/\n/g, '<br/>')}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">${content.bullets.map(bullet => `<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;"><table cellpadding="0" cellspacing="0"><tr><td style="width:28px;vertical-align:top;padding-top:2px;"><div style="width:20px;height:20px;background:#0ea5e9;border-radius:6px;text-align:center;line-height:20px;font-size:12px;color:#fff;font-weight:900;">✓</div></td><td style="font-size:14px;color:#374151;padding-left:12px;line-height:1.6;">${bullet}</td></tr></table></td></tr>`).join('')}</table>
    ${buildResourceLinks(resources)}
    <div style="font-size:15px;color:#374151;line-height:1.8;margin-bottom:16px;">${content.closingLine.replace(/\n/g, '<br/>')}</div>
    <div style="font-size:15px;font-weight:600;color:#0f1c2e;line-height:1.8;margin-bottom:28px;">${content.ctaLine.replace(/\n/g, '<br/>')}</div>
    <div style="text-align:center;margin-bottom:28px;"><a href="mailto:${escapeEmailHtml(recipientEmail)}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">📅 Schedule a 15-Min Call</a></div>
    <div style="border-top:1px solid #f1f5f9;padding-top:20px;"><div style="font-size:13px;color:#64748b;">Warm regards,</div><div style="font-size:15px;font-weight:800;color:#0f1c2e;margin-top:4px;">${content.senderName.replace(/\n/g, '<br/>')}</div></div>
  </td></tr>
  <tr><td style="background:#0f1c2e;padding:24px 48px;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="text-align:center;border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:22px;font-weight:900;color:#38bdf8;">10+</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Years Experience</div></td>
    <td style="text-align:center;border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:22px;font-weight:900;color:#38bdf8;">45+</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Trained Recruiters</div></td>
    <td style="text-align:center;border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:22px;font-weight:900;color:#38bdf8;">48h</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Shortlist Delivery</div></td>
    <td style="text-align:center;"><div style="font-size:22px;font-weight:900;color:#38bdf8;">50K+</div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Talent Pool</div></td>
  </tr></table></td></tr>
  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 20px 20px;padding:20px 48px;text-align:center;">${buildEmailFooter(resources)}</td></tr>
</table></td></tr></table></body></html>`.trim();
};
