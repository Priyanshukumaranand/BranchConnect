module.exports = (otp) => `
  <div style="font-family: Arial, sans-serif; padding: 16px;">
    <h2>CE Bootcamp Verification</h2>
    <p>Your one-time password is:</p>
    <p style="font-size: 24px; letter-spacing: 4px; font-weight: bold;">${otp}</p>
    <p>This code will expire in 5 minutes. If you did not request it, you can ignore this email.</p>
    <p>— CE Bootcamp Team</p>
  </div>
`;
