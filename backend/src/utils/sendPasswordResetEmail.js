const mailSender = require('./mailSender');

module.exports = async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 16px;">
      <h2>Password Reset</h2>
      <p>You requested to reset your CE Bootcamp account password.</p>
      <p>Click the link below to continue. The link is valid for 60 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request it, you can safely ignore this email.</p>
      <p>— CE Bootcamp Team</p>
    </div>
  `;

  await mailSender(email, 'Password Reset Instructions', html);
};
