const Message = require('../models/Message');
const User = require('../models/User');
const sendMessageNotificationEmail = require('../utils/sendMessageNotificationEmail');

const POLL_INTERVAL_MS = Number.parseInt(process.env.MESSAGE_NOTIFICATION_POLL_INTERVAL_MS, 10) || 60_000;
const BATCH_SIZE = Number.parseInt(process.env.MESSAGE_NOTIFICATION_BATCH_SIZE, 10) || 50;
const RETRY_BACKOFF_MS = Number.parseInt(process.env.MESSAGE_NOTIFICATION_RETRY_BACKOFF_MS, 10) || 5 * 60_000;

let pollTimer = null;
let running = false;

const shouldSkipScheduler = () => {
  const disabled = process.env.MESSAGE_NOTIFICATION_SCHEDULER_DISABLED;
  if (!disabled) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(disabled.toLowerCase());
};

async function processMessage(message) {
  if (!message) {
    return;
  }

  if (message.readAt || message.notificationEmailCancelledAt || message.notificationEmailSentAt) {
    return;
  }

  const now = new Date();
  const attempts = (message.notificationEmailAttempts || 0) + 1;
  const filter = {
    _id: message._id,
    readAt: { $exists: false },
    notificationEmailSentAt: { $exists: false },
    notificationEmailCancelledAt: { $exists: false }
  };

  try {
    const [recipient, sender] = await Promise.all([
      User.findById(message.recipient).select('id email name'),
      User.findById(message.sender).select('id email name')
    ]);

    if (!recipient?.email) {
      await Message.updateOne(filter, {
        $set: {
          notificationEmailCancelledAt: now,
          notificationEmailAttempts: attempts,
          notificationEmailLastAttemptAt: now,
          notificationEmailError: 'Recipient has no email address'
        },
        $unset: {
          notificationScheduledFor: ''
        }
      });
      return;
    }

    await sendMessageNotificationEmail({ recipient, sender, message });
    await Message.updateOne(filter, {
      $set: {
        notificationEmailSentAt: new Date(),
        notificationEmailAttempts: attempts,
        notificationEmailLastAttemptAt: now
      },
      $unset: {
        notificationScheduledFor: '',
        notificationEmailError: ''
      }
    });
  } catch (error) {
    await Message.updateOne(filter, {
      $set: {
        notificationEmailAttempts: attempts,
        notificationEmailLastAttemptAt: now,
        notificationEmailError: error?.message || 'Failed to send message notification email',
        notificationScheduledFor: new Date(Date.now() + RETRY_BACKOFF_MS)
      }
    });
  }
}

async function runNotificationCycle() {
  if (running || shouldSkipScheduler()) {
    return;
  }

  running = true;

  try {
    const now = new Date();
    const pendingMessages = await Message.find({
      notificationEmailSentAt: { $exists: false },
      notificationEmailCancelledAt: { $exists: false },
      readAt: { $exists: false }
    })
      .where('notificationScheduledFor').ne(null)
      .where('notificationScheduledFor').lte(now)
      .sort({ notificationScheduledFor: 1 })
      .limit(BATCH_SIZE);

    for (const message of pendingMessages) {
      // eslint-disable-next-line no-await-in-loop
      await processMessage(message);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[chat] Failed to process pending message notifications:', error?.message || error);
    }
  } finally {
    running = false;
  }
}

function startMessageNotificationScheduler() {
  if (pollTimer || shouldSkipScheduler()) {
    return;
  }

  runNotificationCycle().catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[chat] Initial message notification run failed:', error?.message || error);
    }
  });

  pollTimer = setInterval(() => {
    runNotificationCycle().catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[chat] Message notification poll failed:', error?.message || error);
      }
    });
  }, POLL_INTERVAL_MS);
}

async function stopMessageNotificationScheduler() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

module.exports = {
  startMessageNotificationScheduler,
  stopMessageNotificationScheduler,
  runNotificationCycle
};
