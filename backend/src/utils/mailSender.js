const nodemailer = require('nodemailer');

async function createTransporter() {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error('Mail credentials are not configured. Check MAIL_HOST, MAIL_USER, MAIL_PASS.');
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
}

async function mailSender(to, subject, html) {
  const transporter = await createTransporter();
  const from = process.env.MAIL_FROM || process.env.MAIL_USER;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html
  });

  return info;
}

module.exports = mailSender;
