const router = require('express').Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/conversations', chatController.listConversations);
router.get('/conversations/:conversationId/messages', chatController.getMessagesForConversation);
router.get('/with/:userId', chatController.getConversationWithUser);
router.post('/with/:userId/messages', chatController.sendMessageToUser);
router.post('/conversations/:conversationId/read', chatController.markConversationRead);
router.delete('/conversations/:conversationId', chatController.deleteConversation);
router.post('/block/:userId', chatController.blockUser);
router.delete('/block/:userId', chatController.unblockUser);

module.exports = router;
