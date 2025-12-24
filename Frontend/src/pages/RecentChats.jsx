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
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

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
    mutationFn: ({ conversationId, reason, userId }) => blockUser({ userId, reason }),
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
    mutationFn: ({ conversationId, userId }) => unblockUser({ userId }),
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
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} aria-label="Dismiss message">
            Dismiss
          </Button>
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
        <h1>Stay connected with IIIT Network peers</h1>
        <p>All your direct messages live here. Pick up a conversation, clear out old threads, or block members that you no longer want to hear from.</p>

        <div className="recent-chats__stats" role="list">
          <Card className="recent-chats__stat-card" variant="glass">
            <span>Total chats</span>
            <strong>{stats.total}</strong>
          </Card>
          <Card className="recent-chats__stat-card" variant="glass">
            <span>Unread messages</span>
            <strong>{stats.unread}</strong>
          </Card>
          <Card className="recent-chats__stat-card" variant="glass">
            <span>Active threads</span>
            <strong>{stats.active}</strong>
          </Card>
          <Card className="recent-chats__stat-card" variant="glass">
            <span>Blocked chats</span>
            <strong>{stats.blocked}</strong>
          </Card>
        </div>
      </header>

      {renderStatus()}

      {conversationsQuery.isLoading ? (
        <Card className="recent-chats__panel recent-chats__placeholder">
          <h2>Loading your conversations…</h2>
          <p>We’re fetching your latest messages and notifications.</p>
        </Card>
      ) : conversations.length === 0 ? (
        <Card className="recent-chats__panel recent-chats__empty">
          <div className="recent-chats__empty-illustration" aria-hidden>
            <span>💬</span>
          </div>
          <h2>No conversations yet</h2>
          <p>Start a chat from the batches or member profile pages and it’ll appear here for quick access.</p>
          <Button
            variant="primary"
            onClick={() => navigate('/batches')}
          >
            Explore batches
          </Button>
        </Card>
      ) : (
        <div className="recent-chats__list">
          {conversations.map((conversation) => {
            const otherMember = conversation.otherParticipant || null;
            const lastMessagePreview = conversation.lastMessage?.body || 'No messages yet.';
            const lastMessageTime = conversation.lastMessage?.sentAt || conversation.updatedAt;
            const isBlockedByCurrentUser = conversation.isBlockedByCurrentUser;
            const isBlockingCurrentUser = conversation.isBlockingCurrentUser;
            const unreadCount = conversation.unreadCount || 0;
            const conversationId = conversation.id;
            const otherMemberId = otherMember?.id;
            const isOtherOnline = Boolean(conversation.isOtherParticipantOnline || otherMember?.isOnline);
            const lastSeenAt = conversation.otherParticipantLastSeenAt || otherMember?.lastSeenAt || null;

            const deletePending = deleteMutation.isPending && deleteMutation.variables?.conversationId === conversationId;
            const blockPending = blockMutation.isPending && blockMutation.variables?.conversationId === conversationId;
            const unblockPending = unblockMutation.isPending && unblockMutation.variables?.conversationId === conversationId;

            return (
              <Card
                key={conversationId}
                className="conversation-card"
                variant="default"
                noPadding
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
                  <div className="conversation-card__media">
                    <Avatar
                      src={otherMember?.image || otherMember?.avatarPath}
                      name={otherMember?.name || otherMember?.email}
                      size="lg"
                      status={isOtherOnline ? 'online' : null}
                    />
                  </div>

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
                      {!isOtherOnline && lastSeenAt && (
                        <span className="conversation-card__tag conversation-card__tag--muted">Last seen {formatRelativeTime(lastSeenAt)}</span>
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFeedback(null);
                        unblockMutation.mutate({ userId: otherMemberId, conversationId });
                      }}
                      loading={unblockPending}
                    >
                      Unblock
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const reason = window.prompt('Add an optional note forming why you are blocking this member.');
                        setFeedback(null);
                        blockMutation.mutate({ userId: otherMemberId, reason: reason?.trim() || undefined, conversationId });
                      }}
                      loading={blockPending}
                    >
                      Block
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    onClick={() => {
                      setFeedback(null);
                      deleteMutation.mutate({ conversationId, userId: otherMemberId });
                    }}
                    loading={deletePending}
                  >
                    Delete chat
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecentChats;
