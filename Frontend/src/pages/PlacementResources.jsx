import React, { useEffect, useMemo, useRef, useState } from 'react';
import './PlacementResources.css';
import { fetchDsaLeaderboard } from '../api/resources';
import {
  addResumeFromPdf,
  askPlacementQuestion,
  deleteResume,
  listResumes
} from '../api/mcp';
import { useAuth } from '../context/AuthContext';

const driveFolder = 'https://drive.google.com/drive/folders/1UlIxN-hqY6FrOlk_9kOJfj3-TvWJL4ru';

const CP_PROFILE_ORDER = ['leetcode', 'codeforces', 'codechef'];

const CP_PROFILE_LABELS = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef'
};

const PROVIDER_PROFILE_ORDER = {
  codeforces: ['codeforces', 'leetcode', 'codechef'],
  leetcode: ['leetcode', 'codeforces', 'codechef']
};

const LEADERBOARD_PROVIDER_META = {
  codeforces: {
    title: 'Codeforces rating leaders',
    description: 'Live snapshot of IIIT Network members climbing the Codeforces ladder.'
  },
  leetcode: {
    title: 'LeetCode contest rating leaders',
    description: 'Top contest performers sharing their LeetCode grind with the community.'
  }
};

const createEmptyProviderData = () => ({ entries: [], totalProfiles: 0 });

const createEmptyLeaderboardState = () => ({
  codeforces: createEmptyProviderData(),
  leetcode: createEmptyProviderData()
});

const toSafeCount = (value, fallback = 0) => {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : fallback;
};

const highlightStats = [
  {
    value: '12+',
    label: 'curated templates',
    blurb: 'ATS-friendly resumes, cover letters, and portfolio samples collected from recent hires.'
  },
  {
    value: '30+',
    label: 'interview drills',
    blurb: 'Topic-wise question sets, mock interview scripts, and whiteboard prompts.'
  },
  {
    value: '8 weeks',
    label: 'structured roadmap',
    blurb: 'Follow a two-month readiness plan tailored for university placements.'
  }
];

const resourceCollections = [
  {
    id: 'resume',
    icon: '🧾',
    title: 'Resume & Portfolio Prep',
    description: 'Polish your profile with proven templates, pitch decks, and storytelling guides.',
    ctaLabel: 'Browse resume toolkit',
    resources: [
      {
        title: 'ATS-ready resume template',
        type: 'Google Docs',
        summary: 'Clean, recruiter-approved template with inline guidance on quantifying impact.',
        link: `${driveFolder}#resume-template`,
        tags: ['resume', 'ats', 'template']
      },
      {
        title: 'Portfolio & GitHub audit checklist',
        type: 'PDF',
        summary: 'Checklist to keep your public work sharp—README structure, project positioning, and accessibility.',
        link: `${driveFolder}#portfolio-checklist`,
        tags: ['portfolio', 'github']
      },
      {
        title: 'Cover letter snippet library',
        type: 'Docs',
        summary: 'Modular paragraphs for quick customization across companies and roles.',
        link: `${driveFolder}#cover-letter-library`,
        tags: ['cover letter', 'communication']
      }
    ]
  },
  {
    id: 'dsa',
    icon: '⚡',
    title: 'DSA & Competitive Programming',
    description: 'Track your progress with live leaderboards and access curated problem sheets.',
    ctaLabel: 'Browse DSA resources',
    resources: [
      {
        title: 'Standard DSA Checklist',
        type: 'PDF',
        summary: 'A comprehensive list of patterns and problems to solve.',
        link: `${driveFolder}#dsa-checklist`,
        tags: ['dsa', 'checklist']
      }
    ]
  }
];



const DEFAULT_RESUME_FORM = {
  email: '',
  name: ''
};

const DEFAULT_ASSISTANT_TOPK = 3;

const RESUME_ASSISTANT_PROMPTS = [
  'Summarize strengths of the frontend candidates in the pool.',
  'Who is the best fit for a data analyst internship and why?',
  'List candidates with Kubernetes or cloud experience.',
  'Compare the top two resumes for backend roles.'
];

const PlacementResources = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState(() => createEmptyLeaderboardState());
  const [leaderboardSummary, setLeaderboardSummary] = useState(null);
  const [leaderboardStatus, setLeaderboardStatus] = useState('idle');
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [resumeForm, setResumeForm] = useState(DEFAULT_RESUME_FORM);
  const [resumes, setResumes] = useState([]);
  const [resumeStatus, setResumeStatus] = useState('idle');
  const [resumeError, setResumeError] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileError, setResumeFileError] = useState(null);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantTopK, setAssistantTopK] = useState(DEFAULT_ASSISTANT_TOPK);
  const [assistantMessages, setAssistantMessages] = useState(() => ([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content: 'Upload resumes to the shared pool, then ask anything. I will answer using the resumes I have access to.'
    }
  ]));
  const [assistantStatus, setAssistantStatus] = useState('idle');
  const [assistantError, setAssistantError] = useState(null);
  const assistantMessagesRef = useRef(null);
  const resolvedEmail = user?.email || resumeForm.email;

  useEffect(() => {
    if (assistantMessagesRef.current) {
      assistantMessagesRef.current.scrollTop = assistantMessagesRef.current.scrollHeight;
    }
  }, [assistantMessages]);

  useEffect(() => {
    if (user?.email) {
      setResumeForm((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadResumes = async () => {
      setResumeStatus('loading');
      setResumeError(null);
      try {
        const payload = await listResumes({ signal: controller.signal });
        if (!isActive) {
          return;
        }
        setResumes(Array.isArray(payload?.resumes) ? payload.resumes : []);
        setResumeStatus('success');
      } catch (error) {
        if (!isActive || error.name === 'AbortError') {
          return;
        }
        setResumeError(error.message || 'Unable to load shared resumes.');
        setResumeStatus('error');
      }
    };

    loadResumes();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const clampNumber = (value, min, max, fallback) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.min(max, Math.max(min, parsed));
    }
    return fallback;
  };

  const toFriendlyError = (error, fallback) => {
    if (!error) return fallback;
    const fromPayload = error?.payload?.message || error?.payload?.detail || error?.payload?.error;
    if (fromPayload) {
      return fromPayload;
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
    if (error.status) {
      return `Request failed (status ${error.status}).`;
    }
    return fallback;
  };

  const refreshResumes = async () => {
    setResumeStatus('loading');
    setResumeError(null);
    try {
      const payload = await listResumes();
      setResumes(Array.isArray(payload?.resumes) ? payload.resumes : []);
      setResumeStatus('success');
    } catch (error) {
      setResumeError(error.message || 'Unable to load shared resumes.');
      setResumeStatus('error');
    }
  };

  const handleResumeSubmit = async (event) => {
    event.preventDefault();
    const email = (resolvedEmail || '').trim();
    const name = (resumeForm.name || user?.name || user?.fullName || '').trim();

    if (!email) {
      setResumeError('Email is required to add a resume.');
      return;
    }

    if (!resumeFile) {
      setResumeError('Please upload a PDF resume.');
      return;
    }

    if (resumeFile && resumeFile.type !== 'application/pdf') {
      setResumeFileError('Please upload a PDF file.');
      return;
    }

    setResumeFileError(null);

    setResumeStatus('submitting');
    setResumeError(null);
    try {
      await addResumeFromPdf({
        file: resumeFile,
        name: name || null,
        email
      });

      setResumeForm({ ...DEFAULT_RESUME_FORM, email: user?.email || '' });
      setResumeFile(null);
      await refreshResumes();
    } catch (error) {
      setResumeError(error.message || 'Could not add the resume right now.');
      setResumeStatus('error');
    }
  };

  const handleAssistantSubmit = async (event) => {
    event.preventDefault();
    const trimmedQuestion = assistantQuestion.trim();

    if (!user) {
      setAssistantError('Sign in to use the resume bot.');
      return;
    }

    if (!trimmedQuestion) {
      setAssistantError('Ask a question so I can search the resume pool.');
      return;
    }

    const topK = clampNumber(assistantTopK, 1, 10, DEFAULT_ASSISTANT_TOPK);
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuestion
    };

    setAssistantMessages((prev) => [...prev, userMessage]);
    setAssistantQuestion('');
    setAssistantStatus('loading');
    setAssistantError(null);

    try {
      const payload = await askPlacementQuestion({
        question: trimmedQuestion,
        topK
      });

      setAssistantMessages((prev) => ([
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: payload?.answer || 'I could not find an answer right now.',
          sources: Array.isArray(payload?.sources) ? payload.sources : []
        }
      ]));
      setAssistantStatus('success');
    } catch (error) {
      setAssistantError(toFriendlyError(error, 'Could not fetch an answer from the resume pool.'));
      setAssistantStatus('error');
    }
  };

  const handleResumeDelete = async (resumeId) => {
    if (!resumeId) {
      return;
    }
    setResumeStatus('deleting');
    setResumeError(null);
    try {
      await deleteResume({ resumeId });
      await refreshResumes();
    } catch (error) {
      setResumeError(error.message || 'Could not remove the resume right now.');
      setResumeStatus('error');
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setLeaderboardStatus('loading');
    setLeaderboardError(null);

    fetchDsaLeaderboard({ signal: controller.signal })
      .then((response) => {
        if (!isActive) {
          return;
        }
        const normaliseProvider = (payload) => {
          const entries = Array.isArray(payload?.entries) ? payload.entries : [];
          return {
            entries,
            totalProfiles: toSafeCount(payload?.totalProfiles, entries.length)
          };
        };

        const nextData = {
          codeforces: normaliseProvider(response?.leaderboard?.codeforces),
          leetcode: normaliseProvider(response?.leaderboard?.leetcode)
        };

        setLeaderboardData(nextData);
        setLeaderboardSummary({
          generatedAt: response?.generatedAt ?? null,
          summary: response?.summary ?? null
        });
        setLeaderboardStatus('success');
      })
      .catch((error) => {
        if (!isActive || error.name === 'AbortError') {
          return;
        }
        setLeaderboardError(error.message || 'Unable to load the leaderboard right now.');
        setLeaderboardStatus('error');
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const leaderboardSections = useMemo(
    () => Object.entries(leaderboardData).map(([provider, payload]) => {
      const meta = LEADERBOARD_PROVIDER_META[provider] || {
        title: `${provider} leaderboard`,
        description: ''
      };
      const entries = Array.isArray(payload?.entries) ? payload.entries : [];
      return {
        provider,
        ...meta,
        entries,
        totalProfiles: toSafeCount(payload?.totalProfiles, entries.length)
      };
    }),
    [leaderboardData]
  );

  const hasAnyLeaderboardEntries = useMemo(
    () => leaderboardSections.some((section) => section.entries.length > 0),
    [leaderboardSections]
  );

  const leaderboardRefreshLabel = useMemo(() => {
    if (!leaderboardSummary?.generatedAt) {
      return null;
    }
    const timestamp = new Date(leaderboardSummary.generatedAt);
    if (Number.isNaN(timestamp.getTime())) {
      return null;
    }
    return timestamp.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }, [leaderboardSummary?.generatedAt]);

  const linkedProfilesLabel = useMemo(() => {
    const summary = leaderboardSummary?.summary;
    if (!summary) {
      return null;
    }

    const parts = [];
    const codeforcesProfiles = toSafeCount(summary?.codeforces?.totalProfiles);
    const leetcodeProfiles = toSafeCount(summary?.leetcode?.totalProfiles);

    if (codeforcesProfiles > 0) {
      parts.push(`Codeforces ${codeforcesProfiles}`);
    }
    if (leetcodeProfiles > 0) {
      parts.push(`LeetCode ${leetcodeProfiles}`);
    }

    if (parts.length === 0) {
      return null;
    }

    return `Profiles linked · ${parts.join(' • ')}`;
  }, [leaderboardSummary?.summary]);

  const isResumeBusy = useMemo(
    () => ['loading', 'submitting', 'deleting'].includes(resumeStatus),
    [resumeStatus]
  );

  return (
    <div className="placement-page">
      <section className="placement-hero" aria-labelledby="placement-hero-title">
        <div className="placement-hero__intro">
          <p className="placement-hero__eyebrow">placements · readiness stack</p>
          <h1 id="placement-hero-title">Everything you need for campus placements, curated in one drive</h1>
          <p>
            Explore templates, problem sets, mock interview scripts, and roadmaps contributed by IIIT Network mentors and alumni. The resources below mirror the organisation inside the Drive folder so you can jump straight to what you need.
          </p>
          <div className="placement-hero__actions">
            <a className="primary" href={driveFolder} target="_blank" rel="noopener noreferrer">
              Open resource drive
            </a>
            <a className="ghost" href={`${driveFolder}#placement-checklist`} target="_blank" rel="noopener noreferrer">
              Download 8-week checklist
            </a>
          </div>
          <small className="placement-hero__hint">Bookmark the Drive folder and follow the roadmap below for a steady prep cadence.</small>
        </div>
        <div className="placement-hero__stats" role="list">
          {highlightStats.map((stat) => (
            <article key={stat.label} role="listitem">
              <span className="placement-hero__value">{stat.value}</span>
              <span className="placement-hero__label">{stat.label}</span>
              <p>{stat.blurb}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mcp-assistant" aria-labelledby="mcp-assistant-heading">
        <header className="mcp-assistant__header">
          <div>
            <p className="mcp-assistant__eyebrow">IIIT Network resume pool</p>
            <h2 id="mcp-assistant-heading">Share your resume with the community</h2>
            <p>Publish your resume so peers and mentors can discover profiles easily. Upload a PDF or add details, then ask the bot questions grounded in this pool.</p>
          </div>
        </header>

        <article className="mcp-card mcp-card--wide resume-assistant">
          <header className="mcp-card__header">
            <div>
              <p className="mcp-card__eyebrow">Resume assistant</p>
              <h3>Add resumes and ask the bot</h3>
              <p>Upload your PDF or add details so others can browse profiles and get grounded answers.</p>
            </div>
            <div className="resume-assistant__badges">
              <span className="status-pill status-pill--muted">{`${resumes.length} resumes indexed`}</span>
              <button
                type="button"
                className="ghost"
                onClick={refreshResumes}
                disabled={isResumeBusy}
              >
                {resumeStatus === 'loading' ? 'Refreshing…' : 'Refresh pool'}
              </button>
            </div>
            {user && (
              <div className="resume-assistant__panel resume-assistant__panel--chat">
                <div className="resume-chat__header">
                  <div>
                    <p className="mcp-card__eyebrow">Ask the resume bot</p>
                    <h4>Grounded answers from the pool</h4>
                    <p className="mcp-assistant__hint">The bot will cite which resumes were used to answer.</p>
                  </div>
                  <div className="resume-chat__meta">
                    <span className="status-pill status-pill--muted">Top {assistantTopK || DEFAULT_ASSISTANT_TOPK} sources</span>
                  </div>
                </div>

                <div className="resume-chat__samples" aria-label="Suggested prompts">
                  {RESUME_ASSISTANT_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="ghost"
                      onClick={() => setAssistantQuestion(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="resume-chat__shell">
                  <div className="resume-chat__messages" ref={assistantMessagesRef} aria-live="polite">
                    {assistantMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`resume-chat__message resume-chat__message--${message.role}`}
                      >
                        <div className="resume-chat__role">{message.role === 'assistant' ? 'Assistant' : 'You'}</div>
                        <p className="resume-chat__body">{message.content}</p>
                        {Array.isArray(message.sources) && message.sources.length > 0 && (
                          <div className="resume-chat__sources">
                            {message.sources.map((source) => (
                              <span key={source.id} className="resume-chat__source-chip">
                                {source.name}
                                {source.role && <span className="resume-chat__source-role"> · {source.role}</span>}
                                {Array.isArray(source.skills) && source.skills.length > 0 && (
                                  <span className="resume-chat__source-skills"> — {source.skills.join(', ')}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                    {assistantStatus === 'loading' && (
                      <article className="resume-chat__message resume-chat__message--assistant resume-chat__message--pending">
                        <div className="resume-chat__role">Assistant</div>
                        <p className="resume-chat__body">Thinking with the resume pool…</p>
                      </article>
                    )}
                  </div>

                  {assistantError && <p className="mcp-error">{assistantError}</p>}

                  <form className="resume-chat__composer" onSubmit={handleAssistantSubmit}>
                    <label className="sr-only" htmlFor="assistant-question">Ask a question</label>
                    <textarea
                      id="assistant-question"
                      rows="3"
                      value={assistantQuestion}
                      onChange={(event) => setAssistantQuestion(event.target.value)}
                      placeholder="Ask anything about the resumes in the pool…"
                    />
                    <div className="resume-chat__controls">
                      <div className="mcp-inline-fields">
                        <label htmlFor="assistant-topk">Sources to cite</label>
                        <input
                          id="assistant-topk"
                          type="number"
                          min="1"
                          max="10"
                          value={assistantTopK}
                          onChange={(event) => setAssistantTopK(event.target.value)}
                        />
                      </div>
                      <button className="primary" type="submit" disabled={assistantStatus === 'loading'}>
                        {assistantStatus === 'loading' ? 'Working…' : 'Ask the bot'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </header>

          <div className="resume-assistant__grid">
            <div className="resume-assistant__panel resume-assistant__panel--pool">
              <div className="resume-pool__summary">
                <p>Upload a PDF to make it searchable. Only your email is required; we will not show the full resume text.</p>
                {resumeStatus === 'error' && resumeError && <p className="mcp-error">{resumeError}</p>}
                {resumeStatus === 'loading' && <p className="mcp-inline-status">Loading current pool…</p>}
              </div>

              <form className="mcp-form mcp-form--grid resume-pool__form" onSubmit={handleResumeSubmit}>
                <label htmlFor="resume-email">Email</label>
                <input
                  id="resume-email"
                  type="email"
                  value={resolvedEmail}
                  onChange={user ? undefined : ((event) => setResumeForm({ ...resumeForm, email: event.target.value }))}
                  readOnly={!!user}
                  placeholder={user ? 'Using your account email' : 'name@example.com'}
                />
                <label htmlFor="resume-file">Upload PDF</label>
                <input
                  id="resume-file"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                />
                <div className="mcp-actions">
                  <button className="primary" type="submit" disabled={isResumeBusy}>
                    {resumeStatus === 'submitting' ? 'Saving…' : 'Upload to pool'}
                  </button>
                  {resumeError && <span className="mcp-error">{resumeError}</span>}
                  {resumeFileError && <span className="mcp-error">{resumeFileError}</span>}
                </div>
              </form>

              <div className="mcp-resume-list" aria-live="polite">
                {resumeStatus !== 'loading' && resumes.length === 0 && (
                  <p className="mcp-inline-status">No resumes added yet. Be the first to publish.</p>
                )}
                {resumes.length > 0 && (
                  <div className="mcp-resume-grid">
                    {resumes.map((resume) => (
                      <article key={resume.id} className="mcp-resume-chip">
                        <div className="mcp-resume-chip__top">
                          <div>
                            <h5>{resume.name || 'Resume added'}</h5>
                            <p>{resume.email}</p>
                          </div>
                        </div>
                        <p className="mcp-resume-chip__summary">Email captured. Resume stored securely.</p>
                        <div className="mcp-resume-chip__actions">
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => handleResumeDelete(resume.id)}
                            disabled={isResumeBusy}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="resource-collections" aria-labelledby="resource-collections-heading">
        <header>
          <h2 id="resource-collections-heading">Resource collections</h2>
          <p>Jump into the collections that map directly to the Drive sub-folders. Each card highlights what you will find and suggests how to use it.</p>
        </header>
        {resourceCollections.map((collection) => (
          <article key={collection.id} className="resource-collection" aria-labelledby={`collection-${collection.id}`}>
            <div className="resource-collection__intro">
              <span className="resource-collection__icon" aria-hidden>{collection.icon}</span>
              <div>
                <h3 id={`collection-${collection.id}`}>{collection.title}</h3>
                <p>{collection.description}</p>
              </div>
              <a
                className="ghost"
                href={collection.resources[0]?.link || driveFolder}
                target="_blank"
                rel="noopener noreferrer"
              >
                {collection.ctaLabel}
              </a>
            </div>
            {collection.id === 'dsa' && (
              <div className="dsa-leaderboard" role="region" aria-live="polite">
                <div className="dsa-leaderboard__header">
                  <h4>IIIT Network CP leaderboards</h4>
                  <p>Live ratings pulled directly from Codeforces and LeetCode profiles shared by the community.</p>
                  {leaderboardRefreshLabel && (
                    <span className="dsa-leaderboard__timestamp">Updated {leaderboardRefreshLabel}</span>
                  )}
                  {linkedProfilesLabel && (
                    <span className="dsa-leaderboard__meta">{linkedProfilesLabel}</span>
                  )}
                </div>

                {leaderboardStatus === 'loading' && (
                  <p className="dsa-leaderboard__status">Loading leaderboard…</p>
                )}

                {leaderboardStatus === 'error' && (
                  <p className="dsa-leaderboard__status dsa-leaderboard__status--error">
                    {leaderboardError || 'Unable to load the leaderboard right now.'}
                  </p>
                )}

                {leaderboardStatus === 'success' && (
                  <div className="dsa-leaderboard__lists">
                    {leaderboardSections.map((section) => {
                      const profileOrder = PROVIDER_PROFILE_ORDER[section.provider] || CP_PROFILE_ORDER;
                      const emptyMessage = section.provider === 'codeforces'
                        ? 'Link your Codeforces handle in your IIIT Network profile to appear on this board.'
                        : 'Link your LeetCode username in your IIIT Network profile to appear on this board.';

                      return (
                        <section
                          key={section.provider}
                          className="leaderboard-section"
                          aria-labelledby={`leaderboard-${section.provider}`}
                        >
                          <div className="leaderboard-section__header">
                            <h5 id={`leaderboard-${section.provider}`}>{section.title}</h5>
                            {section.description && <p>{section.description}</p>}
                            {section.totalProfiles > 0 && (
                              <span className="leaderboard-section__meta">
                                {`Profiles linked: ${section.totalProfiles}`}
                              </span>
                            )}
                          </div>

                          {section.entries.length === 0 ? (
                            <p className="leaderboard-section__empty">{emptyMessage}</p>
                          ) : (
                            <ol className="leaderboard-list">
                              {section.entries.map((entry) => {
                                const itemKey = entry.userId || `${section.provider}-${entry.rank}-${entry.handle || entry.name}`;
                                const subtitle = entry.subtitle
                                  || (entry.handle ? `@${entry.handle}` : null)
                                  || 'IIIT Network member';
                                const stats = Array.isArray(entry.stats) ? entry.stats : [];
                                const solvedStat = stats.find((stat) => stat?.label === 'Solved');
                                const rankStat = stats.find((stat) => stat?.label === 'Rank');

                                let primaryLabel = entry.ratingLabel || 'Rating';
                                let primaryValueText = '—';

                                if (Number.isFinite(entry.rating)) {
                                  primaryValueText = entry.rating.toLocaleString();
                                } else if (solvedStat && solvedStat.value != null) {
                                  const solvedValue = Number.isFinite(solvedStat.value)
                                    ? solvedStat.value
                                    : Number(solvedStat.value);
                                  primaryLabel = 'Questions solved';
                                  primaryValueText = Number.isFinite(solvedValue)
                                    ? solvedValue.toLocaleString()
                                    : String(solvedStat.value);
                                } else if (rankStat && rankStat.value != null) {
                                  const rankValue = Number.isFinite(rankStat.value)
                                    ? rankStat.value
                                    : Number(rankStat.value);
                                  primaryLabel = 'Global rank';
                                  primaryValueText = Number.isFinite(rankValue)
                                    ? `#${rankValue.toLocaleString()}`
                                    : `#${rankStat.value}`;
                                }

                                const secondaryStats = stats.filter((stat) => {
                                  if (!stat) {
                                    return false;
                                  }
                                  if (primaryLabel === 'Questions solved' && stat.label === 'Solved') {
                                    return false;
                                  }
                                  if (primaryLabel === 'Global rank' && stat.label === 'Rank') {
                                    return false;
                                  }
                                  return true;
                                });

                                return (
                                  <li key={itemKey} className="leaderboard-item">
                                    <div className="leaderboard-item__top">
                                      <span className="leaderboard-item__rank" aria-hidden>#{entry.rank}</span>
                                      <div className="leaderboard-item__identity">
                                        <h5>{entry.name}</h5>
                                        <p>{subtitle}</p>
                                      </div>
                                      <div className="leaderboard-item__score">
                                        <strong>{primaryValueText}</strong>
                                        <span>{primaryLabel}</span>
                                        {secondaryStats.map((stat) => {
                                          if (!stat) {
                                            return null;
                                          }
                                          const rawValue = stat.value ?? stat.count;
                                          if (rawValue === undefined || rawValue === null || rawValue === '') {
                                            return null;
                                          }
                                          const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
                                          const isNumeric = Number.isFinite(numericValue);
                                          const valueText = isNumeric
                                            ? stat.label.includes('%')
                                              ? `${numericValue}%`
                                              : numericValue.toLocaleString()
                                            : String(rawValue);

                                          return (
                                            <span
                                              key={`${stat.label}-${valueText}`}
                                              className="leaderboard-item__score-sub"
                                            >
                                              {`${stat.label}: ${valueText}`}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    {entry.highlight && (
                                      <p className="leaderboard-item__highlight">{entry.highlight}</p>
                                    )}
                                    <div
                                      className="leaderboard-item__links"
                                      aria-label={`Competitive programming profiles for ${entry.name}`}
                                    >
                                      {profileOrder.map((key) => {
                                        const href = entry.profiles?.[key];
                                        if (!href) {
                                          return null;
                                        }
                                        return (
                                          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
                                            {CP_PROFILE_LABELS[key]} ↗
                                          </a>
                                        );
                                      })}
                                      {(!entry.profiles || profileOrder.every((key) => !entry.profiles?.[key])) && (
                                        <span className="leaderboard-item__links--placeholder">
                                          Add your CP profiles from the IIIT Network profile page
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}

                {leaderboardStatus === 'success' && !hasAnyLeaderboardEntries && (
                  <p className="dsa-leaderboard__status">
                    Leaderboard updates will appear once members link their CP profiles.
                  </p>
                )}
              </div>
            )}
            <div className="resource-collection__grid">
              {collection.resources.map((resource) => (
                <article key={resource.title} className="resource-card">
                  <div className="resource-card__meta">
                    <span className="resource-card__type">{resource.type}</span>
                    <div className="resource-card__tags" aria-label="Resource tags">
                      {resource.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <h4>{resource.title}</h4>
                  <p>{resource.summary}</p>
                  <a
                    className="resource-card__link"
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View resource ↗
                  </a>
                </article>
              ))}
            </div>
          </article>
        ))}
      </section>


    </div>
  );
};

export default PlacementResources;
