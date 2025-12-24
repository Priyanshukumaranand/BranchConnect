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
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';

const MESSAGE_PAGE_SIZE = 20;

const deriveBatchYear = (collegeId = '') => {
  const match = collegeId.trim().toLowerCase().match(/^b(\d{3})/);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  if (Number.isNaN(value)) return null;
  return 1500 + value;
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

  // Helpers to update cache optimistically
  const applyConversationMeta = (updates) => {
    if (!updates) return;
    queryClient.setQueryData(conversationQueryKey, (previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        pages: previous.pages.map((page) => ({
          ...page,
          conversation: page.conversation
            ? { ...page.conversation, ...updates }
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
    return 'Type a message...';
  }, [isBlockedByCurrentUser, isBlockingCurrentUser]);

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
    if (!conversationId || !conversation) return;
    if (conversation.unreadCount === 0) return;
    if (markReadMutation.isPending) return;
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
          return { ...page, conversation: mergedConversation };
        });
        return { ...previous, pages: nextPages };
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
      setPanelStatus({ type: 'error', message: error?.message || 'Unable to delete conversation.' });
    }
  });

  const blockConversationMutation = useMutation({
    mutationFn: ({ reason }) => blockUser({ userId, reason }),
    onSuccess: (_, variables) => {
      const updates = { isBlockedByCurrentUser: true, blockReason: variables?.reason || null };
      applyConversationMeta(updates);
      const targetId = variables?.conversationId || conversationId;
      updateConversationListMeta(targetId, updates);
      setPanelStatus({ type: 'success', message: 'Member blocked.' });
      setComposerError(null);
      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
    },
    onError: (error) => {
      setPanelStatus({ type: 'error', message: error?.message || 'Unable to block member.' });
    }
  });

  const unblockConversationMutation = useMutation({
    mutationFn: () => unblockUser({ userId }),
    onSuccess: (_, variables) => {
      const updates = { isBlockedByCurrentUser: false, blockReason: null };
      applyConversationMeta(updates);
      const targetId = variables?.conversationId || conversationId;
      updateConversationListMeta(targetId, updates);
      setPanelStatus({ type: 'success', message: 'Member unblocked.' });
      queryClient.invalidateQueries({ queryKey: conversationListQueryKey });
    },
    onError: (error) => {
      setPanelStatus({ type: 'error', message: error?.message || 'Unable to unblock member.' });
    }
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (composerDisabled) {
      setPanelStatus({
        type: 'error',
        message: isBlockedByCurrentUser
          ? 'You blocked this member. Unblock to message.'
          : 'This member has blocked you.'
      });
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed || sendMessageMutation.isPending) return;
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
        <header className="member-profile__header">
          <Button variant="ghost" onClick={() => navigate(-1)} icon="arrow-left">Back</Button>
          <h1>Profile Unavailable</h1>
        </header>
        <Card>
          <p>We couldn’t load this member’s profile.</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="member-profile">
      <header className="member-profile__header">
        <Button variant="ghost" onClick={() => navigate(-1)} icon="arrow-left">Back</Button>
      </header>

      <div className="member-profile__grid">

        {/* Left Sidebar: Profile Info */}
        <aside className="member-profile__sidebar">
          <Card className="member-card member-card--hero" variant="glass">
            <Avatar
              src={member?.image || member?.avatarPath}
              name={member?.name || member?.email}
              size="xl"
            />
            <div className="member-hero__text">
              <h1>{member?.name || member?.email || 'Member'}</h1>
              {member?.collegeId && <p className="member-college-id">{member.collegeId.toUpperCase()}</p>}
            </div>

            <div className="member-tags">
              {batchYear && <span className="tag">Batch {batchYear}</span>}
              {member?.branch && <span className="tag">{member.branch}</span>}
              {member?.role && <span className="tag tag--role">{member.role}</span>}
            </div>
          </Card>

          <Card className="member-card">
            <h3>About</h3>
            <p className="member-about">{member?.about || member?.bio || 'No bio available.'}</p>
            <div className="member-details">
              {member?.place && <div className="detail-row"><span>📍</span> {member.place}</div>}
            </div>
          </Card>

          <Card className="member-card">
            <h3>Connect</h3>
            {contactLinks.length > 0 ? (
              <div className="member-links">
                {contactLinks.map(([label, href]) => (
                  <a key={label} href={href} className="link-chip" target="_blank" rel="noreferrer noopener">
                    {label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted">No public links.</p>
            )}
          </Card>
        </aside>

        {/* Right Content: Chat */}
        <div className="member-profile__content">
          <Card className="chat-panel" variant="default" noPadding>
            <header className="chat-panel__header">
              <div className="chat-panel__title">
                <h2>Chat</h2>
                {conversationId && (
                  <div className="chat-panel__actions">
                    {isBlockedByCurrentUser ? (
                      <Button size="sm" variant="secondary" onClick={() => unblockConversationMutation.mutate({ userId })}>Unblock</Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => {
                        const r = prompt('Reason for blocking?');
                        blockConversationMutation.mutate({ reason: r });
                      }}>Block</Button>
                    )}
                  </div>
                )}
              </div>
              {panelStatus && (
                <div className={`panel-status panel-status--${panelStatus.type}`}>
                  {panelStatus.message}
                  <button onClick={() => setPanelStatus(null)}>×</button>
                </div>
              )}
            </header>

            <div className="chat-panel__messages" ref={threadRef}>
              {shouldLoadConversation ? (
                <>
                  {conversationQuery.hasNextPage && (
                    <div className="load-more-container">
                      <Button variant="ghost" size="sm" onClick={handleLoadOlder} loading={conversationQuery.isFetchingNextPage}>
                        Load Older
                      </Button>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div key={msg.id} className={`chat-bubble ${msg.isOwn ? 'own' : 'other'}`}>
                      <p>{msg.body}</p>
                      <time>{formatRelativeTime(msg.createdAt)}</time>
                    </div>
                  ))}
                  {messages.length === 0 && !conversationQuery.isLoading && (
                    <p className="empty-chat">No messages yet.</p>
                  )}
                </>
              ) : (
                <div className="chat-placeholder">
                  <p>Start a conversation with {member?.name?.split(' ')[0] || 'Member'}.</p>
                  <Button variant="secondary" onClick={() => setShouldLoadConversation(true)}>Show Messages</Button>
                </div>
              )}
            </div>

            <form className="chat-panel__composer" onSubmit={handleSubmit}>
              <input
                className="composer-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Type a message..."
                disabled={composerDisabled}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!draft.trim() || sendMessageMutation.isPending || composerDisabled}
                loading={sendMessageMutation.isPending}
                icon="paper-plane"
              />
            </form>
          </Card>
        </div>

      </div>
    </section>
  );
};

export default MemberProfile;
