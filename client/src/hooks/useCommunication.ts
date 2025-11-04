import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  placeholders: string[];
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  placeholders: string[];
  type: "text" | "document" | "image";
}

export interface CommunicationLog {
  id: string;
  leadId: string;
  userId: string;
  type: "email" | "whatsapp";
  template: string;
  content: string;
  recipient: string;
  status: "sent" | "delivered" | "opened" | "read" | "failed";
  timestamp: string;
  metadata?: {
    subject?: string;
    attachments?: string[];
    mediaUrl?: string;
  };
}

// Demo email templates
const demoEmailTemplates: EmailTemplate[] = [
  {
    id: "email-1",
    name: "Initial Contact",
    subject: "Partnership Opportunity - {{company_name}}",

    content: `
    Hi {{contact_name}},<br><br>

    It was nice talking to you. I hope this email finds you well.<br><br>
    <b>Welcome to Jobs Territory — Your Gateway to Exceptional Talent!</b><br><br>
    With over 15 years of expertise and a team of 180+ expert Talent Advisors, Jobs Territory is a leading recruitment agency dedicated to connecting businesses like <b>{{company_name}}</b> with top-tier professionals.<br><br>
    <b>Our Recruitment Solutions:</b>
    <p>-Executive Search<br/>-Permanent and Lateral Hiring<br/>-Volume and Bulk Hiring</p>
<br><br>
      <h3 style=color:"#004aad;">Industries We Serve & Positions We've Closed:</h3>
<br><br>
    <table style="margin-0px" cellpadding="6" cellspacing="0" border="0" width="70%" style="border-collapse: collapse; font-size: 14px; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; margin:0; padding:0;">
     <thead>
        <tr style="background-color: #004aad; color: #ffffff;">
          <th align="left" width="40%" style="padding: 10px; border: 1px solid #e0e0e0;">Industry</th>
          <th align="left" width="60%" style="padding: 10px; border: 1px solid #e0e0e0;">Trending Positions</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">Wholesale Building Materials</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Procurement Specialist, Sales Manager</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0e0;">Agritech</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Product Manager, Operations Manager</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">NBFC</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Data Scientist, Finance Manager</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0e0;">FMCG</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Sales Manager, Marketing Head</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">HVAC</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Project Engineer, Service Manager</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0e0;">Electrical Appliances</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Product Designer, Quality Assurance Lead</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">Manufacturing</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Plant Manager, Supply Chain Analyst</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0e0;">Retail</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Store Manager, Merchandising Director</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">Healthcare</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Clinical Operations Lead, HR Director</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0e0;">Pharmaceuticals</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Regulatory Affairs Manager, QA Manager</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">Hospitality</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Hotel General Manager, Operations Director</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0e0;">Logistics</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Logistics Coordinator, Supply Chain Manager</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">Construction</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Project Manager, Site Engineer</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0e0;">Automotive</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Mechanical Engineer, Plant Supervisor</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">Consumer Goods</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">Brand Manager, Marketing Specialist</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0e0;">Startups</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">CTO, Business Development Manager</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding:10px; border:1px solid #e0e0e0;">D2C (Direct-to-Consumer)</td>
          <td style="padding:10px; border:1px solid #e0e0e0;">E-commerce Manager, Digital Marketing Head</td>
        </tr>
      </tbody>
    </table>

<br><br>
    We’d love to explore how we can support <b>{{company_name}}</b>’s hiring needs and contribute to your recruitment goals.
    Would you be available for a brief call this week to discuss potential collaboration opportunities?<br>
<br><br>

    Best regards,<br>
    <b>{{consultant_name}}</b><br/>
    Jobs Territory Team

    <hr style="border:none; border-top:1px solid #ccc; margin:20px 0;">

      <table style="width:100%; font-size:0.9em; color:#555;">
        <tr>
          <td style="vertical-align: top;">
            <img src="https://www.jobsterritory.com/images/logo.png" alt="Jobs Territory Logo" style="width:250px; height:auto; margin-bottom:10px;">
          </td><br/>
          <td style="vertical-align: top; padding-left:15px;">
            {{consultant_name}}<br>
           {{consultant_role}}<br>
            <a href="https://www.facebook.com/jobsterritory" target="_blank">Facebook</a> | 
            <a href="https://www.linkedin.com/company/jobs-territory/?viewAsMember=true" target="_blank">LinkedIn</a> | 
            <a href="https://www.instagram.com/jobsterritory/" target="_blank">Instagram</a><br><br>
            M: {{consultant_num}}<br>
            
            W: <a href="https://www.jobsterritory.com" target="_blank">www.jobsterritory.com</a>
          </td>
        </tr>
      </table>

      <p>P.S. I’ve attached our company profile for your review.</p>
    `,
    //     content: `
    //     <div style="font-family: Arial, sans-serif; font-size:14px; color:#000000; line-height:1.4; margin:0; padding:0;">

    //   Hi {{contact_name}},<div style="height:10px;"></div>
    //   It was nice talking to you.<div style="height:15px;"></div>

    //   <b>Welcome to Jobs Territory — Your Gateway to Exceptional Talent!</b><div style="height:10px;"></div>
    //   With over 15 years of expertise and a team of 180+ expert Talent Advisors, Jobs Territory is a leading recruitment agency.<div style="height:15px;"></div>

    //   <b>Our Recruitment Solutions:</b><div style="height:8px;"></div>
    //   - Executive Search<br>
    //   - Permanent and Lateral Hiring<br>
    //   - Volume and Bulk Hiring<div style="height:15px;"></div>

    //   <b>Industries We Serve & Positions We've Closed:</b><div style="height:10px;"></div>

    //   <table cellpadding="0" cellspacing="0" border="0" width="60%" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; font-size:14px; margin:0; padding:0; border:1px solid #e0e0e0;">
    //     <thead>
    //       <tr>
    //         <th style="padding:10px; border:1px solid #e0e0e0; background-color:#004aad; color:#ffffff; text-align:left;">Industry</th>
    //         <th style="padding:10px; border:1px solid #e0e0e0; background-color:#004aad; color:#ffffff; text-align:left;">Trending Positions</th>
    //       </tr>
    //     </thead>
    //     <tbody>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Wholesale Building Materials</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Procurement Specialist, Sales Manager</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Agritech</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Product Manager, Operations Manager</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">NBFC</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Data Scientist, Finance Manager</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">FMCG</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Sales Manager, Marketing Head</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">HVAC</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Project Engineer, Service Manager</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Electrical Appliances</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Product Designer, Quality Assurance Lead</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Manufacturing</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Plant Manager, Supply Chain Analyst</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Retail</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Store Manager, Merchandising Director</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Healthcare</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Clinical Operations Lead, HR Director</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Pharmaceuticals</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Regulatory Affairs Manager, QA Manager</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Hospitality</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Hotel General Manager, Operations Director</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Logistics</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Logistics Coordinator, Supply Chain Manager</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Construction</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Project Manager, Site Engineer</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Automotive</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Mechanical Engineer, Plant Supervisor</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Consumer Goods</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">Brand Manager, Marketing Specialist</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">Startups</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0;">CTO, Business Development Manager</td>
    //       </tr>
    //       <tr>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">D2C (Direct-to-Consumer)</td>
    //         <td style="padding:10px; border:1px solid #e0e0e0; background-color:#f9f9f9;">E-commerce Manager, Digital Marketing Head</td>
    //       </tr>
    //     </tbody>
    //   </table>

    //   <div style="height:20px;"></div>
    //   Best Regards,<br>
    //   <b>Jobs Territory Team</b>
    // </div>

    // `,
    placeholders: [
      "company_name",
      "contact_name",
      "consultant_name",
      "consultant_role",
      "consultant_num",
    ],
  },
  {
    id: "email-2",
    name: "Follow-up",
    subject: "RE: Partnership Opportunity – {{company_name}}",
    content: `Hi {{contact_name}},

Thank you for taking the time to speak with me earlier about {{company_name}}'s recruitment needs.

As discussed, I'm attaching our service overview and rate card for your review. We're confident we can help you find the right talent for your {{position_type}} requirements.

Please let me know if you have any questions or would like to schedule a follow-up meeting.

Looking forward to hearing from you.

Best regards,
{{consultant_name}}`,
    placeholders: [
      "company_name",
      "contact_name",
      "position_type",
      "consultant_name",
    ],
  },
  {
    id: "email-3",
    name: "Proposal Submission",
    subject: "Recruitment Proposal - {{company_name}}",
    content: `
<table style="width:100%; font-family: Arial, sans-serif; line-height:1.5; color:#333;">
  <tr>
    <td>
      <p>Hi {{contact_name}},</p>

      <p>It was nice talking to you. I hope this email finds you well.</p>

      <h2 style="color:#2E86C1;">Welcome to Jobs Territory — Your Gateway to Exceptional Talent!</h2>

      <p>With over 15 years of expertise and a team of 180+ Talent Advisors, Jobs Territory is a leading recruitment agency dedicated to connecting businesses with top talent.</p>

      <p>We’re pleased to share our recruitment proposal for <b>{{company_name}}</b>.</p>

      <h3>Key Highlights:</h3>
      <ul>
        <li><b>Payment Term:</b> {{payment_term}} days</li>
        <li><b>Service Fee:</b> {{service_fee}} of Annual CTC</li>
        <li><b>Replacement Guarantee:</b> {{replacement_guarantee}} days</li>
      </ul>

      <h3>Industries We Serve & Positions We've Closed:</h3>
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align:left;">Industry</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align:left;">Trending Positions</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Wholesale Building Materials</td><td style="border: 1px solid #ddd; padding: 8px;">Procurement Specialist, Sales Manager</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Agritech</td><td style="border: 1px solid #ddd; padding: 8px;">Product Manager, Operations Manager</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">NBFC</td><td style="border: 1px solid #ddd; padding: 8px;">Data Scientist, Finance Manager</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">FMCG</td><td style="border: 1px solid #ddd; padding: 8px;">Sales Manager, Marketing Head</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">HVAC</td><td style="border: 1px solid #ddd; padding: 8px;">Project Engineer, Service Manager</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Electrical Appliances</td><td style="border: 1px solid #ddd; padding: 8px;">Product Designer, QA Lead</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Manufacturing</td><td style="border: 1px solid #ddd; padding: 8px;">Plant Manager, Supply Chain Analyst</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Retail</td><td style="border: 1px solid #ddd; padding: 8px;">Store Manager, Merchandising Director</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Healthcare</td><td style="border: 1px solid #ddd; padding: 8px;">Clinical Operations Lead, HR Director</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Pharmaceuticals</td><td style="border: 1px solid #ddd; padding: 8px;">Regulatory Affairs Manager, QA Manager</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Hospitality</td><td style="border: 1px solid #ddd; padding: 8px;">Hotel General Manager, Operations Director</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Logistics</td><td style="border: 1px solid #ddd; padding: 8px;">Logistics Coordinator, Supply Chain Manager</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Construction</td><td style="border: 1px solid #ddd; padding: 8px;">Project Manager, Site Engineer</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Automotive</td><td style="border: 1px solid #ddd; padding: 8px;">Mechanical Engineer, Plant Supervisor</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Consumer Goods</td><td style="border: 1px solid #ddd; padding: 8px;">Brand Manager, Marketing Specialist</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Startups</td><td style="border: 1px solid #ddd; padding: 8px;">CTO, Business Development Manager</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">D2C (Direct-to-Consumer)</td><td style="border: 1px solid #ddd; padding: 8px;">E-commerce Manager, Digital Marketing Head</td></tr>
        </tbody>
      </table>

      <h3>Payment Terms:</h3>
      <ul>
        <li>Service Charge: {{service_fee}} of Annual CTC</li>
        <li>Payment Terms: {{payment_term}} from invoice date</li>
        <li>Replacement: {{replacement_guarantee}} days (if a candidate leaves within this period, excluding involuntary termination, we’ll conduct a search at no additional cost)</li>
      </ul>

      <p>Request you to kindly confirm and share the JD for us.</p>

      <p>Looking forward to partnering with <b>{{company_name}}</b> to build your dream team.</p>

      <p>Best regards,<br>
      {{consultant_name}}<br>
      Jobs Territory Team</p>
      <hr style="border:none; border-top:1px solid #ccc; margin:20px 0;">

      <table style="width:100%; font-size:0.9em; color:#555;">
        <tr>
          <td style="vertical-align: top;">
            <img src="https://www.jobsterritory.com/images/logo.png" alt="Jobs Territory Logo" style="width:120px; height:auto; margin-bottom:10px;">
          </td><br/>
          <td style="vertical-align: top; padding-left:15px;">
            {{consultant_name}}<br>
            {{consultant_role}}<br>
            <a href="https://www.facebook.com/jobsterritory" target="_blank">Facebook</a> | 
            <a href="https://www.linkedin.com/company/jobs-territory/?viewAsMember=true" target="_blank">LinkedIn</a> | 
            <a href="https://www.instagram.com/jobsterritory/" target="_blank">Instagram</a><br><br>
            M: {{consultant_num}}<br>
            
            W: <a href="https://www.jobsterritory.com" target="_blank">www.jobsterritory.com</a>
          </td>
        </tr>
      </table>

      <p>P.S. I’ve attached our company profile for your review.</p>
    </td>
  </tr>
</table>
`,
    placeholders: [
      "company_name",
      "contact_name",
      "payment_term",
      "service_fee",
      "replacement_guarantee",
      "consultant_name",
      "consultant_role",
      "consultant_num",
    ],
  },

  {
    id: "email-raas-html-full",
    name: "RAAS Offering",
    subject: "Recruitment As A Service Proposal – {{company_name}}",
    content: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Hi {{contact_name}},</p>

      <p>As discussed, here’s our <strong>Recruitment As A Service (RAAS)</strong> offering. You’ll get unlimited hiring support with a dedicated team of recruiters, along with guaranteed closures every month.</p>

      <h4>What you get:</h4>
      <ul>
        <li>Unlimited hiring across all roles shared with us</li>
        <li>Dedicated recruiters aligned to your requirements</li>
        <li>Access to premium job portals (Naukri, LinkedIn, Shine, iimjobs, AngelList & more)</li>
        <li>No additional charges beyond the fixed fee</li>
        <li>Faster, cost-effective closures with guaranteed results</li>
      </ul>

      <h4>What we need from you:</h4>
      <ul>
        <li>Feedback within 24–36 hours</li>
        <li>Availability of hiring managers for interviews</li>
        <li>Advance payment before commencement of services</li>
      </ul>

      <p>📌 <strong>Case Studies</strong><br/>
      See how we’ve helped companies across industries hire faster, cut costs, and scale efficiently — from startups to large enterprises. Explore our success stories at: <a href="https://jobsterritory.com/case-studies" target="_blank">Jobs Territory – Case Studies</a></p>

      <p>Best regards,<br>
      {{consultant_name}}<br>
      Jobs Territory Team</p>

      <hr style="border:none; border-top:1px solid #ccc; margin:20px 0;">

      <table style="width:100%; font-size:0.9em; color:#555;">
        <tr>
          <td style="vertical-align: top;">
            <img src="https://www.jobsterritory.com/images/logo.png" alt="Jobs Territory Logo" style="width:120px; height:auto; margin-bottom:10px;">
          </td>
          <td style="vertical-align: top; padding-left:15px;">
            {{consultant_name}}<br>
            {{consultant_role}}<br>
            <a href="https://www.facebook.com/jobsterritory" target="_blank">Facebook</a> | 
            <a href="https://www.linkedin.com/company/jobs-territory/?viewAsMember=true" target="_blank">LinkedIn</a> | 
            <a href="https://www.instagram.com/jobsterritory/" target="_blank">Instagram</a><br><br>
            M: {{consultant_num}}<br>
            W: <a href="https://www.jobsterritory.com" target="_blank">www.jobsterritory.com</a>
          </td>
        </tr>
      </table>

      <p>P.S. I’ve attached our company profile for your review.</p>
    </div>
  `,
    placeholders: [
      "company_name",
      "contact_name",
      "consultant_name",
      "consultant_role",
      "consultant_num",
    ],
  },
];

// Demo WhatsApp templates
const demoWhatsAppTemplates: WhatsAppTemplate[] = [
  //   {
  //     id: "whatsapp-1",
  //     name: "Quick Introduction",
  //     content: `Hi {{contact_name}}! 👋

  // This is {{consultant_name}} from Jobs Territory. We specialize in recruitment services and would love to discuss potential partnership opportunities with {{company_name}}.

  // Would you be interested in a quick call to explore how we can support your hiring needs?`,
  //     placeholders: ["contact_name", "consultant_name", "company_name"],
  //     type: "text",
  //   },
  //   {
  //     id: "whatsapp-2",
  //     name: "Proposal Shared",
  //     content: `Hi {{contact_name}},

  // I've prepared a customized recruitment proposal for {{company_name}}.

  // Key details:
  // ✅ Position: {{position_type}}
  // ✅ TAT: {{tat}} days
  // ✅ Competitive rates with quality guarantee

  // Would you like me to share the detailed proposal via email or WhatsApp?`,
  //     placeholders: ["contact_name", "company_name", "position_type", "tat"],
  //     type: "text",
  //   },
  //   {
  //     id: "whatsapp-3",
  //     name: "Follow-up Reminder",
  //     content: `Hi {{contact_name}},

  // Hope you're doing well! Just following up on our discussion about {{company_name}}'s recruitment needs.

  // We have some excellent candidates in our pipeline that might be a perfect fit for your requirements.

  // Let me know when would be a good time to connect! 😊`,
  //     placeholders: ["contact_name", "company_name"],
  //     type: "text",
  //   },
  //   {
  //     id: "whatsapp-raas-1",
  //     name: "Stage 1: First Contact / Cold Outreach",
  //     content: `Hey {{contact_name}}, 👋
  // I’m reaching out from Jobs Territory.

  // We help companies like {{company_name}} scale faster with our Unlimited Hiring Support — no per-hire charges, just one predictable monthly plan. 💼✨

  // Would you be open to a quick chat to see how this model can make your hiring faster and cost-efficient? 😊

  // Warm regards,
  // {{consultant_name}}
  // Jobs Territory 🌸`,
  //     placeholders: ["contact_name", "company_name", "consultant_name"],
  //     type: "text",
  //   },
  //   {
  //     id: "whatsapp-raas-2",
  //     name: "Stage 2: After Call (Proposal Shared)",
  //     content: `Hey {{contact_name}}, 😊
  // It was lovely speaking with you earlier! I’ve shared the proposal we discussed for {{company_name}} — it includes details of our Unlimited Hiring Model that lets you hire across multiple roles without any extra cost. 🚀

  // Take a look when you can — happy to walk you through how it can simplify your hiring and save costs.

  // Warm regards,
  // {{consultant_name}}
  // Jobs Territory 🌸`,
  //     placeholders: ["contact_name", "company_name", "consultant_name"],
  //     type: "text",
  //   },
  //   {
  //     id: "whatsapp-raas-3",
  //     name: "Stage 3: Follow-Up (After Proposal Sent – No Response)",
  //     content: `Hey {{contact_name}}, 👋
  // Just checking in to see if you got a chance to review the proposal we shared for {{company_name}}.

  // Our Unlimited Hiring Plan has been helping growing teams scale without worrying about per-hire fees — I’d love to explore how it could work for you too.

  // Would you like me to schedule a quick call this week? 😊

  // Warm regards,
  // {{consultant_name}}
  // Jobs Territory 🌸`,
  //     placeholders: ["contact_name", "company_name", "consultant_name"],
  //     type: "text",
  //   },
  //   {
  //     id: "whatsapp-raas-4",
  //     name: "Stage 4: Tried Calling – No Response",
  //     content: `Hey {{contact_name}}, 😊
  // I tried reaching you over a quick call regarding the Unlimited Hiring proposal we shared for {{company_name}}, but couldn’t connect.

  // Just wanted to check if you’ve had a chance to go through it — this model really helps companies hire unlimited roles under one predictable plan. 💼

  // Would tomorrow be a good time for a quick call?

  // Warm regards,
  // {{consultant_name}}
  // Jobs Territory 🌸`,
  //     placeholders: ["contact_name", "company_name", "consultant_name"],
  //     type: "text",
  //   },
  //   {
  //     id: "whatsapp-raas-5",
  //     name: "Stage 5: Final Follow-Up (Polite Closure)",
  //     content: `Hey {{contact_name}}, 🙏
  // Just following up one last time regarding the Unlimited Hiring Support proposal we shared for {{company_name}}.

  // Please let me know if you’d like to move forward or if it’s not a priority right now — I’ll make sure not to follow up again unless you’d like me to. 👍

  // Appreciate your time either way!

  // Warm regards,
  // {{consultant_name}}
  // Jobs Territory 🌸`,
  //     placeholders: ["contact_name", "company_name", "consultant_name"],
  //     type: "text",
  //   },
  //   {
  //     id: "whatsapp-raas-6",
  //     name: "Stage 6: Reconnect Message (Few Weeks Later)",
  //     content: `Hey {{contact_name}}, 👋
  // Hope all’s going great at {{company_name}}!

  // Just wanted to reconnect — are you currently exploring any hiring support? Our Unlimited Hiring Model continues to help companies scale effortlessly with one fixed plan and unlimited hires. 🚀

  // Would you like me to share a quick refresher on how it works?

  // Warm regards,
  // {{consultant_name}}
  // Jobs Territory 🌸`,
  //     placeholders: ["contact_name", "company_name", "consultant_name"],
  //     type: "text",
  //   },

  {
    id: "whatsapp-raas-1",
    name: "Stage 1: First Contact / Cold Outreach",
    content: `*Hey {{contact_name}},*
I’m reaching out from *Jobs Territory*.

We help companies like *{{company_name}}* hire faster and smarter through our *Pay-Per-Hire model* — you only pay when we successfully close your position. No retainers, no hidden costs.

Would you be open to a short discussion to see how this model can make your hiring faster and more efficient?

Warm regards,  
*{{consultant_name}}*  
Jobs Territory  

[View our case studies](https://jobsterritory.com/casestudies)  
[See what our clients say](https://www.jobsterritory.com/#testimonials)`,
    placeholders: ["contact_name", "company_name", "consultant_name"],
    type: "text",
  },

  {
    id: "whatsapp-raas-2",
    name: "Stage 2: After Call (Proposal Shared)",
    content: `*Hey {{contact_name}},*
It was great speaking with you earlier. I’ve shared the proposal we discussed for *{{company_name}}*, outlining how our *Pay-Per-Hire model* ensures cost-effective and quality-driven hiring support.

Please take a look when you get a moment — happy to walk you through how it simplifies your hiring and speeds up closures.

Warm regards,  
*{{consultant_name}}*  
Jobs Territory  

[Check out our case studies](https://jobsterritory.com/casestudies)  
[Hear from our happy clients](https://www.jobsterritory.com/#testimonials)`,
    placeholders: ["contact_name", "company_name", "consultant_name"],
    type: "text",
  },

  {
    id: "whatsapp-raas-3",
    name: "Stage 3: Follow-Up (After Proposal Sent – No Response)",
    content: `*Hey {{contact_name}},*
Just checking in to see if you’ve had a chance to review the proposal we sent for *{{company_name}}*.

Our *Pay-Per-Hire model* helps companies scale efficiently — you only pay for successful hires, ensuring complete accountability and zero risk.

Would you like me to schedule a quick call this week to discuss how it fits into your hiring plans?

Warm regards,  
*{{consultant_name}}*  
Jobs Territory  

[View our case studies](https://jobsterritory.com/casestudies)  
[See our client testimonials](https://www.jobsterritory.com/#testimonials)`,
    placeholders: ["contact_name", "company_name", "consultant_name"],
    type: "text",
  },

  {
    id: "whatsapp-raas-4",
    name: "Stage 4: Tried Calling – No Response",
    content: `*Hey {{contact_name}},*
I tried reaching you for a quick chat regarding the *Pay-Per-Hire proposal* we shared for *{{company_name}}*, but couldn’t connect.

Just wanted to check if you’ve had a chance to review it — our model offers complete flexibility with performance-based hiring and zero upfront cost.

Would tomorrow be a good time for a short call?

Warm regards,  
*{{consultant_name}}*  
Jobs Territory  

[Check our case studies](https://jobsterritory.com/casestudies)  
[Read client success stories](https://www.jobsterritory.com/#testimonials)`,
    placeholders: ["contact_name", "company_name", "consultant_name"],
    type: "text",
  },

  {
    id: "whatsapp-raas-5",
    name: "Stage 5: Final Follow-Up (Polite Closure)",
    content: `*Hey {{contact_name}},*
Just following up one last time regarding the *Pay-Per-Hire proposal* we shared for *{{company_name}}*.

Please let me know if you’d like to move forward or if it’s not a current priority — I’ll pause follow-ups unless you’d like me to reconnect later.

Appreciate your time either way.

Warm regards,  
*{{consultant_name}}*  
Jobs Territory  

[See our case studies](https://jobsterritory.com/casestudies)  
[What clients say about us](https://www.jobsterritory.com/#testimonials)`,
    placeholders: ["contact_name", "company_name", "consultant_name"],
    type: "text",
  },

  {
    id: "whatsapp-raas-6",
    name: "Stage 6: Reconnect Message (Few Weeks Later)",
    content: `*Hey {{contact_name}},*
Hope all’s going well at *{{company_name}}*.

Just wanted to reconnect and check if you’re currently exploring any hiring support. Our *Pay-Per-Hire model* continues to help companies close roles quickly while maintaining flexibility and cost control.

Would you like me to share a quick refresher on how it works?

Warm regards,  
*{{consultant_name}}*  
Jobs Territory  

[Explore our case studies](https://jobsterritory.com/casestudies)  
[See client feedback](https://www.jobsterritory.com/#testimonials)`,
    placeholders: ["contact_name", "company_name", "consultant_name"],
    type: "text",
  },
];

export const useCommunication = () => {
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const [communicationLogs, setCommunicationLogs] = useState<
    CommunicationLog[]
  >([]);

  const sendEmail = async (
    leadId: string,
    templateId: string,
    placeholderValues: Record<string, string>,
    customSubject?: string,
    customContent?: string
  ): Promise<void> => {
    if (!user || !profile) throw new Error("User not authenticated");

    setLoading(true);
    try {
      const template = demoEmailTemplates.find((t) => t.id === templateId);
      if (!template) throw new Error("Template not found");

      // Replace placeholders in subject and content
      let subject = customSubject || template.subject;
      let content = customContent || template.content;

      Object.entries(placeholderValues).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, "g"), value);
        content = content.replace(new RegExp(placeholder, "g"), value);
      });

      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create communication log
      const log: CommunicationLog = {
        id: `email-${Date.now()}`,
        leadId,
        userId: user.id,
        type: "email",
        template: template.name,
        content,
        recipient: placeholderValues.contact_email || "recipient@example.com",
        status: "sent",
        timestamp: new Date().toISOString(),
        metadata: {
          subject,
          attachments: [],
        },
      };

      setCommunicationLogs((prev) => [log, ...prev]);

      // Simulate status updates
      setTimeout(() => {
        setCommunicationLogs((prev) =>
          prev.map((l) => (l.id === log.id ? { ...l, status: "delivered" } : l))
        );
      }, 3000);

      setTimeout(() => {
        setCommunicationLogs((prev) =>
          prev.map((l) => (l.id === log.id ? { ...l, status: "opened" } : l))
        );
      }, 8000);

      toast.success("Email sent successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = async (
    leadId: string,
    templateId: string,
    placeholderValues: Record<string, string>,
    customContent?: string,
    mediaUrl?: string
  ): Promise<void> => {
    if (!user || !profile) throw new Error("User not authenticated");

    setLoading(true);
    try {
      const template = demoWhatsAppTemplates.find((t) => t.id === templateId);
      if (!template) throw new Error("Template not found");

      // Replace placeholders in content
      let content = customContent || template.content;

      Object.entries(placeholderValues).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, "g"), value);
      });

      // Simulate WhatsApp sending
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create communication log
      const log: CommunicationLog = {
        id: `whatsapp-${Date.now()}`,
        leadId,
        userId: user.id,
        type: "whatsapp",
        template: template.name,
        content,
        recipient: placeholderValues.contact_phone || "+1234567890",
        status: "sent",
        timestamp: new Date().toISOString(),
        metadata: {
          mediaUrl,
        },
      };

      setCommunicationLogs((prev) => [log, ...prev]);

      // Simulate status updates
      setTimeout(() => {
        setCommunicationLogs((prev) =>
          prev.map((l) => (l.id === log.id ? { ...l, status: "delivered" } : l))
        );
      }, 2000);

      setTimeout(() => {
        setCommunicationLogs((prev) =>
          prev.map((l) => (l.id === log.id ? { ...l, status: "read" } : l))
        );
      }, 6000);

      toast.success("WhatsApp message sent successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send WhatsApp message");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCommunicationLogs = (leadId: string): CommunicationLog[] => {
    return communicationLogs.filter((log) => log.leadId === leadId);
  };

  const getEmailTemplates = (): EmailTemplate[] => {
    return demoEmailTemplates;
  };

  const getWhatsAppTemplates = (): WhatsAppTemplate[] => {
    return demoWhatsAppTemplates;
  };

  return {
    loading,
    sendEmail,
    sendWhatsApp,
    getCommunicationLogs,
    getEmailTemplates,
    getWhatsAppTemplates,
    communicationLogs,
  };
};
