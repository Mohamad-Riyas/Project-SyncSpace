const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP configuration is incomplete");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

function getSender() {
  const configuredFrom = process.env.EMAIL_FROM;

  if (configuredFrom) {
    return {
      name: "SyncSpace",
      address: configuredFrom,
    };
  }

  return {
    name: "SyncSpace",
    address: process.env.SMTP_USER,
  };
}

async function sendVerificationEmail(email, name, verificationUrl) {
  return getTransporter().sendMail({
    from: getSender(),
    to: email,
    subject: "Verify your SyncSpace email",
    text: [
      `Hi ${name},`,
      "",
      "Thanks for registering with SyncSpace.",
      "Open the link below to verify your email address:",
      "",
      verificationUrl,
      "",
      "This link expires in 30 minutes.",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2>Verify your SyncSpace email</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for registering. Click below to verify your email address.</p>
        <p>
          <a href="${escapeHtml(verificationUrl)}"
             style="display:inline-block;padding:12px 20px;background:#2563eb;
                    color:white;text-decoration:none;border-radius:6px">
            Verify email
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, name, resetUrl) {
  return getTransporter().sendMail({
    from: getSender(),
    to: email,
    subject: "Reset your SyncSpace password",
    text: [
      `Hi ${name},`,
      "",
      "We received a request to reset your SyncSpace password.",
      "Open the link below to choose a new password:",
      "",
      resetUrl,
      "",
      "This link expires in 15 minutes and can only be used once.",
      "If you did not request a password reset, you can ignore this email.",
      "Your password will not change unless you complete the reset.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2>Reset your SyncSpace password</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>
          We received a request to reset your SyncSpace password.
          Click below to choose a new password.
        </p>
        <p>
          <a href="${escapeHtml(resetUrl)}"
             style="display:inline-block;padding:12px 20px;background:#2563eb;
                    color:white;text-decoration:none;border-radius:6px">
            Reset password
          </a>
        </p>
        <p>This link expires in 15 minutes and can only be used once.</p>
        <p>
          If you did not request a password reset, you can ignore this email.
          Your password will not change unless you complete the reset.
        </p>
      </div>
    `,
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};