import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
import { connectSocket, onSocketEvent, getSocketStatus } from '../api/socket';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';

const MESSAGE_PAGE_SIZE = 20;

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
  const [socketStatus, setSocketStatus] = useState(() => getSocketStatus());
  const [socketError, setSocketError] = useState(null);
  const [, forceRelativeRefresh] = useReducer((count) => count + 1, 0);
  const threadRef = useRef(null);
  const lastMessageTimestampRef = useRef(null);
  const isSocketConnected = socketStatus === 'connected';

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
    refetchInterval: isSocketConnected ? false : 8000,
    refetchIntervalInBackground: !isSocketConnected,
    refetchOnWindowFocus: !isSocketConnected,
    refetchOnReconnect: true
  });

  const conversationQueryKey = useMemo(() => ['chat', 'with', userId], [userId]);
  const conversationListQueryKey = useMemo(() => ['chat', 'conversations'], []);

  const applyConversationMeta = useCallback((updates) => {
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
  }, [conversationQueryKey, queryClient]);

  const updateConversationListMeta = useCallback((targetConversationId, updates) => {
    if (!targetConversationId || !updates) return;
    queryClient.setQueryData(conversationListQueryKey, (previous = []) => {
      if (!Array.isArray(previous)) return previous;
      return previous.map((item) => (item.id === targetConversationId ? { ...item, ...updates } : item));
    });
  }, [conversationListQueryKey, queryClient]);

  const removeConversationFromList = useCallback((targetConversationId) => {
    if (!targetConversationId) return;
    queryClient.setQueryData(conversationListQueryKey, (previous = []) => {
      if (!Array.isArray(previous)) return previous;
      return previous.filter((item) => item.id !== targetConversationId);
    });
  }, [conversationListQueryKey, queryClient]);

  useEffect(() => {
    if (!currentUser?.id) {
      return undefined;
    }

    const client = connectSocket();
    setSocketStatus(client.connected ? 'connected' : 'connecting');
    setSocketError(null);

    const unsubscribeConnect = onSocketEvent('connect', () => {
      setSocketStatus('connected');
      setSocketError(null);
    });

    const unsubscribeDisconnect = onSocketEvent('disconnect', (reason) => {
      setSocketStatus(reason === 'io server disconnect' ? 'disconnected' : 'reconnecting');
    });

    const unsubscribeError = onSocketEvent('connect_error', (error) => {
      setSocketStatus('error');
      setSocketError(error?.message || 'Realtime connection failed. Falling back to polling.');
    });

    const unsubscribeReconnectAttempt = onSocketEvent('reconnect_attempt', () => {
      setSocketStatus('reconnecting');
    });

    const unsubscribeReconnect = onSocketEvent('reconnect', () => {
      setSocketStatus('connected');
      setSocketError(null);
      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
      if (conversationQueryKey) {
        queryClient.invalidateQueries({ queryKey: conversationQueryKey });
      }
    });

    const unsubscribeReconnectFailed = onSocketEvent('reconnect_failed', () => {
      setSocketStatus('error');
      setSocketError('Realtime reconnection failed. Continuing with polling.');
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
      unsubscribeReconnectAttempt();
      unsubscribeReconnect();
      unsubscribeReconnectFailed();
    };
  }, [currentUser?.id, queryClient, conversationListQueryKey, conversationQueryKey]);


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
    const byId = new Map();

    pages.forEach((page) => {
      (page.messages || []).forEach((message) => {
        if (!message?.id) {
          return;
        }

        const existing = byId.get(message.id);
        if (!existing) {
          byId.set(message.id, message);
          return;
        }

        const existingUpdatedAt = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const messageUpdatedAt = message?.updatedAt ? new Date(message.updatedAt).getTime() : 0;

        if (messageUpdatedAt >= existingUpdatedAt) {
          byId.set(message.id, { ...existing, ...message });
        }
      });
    });

    const merged = Array.from(byId.values());
    return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [conversationQuery.data]);

  useEffect(() => {
    if (!currentUser?.id) {
      return undefined;
    }

    const unsubscribeMessage = onSocketEvent('message:new', (payload) => {
      if (!payload?.conversationId || !payload?.message) {
        return;
      }

      if (conversationId && payload.conversationId === conversationId) {
        queryClient.setQueryData(conversationQueryKey, (previous) => {
          if (!previous) {
            return previous;
          }

          const alreadyExists = previous.pages.some((page) =>
            (page.messages || []).some((existing) => existing.id === payload.message.id)
          );

          if (alreadyExists) {
            return previous;
          }

          const nextPages = previous.pages.map((page, index, array) => {
            if (index === array.length - 1) {
              return {
                ...page,
                messages: [...(page.messages || []), payload.message]
              };
            }
            return page;
          });

          return {
            ...previous,
            pages: nextPages
          };
        });
        lastMessageTimestampRef.current = payload.message.createdAt;
      }

      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
    });

    const unsubscribeConversation = onSocketEvent('conversation:update', (updatedConversation) => {
      if (!updatedConversation?.id) {
        return;
      }

      updateConversationListMeta(updatedConversation.id, updatedConversation);

      if (conversationId && updatedConversation.id === conversationId) {
        applyConversationMeta(updatedConversation);
      }
    });

    const unsubscribeMessageRead = onSocketEvent('message:read', (payload) => {
      if (!payload?.conversationId || !Array.isArray(payload.messageIds) || payload.messageIds.length === 0) {
        return;
      }

      if (!conversationId || payload.conversationId !== conversationId) {
        return;
      }

      const readAtIso = payload.readAt || new Date().toISOString();
      const messageIds = new Set(payload.messageIds);

      queryClient.setQueryData(conversationQueryKey, (previous) => {
        if (!previous) {
          return previous;
        }

        const nextPages = previous.pages.map((page) => {
          if (!page?.messages) {
            return page;
          }

          const updatedMessages = page.messages.map((message) => {
            if (!message || !messageIds.has(message.id)) {
              return message;
            }

            if (message.readAt) {
              return message;
            }

            return {
              ...message,
              readAt: readAtIso
            };
          });

          return {
            ...page,
            messages: updatedMessages
          };
        });

        return {
          ...previous,
          pages: nextPages
        };
      });
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConversation();
      unsubscribeMessageRead();
    };
  }, [
    currentUser?.id,
    conversationId,
    conversationQueryKey,
    queryClient,
    conversationListQueryKey,
    updateConversationListMeta,
    applyConversationMeta
  ]);

  useEffect(() => {
    if (!currentUser?.id) {
      return undefined;
    }

    const handlePresence = (payload) => {
      if (!payload?.userId) {
        return;
      }

      const isOnline = payload.status === 'online';
      const lastSeenAt = payload.lastSeenAt || null;

      queryClient.setQueryData(conversationListQueryKey, (previous = []) => {
        if (!Array.isArray(previous)) {
          return previous;
        }

        return previous.map((item) => {
          if (item?.otherParticipant?.id !== payload.userId) {
            return item;
          }

          const updatedOther = {
            ...item.otherParticipant,
            isOnline,
            lastSeenAt
          };

          return {
            ...item,
            otherParticipant: updatedOther,
            isOtherParticipantOnline: isOnline,
            otherParticipantLastSeenAt: lastSeenAt
          };
        });
      });

      queryClient.setQueryData(conversationQueryKey, (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          pages: previous.pages.map((page) => {
            if (!page?.conversation?.otherParticipant?.id || page.conversation.otherParticipant.id !== payload.userId) {
              return page;
            }

            const updatedOther = {
              ...page.conversation.otherParticipant,
              isOnline,
              lastSeenAt
            };

            return {
              ...page,
              conversation: {
                ...page.conversation,
                otherParticipant: updatedOther,
                isOtherParticipantOnline: isOnline,
                otherParticipantLastSeenAt: lastSeenAt
              }
            };
          })
        };
      });

      if (payload.userId === userId) {
        queryClient.setQueryData(['member-profile', userId], (previousMember) => {
          if (!previousMember) {
            return previousMember;
          }

          return {
            ...previousMember,
            isOnline,
            lastSeenAt
          };
        });
      }
    };

    const unsubscribePresence = onSocketEvent('presence:update', handlePresence);

    return () => {
      unsubscribePresence();
    };
  }, [currentUser?.id, queryClient, conversationListQueryKey, conversationQueryKey, userId]);

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
  const conversationPartner = useMemo(() => {
    if (conversation?.otherParticipant?.id === userId) {
      return conversation.otherParticipant;
    }

    const fallback = (conversation?.participants || []).find((participant) => participant?.id === userId);
    if (fallback) {
      return fallback;
    }

    if (member?.id === userId) {
      return member;
    }

    return null;
  }, [conversation, member, userId]);

  const presence = useMemo(() => {
    const source = conversationPartner || (member?.id === userId ? member : null);
    const isOnline = source?.isOnline
      ?? (conversationPartner ? conversation?.isOtherParticipantOnline : undefined)
      ?? false;
    const lastSeenAt = source?.lastSeenAt
      || (conversationPartner ? conversation?.otherParticipantLastSeenAt : undefined)
      || (member?.id === userId ? member?.lastSeenAt : undefined)
      || null;

    return {
      isOnline: Boolean(isOnline),
      lastSeenAt
    };
  }, [conversationPartner, conversation, member, userId]);
  const presenceLabel = presence.isOnline
    ? 'Online now'
    : presence.lastSeenAt
      ? `Last seen ${formatRelativeTime(presence.lastSeenAt)}`
      : 'Last seen NA';

  useEffect(() => {
    const shouldTrackMessages = messages.length > 0;
    const shouldTrackPresence = !presence.isOnline && Boolean(presence.lastSeenAt);

    if (!shouldTrackMessages && !shouldTrackPresence) {
      return undefined;
    }

    const interval = setInterval(() => {
      forceRelativeRefresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [messages.length, presence.isOnline, presence.lastSeenAt, forceRelativeRefresh]);

  const loadingMember = memberQuery.isLoading;
  const memberError = memberQuery.isError;
  const conversationTitle = member?.name || member?.email || 'IIIT Network member';
  const memberEmail = member?.email || null;
  const lastInteraction = conversation?.lastMessage?.sentAt || conversation?.updatedAt || null;
  const lastInteractionIso = lastInteraction ? new Date(lastInteraction).toISOString() : null;

  if (memberError) {
    return (
      <section className="chat-thread-page">
        <header className="chat-thread-page__header">
          <Button variant="ghost" onClick={() => navigate('/chats')}>
            ← Recent chats
          </Button>
          <h1>Chat unavailable</h1>
          <p>We couldn’t load this member’s details right now. Please try again later.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="chat-thread-page">
      <header className="chat-thread-page__header">
        <div className="header-actions">
          <Button variant="ghost" size="sm" onClick={() => navigate('/chats')} icon="arrow-left">
            Back
          </Button>
          <span className="chat-thread-page__eyebrow">direct chat</span>
        </div>
      </header>

      <Card className="chat-thread-shell" variant="glass" noPadding>
        <header className="chat-thread__participant">
          <Avatar
            src={member?.image || member?.avatarPath}
            name={conversationTitle}
            size="md"
            status={presence.isOnline ? 'online' : null}
          />
          <div className="chat-thread__details">
            <div className="chat-thread__title-row">
              <h2>{conversationTitle}</h2>
              {lastInteraction && (
                <time dateTime={lastInteractionIso || undefined}>{formatRelativeTime(lastInteraction)}</time>
              )}
            </div>
            {presenceLabel && (
              <p
                className={`chat-thread__presence${presence.isOnline ? ' chat-thread__presence--online' : ''}`}
                role="status"
              >
                {presenceLabel}
              </p>
            )}
            <div className="chat-thread__badges">
              {isBlockingCurrentUser && (
                <span className="chat-thread__badge chat-thread__badge--warning">They blocked you</span>
              )}
              {isBlockedByCurrentUser && (
                <span className="chat-thread__badge">Blocked</span>
              )}
            </div>
          </div>

          <div className="chat-thread__inline-actions">
            {isBlockedByCurrentUser ? (
              <button
                className="chat-thread__action-btn"
                onClick={() => unblockConversationMutation.mutate({ conversationId })}
              >
                Unblock
              </button>
            ) : (
              <button
                className="chat-thread__action-btn chat-thread__action-btn--danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to block this user?')) {
                    blockConversationMutation.mutate({ conversationId });
                  }
                }}
              >
                Block
              </button>
            )}
            <button
              className="chat-thread__action-btn chat-thread__action-btn--danger"
              onClick={() => {
                if (window.confirm('Delete this conversation? This cannot be undone.')) {
                  deleteConversationMutation.mutate({ conversationId });
                }
              }}
            >
              Delete
            </button>
          </div>
        </header>

        {panelStatus && (
          <div className={`chat-thread__notice chat-thread__notice--${panelStatus.type}`} role="alert">
            {panelStatus.message}
            <button type="button" onClick={() => setPanelStatus(null)}>×</button>
          </div>
        )}

        {isBlockingCurrentUser && (
          <div className="chat-thread__notice chat-thread__notice--error">
            This member has blocked you. You can read past messages but cannot reply.
          </div>
        )}

        <div className="chat-thread__messages" ref={threadRef}>
          {conversationQuery.hasNextPage && (
            <div className="chat-thread__loader">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadOlder}
                disabled={conversationQuery.isFetchingNextPage}
                loading={conversationQuery.isFetchingNextPage}
              >
                Load older messages
              </Button>
            </div>
          )}

          {messages.length === 0 && !conversationQuery.isLoading && (
            <div className="chat-thread__empty">
              <p>No messages yet. Say hello!</p>
            </div>
          )}

          {messages.map((message, index) => {
            const isOwn = message.isOwn;
            const showAvatar = !isOwn && (index === 0 || messages[index - 1].isOwn || messages[index - 1].senderId !== message.senderId);

            return (
              <div
                key={message.id}
                className={`chat-bubble${isOwn ? ' chat-bubble--own' : ' chat-bubble--other'}`}
              >
                {!isOwn && (
                  <div className="chat-bubble__avatar">
                    {showAvatar ? (
                      <Avatar
                        src={member?.image || member?.avatarPath}
                        name={conversationTitle}
                        size="sm"
                      />
                    ) : <div className="avatar-spacer" />}
                  </div>
                )}
                <div className="chat-bubble__content">
                  <p>{message.body}</p>
                  <time title={new Date(message.createdAt).toLocaleString()}>
                    {formatRelativeTime(message.createdAt)}
                  </time>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="chat-thread__footer">
          <form className="chat-composer" onSubmit={handleSubmit}>
            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setComposerError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={composerPlaceholder}
              rows={1}
              disabled={composerDisabled}
            />
            <Button
              type="button" // Change to submit via logic 
              variant="primary"
              icon="paper-plane"
              onClick={handleSubmit}
              disabled={!draft.trim() || sendMessageMutation.isPending || composerDisabled}
              loading={sendMessageMutation.isPending}
              className="chat-composer__send"
            />
          </form>
          {composerError && (
            <p className="chat-composer__error">{composerError}</p>
          )}
        </footer>
      </Card>
    </section>
  );
};

export default ChatThread;
