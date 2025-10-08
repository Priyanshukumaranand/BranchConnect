import { apiFetch } from './client';

export const listConversations = ({ signal } = {}) =>
  apiFetch('/chat/conversations', { method: 'GET', signal });

export const fetchConversationWithUser = ({ userId, cursor, limit, signal }) => {
  if (!userId) {
    return Promise.reject(new Error('User id is required.'));
  }

  const params = new URLSearchParams();

  if (cursor) {
    params.set('before', cursor);
  }

  if (limit) {
    params.set('limit', limit);
  }

  const query = params.toString();
  return apiFetch(`/chat/with/${userId}${query ? `?${query}` : ''}`, { method: 'GET', signal });
};

export const sendMessageToUser = ({ userId, body }) => {
  if (!userId) {
    return Promise.reject(new Error('User id is required.'));
  }

  return apiFetch(`/chat/with/${userId}/messages`, {
    method: 'POST',
    body: { body }
  });
};

export const fetchConversationMessages = ({ conversationId, cursor, limit, signal }) => {
  if (!conversationId) {
    return Promise.reject(new Error('Conversation id is required.'));
  }

  const params = new URLSearchParams();
  if (cursor) {
    params.set('before', cursor);
  }
  if (limit) {
    params.set('limit', limit);
  }
  const query = params.toString();
  return apiFetch(`/chat/conversations/${conversationId}/messages${query ? `?${query}` : ''}`, {
    method: 'GET',
    signal
  });
};

export const markConversationRead = ({ conversationId }) => {
  if (!conversationId) {
    return Promise.reject(new Error('Conversation id is required.'));
  }

  return apiFetch(`/chat/conversations/${conversationId}/read`, {
    method: 'POST'
  });
};

export const deleteConversation = ({ conversationId }) => {
  if (!conversationId) {
    return Promise.reject(new Error('Conversation id is required.'));
  }

  return apiFetch(`/chat/conversations/${conversationId}`, {
    method: 'DELETE'
  });
};

export const blockUser = ({ userId, reason }) => {
  if (!userId) {
    return Promise.reject(new Error('User id is required.'));
  }

  return apiFetch(`/chat/block/${userId}`, {
    method: 'POST',
    body: { reason }
  });
};

export const unblockUser = ({ userId }) => {
  if (!userId) {
    return Promise.reject(new Error('User id is required.'));
  }

  return apiFetch(`/chat/block/${userId}`, {
    method: 'DELETE'
  });
};
