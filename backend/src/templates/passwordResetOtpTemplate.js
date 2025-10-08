module.exports = (otp) => `
  <div style="font-family: Arial, sans-serif; padding: 16px;">
    <h2>Reset your CE Bootcamp password</h2>
    <p>Use the one-time password below to verify your identity.</p>
    <p style="font-size: 24px; letter-spacing: 4px; font-weight: bold;">${otp}</p>
    <p>This code expires in 5 minutes. If you did not request a reset, you can ignore this email.</p>
    <p>— CE Bootcamp Team</p>
  </div>
`;
