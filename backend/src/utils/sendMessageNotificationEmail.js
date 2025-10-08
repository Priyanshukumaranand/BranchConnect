const mailSender = require('./mailSender');
const messageNotificationTemplate = require('../templates/messageNotificationTemplate');

const resolveFrontendBaseUrl = () => {
  const configured = process.env.FRONTEND_URL;
  if (!configured) {
    return 'http://localhost:3000';
  }

  const [first] = configured.split(',').map((item) => item.trim()).filter(Boolean);
  return (first || 'http://localhost:3000').replace(/\/$/, '');
};

module.exports = async function sendMessageNotificationEmail({ recipient, sender, message }) {
  if (!recipient?.email) {
    return;
  }

  const senderName = sender?.name || sender?.email || 'A fellow member';
  const recipientName = recipient?.name || recipient?.email || '';
  const messageBody = message?.body || '';
  const senderId = sender?.id || sender?._id?.toString?.();

  if (!senderId) {
    return;
  }

  const conversationUrl = `${resolveFrontendBaseUrl()}/members/${senderId}`;

  try {
    await mailSender(
      recipient.email,
      `${senderName} sent you a message`,
      messageNotificationTemplate({
        recipientName,
        senderName,
        messageBody,
        conversationUrl
      })
    );
  } catch (error) {
    // Failing to send an email should not block chat delivery; log and move on.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Unable to send message notification email:', error.message);
    }
  }
};
