import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;
  if (!host || !user || !pass || !from) {
    throw new Error("SMTP configuration missing");
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM;
  
  // Add logo attachment for email verification emails
  const logoPath = path.join(__dirname, '../templates/gymmawy.png');
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'gymmawy-logo.png',
      path: logoPath,
      cid: 'gymmawy-logo'
    });
  }
  
  await mailer.sendMail({ 
    from, 
    to, 
    subject, 
    html, 
    text,
    attachments 
  });
}

