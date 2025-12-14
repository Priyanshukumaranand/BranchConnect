import React, { useEffect, useMemo, useState } from 'react';
import './PlacementResources.css';
import { fetchDsaLeaderboard } from '../api/resources';
import {
  addResume,
  addResumeFromPdf,
  askPlacementQuestion,
  deleteResume,
  fetchMcpHealth,
  listResumes,
  recommendTeammate,
  MCP_API_BASE_URL
} from '../api/mcp';

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
    description: 'Live snapshot of Branch Connect members climbing the Codeforces ladder.'
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
    blurb: 'Follow a two-month readiness plan tailored for computer engineering placements.'
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
    icon: '🧠',
    title: 'Problem-solving & DSA',
    description: 'Strengthen your data structures, algorithms, and contest strategies with structured practice sets.',
    ctaLabel: 'Open DSA hub',
    resources: [
      {
        title: 'Patterns-first question bank',
        type: 'Google Sheets',
        summary: 'Topic-tagged problems grouped by company and difficulty; track your progress live.',
        link: `${driveFolder}#dsa-patterns`,
        tags: ['arrays', 'dynamic programming', 'graphs']
      },
      {
        title: 'Weekend mock contest kit',
        type: 'PDF',
        summary: 'Two curated 90-minute contests with editorials and brute-force to optimal walkthroughs.',
        link: `${driveFolder}#mock-contests`,
        tags: ['mock', 'contest', 'editorials']
      },
      {
        title: 'Revision flashcards (Cheatsheets)',
        type: 'Notion',
        summary: 'Handy big-O cheats, recursion reminders, and trick-edge-case lists for rapid revision.',
        link: `${driveFolder}#revision-cards`,
        tags: ['revision', 'flashcards']
      }
    ]
  },
  {
    id: 'behavioural',
    icon: '💬',
    title: 'Behavioural & HR readiness',
    description: 'Craft confident narratives for “Tell me about yourself” and behavioral deep-dives.',
    ctaLabel: 'Practice soft skills',
    resources: [
      {
        title: 'STAR story workbook',
        type: 'Google Docs',
        summary: 'Prompt-driven journal to map achievements into Situation-Task-Action-Result stories.',
        link: `${driveFolder}#star-workbook`,
        tags: ['behavioural', 'storytelling']
      },
      {
        title: 'HR one-pager quick responses',
        type: 'PDF',
        summary: 'Ready-to-tailor answers for strengths, weaknesses, relocation, and compensation questions.',
        link: `${driveFolder}#hr-answers`,
        tags: ['hr', 'interview']
      },
      {
        title: 'Peer mock interview script',
        type: 'Docs',
        summary: '30-minute peer-interview flow with score rubric and feedback prompts.',
        link: `${driveFolder}#peer-mock`,
        tags: ['mock interview', 'feedback']
      }
    ]
  },
  {
    id: 'system',
    icon: '🛠️',
    title: 'Projects & System Design',
    description: 'Upgrade your project storytelling and system design thinking with templates and diagrams.',
    ctaLabel: 'Explore build track',
    resources: [
      {
        title: 'Project deep-dive template deck',
        type: 'Google Slides',
        summary: 'Pitch-ready slide deck format to articulate problem, architecture, metrics, and learning.',
        link: `${driveFolder}#project-deck`,
        tags: ['projects', 'presentation']
      },
      {
        title: 'System design primer for campus roles',
        type: 'PDF',
        summary: 'Lightweight system design syllabus focused on SDE-1 interview expectations.',
        link: `${driveFolder}#system-design`,
        tags: ['system design', 'architecture']
      },
      {
        title: 'Project retrospective worksheet',
        type: 'Docs',
        summary: 'Reflect on outcomes, failures, and iteration loops to answer “what would you do differently?”.',
        link: `${driveFolder}#retro`,
        tags: ['reflection', 'growth']
      }
    ]
  }
];

const timelineMilestones = [
  {
    period: 'Weeks 1-2',
    focus: 'Baseline & Resume Sprint',
    actions: [
      'Audit your resume using the Resume Toolkit and circulate for mentor feedback.',
      'Pick one flagship project and build the project deep-dive deck outline.',
      'Book two mock HR conversations to warm up your storytelling game.'
    ]
  },
  {
    period: 'Weeks 3-4',
    focus: 'DSA Rhythm & Mock Interviews',
    actions: [
      'Solve at least 20 questions from two different DSA patterns and log reflections in the sheet.',
      'Run one weekend mock contest and review the editorial solutions the next day.',
      'Schedule a peer mock using the script; focus on structuring your thought process aloud.'
    ]
  },
  {
    period: 'Weeks 5-6',
    focus: 'Projects & System Design',
    actions: [
      'Ship a minor feature or fix on an existing project and update the case-study deck.',
      'Review the system design primer and draft solutions for two prompt scenarios.',
      'Record a 5-minute project walkthrough to spot clarity gaps in your explanation.'
    ]
  },
  {
    period: 'Weeks 7-8',
    focus: 'Company-Specific Prep & Final Polish',
    actions: [
      'Shortlist top companies; align your problem bank to their interview style.',
      'Refresh HR answers and align stories with company values.',
      'Complete a final resume pass and store PDF versions tailored per company bucket.'
    ]
  }
];

const faqItems = [
  {
    question: 'How should I prioritize the resources in the Drive folder?',
    answer:
      'Start with the Resume Toolkit to establish a strong baseline, then move into the DSA hub for daily problem practice. Once you have a rhythm, rotate through behavioural and system design resources each week so every track progresses together.'
  },
  {
    question: 'Can I contribute additional sheets or notes?',
    answer:
      'Absolutely. Create a subfolder with your batch name or tag your document clearly, then share it with the coordinators. We review weekly and merge high-quality additions into the main collections.'
  },
  {
    question: 'How often are the resources refreshed?',
    answer:
      'Community volunteers update the drive after every major placement season. You can always check the resource changelog inside the drive for timestamps and editors.'
  },
  {
    question: 'What if I only have four weeks before interviews?',
    answer:
      'Compress the roadmap by focusing on resume polish and targeted DSA practice (top patterns + company past questions). Use the mock interview script twice a week and prioritize storytelling prep for fast confidence wins.'
  }
];

const supportChannels = [
  {
    title: 'Weekly focus sessions',
    detail: 'Join Friday syncs to share blockers, new resources, and interview learnings with peers.',
    action: {
      label: 'Check meeting calendar',
      link: driveFolder
    }
  },
  {
    title: 'Mentor office hours',
    detail: 'Book 1:1 time with alumni mentors for resume critique or mock interview dry runs.',
    action: {
      label: 'See mentor roster',
      link: driveFolder
    }
  },
  {
    title: 'Resource request form',
    detail: 'Missing a company sheet or topic summary? Submit a request and we will add it to the pipeline.',
    action: {
      label: 'Request a resource',
      link: driveFolder
    }
  }
];

const practicePlatforms = [
  {
    id: 'gfg',
    name: 'GeeksforGeeks',
    icon: '🧩',
    description:
      'Topic-wise problem sets, company archives, and detailed editorials that mirror common campus interview rounds.',
    link: 'https://www.geeksforgeeks.org/explore?page=1&category=Placement%20series',
    highlights: ['Complete SDE sheet', 'Company interview archives', 'Daily revision problems']
  },
  {
    id: 'leetcode',
    name: 'LeetCode',
    icon: '🧠',
    description:
      'Refine problem-solving patterns with curated playlists and timed contests that strengthen analytical speed.',
    link: 'https://leetcode.com/explore/interview/card/top-interview-questions-easy/',
    highlights: ['Top interview question sets', 'Timed weekly contests', 'Company tagged questions']
  },
  {
    id: 'interviewbit',
    name: 'InterviewBit',
    icon: '🚀',
    description:
      'Structured track that blends bite-sized tutorials with checkpoint problems for quick revision before interviews.',
    link: 'https://www.interviewbit.com/courses/programming/',
    highlights: ['Structured learning paths', 'Checkpoint quizzes', 'Behavioral question bank']
  }
];

const DEFAULT_QA_FORM = {
  question: '',
  topK: 3
};

const DEFAULT_RECOMMENDATION_FORM = {
  role: 'Software Engineer - SDE 1',
  skills: 'javascript, react, node, sql',
  summary: '',
  topK: 8
};

const DEFAULT_RESUME_FORM = {
  name: '',
  email: '',
  role: '',
  skills: '',
  experience: '',
  summary: ''
};

const PlacementResources = () => {
  const [leaderboardData, setLeaderboardData] = useState(() => createEmptyLeaderboardState());
  const [leaderboardSummary, setLeaderboardSummary] = useState(null);
  const [leaderboardStatus, setLeaderboardStatus] = useState('idle');
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [healthStatus, setHealthStatus] = useState('idle');
  const [healthPayload, setHealthPayload] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [qaForm, setQaForm] = useState(DEFAULT_QA_FORM);
  const [qaResult, setQaResult] = useState(null);
  const [qaStatus, setQaStatus] = useState('idle');
  const [qaError, setQaError] = useState(null);
  const [recommendationForm, setRecommendationForm] = useState(DEFAULT_RECOMMENDATION_FORM);
  const [recommendationResult, setRecommendationResult] = useState(null);
  const [recommendationStatus, setRecommendationStatus] = useState('idle');
  const [recommendationError, setRecommendationError] = useState(null);
  const [resumeForm, setResumeForm] = useState(DEFAULT_RESUME_FORM);
  const [resumes, setResumes] = useState([]);
  const [resumeStatus, setResumeStatus] = useState('idle');
  const [resumeError, setResumeError] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileError, setResumeFileError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadHealth = async () => {
      setHealthStatus('loading');
      setHealthError(null);
      try {
        const payload = await fetchMcpHealth({ signal: controller.signal });
        if (!isActive) {
          return;
        }
        setHealthPayload(payload);
        setHealthStatus('success');
      } catch (error) {
        if (!isActive || error.name === 'AbortError') {
          return;
        }
        setHealthError(error.message || 'Unable to reach the MCP resume API.');
        setHealthStatus('error');
      }
    };

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

    loadHealth();
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

  const parseSkillsInput = (value) => value.split(',').map((skill) => skill.trim()).filter(Boolean);

  const refreshHealth = async () => {
    setHealthStatus('loading');
    setHealthError(null);
    try {
      const payload = await fetchMcpHealth();
      setHealthPayload(payload);
      setHealthStatus('success');
    } catch (error) {
      setHealthError(error.message || 'Unable to reach the MCP resume API.');
      setHealthStatus('error');
    }
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

  const handleQaSubmit = async (event) => {
    event.preventDefault();
    const trimmedQuestion = qaForm.question.trim();
    if (!trimmedQuestion) {
      setQaError('Please enter a question for the placement knowledge base.');
      return;
    }
    setQaStatus('loading');
    setQaError(null);
    try {
      const payload = await askPlacementQuestion({
        question: trimmedQuestion,
        topK: clampNumber(qaForm.topK, 1, 10, DEFAULT_QA_FORM.topK)
      });
      setQaResult(payload);
      setQaStatus('success');
    } catch (error) {
      setQaError(error.message || 'Could not fetch an answer right now.');
      setQaStatus('error');
    }
  };

  const handleRecommendationSubmit = async (event) => {
    event.preventDefault();
    const role = recommendationForm.role.trim();
    if (!role) {
      setRecommendationError('Add a target role to get a recommendation.');
      return;
    }

    const skills = parseSkillsInput(recommendationForm.skills);
    const summary = recommendationForm.summary.trim();

    setRecommendationStatus('loading');
    setRecommendationError(null);
    try {
      const payload = await recommendTeammate({
        role,
        skills,
        summary,
        topK: clampNumber(recommendationForm.topK, 1, 20, DEFAULT_RECOMMENDATION_FORM.topK)
      });
      setRecommendationResult(payload);
      setRecommendationStatus('success');
    } catch (error) {
      setRecommendationError(error.message || 'Unable to fetch a recommendation right now.');
      setRecommendationStatus('error');
    }
  };

  const handleResumeSubmit = async (event) => {
    event.preventDefault();
    const name = resumeForm.name.trim();
    const email = resumeForm.email.trim();
    const role = resumeForm.role.trim();
    const experience = resumeForm.experience.trim();
    const summary = resumeForm.summary.trim();
    const skills = parseSkillsInput(resumeForm.skills);

    if (!name || !email || !experience || !summary) {
      setResumeError('Name, email, experience, and summary are required to add a resume.');
      return;
    }

    if (resumeFile && resumeFile.type !== 'application/pdf') {
      setResumeFileError('Please upload a PDF file.');
      return;
    }

    setResumeFileError(null);

    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `resume-${Date.now()}`;

    setResumeStatus('submitting');
    setResumeError(null);
    try {
      if (resumeFile) {
        await addResumeFromPdf({
          file: resumeFile,
          name,
          email,
          role,
          skills: skills.join(', '),
          experience,
          summary
        });
      } else {
        await addResume({
          resume: {
            id,
            name,
            email,
            role: role || null,
            skills,
            experience,
            summary
          }
        });
      }

      setResumeForm(DEFAULT_RESUME_FORM);
      setResumeFile(null);
      await refreshResumes();
    } catch (error) {
      setResumeError(error.message || 'Could not add the resume right now.');
      setResumeStatus('error');
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

  const healthBadge = useMemo(() => {
    if (healthStatus === 'success') {
      return { tone: 'success', label: 'MCP API online' };
    }
    if (healthStatus === 'error') {
      return { tone: 'error', label: 'MCP API unreachable' };
    }
    if (healthStatus === 'loading') {
      return { tone: 'pending', label: 'Checking MCP API…' };
    }
    return { tone: 'muted', label: 'MCP API status unknown' };
  }, [healthStatus]);

  const isResumeBusy = useMemo(
    () => ['loading', 'submitting', 'deleting'].includes(resumeStatus),
    [resumeStatus]
  );

  const qaSources = useMemo(
    () => (Array.isArray(qaResult?.sources) ? qaResult.sources : []),
    [qaResult?.sources]
  );

  const recommendationCandidate = recommendationResult?.best_match?.candidate;

  return (
    <div className="placement-page">
      <section className="placement-hero" aria-labelledby="placement-hero-title">
        <div className="placement-hero__intro">
          <p className="placement-hero__eyebrow">placements · readiness stack</p>
          <h1 id="placement-hero-title">Everything you need for campus placements, curated in one drive</h1>
          <p>
            Explore templates, problem sets, mock interview scripts, and roadmaps contributed by Branch Connect mentors and alumni. The resources below mirror the organisation inside the Drive folder so you can jump straight to what you need.
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
            <p className="mcp-assistant__eyebrow">branchbase × mcp resume engine</p>
            <h2 id="mcp-assistant-heading">Placement assistant (live API)</h2>
            <p>
              Interact with the deployed MCP Resume Engine to ask prep questions, test teammate matches, and share resumes with the pool.
              All requests are sent to
              {' '}
              <a href={MCP_API_BASE_URL} target="_blank" rel="noopener noreferrer">{MCP_API_BASE_URL}</a>
              {' '}in real time.
            </p>
          </div>
          <div className="mcp-assistant__statusbar">
            <span className={`status-pill status-pill--${healthBadge.tone}`}>{healthBadge.label}</span>
            <button type="button" className="ghost" onClick={refreshHealth} disabled={healthStatus === 'loading'}>
              {healthStatus === 'loading' ? 'Checking…' : 'Refresh status'}
            </button>
            {healthPayload && (
              <span className="mcp-assistant__hint">
                {healthPayload.status || 'Healthy response received.'}
              </span>
            )}
            {healthError && <span className="mcp-error">{healthError}</span>}
          </div>
        </header>

        <div className="mcp-grid">
          <article className="mcp-card">
            <header className="mcp-card__header">
              <div>
                <p className="mcp-card__eyebrow">Knowledge base QA</p>
                <h3>Ask a placement question</h3>
                <p>Get a synthesized answer with supporting resumes and notes from the MCP knowledge base.</p>
              </div>
            </header>
            <form className="mcp-form" onSubmit={handleQaSubmit}>
              <label htmlFor="qa-question">Question</label>
              <textarea
                id="qa-question"
                rows="3"
                value={qaForm.question}
                onChange={(event) => setQaForm({ ...qaForm, question: event.target.value })}
                placeholder="e.g., How do I explain load balancers in a systems round?"
              />
              <div className="mcp-inline-fields">
                <label htmlFor="qa-topk">Top sources</label>
                <input
                  id="qa-topk"
                  type="number"
                  min="1"
                  max="10"
                  value={qaForm.topK}
                  onChange={(event) => setQaForm({ ...qaForm, topK: event.target.value })}
                />
              </div>
              <div className="mcp-actions">
                <button className="primary" type="submit" disabled={qaStatus === 'loading'}>
                  {qaStatus === 'loading' ? 'Fetching answer…' : 'Get answer'}
                </button>
                {qaStatus === 'loading' && <span className="mcp-inline-status">Talking to MCP…</span>}
              </div>
              {qaError && <p className="mcp-error">{qaError}</p>}
            </form>
            {qaStatus === 'success' && qaResult && (
              <div className="mcp-result" aria-live="polite">
                <h4>Answer</h4>
                <p className="mcp-result__answer">{qaResult.answer}</p>
                {qaSources.length > 0 && (
                  <div className="mcp-result__sources">
                    <h5>Sources</h5>
                    <ul>
                      {qaSources.map((source) => (
                        <li key={source.id}>
                          <strong>{source.name}</strong>
                          {source.role && <span className="mcp-source__role"> · {source.role}</span>}
                          {Array.isArray(source.skills) && source.skills.length > 0 && (
                            <span className="mcp-source__skills"> — {source.skills.join(', ')}</span>
                          )}
                          {source.summary && <div className="mcp-source__summary">{source.summary}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </article>

          <article className="mcp-card">
            <header className="mcp-card__header">
              <div>
                <p className="mcp-card__eyebrow">Teammate finder</p>
                <h3>Get a match for a role</h3>
                <p>Describe the target role and skills; the MCP recommender will rank the closest resume.</p>
              </div>
            </header>
            <form className="mcp-form" onSubmit={handleRecommendationSubmit}>
              <label htmlFor="reco-role">Target role</label>
              <input
                id="reco-role"
                type="text"
                value={recommendationForm.role}
                onChange={(event) => setRecommendationForm({ ...recommendationForm, role: event.target.value })}
                placeholder="e.g., Backend Intern, ML Engineer"
              />
              <label htmlFor="reco-skills">Skills to prioritize</label>
              <input
                id="reco-skills"
                type="text"
                value={recommendationForm.skills}
                onChange={(event) => setRecommendationForm({ ...recommendationForm, skills: event.target.value })}
                placeholder="comma-separated, e.g., go, redis, kubernetes"
              />
              <label htmlFor="reco-summary">Context / summary</label>
              <textarea
                id="reco-summary"
                rows="3"
                value={recommendationForm.summary}
                onChange={(event) => setRecommendationForm({ ...recommendationForm, summary: event.target.value })}
                placeholder="Include project domain or interview round focus."
              />
              <div className="mcp-inline-fields">
                <label htmlFor="reco-topk">Evaluate top</label>
                <input
                  id="reco-topk"
                  type="number"
                  min="1"
                  max="20"
                  value={recommendationForm.topK}
                  onChange={(event) => setRecommendationForm({ ...recommendationForm, topK: event.target.value })}
                />
              </div>
              <div className="mcp-actions">
                <button className="primary" type="submit" disabled={recommendationStatus === 'loading'}>
                  {recommendationStatus === 'loading' ? 'Scoring…' : 'Get recommendation'}
                </button>
                {recommendationStatus === 'loading' && <span className="mcp-inline-status">Running reranker…</span>}
              </div>
              {recommendationError && <p className="mcp-error">{recommendationError}</p>}
            </form>
            {recommendationStatus === 'success' && recommendationResult?.best_match && (
              <div className="mcp-result" aria-live="polite">
                <div className="mcp-score">
                  <span className="mcp-score__value">{recommendationResult.best_match.match_score?.toFixed?.(2) ?? recommendationResult.best_match.match_score}</span>
                  <span className="mcp-score__label">match score</span>
                  {Array.isArray(recommendationResult.best_match.matching_skills) && recommendationResult.best_match.matching_skills.length > 0 && (
                    <span className="mcp-score__skills">Matches: {recommendationResult.best_match.matching_skills.join(', ')}</span>
                  )}
                  {typeof recommendationResult.considered === 'number' && (
                    <span className="mcp-score__meta">Candidates evaluated: {recommendationResult.considered}</span>
                  )}
                </div>
                {recommendationCandidate && (
                  <div className="mcp-resume-card">
                    <div className="mcp-resume-card__top">
                      <div>
                        <h5>{recommendationCandidate.name}</h5>
                        <p>{recommendationCandidate.email}</p>
                      </div>
                      {recommendationCandidate.role && <span className="mcp-tag">{recommendationCandidate.role}</span>}
                    </div>
                    <p className="mcp-resume-card__summary">{recommendationCandidate.summary}</p>
                    <div className="mcp-resume-card__meta">
                      <span>{recommendationCandidate.experience}</span>
                      {Array.isArray(recommendationCandidate.skills) && recommendationCandidate.skills.length > 0 && (
                        <span>Skills: {recommendationCandidate.skills.join(', ')}</span>
                      )}
                    </div>
                  </div>
                )}
                {recommendationResult.best_match.explanation && (
                  <p className="mcp-result__explanation">{recommendationResult.best_match.explanation}</p>
                )}
              </div>
            )}
          </article>
        </div>

        <article className="mcp-card mcp-card--wide">
          <header className="mcp-card__header">
            <div>
              <p className="mcp-card__eyebrow">Shared resume pool</p>
              <h3>Publish a resume to the MCP index</h3>
              <p>Drop a lightweight profile to help the recommender match peers faster.</p>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={refreshResumes}
              disabled={isResumeBusy}
            >
              {resumeStatus === 'loading' ? 'Refreshing…' : 'Refresh list'}
            </button>
          </header>
          <form className="mcp-form mcp-form--grid" onSubmit={handleResumeSubmit}>
            <label htmlFor="resume-name">Name</label>
            <input
              id="resume-name"
              type="text"
              value={resumeForm.name}
              onChange={(event) => setResumeForm({ ...resumeForm, name: event.target.value })}
              placeholder="Full name"
            />
            <label htmlFor="resume-email">Email</label>
            <input
              id="resume-email"
              type="email"
              value={resumeForm.email}
              onChange={(event) => setResumeForm({ ...resumeForm, email: event.target.value })}
              placeholder="name@example.com"
            />
            <label htmlFor="resume-role">Role (optional)</label>
            <input
              id="resume-role"
              type="text"
              value={resumeForm.role}
              onChange={(event) => setResumeForm({ ...resumeForm, role: event.target.value })}
              placeholder="e.g., SDE Intern, Data Analyst"
            />
            <label htmlFor="resume-skills">Skills (comma separated)</label>
            <input
              id="resume-skills"
              type="text"
              value={resumeForm.skills}
              onChange={(event) => setResumeForm({ ...resumeForm, skills: event.target.value })}
              placeholder="python, pandas, api design"
            />
            <label htmlFor="resume-experience">Experience</label>
            <input
              id="resume-experience"
              type="text"
              value={resumeForm.experience}
              onChange={(event) => setResumeForm({ ...resumeForm, experience: event.target.value })}
              placeholder="e.g., 6 months internships, 15 projects"
            />
            <label htmlFor="resume-summary">Summary</label>
            <textarea
              id="resume-summary"
              rows="3"
              value={resumeForm.summary}
              onChange={(event) => setResumeForm({ ...resumeForm, summary: event.target.value })}
              placeholder="Key outcomes, domains, and strengths"
            />
            <label htmlFor="resume-file">Upload PDF (optional)</label>
            <input
              id="resume-file"
              type="file"
              accept="application/pdf"
              onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
            />
            <div className="mcp-actions">
              <button className="primary" type="submit" disabled={isResumeBusy}>
                {resumeStatus === 'submitting' ? 'Saving…' : 'Add to pool'}
              </button>
              {resumeError && <span className="mcp-error">{resumeError}</span>}
              {resumeFileError && <span className="mcp-error">{resumeFileError}</span>}
            </div>
          </form>
          <div className="mcp-resume-list" aria-live="polite">
            {resumeStatus === 'loading' && <p className="mcp-inline-status">Loading resumes…</p>}
            {resumeStatus === 'error' && resumeError && <p className="mcp-error">{resumeError}</p>}
            {resumeStatus !== 'loading' && resumes.length === 0 && (
              <p className="mcp-inline-status">No resumes added yet. Be the first to publish.</p>
            )}
            {resumes.length > 0 && (
              <div className="mcp-resume-grid">
                {resumes.map((resume) => (
                  <article key={resume.id} className="mcp-resume-chip">
                    <div className="mcp-resume-chip__top">
                      <div>
                        <h5>{resume.name}</h5>
                        <p>{resume.email}</p>
                      </div>
                      {resume.role && <span className="mcp-tag">{resume.role}</span>}
                    </div>
                    <p className="mcp-resume-chip__summary">{resume.summary}</p>
                    <div className="mcp-resume-chip__meta">
                      <span>{resume.experience}</span>
                      {Array.isArray(resume.skills) && resume.skills.length > 0 && (
                        <span>Skills: {resume.skills.join(', ')}</span>
                      )}
                    </div>
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
                  <h4>Branch Connect CP leaderboards</h4>
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
                        ? 'Link your Codeforces handle in your Branch Connect profile to appear on this board.'
                        : 'Link your LeetCode username in your Branch Connect profile to appear on this board.';

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
                                  || 'Branch Connect member';
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
                                          Add your CP profiles from the Branch Connect profile page
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

      <section className="practice-platforms" aria-labelledby="practice-platforms-heading">
        <header>
          <h2 id="practice-platforms-heading">Pair the drive with daily practice</h2>
          <p>
            Mix in these verified online platforms to keep your problem-solving sharp. Each link opens a curated track focused on
            interview-ready patterns.
          </p>
        </header>
        <div className="practice-platforms__grid">
          {practicePlatforms.map((platform) => (
            <article key={platform.id} className="platform-card">
              <div className="platform-card__header">
                <span className="platform-card__icon" aria-hidden>{platform.icon}</span>
                <h3>{platform.name}</h3>
              </div>
              <p>{platform.description}</p>
              <ul>
                {platform.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a href={platform.link} target="_blank" rel="noopener noreferrer" className="platform-card__link">
                Launch playlist ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="prep-timeline" aria-labelledby="prep-timeline-heading">
        <header>
          <h2 id="prep-timeline-heading">8-week placement roadmap</h2>
          <p>Use this weekly breakdown to balance depth and breadth. Pair it with the checklist inside the Drive for a detailed tracker.</p>
        </header>
        <div className="timeline-grid">
          {timelineMilestones.map((milestone) => (
            <article key={milestone.period} className="timeline-card">
              <span className="timeline-card__period">{milestone.period}</span>
              <h3>{milestone.focus}</h3>
              <ul>
                {milestone.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="support-section" aria-labelledby="support-section-heading">
        <header>
          <h2 id="support-section-heading">Keep up the momentum</h2>
          <p>Connect with peers and mentors so you never prep alone. These support loops live alongside the Drive resources.</p>
        </header>
        <div className="support-grid">
          {supportChannels.map((channel) => (
            <article key={channel.title} className="support-card">
              <h3>{channel.title}</h3>
              <p>{channel.detail}</p>
              <a href={channel.action.link} target="_blank" rel="noopener noreferrer">
                {channel.action.label} ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="faq" aria-labelledby="placement-faq-heading">
        <header>
          <h2 id="placement-faq-heading">Placement prep FAQs</h2>
          <p>Quick answers to the most common questions we hear from the community each season.</p>
        </header>
        <div className="faq-list">
          {faqItems.map((faq) => (
            <article key={faq.question} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="placement-cta" aria-label="Placement resource footer call to action">
        <div className="placement-cta__copy">
          <h2>Ready to share your own resource?</h2>
          <p>
            Add your notes, solutions, or interview experiences to the Drive so the next Branch Connect batch can learn faster. Use clear naming, include a short description, and drop a message in the Friday sync.
          </p>
        </div>
        <a className="primary" href={driveFolder} target="_blank" rel="noopener noreferrer">
          Contribute to the drive
        </a>
      </section>
    </div>
  );
};

export default PlacementResources;
