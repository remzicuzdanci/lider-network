import nodemailer from "nodemailer";

interface ContactMailData {
  name: string;
  company: string;
  email: string;
  phone?: string;
  message: string;
  locale?: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendContactEmail(data: ContactMailData): Promise<void> {
  const transporter = createTransporter();

  const isTr = data.locale !== "en";

  const subject = isTr
    ? `Yeni İletişim Talebi - ${data.name} (${data.company})`
    : `New Contact Request - ${data.name} (${data.company})`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="${data.locale || "tr"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #101415; padding: 30px; text-align: center; }
    .header h1 { color: #b7c4ff; margin: 0; font-size: 24px; }
    .header p { color: #8d90a2; margin: 8px 0 0; font-size: 14px; }
    .body { padding: 30px; }
    .field { margin-bottom: 20px; }
    .field-label { font-size: 12px; font-weight: 600; color: #8d90a2; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .field-value { font-size: 16px; color: #333333; padding: 12px 16px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #0052ff; }
    .message-value { white-space: pre-wrap; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef; text-align: center; }
    .footer p { color: #8d90a2; font-size: 12px; margin: 0; }
    .badge { display: inline-block; background: #0052ff; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LİDER NETWORK</h1>
      <p>${isTr ? "Yeni İletişim Talebi" : "New Contact Request"}</p>
    </div>
    <div class="body">
      <div class="badge">
        ${isTr ? "İletişim Formu" : "Contact Form"}
      </div>

      <div class="field">
        <div class="field-label">${isTr ? "Ad Soyad" : "Full Name"}</div>
        <div class="field-value">${escapeHtml(data.name)}</div>
      </div>

      <div class="field">
        <div class="field-label">${isTr ? "Şirket" : "Company"}</div>
        <div class="field-value">${escapeHtml(data.company)}</div>
      </div>

      <div class="field">
        <div class="field-label">${isTr ? "E-posta" : "Email"}</div>
        <div class="field-value"><a href="mailto:${escapeHtml(data.email)}" style="color: #0052ff;">${escapeHtml(data.email)}</a></div>
      </div>

      ${
        data.phone
          ? `
      <div class="field">
        <div class="field-label">${isTr ? "Telefon" : "Phone"}</div>
        <div class="field-value"><a href="tel:${escapeHtml(data.phone)}" style="color: #0052ff;">${escapeHtml(data.phone)}</a></div>
      </div>
      `
          : ""
      }

      <div class="field">
        <div class="field-label">${isTr ? "Mesaj" : "Message"}</div>
        <div class="field-value message-value">${escapeHtml(data.message)}</div>
      </div>
    </div>
    <div class="footer">
      <p>${isTr ? "Bu e-posta Lider Network web sitesi iletişim formundan gönderilmiştir." : "This email was sent from the Lider Network website contact form."}</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} Lider Network. ${isTr ? "Tüm hakları saklıdır." : "All rights reserved."}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: `"Lider Network Web" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: process.env.SMTP_TO || process.env.SMTP_USER,
    replyTo: data.email,
    subject,
    html: htmlContent,
    text: `
${isTr ? "Yeni İletişim Talebi" : "New Contact Request"}
${"=".repeat(40)}

${isTr ? "Ad Soyad" : "Full Name"}: ${data.name}
${isTr ? "Şirket" : "Company"}: ${data.company}
${isTr ? "E-posta" : "Email"}: ${data.email}
${data.phone ? `${isTr ? "Telefon" : "Phone"}: ${data.phone}\n` : ""}
${isTr ? "Mesaj" : "Message"}:
${data.message}

${"=".repeat(40)}
Lider Network - www.lidernetwork.com.tr
    `.trim(),
  };

  await transporter.sendMail(mailOptions);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
