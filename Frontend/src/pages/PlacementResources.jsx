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
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import placementHero3d from '../assets/placement-career-visual.png';

const driveFolder = 'https://drive.google.com/drive/folders/1UlIxN-hqY6FrOlk_9kOJfj3-TvWJL4ru';

const CP_PROFILE_ORDER = ['leetcode', 'codeforces', 'codechef'];

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

// ============== PLACEMENT DASHBOARD DATA (Replace with API calls) ==============
// These will be populated from your email pipeline API

const MOCK_PLACEMENT_METRICS = {
  placementRate: 92,
  placementRateChange: '+5%',
  avgCtc: '₹12.5 LPA',
  avgCtcChange: '+18%',
  highestCtc: '₹45 LPA',
  highestCtcCompany: 'Microsoft India',
  companiesVisited: 85,
  newCompanies: 12,
  lastUpdated: new Date().toISOString()
};

const MOCK_COMPANIES = [
  {
    id: 1,
    name: 'Google',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
    role: 'SDE Intern',
    ctc: '₹40 LPA',
    cgpa: '8.0+',
    branches: 'CSE, IT, ECE',
    backlogs: '0',
    visitDate: '2025-01-15',
    deadline: '2025-01-10',
    status: 'open',
    appliedCount: 45,
    // External API data (Glassdoor/AmbitionBox/LinkedIn)
    glassdoorRating: 4.4,
    interviewDifficulty: 'Hard',
    employeeCount: '150,000+',
    industry: 'Technology',
    reviewsCount: 45000,
    workLifeBalance: 4.2,
    linkedinUrl: 'https://linkedin.com/company/google'
  },
  {
    id: 2,
    name: 'Microsoft',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
    role: 'Software Engineer',
    ctc: '₹42 LPA',
    cgpa: '7.5+',
    branches: 'All Branches',
    backlogs: '0',
    visitDate: '2025-01-18',
    deadline: '2025-01-12',
    status: 'open',
    appliedCount: 62,
    glassdoorRating: 4.3,
    interviewDifficulty: 'Medium',
    employeeCount: '180,000+',
    industry: 'Technology',
    reviewsCount: 52000,
    workLifeBalance: 4.0,
    linkedinUrl: 'https://linkedin.com/company/microsoft'
  },
  {
    id: 3,
    name: 'Amazon',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
    role: 'SDE-1',
    ctc: '₹32 LPA',
    cgpa: '7.0+',
    branches: 'CSE, IT, ECE, EE',
    backlogs: '≤1',
    visitDate: '2025-01-22',
    deadline: '2025-01-16',
    status: 'shortlisting',
    appliedCount: 78,
    glassdoorRating: 3.9,
    interviewDifficulty: 'Hard',
    employeeCount: '1.5M+',
    industry: 'E-commerce/Cloud',
    reviewsCount: 95000,
    workLifeBalance: 3.4,
    linkedinUrl: 'https://linkedin.com/company/amazon'
  },
  {
    id: 4,
    name: 'Flipkart',
    logo: 'https://logo.clearbit.com/flipkart.com',
    role: 'Backend Engineer',
    ctc: '₹28 LPA',
    cgpa: '7.0+',
    branches: 'CSE, IT',
    backlogs: '0',
    visitDate: '2025-01-25',
    deadline: '2025-01-18',
    status: 'shortlisting',
    appliedCount: 55,
    glassdoorRating: 4.0,
    interviewDifficulty: 'Medium',
    employeeCount: '30,000+',
    industry: 'E-commerce',
    reviewsCount: 8500,
    workLifeBalance: 3.8,
    linkedinUrl: 'https://linkedin.com/company/flipkart'
  },
  {
    id: 5,
    name: 'Razorpay',
    logo: 'https://logo.clearbit.com/razorpay.com',
    role: 'Full Stack Dev',
    ctc: '₹24 LPA',
    cgpa: '6.5+',
    branches: 'All Branches',
    backlogs: '≤2',
    visitDate: '2025-01-28',
    deadline: '2025-01-22',
    status: 'open',
    appliedCount: 42,
    glassdoorRating: 4.1,
    interviewDifficulty: 'Medium',
    employeeCount: '3,000+',
    industry: 'Fintech',
    reviewsCount: 1200,
    workLifeBalance: 4.0,
    linkedinUrl: 'https://linkedin.com/company/razorpay'
  },
  {
    id: 6,
    name: 'PhonePe',
    logo: 'https://logo.clearbit.com/phonepe.com',
    role: 'Android Dev',
    ctc: '₹22 LPA',
    cgpa: '6.5+',
    branches: 'CSE, IT, ECE',
    backlogs: '≤1',
    visitDate: '2025-02-01',
    deadline: '2025-01-25',
    status: 'upcoming',
    appliedCount: 0,
    glassdoorRating: 4.0,
    interviewDifficulty: 'Medium',
    employeeCount: '5,000+',
    industry: 'Fintech',
    reviewsCount: 2100,
    workLifeBalance: 3.7,
    linkedinUrl: 'https://linkedin.com/company/phonepe'
  },
  {
    id: 7,
    name: 'Zomato',
    logo: 'https://logo.clearbit.com/zomato.com',
    role: 'Backend Engineer',
    ctc: '₹20 LPA',
    cgpa: '6.0+',
    branches: 'All Branches',
    backlogs: '≤2',
    visitDate: '2025-02-05',
    deadline: '2025-01-30',
    status: 'upcoming',
    appliedCount: 0,
    glassdoorRating: 3.8,
    interviewDifficulty: 'Medium',
    employeeCount: '8,000+',
    industry: 'Food Tech',
    reviewsCount: 3200,
    workLifeBalance: 3.5,
    linkedinUrl: 'https://linkedin.com/company/zomato'
  },
];

const MOCK_PLACEMENT_TRENDS = [
  { year: 2021, placementRate: 78, totalOffers: 120 },
  { year: 2022, placementRate: 85, totalOffers: 145 },
  { year: 2023, placementRate: 88, totalOffers: 168 },
  { year: 2024, placementRate: 92, totalOffers: 195 },
];

const MOCK_SECTOR_DATA = [
  { id: 'software', name: 'Software & IT', percentage: 45, color: '#6366f1' },
  { id: 'fintech', name: 'Finance & Fintech', percentage: 22, color: '#ec4899' },
  { id: 'consulting', name: 'Consulting', percentage: 15, color: '#f59e0b' },
  { id: 'product', name: 'Product Companies', percentage: 12, color: '#10b981' },
  { id: 'others', name: 'Others', percentage: 6, color: '#64748b' },
];

const MOCK_TOP_RECRUITERS = [
  { id: 1, name: 'Google', hires: 12, logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg' },
  { id: 2, name: 'Microsoft', hires: 15, logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
  { id: 3, name: 'Amazon', hires: 18, logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg' },
  { id: 4, name: 'Goldman Sachs', hires: 8, logo: 'https://logo.clearbit.com/goldmansachs.com' },
  { id: 5, name: 'Flipkart', hires: 10, logo: 'https://logo.clearbit.com/flipkart.com' },
  { id: 6, name: 'PhonePe', hires: 7, logo: 'https://logo.clearbit.com/phonepe.com' },
  { id: 7, name: 'Razorpay', hires: 6, logo: 'https://logo.clearbit.com/razorpay.com' },
  { id: 8, name: 'Adobe', hires: 5, logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg' },
];

const MOCK_CTC_DISTRIBUTION = [
  { range: '< ₹8 LPA', count: 25, percentage: 15 },
  { range: '₹8-15 LPA', count: 68, percentage: 40 },
  { range: '₹15-25 LPA', count: 52, percentage: 30 },
  { range: '₹25-40 LPA', count: 18, percentage: 10 },
  { range: '> ₹40 LPA', count: 8, percentage: 5 },
];

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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
      <section className="placement-hero animate-slide-up" aria-labelledby="placement-hero-title">
        <div className="placement-hero__intro">
          <p className="placement-hero__eyebrow">placements · readiness stack</p>
          <h1 id="placement-hero-title">Everything you need for campus placements, curated in one drive</h1>
          <p>
            Explore templates, problem sets, mock interview scripts, and roadmaps contributed by IIIT Network mentors and alumni.
          </p>
          <div className="placement-hero__actions">
            <Button
              as="a"
              href={driveFolder}
              target="_blank"
              rel="noopener noreferrer"
              variant="gradient"
              className="primary hover-pulse"
              icon="external-link"
            >
              Open resource drive
            </Button>
            <Button
              as="a"
              href={`${driveFolder}#placement-checklist`}
              target="_blank"
              rel="noopener noreferrer"
              variant="ghost"
            >
              Download 8-week checklist
            </Button>
          </div>
        </div>

        <div className="placement-hero__visual delay-200 animate-slide-up">
          <img src={placementHero3d} alt="Abstract 3D glass shapes representing future pathways" className="hero-3d-asset" />
        </div>
      </section>

      {/* Placement Dashboard Section */}
      <section className="placement-dashboard delay-500 animate-slide-up" aria-labelledby="dashboard-heading">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Placement Insights</p>
            <h2 id="dashboard-heading">Campus Placement Dashboard</h2>
            <p>Real-time placement data, company visits, and CTC trends to help you prepare better.</p>
          </div>
        </header>

        {/* Key Metrics */}
        <div className="dashboard-metrics">
          <Card className="metric-card metric-card--highlight" variant="glass">
            <span className="metric-icon">📈</span>
            <div className="metric-content">
              <span className="metric-value">{MOCK_PLACEMENT_METRICS.placementRate}%</span>
              <span className="metric-label">Placement Rate</span>
              <span className="metric-change positive">{MOCK_PLACEMENT_METRICS.placementRateChange} from last year</span>
            </div>
          </Card>
          <Card className="metric-card" variant="glass">
            <span className="metric-icon">💰</span>
            <div className="metric-content">
              <span className="metric-value">{MOCK_PLACEMENT_METRICS.avgCtc}</span>
              <span className="metric-label">Average CTC</span>
              <span className="metric-change positive">{MOCK_PLACEMENT_METRICS.avgCtcChange} YoY</span>
            </div>
          </Card>
          <Card className="metric-card" variant="glass">
            <span className="metric-icon">🏆</span>
            <div className="metric-content">
              <span className="metric-value">{MOCK_PLACEMENT_METRICS.highestCtc}</span>
              <span className="metric-label">Highest CTC</span>
              <span className="metric-trend">{MOCK_PLACEMENT_METRICS.highestCtcCompany}</span>
            </div>
          </Card>
          <Card className="metric-card" variant="glass">
            <span className="metric-icon">🏢</span>
            <div className="metric-content">
              <span className="metric-value">{MOCK_PLACEMENT_METRICS.companiesVisited}+</span>
              <span className="metric-label">Companies Visited</span>
              <span className="metric-change positive">+{MOCK_PLACEMENT_METRICS.newCompanies} new</span>
            </div>
          </Card>
        </div>

        {/* Companies Visiting */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>🗓️ Upcoming Company Visits</h3>
            <span className="badge badge--info">Live Schedule</span>
          </div>
          <div className="company-table-container">
            <table className="company-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>CTC</th>
                  <th>CGPA</th>
                  <th>Branches</th>
                  <th>Backlogs</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COMPANIES.map((company) => (
                  <tr key={company.id} className={`company-row company-row--${company.status}`}>
                    <td className="company-name-cell">
                      <img src={company.logo} alt={company.name} className="company-logo-img" />
                      <span className="company-name">{company.name}</span>
                    </td>
                    <td>{company.role}</td>
                    <td className="ctc-cell">{company.ctc}</td>
                    <td className="cgpa-cell">
                      <span className="cgpa-badge">{company.cgpa}</span>
                    </td>
                    <td className="branches-cell">{company.branches}</td>
                    <td className="backlogs-cell">{company.backlogs}</td>
                    <td className="date-cell">
                      <span className="visit-date">{formatDate(company.visitDate)}</span>
                      {company.status !== 'upcoming' && (
                        <span className="deadline">Apply by {formatDate(company.deadline)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="eligibility-note">
            <span className="note-icon">💡</span>
            <p><strong>Tip:</strong> Check your eligibility criteria carefully. CGPA requirements are minimum cutoffs. Some companies may have additional coding rounds before shortlisting.</p>
          </div>
        </div>

        {/* Placement Trends */}
        <div className="dashboard-grid">
          <Card className="trend-card" variant="default">
            <div className="trend-header">
              <h3>📊 Year-wise Placement Trends</h3>
            </div>
            <div className="trend-bars">
              {MOCK_PLACEMENT_TRENDS.map((item) => (
                <div key={item.year} className="trend-bar-item">
                  <div className="trend-bar-label">
                    <span className="trend-year">{item.year}</span>
                    <span className="trend-rate">{item.placementRate}%</span>
                  </div>
                  <div className="trend-bar-track">
                    <div
                      className="trend-bar-fill"
                      style={{ width: `${item.placementRate}%`, background: `hsl(${240 + item.year - 2021 * 15}, 70%, 60%)` }}
                    />
                  </div>
                  <span className="trend-offers">{item.totalOffers} offers</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="sector-card" variant="default">
            <div className="sector-header">
              <h3>🎯 Top Recruiting Sectors</h3>
            </div>
            <div className="sector-list">
              {MOCK_SECTOR_DATA.map((sector) => (
                <div key={sector.id} className="sector-item">
                  <div className="sector-info">
                    <span className="sector-dot" style={{ background: sector.color }} />
                    <span className="sector-name">{sector.name}</span>
                  </div>
                  <span className="sector-percentage">{sector.percentage}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top Recruiters */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>⭐ Top Recruiters (2024)</h3>
          </div>
          <div className="recruiters-carousel">
            {MOCK_TOP_RECRUITERS.map((recruiter) => (
              <Card key={recruiter.id} className="recruiter-chip" hoverEffect>
                <img src={recruiter.logo} alt={recruiter.name} className="recruiter-logo-img" />
                <span className="recruiter-name">{recruiter.name}</span>
                <span className="recruiter-hires">{recruiter.hires} hires</span>
              </Card>
            ))}
          </div>
        </div>

        {/* CTC Breakdown */}
        <Card className="ctc-card" variant="glass">
          <div className="ctc-header">
            <h3>💵 CTC Distribution (2024 Batch)</h3>
          </div>
          <div className="ctc-grid">
            {MOCK_CTC_DISTRIBUTION.map((bracket) => (
              <div key={bracket.range} className="ctc-bracket">
                <div className="ctc-bar-container">
                  <div
                    className="ctc-bar"
                    style={{ height: `${bracket.percentage * 2}px` }}
                  />
                </div>
                <span className="ctc-range">{bracket.range}</span>
                <span className="ctc-count">{bracket.count} students</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mcp-assistant delay-500 animate-slide-up" aria-labelledby="mcp-assistant-heading">
        <header className="mcp-assistant__header">
          <div>
            <p className="mcp-assistant__eyebrow">IIIT Network resume pool</p>
            <h2 id="mcp-assistant-heading">Share your resume with the community</h2>
            <p>Publish your resume so peers and mentors can discover profiles easily. Upload a PDF or add details, then ask the bot questions grounded in this pool.</p>
          </div>
        </header>

        <Card className="mcp-card mcp-card--wide resume-assistant" variant="default">
          <header className="mcp-card__header">
            <div>
              <p className="mcp-card__eyebrow">Resume assistant</p>
              <h3>Add resumes and ask the bot</h3>
              <p>Upload your PDF or add details so others can browse profiles and get grounded answers.</p>
            </div>
            <div className="resume-assistant__badges">
              <span className="status-pill status-pill--muted">{`${resumes.length} resumes indexed`}</span>
              <Button
                variant="ghost"
                onClick={refreshResumes}
                disabled={isResumeBusy}
                loading={resumeStatus === 'loading'}
                size="sm"
              >
                Refresh pool
              </Button>
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
                      className="ghost-sample"
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
                      <Button variant="primary" type="submit" loading={assistantStatus === 'loading'} disabled={assistantStatus === 'loading'}>
                        Ask the bot
                      </Button>
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
                <div className="form-group">
                  <label htmlFor="resume-email">Email</label>
                  <input
                    id="resume-email"
                    type="email"
                    value={resolvedEmail}
                    onChange={user ? undefined : ((event) => setResumeForm({ ...resumeForm, email: event.target.value }))}
                    readOnly={!!user}
                    placeholder={user ? 'Using your account email' : 'name@example.com'}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="resume-file">Upload PDF</label>
                  <input
                    id="resume-file"
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                  />
                </div>
                <div className="mcp-actions">
                  <Button variant="primary" type="submit" disabled={isResumeBusy} loading={resumeStatus === 'submitting'}>
                    Upload to pool
                  </Button>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger"
                            onClick={() => handleResumeDelete(resume.id)}
                            disabled={isResumeBusy}
                          >
                            Remove
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="resource-collections delay-500 animate-slide-up" aria-labelledby="resource-collections-heading">
        <header>
          <h2 id="resource-collections-heading">Resource collections</h2>
          <p>Jump into the collections that map directly to the Drive sub-folders. Each card highlights what you will find and suggests how to use it.</p>
        </header>
        {resourceCollections.map((collection) => (
          <Card key={collection.id} className="resource-collection hover-pulse" aria-labelledby={`collection-${collection.id}`}>
            <div className="resource-collection__intro">
              <span className="resource-collection__icon" aria-hidden>{collection.icon}</span>
              <div>
                <h3 id={`collection-${collection.id}`}>{collection.title}</h3>
                <p>{collection.description}</p>
              </div>
              <Button
                as="a"
                variant="ghost"
                href={collection.resources[0]?.link || driveFolder}
                target="_blank"
                rel="noopener noreferrer"
              >
                {collection.ctaLabel}
              </Button>
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
                      const emptyMessage = section.provider === 'codeforces'
                        ? 'Link your Codeforces handle in your IIIT Network profile to appear on this board.'
                        : 'Link your LeetCode username in your IIIT Network profile to appear on this board.';

                      return (
                        <div
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
                                          return (
                                            <span key={stat.label} className="leaderboard-item__score-sub">
                                              {stat.label}: {rawValue}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </section>
    </div >
  );
};

export default PlacementResources;
