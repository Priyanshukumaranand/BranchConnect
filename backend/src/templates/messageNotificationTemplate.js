module.exports = ({ recipientName, senderName, messageBody, conversationUrl }) => `
  <div style="font-family: Arial, sans-serif; padding: 16px; background-color: #f9fbff;">
    <h2 style="margin-top: 0;">New message from ${senderName}</h2>
    <p>Hi ${recipientName || 'there'},</p>
    <p><strong>${senderName}</strong> just sent you a message:</p>
    <blockquote style="border-left: 4px solid #4f46e5; padding-left: 12px; margin-left: 0; color: #111827;">
      ${messageBody}
    </blockquote>
    <p style="margin-top: 24px;">
      <a href="${conversationUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; display: inline-block;">
        Read and reply
      </a>
    </p>
    <p style="color: #6b7280; font-size: 0.9rem;">
      You’re receiving this because you have an active CE Bootcamp account. If you’d prefer not to get email notifications, you can mute the conversation or block the sender from your dashboard.
    </p>
    <p style="margin-top: 24px; color: #111827;">— CE Bootcamp Team</p>
  </div>
`;
