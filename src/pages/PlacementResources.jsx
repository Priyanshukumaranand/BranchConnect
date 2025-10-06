import React from 'react';
import './PlacementResources.css';

const driveFolder = 'https://drive.google.com/drive/folders/1UlIxN-hqY6FrOlk_9kOJfj3-TvWJL4ru';

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
      'Cohort volunteers update the drive after every major placement season. You can always check the resource changelog inside the drive for timestamps and editors.'
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

const PlacementResources = () => {
  return (
    <div className="placement-page">
      <section className="placement-hero" aria-labelledby="placement-hero-title">
        <div className="placement-hero__intro">
          <p className="placement-hero__eyebrow">placements · readiness stack</p>
          <h1 id="placement-hero-title">Everything you need for campus placements, curated in one drive</h1>
          <p>
            Explore templates, problem sets, mock interview scripts, and roadmaps contributed by CE Bootcamp mentors and alumni. The resources below mirror the organisation inside the Drive folder so you can jump straight to what you need.
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
          <p>Quick answers to the most common questions we hear from the cohort each season.</p>
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
            Add your notes, solutions, or interview experiences to the Drive so the next cohort can learn faster. Use clear naming, include a short description, and drop a message in the Friday sync.
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
