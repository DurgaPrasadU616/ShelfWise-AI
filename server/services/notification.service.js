import nodemailer from 'nodemailer';
import config from '../config/env.js';
import logger from '../utils/logger.js';

// Create transporter — falls back to Ethereal (captures emails in test/dev, no SMTP needed)
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;
  
  if (config.email?.host) {
    // Production SMTP config
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port || 587,
      secure: config.email.secure || false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  } else {
    // Dev fallback: Ethereal test account (prints preview URL to console)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`[Email] Using Ethereal test account: ${testAccount.user}`);
  }
  
  return transporter;
};

export const sendEmailAlert = async ({ to, subject, title, message, type = 'info' }) => {
  const typeColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  const color = typeColors[type] || typeColors.info;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:${color};padding:24px 32px;">
                  <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">ShelfWise AI</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Inventory Intelligence Platform</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding:32px;">
                  <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">${title}</h2>
                  <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">${message}</p>
                  <div style="background:#f1f5f9;border-radius:8px;padding:16px;">
                    <p style="margin:0;font-size:13px;color:#64748b;">This is an automated alert from ShelfWise AI. No action is required if this was expected.</p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:16px 32px;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;">ShelfWise AI • Smart Inventory Management</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"ShelfWise AI" <${config.email?.from || 'noreply@shelfwise.ai'}>`,
      to,
      subject,
      html,
    });
    
    // In development, print the Ethereal preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[Email] Preview URL: ${previewUrl}`);
    }
    
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    logger.error(`[Email] Failed to send: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// === Future-ready channel stubs ===

export const sendWhatsAppAlert = async ({ phone, message }) => {
  // TODO: Integrate Twilio WhatsApp API or Meta Cloud API
  // Will use: process.env.TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, WHATSAPP_FROM_NUMBER
  logger.warn(`[WhatsApp] STUB MODE (Unconfigured). Intended for: ${phone} | Msg: ${message}`);
  return { success: false, reason: 'WhatsApp channel not yet configured.' };
};

export const sendSmsAlert = async ({ phone, message }) => {
  // TODO: Integrate Twilio SMS API
  logger.warn(`[SMS] STUB MODE (Unconfigured). Intended for: ${phone} | Msg: ${message}`);
  return { success: false, reason: 'SMS channel not yet configured.' };
};
