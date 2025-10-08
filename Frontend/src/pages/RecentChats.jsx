import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './RecentChats.css';
import {
  listConversations,
  deleteConversation,
  blockUser,
  unblockUser
} from '../api/chat';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

const buildAvatarUrl = (participant) => {
  if (!participant) return null;
  if (participant.image) {
    return participant.image;
  }

  if (participant.avatarPath) {
    try {
      // eslint-disable-next-line no-new
      new URL(participant.avatarPath);
      return participant.avatarPath;
    } catch (error) {
      try {
        return new URL(participant.avatarPath, API_BASE_URL).toString();
      } catch (fallbackError) {
        return `${API_BASE_URL}${participant.avatarPath}`;
      }
    }
  }

  return null;
};

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 5) {
    return 'just now';
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const buildInitials = (participant) => {
  if (!participant) return '??';
  if (participant.name) {
    return participant.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (participant.email) {
    return participant.email.slice(0, 2).toUpperCase();
  }
  return '??';
};

const RecentChats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState(null);

  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations'],
    enabled: Boolean(user?.id),
    queryFn: ({ signal }) => listConversations({ signal }).then((response) => response.conversations || []),
    staleTime: 10_000,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  const removeConversationFromCache = (conversationId) => {
    queryClient.setQueryData(['chat', 'conversations'], (previous = []) => {
      if (!Array.isArray(previous)) return previous;
      return previous.filter((conversation) => conversation.id !== conversationId);
    });
  };

  const updateConversationInCache = (conversationId, updates) => {
    queryClient.setQueryData(['chat', 'conversations'], (previous = []) => {
      if (!Array.isArray(previous)) return previous;
      return previous.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }
        return {
          ...conversation,
          ...updates
        };
      });
    });
  };

  const deleteMutation = useMutation({
    mutationFn: ({ conversationId }) => deleteConversation({ conversationId }),
    onSuccess: (_, variables) => {
      if (variables?.conversationId) {
        removeConversationFromCache(variables.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      if (variables?.userId) {
        queryClient.removeQueries({ queryKey: ['chat', 'with', variables.userId] });
      } else {
        queryClient.removeQueries({ queryKey: ['chat', 'with'], exact: false });
      }
  setFeedback({ type: 'success', message: 'Conversation deleted.' });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error?.message || 'Unable to delete conversation right now.' });
    }
  });

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: (_, variables) => {
      updateConversationInCache(variables.conversationId, {
        isBlockedByCurrentUser: true,
        blockReason: variables.reason || null
      });
      setFeedback({ type: 'success', message: 'Member blocked. They can no longer message you.' });
      queryClient.invalidateQueries({ queryKey: ['chat', 'with', variables.userId] });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error?.message || 'Unable to block this member right now.' });
    }
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: (_, variables) => {
      updateConversationInCache(variables.conversationId, {
        isBlockedByCurrentUser: false,
        blockReason: null
      });
      setFeedback({ type: 'success', message: 'Member unblocked. You can chat again.' });
      queryClient.invalidateQueries({ queryKey: ['chat', 'with', variables.userId] });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error?.message || 'Unable to unblock this member right now.' });
    }
  });

  const conversations = useMemo(() => conversationsQuery.data || [], [conversationsQuery.data]);

  const stats = useMemo(() => {
    if (!Array.isArray(conversations) || conversations.length === 0) {
      return {
        total: 0,
        unread: 0,
        blocked: 0,
        active: 0
      };
    }

    const unread = conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0);
    const blocked = conversations.filter((conversation) => conversation.isBlockedByCurrentUser).length;
    const active = conversations.length - blocked;

    return {
      total: conversations.length,
      unread,
      blocked,
      active: Math.max(active, 0)
    };
  }, [conversations]);

  useEffect(() => {
    if (location.state?.feedback) {
      setFeedback({ type: 'success', message: location.state.feedback });
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleOpenConversation = (participantId) => {
    if (!participantId) {
      return;
    }
    navigate(`/chats/${participantId}`);
  };

  const renderStatus = () => {
    if (feedback) {
      return (
        <div className={`recent-chats__feedback recent-chats__feedback--${feedback.type}`} role="status">
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss message">×</button>
        </div>
      );
    }
    if (conversationsQuery.isError) {
      return (
        <div className="recent-chats__feedback recent-chats__feedback--error" role="alert">
          <span>{conversationsQuery.error?.message || 'Unable to load your conversations right now.'}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="recent-chats">
      <header className="recent-chats__header">
        <span className="recent-chats__eyebrow">Inbox</span>
        <h1>Stay connected with your cohort</h1>
        <p>All your direct messages live here. Pick up a conversation, clear out old threads, or block members that you no longer want to hear from.</p>

        <div className="recent-chats__stats" role="list">
          <div className="recent-chats__stat-card" role="listitem">
            <span>Total chats</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="recent-chats__stat-card" role="listitem">
            <span>Unread messages</span>
            <strong>{stats.unread}</strong>
          </div>
          <div className="recent-chats__stat-card" role="listitem">
            <span>Active threads</span>
            <strong>{stats.active}</strong>
          </div>
          <div className="recent-chats__stat-card" role="listitem">
            <span>Blocked chats</span>
            <strong>{stats.blocked}</strong>
          </div>
        </div>
      </header>

      {renderStatus()}

      {conversationsQuery.isLoading ? (
        <div className="recent-chats__panel recent-chats__placeholder">
          <h2>Loading your conversations…</h2>
          <p>We’re fetching your latest messages and notifications.</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="recent-chats__panel recent-chats__empty">
          <div className="recent-chats__empty-illustration" aria-hidden>
            <span>💬</span>
          </div>
          <h2>No conversations yet</h2>
          <p>Start a chat from the batches or member profile pages and it’ll appear here for quick access.</p>
          <button
            type="button"
            className="recent-chats__cta"
            onClick={() => navigate('/batches')}
          >
            Explore batches
          </button>
        </div>
      ) : (
        <div className="recent-chats__panel">
          <div className="recent-chats__list">
            {conversations.map((conversation) => {
            const otherMember = conversation.otherParticipant || null;
            const avatarUrl = buildAvatarUrl(otherMember);
            const initials = buildInitials(otherMember);
            const lastMessagePreview = conversation.lastMessage?.body || 'No messages yet.';
            const lastMessageTime = conversation.lastMessage?.sentAt || conversation.updatedAt;
            const isBlockedByCurrentUser = conversation.isBlockedByCurrentUser;
            const isBlockingCurrentUser = conversation.isBlockingCurrentUser;
            const unreadCount = conversation.unreadCount || 0;
            const conversationId = conversation.id;
            const otherMemberId = otherMember?.id;

            const deletePending = deleteMutation.isPending && deleteMutation.variables?.conversationId === conversationId;
            const blockPending = blockMutation.isPending && blockMutation.variables?.conversationId === conversationId;
            const unblockPending = unblockMutation.isPending && unblockMutation.variables?.conversationId === conversationId;

              return (
                <article
                  key={conversationId}
                  className="conversation-card"
                  aria-label={`Conversation with ${otherMember?.name || otherMember?.email || 'member'}`}
                >
                  <div
                    className="conversation-card__main"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenConversation(otherMemberId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOpenConversation(otherMemberId);
                      }
                    }}
                  >
                    <span className={`conversation-card__avatar${avatarUrl ? ' has-image' : ''}`} aria-hidden>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </span>
                    <div className="conversation-card__text">
                      <div className="conversation-card__row">
                        <h2>{otherMember?.name || otherMember?.email || 'Member'}</h2>
                        <time dateTime={lastMessageTime}>{formatRelativeTime(lastMessageTime)}</time>
                      </div>
                      <p className="conversation-card__preview" title={lastMessagePreview}>{lastMessagePreview}</p>
                      <div className="conversation-card__tags">
                        {unreadCount > 0 && (
                          <span className="conversation-card__badge" aria-label={`${unreadCount} unread messages`}>
                            {unreadCount} unread
                          </span>
                        )}
                        {isBlockingCurrentUser && (
                          <span className="conversation-card__tag conversation-card__tag--warning">They blocked you</span>
                        )}
                        {isBlockedByCurrentUser && (
                          <span className="conversation-card__tag">Blocked</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(isBlockedByCurrentUser || isBlockingCurrentUser || conversation.blockReason) && (
                    <div className="conversation-card__notices">
                      {conversation.blockReason && (
                        <p className="conversation-card__note" role="note">
                          Reason noted: {conversation.blockReason}
                        </p>
                      )}
                      {isBlockingCurrentUser && !conversation.blockReason && (
                        <p className="conversation-card__note" role="note">This member has blocked you.</p>
                      )}
                      {isBlockedByCurrentUser && !conversation.blockReason && (
                        <p className="conversation-card__note" role="note">You’ve blocked this member.</p>
                      )}
                    </div>
                  )}

                  <div className="conversation-card__actions" aria-label="Conversation actions">
                    {isBlockedByCurrentUser ? (
                      <button
                        type="button"
                        className="conversation-card__action"
                        onClick={() => {
                          setFeedback(null);
                          unblockMutation.mutate({ userId: otherMemberId, conversationId });
                        }}
                        disabled={unblockPending}
                      >
                        {unblockPending ? 'Unblocking…' : 'Unblock'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="conversation-card__action"
                        onClick={() => {
                          const reason = window.prompt('Add an optional note for why you are blocking this member (optional).');
                          setFeedback(null);
                          blockMutation.mutate({ userId: otherMemberId, reason: reason?.trim() || undefined, conversationId });
                        }}
                        disabled={blockPending}
                      >
                        {blockPending ? 'Blocking…' : 'Block'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="conversation-card__action conversation-card__action--danger"
                      onClick={() => {
                        setFeedback(null);
                        deleteMutation.mutate({ conversationId, userId: otherMemberId });
                      }}
                      disabled={deletePending}
                    >
                      {deletePending ? 'Deleting…' : 'Delete chat'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default RecentChats;
