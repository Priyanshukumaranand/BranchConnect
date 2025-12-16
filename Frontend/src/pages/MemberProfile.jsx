import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './MemberProfile.css';
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
import { useAuth } from '../context/AuthContext';

const MESSAGE_PAGE_SIZE = 20;

const deriveBatchYear = (collegeId = '') => {
  const match = collegeId.trim().toLowerCase().match(/^b(\d{3})/);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  if (Number.isNaN(value)) return null;
  return 1500 + value;
};

const buildAvatarUrl = (member) => {
  if (!member) return null;
  if (member.image) {
    return member.image;
  }

  if (member.avatarPath) {
    try {
      return new URL(member.avatarPath, API_BASE_URL).toString();
    } catch (error) {
      return `${API_BASE_URL}${member.avatarPath}`;
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

const MemberProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const conversationQueryKey = useMemo(() => ['chat', 'with', userId], [userId]);
  const conversationListQueryKey = useMemo(() => ['chat', 'conversations'], []);
  const [shouldLoadConversation, setShouldLoadConversation] = useState(false);
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

  useEffect(() => {
    const cachedConversation = queryClient.getQueryData(conversationQueryKey);
    setShouldLoadConversation(Boolean(cachedConversation));
  }, [conversationQueryKey, queryClient]);

  const conversationQueryEnabled = shouldLoadConversation && Boolean(userId) && !!currentUser?.id;

  const conversationQuery = useInfiniteQuery({
    queryKey: conversationQueryKey,
    enabled: conversationQueryEnabled,
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
      setComposerError(error?.message || 'Unable to send message right now.');
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
      setShouldLoadConversation(true);
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
        applyConversationMeta({ unreadCount: 0 });
      }
      setPanelStatus({ type: 'success', message: 'Conversation removed from your recent chats.' });
      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
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
    if (!trimmed) {
      return;
    }
    if (sendMessageMutation.isPending) {
      return;
    }
    await sendMessageMutation.mutateAsync(trimmed);
  };

  const handleLoadOlder = () => {
    if (!shouldLoadConversation) {
      setShouldLoadConversation(true);
      return;
    }

    if (conversationQueryEnabled && conversationQuery.hasNextPage && !conversationQuery.isFetchingNextPage) {
      conversationQuery.fetchNextPage();
    }
  };

  const member = memberQuery.data || null;
  const batchYear = useMemo(() => deriveBatchYear(member?.collegeId || ''), [member?.collegeId]);
  const avatarUrl = buildAvatarUrl(member);
  const loadingMember = memberQuery.isLoading;
  const memberError = memberQuery.isError;
  const conversationError = conversationQuery.isError;

  const contactLinks = useMemo(() => {
    if (!member) return [];
    const socials = member.socials || {};
    const entries = [
      ['Email', member.email ? (member.email.startsWith('mailto:') ? member.email : `mailto:${member.email}`) : null],
      ['LinkedIn', socials.linkedin || member.linkedin],
      ['GitHub', socials.github || member.github],
      ['Instagram', socials.instagram || member.instagram],
      ['Portfolio', socials.portfolio || member.portfolio],
      ['Website', socials.website || member.website]
    ];

    return entries.filter(([, value]) => Boolean(value));
  }, [member]);

  if (memberError) {
    return (
      <section className="member-profile">
        <div className="member-profile__feedback">
          <button type="button" onClick={() => navigate(-1)} className="member-profile__back">← Back</button>
          <h1>Profile unavailable</h1>
          <p>We couldn’t load this member’s profile right now. Please try again or reach out to the Branch Connect team.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="member-profile">
      <header className="member-profile__top">
        <button type="button" onClick={() => navigate(-1)} className="member-profile__back">← Back</button>
        <div className="member-profile__hero">
          <div className={`member-profile__avatar${avatarUrl ? ' has-image' : ''}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${member?.name || 'Member'} avatar`} />
            ) : (
              <span>{(member?.name || member?.email || '?').slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="member-profile__heading">
            <span className="member-profile__eyebrow">Community member</span>
            <h1>{member?.name || member?.email || 'Branch Connect Member'}</h1>
            <div className="member-profile__tags">
              {member?.collegeId && (
                <span className="member-profile__tag">Roll · {member.collegeId.toUpperCase()}</span>
              )}
              {batchYear && (
                <span className="member-profile__tag">Batch {batchYear}</span>
              )}
              {member?.place && (
                <span className="member-profile__tag">{member.place}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="member-profile__body">
        <aside className="member-profile__sidebar">
          <div className="member-profile__card">
            <h2>About</h2>
            <div className="member-profile__info">
              <p className="member-profile__about">{member?.about || 'This member hasn’t added an introduction yet.'}</p>
              <ul className="member-profile__facts">
                <li>{member?.place || 'Location not shared yet.'}</li>
                {member?.collegeId && <li>Roll • {member.collegeId.toUpperCase()}</li>}
                {batchYear && <li>Batch {batchYear}</li>}
              </ul>
            </div>
          </div>

          <div className="member-profile__links">
            <h2>Connect</h2>
            {contactLinks.length > 0 ? (
              <div className="member-profile__link-chips">
                {contactLinks.map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer noopener">{label}</a>
                ))}
              </div>
            ) : (
              <p className="member-profile__meta">No links shared yet.</p>
            )}
          </div>
        </aside>

        <div className="member-profile__chat">
          <div className="chat-panel">
            <header className="chat-panel__header">
              <div className="chat-panel__title">
                <h2>Chat with {member?.name?.split(' ')?.[0] || member?.name || 'this member'}</h2>
                {panelStatus && (
                  <p className={`chat-panel__status chat-panel__status--${panelStatus.type}`} role="status">
                    {panelStatus.message}
                  </p>
                )}
              </div>
              {conversationError && (
                <p className="chat-panel__error">We couldn’t load previous messages. You can still send a new one.</p>
              )}
              <div className="chat-panel__actions">
                {isBlockedByCurrentUser ? (
                  <button
                    type="button"
                    className="chat-panel__action-btn"
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
                    className="chat-panel__action-btn"
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
                    {blockConversationMutation.isPending ? 'Blocking…' : 'Block'}
                  </button>
                )}
                <button
                  type="button"
                  className="chat-panel__action-btn chat-panel__action-btn--danger"
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
              {blockReason && (
                <p className="chat-panel__notice chat-panel__notice--muted">
                  Block note: {blockReason}
                </p>
              )}
              {isBlockingCurrentUser && (
                <p className="chat-panel__notice chat-panel__notice--danger" role="alert">
                  This member has blocked you. You can read past messages but can’t reply.
                </p>
              )}
              {isBlockedByCurrentUser && !isBlockingCurrentUser && (
                <p className="chat-panel__notice" role="note">
                  You blocked this member. Unblock to resume the conversation.
                </p>
              )}
            </header>

            {shouldLoadConversation ? (
              <div className="chat-thread" ref={threadRef}>
                {conversationQueryEnabled && conversationQuery.isPending && (
                  <p className="chat-thread__hint">Loading conversation…</p>
                )}

                {conversationQueryEnabled && !conversationQuery.isPending && conversationQuery.hasNextPage && (
                  <button
                    type="button"
                    className="chat-thread__load-more"
                    onClick={handleLoadOlder}
                    disabled={conversationQuery.isFetchingNextPage}
                  >
                    {conversationQuery.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
                  </button>
                )}

                {conversationQueryEnabled && conversationQuery.isFetchingNextPage && (
                  <p className="chat-thread__hint">Loading earlier messages…</p>
                )}

                {messages.length === 0 && (!conversationQueryEnabled || !conversationQuery.isPending) && (
                  <p className="chat-thread__hint">Say hi and start the conversation.</p>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-bubble${message.isOwn ? ' chat-bubble--own' : ''}`}
                  >
                    <p>{message.body}</p>
                    <span>{formatRelativeTime(message.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chat-thread chat-thread--inactive">
                <p className="chat-thread__hint">
                  Send a message to start the conversation. If you already have a chat history, load it to catch up.
                </p>
                <button
                  type="button"
                  className="chat-thread__load-more"
                  onClick={() => {
                    setPanelStatus(null);
                    setShouldLoadConversation(true);
                  }}
                >
                  Show previous messages
                </button>
              </div>
            )}

            <form className="chat-composer" onSubmit={handleSubmit}>
              <textarea
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setComposerError(null);
                }}
                placeholder={composerPlaceholder}
                rows={2}
                disabled={composerDisabled}
              />
              {composerError && (
                <p className="chat-composer__error" role="alert">{composerError}</p>
              )}
              <div className="chat-composer__actions">
                <button type="submit" disabled={!draft.trim() || sendMessageMutation.isPending || composerDisabled}>
                  {sendMessageMutation.isPending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {loadingMember && (
        <div className="member-profile__loading" aria-live="polite">Loading member details…</div>
      )}
    </section>
  );
};

export default MemberProfile;
