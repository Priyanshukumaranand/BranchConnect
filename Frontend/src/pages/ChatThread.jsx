import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './ChatThread.css';
import { fetchUserById } from '../api/users';
import {
  fetchConversationWithUser,
  sendMessageToUser,
  markConversationRead,
  deleteConversation,
  blockUser,
  unblockUser
} from '../api/chat';
import { API_BASE_URL } from '../api/client';

const MESSAGE_PAGE_SIZE = 20;

const buildAvatarUrl = (member) => {
  if (!member) return null;
  if (member.image) {
    return member.image;
  }

  if (member.avatarPath) {
    try {
      // eslint-disable-next-line no-new
      new URL(member.avatarPath);
      return member.avatarPath;
    } catch (error) {
      try {
        return new URL(member.avatarPath, API_BASE_URL).toString();
      } catch (fallbackError) {
        return `${API_BASE_URL}${member.avatarPath}`;
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

const ChatThread = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [composerError, setComposerError] = useState(null);
  const [panelStatus, setPanelStatus] = useState(null);
  const threadRef = useRef(null);
  const lastMessageTimestampRef = useRef(null);

  useEffect(() => {
    if (currentUser?.id && userId && currentUser.id === userId) {
      navigate('/profile', { replace: true });
    }
  }, [currentUser?.id, navigate, userId]);

  const memberQuery = useQuery({
    queryKey: ['member-profile', userId],
    queryFn: () => fetchUserById(userId).then((response) => response.user),
    enabled: Boolean(userId)
  });

  const conversationQuery = useInfiniteQuery({
    queryKey: ['chat', 'with', userId],
    enabled: Boolean(userId) && !!currentUser?.id,
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) => fetchConversationWithUser({
      userId,
      cursor: pageParam,
      limit: MESSAGE_PAGE_SIZE,
      signal
    }),
    getNextPageParam: (lastPage) => (lastPage?.pagination?.hasMore ? lastPage.pagination.nextCursor : undefined),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  const conversationQueryKey = useMemo(() => ['chat', 'with', userId], [userId]);
  const conversationListQueryKey = useMemo(() => ['chat', 'conversations'], []);

  const applyConversationMeta = (updates) => {
    if (!updates) return;
    queryClient.setQueryData(conversationQueryKey, (previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        pages: previous.pages.map((page) => ({
          ...page,
          conversation: page.conversation
            ? {
                ...page.conversation,
                ...updates
              }
            : page.conversation
        }))
      };
    });
  };

  const updateConversationListMeta = (conversationId, updates) => {
    if (!conversationId || !updates) return;
    queryClient.setQueryData(conversationListQueryKey, (previous = []) => {
      if (!Array.isArray(previous)) return previous;
      return previous.map((item) => (item.id === conversationId ? { ...item, ...updates } : item));
    });
  };

  const removeConversationFromList = (conversationId) => {
    if (!conversationId) return;
    queryClient.setQueryData(conversationListQueryKey, (previous = []) => {
      if (!Array.isArray(previous)) return previous;
      return previous.filter((item) => item.id !== conversationId);
    });
  };

  const conversation = conversationQuery.data?.pages?.[0]?.conversation || null;
  const conversationId = conversation?.id || null;
  const isBlockedByCurrentUser = Boolean(conversation?.isBlockedByCurrentUser);
  const isBlockingCurrentUser = Boolean(conversation?.isBlockingCurrentUser);
  const blockReason = conversation?.blockReason || null;
  const composerDisabled = isBlockedByCurrentUser || isBlockingCurrentUser;

  const composerPlaceholder = useMemo(() => {
    if (isBlockedByCurrentUser) {
      return 'You blocked this member. Unblock to resume the conversation.';
    }
    if (isBlockingCurrentUser) {
      return 'This member has blocked you. You can still read past messages.';
    }
    const firstName = memberQuery.data?.name?.split(' ')?.[0] || memberQuery.data?.name;
    return `Message ${firstName || memberQuery.data?.email || 'this member'}…`;
  }, [isBlockedByCurrentUser, isBlockingCurrentUser, memberQuery.data]);

  const messages = useMemo(() => {
    const pages = conversationQuery.data?.pages || [];
    const merged = pages.flatMap((page) => page.messages || []);
    return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [conversationQuery.data]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread || messages.length === 0) {
      return;
    }

    if (conversationQuery.isFetchingNextPage) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const lastTimestamp = lastMessage?.createdAt;

    if (lastTimestamp && lastTimestamp !== lastMessageTimestampRef.current) {
      thread.scrollTop = thread.scrollHeight;
      lastMessageTimestampRef.current = lastTimestamp;
    }
  }, [messages, conversationQuery.isFetchingNextPage]);

  const markReadMutation = useMutation({
    mutationFn: ({ conversationId: id }) => markConversationRead({ conversationId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'with', userId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
    onError: (error) => {
      setComposerError(error?.message || 'Unable to update read status right now.');
    }
  });

  useEffect(() => {
    if (!conversationId || !conversation) {
      return;
    }

    if (conversation.unreadCount === 0) {
      return;
    }

    if (markReadMutation.isPending) {
      return;
    }

    markReadMutation.mutate({ conversationId });
  }, [conversationId, conversation, markReadMutation]);

  const sendMessageMutation = useMutation({
    mutationFn: (payload) => sendMessageToUser({ userId, body: payload }),
    onSuccess: (response) => {
      setDraft('');
      setComposerError(null);
      setPanelStatus(null);
      queryClient.setQueryData(conversationQueryKey, (previous) => {
        if (!previous) {
          return {
            pageParams: [null],
            pages: [{
              conversation: response.conversation,
              messages: [response.message],
              pagination: { hasMore: false, nextCursor: null }
            }]
          };
        }

        const nextPages = previous.pages.map((page, index, arr) => {
          const mergedConversation = response.conversation || page.conversation;
          if (index === arr.length - 1) {
            return {
              ...page,
              conversation: mergedConversation,
              messages: [...(page.messages || []), response.message]
            };
          }

          return {
            ...page,
            conversation: mergedConversation
          };
        });

        return {
          ...previous,
          pages: nextPages
        };
      });
      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
    },
    onError: (error) => {
      setComposerError(error?.message || 'Unable to send message right now.');
    }
  });

  const deleteConversationMutation = useMutation({
    mutationFn: ({ conversationId: id }) => deleteConversation({ conversationId: id }),
    onSuccess: (_, variables) => {
      const targetId = variables?.conversationId || conversationId;
      if (targetId) {
        removeConversationFromList(targetId);
        queryClient.removeQueries({ queryKey: ['chat', 'with', userId] });
      }
      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
      navigate('/chats', { replace: true, state: { feedback: 'Conversation removed.' } });
    },
    onError: (error) => {
      setPanelStatus({ type: 'error', message: error?.message || 'Unable to delete this conversation right now.' });
    }
  });

  const blockConversationMutation = useMutation({
    mutationFn: ({ reason }) => blockUser({ userId, reason }),
    onSuccess: (_, variables) => {
      const updates = {
        isBlockedByCurrentUser: true,
        blockReason: variables?.reason || null
      };
      applyConversationMeta(updates);
      const targetId = variables?.conversationId || conversationId;
      updateConversationListMeta(targetId, updates);
      setPanelStatus({ type: 'success', message: 'Member blocked. They can no longer message you.' });
      setComposerError(null);
      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
    },
    onError: (error) => {
      setPanelStatus({ type: 'error', message: error?.message || 'Unable to block this member right now.' });
    }
  });

  const unblockConversationMutation = useMutation({
    mutationFn: () => unblockUser({ userId }),
    onSuccess: (_, variables) => {
      const updates = {
        isBlockedByCurrentUser: false,
        blockReason: null
      };
      applyConversationMeta(updates);
      const targetId = variables?.conversationId || conversationId;
      updateConversationListMeta(targetId, updates);
      setPanelStatus({ type: 'success', message: 'Member unblocked. You can chat again.' });
      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
    },
    onError: (error) => {
      setPanelStatus({ type: 'error', message: error?.message || 'Unable to unblock this member right now.' });
    }
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (composerDisabled) {
      setPanelStatus({
        type: 'error',
        message: isBlockedByCurrentUser
          ? 'You’ve blocked this member. Unblock them to send a message.'
          : 'This member has blocked you. You can’t send messages right now.'
      });
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed || sendMessageMutation.isPending) {
      return;
    }
    await sendMessageMutation.mutateAsync(trimmed);
  };

  const handleLoadOlder = () => {
    if (conversationQuery.hasNextPage && !conversationQuery.isFetchingNextPage) {
      conversationQuery.fetchNextPage();
    }
  };

  const member = memberQuery.data || null;
  const avatarUrl = buildAvatarUrl(member);
  const loadingMember = memberQuery.isLoading;
  const memberError = memberQuery.isError;
  const conversationError = conversationQuery.isError;
  const conversationTitle = member?.name || member?.email || 'Bootcamp member';
  const memberEmail = member?.email || null;
  const lastInteraction = conversation?.lastMessage?.sentAt || conversation?.updatedAt || null;
  const lastInteractionIso = lastInteraction ? new Date(lastInteraction).toISOString() : null;

  if (memberError) {
    return (
      <section className="chat-thread-page">
        <header className="chat-thread-page__header">
          <button type="button" className="chat-thread-page__back" onClick={() => navigate('/chats')}>
            ← Recent chats
          </button>
          <h1>Chat unavailable</h1>
          <p>We couldn’t load this member’s details right now. Please try again later.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="chat-thread-page">
      <header className="chat-thread-page__header">
        <button type="button" className="chat-thread-page__back" onClick={() => navigate('/chats')}>
          ← Recent chats
        </button>
        <span className="chat-thread-page__eyebrow">direct chat</span>
        <h1>{member?.name || member?.email || 'Bootcamp member'}</h1>
      </header>

      <div className="chat-thread-shell">
        <header className="chat-thread__participant">
          <span className={`chat-thread__avatar${avatarUrl ? ' has-image' : ''}`} aria-hidden>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span>{conversationTitle.slice(0, 2).toUpperCase()}</span>
            )}
          </span>
          <div className="chat-thread__details">
            <div className="chat-thread__title-row">
              <h2>{conversationTitle}</h2>
              {lastInteraction && (
                <time dateTime={lastInteractionIso || undefined}>{formatRelativeTime(lastInteraction)}</time>
              )}
            </div>
            {memberEmail && <p>{memberEmail}</p>}
            <div className="chat-thread__badges">
              {isBlockingCurrentUser && (
                <span className="chat-thread__badge chat-thread__badge--warning">They blocked you</span>
              )}
              {isBlockedByCurrentUser && (
                <span className="chat-thread__badge">Blocked</span>
              )}
            </div>
          </div>
          <div className="chat-thread__actions" aria-label="Conversation actions">
            {isBlockedByCurrentUser ? (
              <button
                type="button"
                className="chat-thread__action"
                onClick={() => {
                  setPanelStatus(null);
                  unblockConversationMutation.mutate({ conversationId });
                }}
                disabled={unblockConversationMutation.isPending}
              >
                {unblockConversationMutation.isPending ? 'Unblocking…' : 'Unblock'}
              </button>
            ) : (
              <button
                type="button"
                className="chat-thread__action"
                onClick={() => {
                  const reason = window.prompt('Add a short note about why you’re blocking this member (optional).');
                  setPanelStatus(null);
                  blockConversationMutation.mutate({
                    conversationId,
                    reason: reason?.trim() || undefined
                  });
                }}
                disabled={blockConversationMutation.isPending}
              >
                {blockConversationMutation.isPending ? 'Blocking…' : 'Block member'}
              </button>
            )}
            <button
              type="button"
              className="chat-thread__action chat-thread__action--danger"
              onClick={() => {
                if (!conversationId) {
                  return;
                }
                setPanelStatus(null);
                deleteConversationMutation.mutate({ conversationId });
              }}
              disabled={!conversationId || deleteConversationMutation.isPending}
            >
              {deleteConversationMutation.isPending ? 'Deleting…' : 'Delete chat'}
            </button>
          </div>
        </header>

        {blockReason && (
          <p className="chat-thread__note" role="note">Block note: {blockReason}</p>
        )}

        {panelStatus && (
          <p className={`chat-thread__status chat-thread__status--${panelStatus.type}`} role="status">
            {panelStatus.message}
          </p>
        )}

        {conversationError && (
          <p className="chat-thread__status chat-thread__status--warning">
            We couldn’t load previous messages. You can still send a new one.
          </p>
        )}

        <div className="chat-thread__messages">
          {!conversationQuery.isPending && conversationQuery.hasNextPage && (
            <button
              type="button"
              className="chat-thread__load-more"
              onClick={handleLoadOlder}
              disabled={conversationQuery.isFetchingNextPage}
            >
              {conversationQuery.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
            </button>
          )}

          {conversationQuery.isFetchingNextPage && (
            <p className="chat-thread__hint">Loading earlier messages…</p>
          )}

          <div className="chat-thread__scroll" ref={threadRef}>
            {conversationQuery.isPending ? (
              <p className="chat-thread__hint">Loading conversation…</p>
            ) : messages.length === 0 ? (
              <p className="chat-thread__hint">Say hi and start the conversation.</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message${message.isOwn ? ' chat-message--own' : ''}`}
                >
                  <p className="chat-message__body">{message.body}</p>
                  <span className="chat-message__meta">{formatRelativeTime(message.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <form className="chat-thread__composer" onSubmit={handleSubmit}>
          <textarea
            className="chat-thread__textarea"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setComposerError(null);
            }}
            placeholder={composerPlaceholder}
            rows={3}
            disabled={composerDisabled}
          />
          {composerError && (
            <p className="chat-thread__composer-error" role="alert">{composerError}</p>
          )}
          <div className="chat-thread__composer-actions">
            <button
              type="submit"
              className="chat-thread__send"
              disabled={!draft.trim() || sendMessageMutation.isPending || composerDisabled}
            >
              {sendMessageMutation.isPending ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>

      {loadingMember && (
        <p role="status">Loading member details…</p>
      )}
    </section>
  );
};

export default ChatThread;
