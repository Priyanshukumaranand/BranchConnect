import React from 'react';
import './ExamResources.css';

const driveFolder = 'https://drive.google.com/drive/folders/1ueFADGyyHUiyRs7kyHbNadwv6lElRL9P';

const semesterCollections = [
  {
    id: 'sem1',
    tag: 'Semester 1',
    description: 'Foundational math, programming, and circuits resources to accelerate first-year prep.',
    resources: [
      {
        title: 'Mathematics-I solved papers',
        format: 'PDF bundle',
        summary: 'Topic-wise PDF of previous year questions with worked-out solutions and mark distributions.',
        link: `${driveFolder}#maths1`
      },
      {
        title: 'Programming in C lab notebook',
        format: 'Docs',
        summary: 'Step-by-step lab solutions with common pitfalls and viva questions.',
        link: `${driveFolder}#pic-lab`
      },
      {
        title: 'Electronics Engineering formula sheet',
        format: 'Slides',
        summary: 'One-page cheat sheet covering diodes, transistors, and basic circuit theorems.',
        link: `${driveFolder}#electronics-formulas`
      }
    ]
  },
  {
    id: 'sem2',
    tag: 'Semester 2',
    description: 'Strengthen discrete math, OOPs, and digital logic with curated notes and practice sets.',
    resources: [
      {
        title: 'Discrete Mathematics question bank',
        format: 'Google Sheets',
        summary: 'Chapter-wise problems with difficulty tags and answer hints for self-evaluation.',
        link: `${driveFolder}#discrete-math`
      },
      {
        title: 'OOP with C++ mega notes',
        format: 'PDF',
        summary: 'Class diagrams, design patterns, and sample snippets to revise core concepts fast.',
        link: `${driveFolder}#oop-notes`
      },
      {
        title: 'Digital Logic design summaries',
        format: 'Docs',
        summary: 'K-map templates, FSM breakdowns, and frequently asked short questions.',
        link: `${driveFolder}#digital-logic`
      }
    ]
  },
  {
    id: 'sem3',
    tag: 'Semester 3',
    description: 'Data structures, computer architecture, and probability assets aligned to university papers.',
    resources: [
      {
        title: 'Data Structures crash workbook',
        format: 'PDF',
        summary: 'Singly/doubly linked list variations, tree traversals, and complexity table for quick drills.',
        link: `${driveFolder}#ds-workbook`
      },
      {
        title: 'Computer Organization solved numericals',
        format: 'PDF',
        summary: 'Memory hierarchy, pipeline, and ALU problems with detailed step-by-step workings.',
        link: `${driveFolder}#co-notes`
      },
      {
        title: 'Probability & Statistics cheat sheet',
        format: 'Docs',
        summary: 'Distribution properties, expectation tricks, and go-to theorems for short-notice revision.',
        link: `${driveFolder}#probability`
      }
    ]
  },
  {
    id: 'sem4',
    tag: 'Semester 4',
    description: 'Algorithm design, DBMS, and OS prep kits aligned with midterm + end-term blueprints.',
    resources: [
      {
        title: 'Design & Analysis of Algorithms pattern sheet',
        format: 'Slides',
        summary: 'Master DP patterns, greedy proofs, and amortized complexity examples.',
        link: `${driveFolder}#daa`
      },
      {
        title: 'DBMS 15-day sprint plan',
        format: 'Notion',
        summary: 'Daily study tracker with topic coverage, PYQs, and mini assignments.',
        link: `${driveFolder}#dbms-plan`
      },
      {
        title: 'Operating Systems viva & long questions',
        format: 'Docs',
        summary: 'Thread scheduling, memory management, and synchronization case studies.',
        link: `${driveFolder}#os-notes`
      }
    ]
  }
];

const studyPlaylists = [
  {
    title: 'Exam week game plan',
    description: 'A 7-day revision cadence that stretches across core subjects with rest days baked in.',
    link: `${driveFolder}#exam-week-plan`
  },
  {
    title: 'Score boosters list',
    description: 'Quick-win topics most likely to appear, with time estimates and formula callouts.',
    link: `${driveFolder}#score-boosters`
  },
  {
    title: 'Lab viva flashcards',
    description: 'Call-and-response cards for viva prep spanning first and second-year labs.',
    link: `${driveFolder}#lab-flashcards`
  }
];

const tips = [
  {
    title: 'Prioritize by question weightage',
    detail:
      'Scan past paper analysis to spot 12- and 8-mark question clusters. Hit those first, then loop back to smaller theory bites.'
  },
  {
    title: 'Rotate subjects in 90-minute focus blocks',
    detail:
      'Alternate between heavy concept topics and lightweight memorization to avoid burnout. Use the playlists to stack blocks sensibly.'
  },
  {
    title: 'Teach back to lock understanding',
    detail:
      'Summarize topics to a friend or record yourself explaining. You will immediately surface gaps to revisit in the notes.'
  }
];

const faqItems = [
  {
    question: 'How frequently are exam resources refreshed?',
    answer:
      'CRs and subject toppers upload new notes every exam season. Check the change-log document sitting at the root of the drive for timestamps.'
  },
  {
    question: 'Can I request missing chapters?',
    answer:
      'Yes—fill out the request form inside the drive or ping the academic support group. We prioritise uploads by demand and exam calendar.'
  },
  {
    question: 'What is the quickest way to cover labs before viva?',
    answer:
      'Start with the lab notebooks for your semester, rehearse the viva flashcards, and schedule a 30-minute mock with your lab partner using the prompts provided.'
  }
];

const ExamResources = () => {
  return (
    <div className="exam-page">
      <section className="exam-hero" aria-labelledby="exam-hero-title">
        <div className="exam-hero__intro">
          <p className="exam-hero__eyebrow">academics · exams & viva</p>
          <h1 id="exam-hero-title">Semester-by-semester resources to help you ace university exams</h1>
          <p>
            Dive into curated notes, solved papers, lab notebooks, and revision checklists organised exactly like the shared Drive. Everything is compiled by seniors who have cleared the papers with distinction.
          </p>
          <div className="exam-hero__actions">
            <a className="primary" href={driveFolder} target="_blank" rel="noopener noreferrer">
              Open exam drive
            </a>
            <a className="ghost" href={`${driveFolder}#exam-week-plan`} target="_blank" rel="noopener noreferrer">
              Download weekly plan
            </a>
          </div>
          <small className="exam-hero__hint">Bookmark the drive and keep an eye on the change-log for newly added notes.</small>
        </div>
      </section>

      <section className="semester-section" aria-labelledby="semester-section-heading">
        <header>
          <h2 id="semester-section-heading">Semester hubs</h2>
          <p>Select the semester you are revising. Each hub mirrors the Drive folders for quick lookup.</p>
        </header>
        <div className="semester-grid">
          {semesterCollections.map((collection) => (
            <article key={collection.id} className="semester-card" aria-labelledby={`semester-${collection.id}`}>
              <header className="semester-card__header">
                <span className="semester-card__tag">{collection.tag}</span>
                <p>{collection.description}</p>
              </header>
              <div className="semester-card__resources">
                {collection.resources.map((resource) => (
                  <a
                    key={resource.title}
                    className="semester-resource"
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="semester-resource__title">{resource.title}</span>
                    <span className="semester-resource__meta">{resource.format}</span>
                    <p>{resource.summary}</p>
                    <span className="semester-resource__cta">View resource ↗</span>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="study-playlists" aria-labelledby="study-playlists-heading">
        <header>
          <h2 id="study-playlists-heading">Quick playlists & trackers</h2>
          <p>Borrow ready-made schedules to keep yourself accountable during exam crunch weeks.</p>
        </header>
        <div className="playlist-grid">
          {studyPlaylists.map((playlist) => (
            <a
              key={playlist.title}
              className="playlist-card"
              href={playlist.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h3>{playlist.title}</h3>
              <p>{playlist.description}</p>
              <span>Open template ↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="exam-tips" aria-labelledby="exam-tips-heading">
        <header>
          <h2 id="exam-tips-heading">Prep smarter</h2>
          <p>Use these battle-tested strategies from seniors to keep stress in check and retention high.</p>
        </header>
        <div className="tips-grid">
          {tips.map((tip) => (
            <article key={tip.title} className="tip-card">
              <h3>{tip.title}</h3>
              <p>{tip.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="exam-faq" aria-labelledby="exam-faq-heading">
        <header>
          <h2 id="exam-faq-heading">Exam prep FAQs</h2>
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

      <section className="exam-cta" aria-label="Exam resource contribution CTA">
        <div className="exam-cta__copy">
          <h2>Share your toppers notes</h2>
          <p>
            Upload annotated PDFs, viva hints, or question bank updates to the drive so juniors can build on your work. Use clear file names and semester tags for quick discovery.
          </p>
        </div>
        <a className="primary" href={driveFolder} target="_blank" rel="noopener noreferrer">
          Contribute notes
        </a>
      </section>
    </div>
  );
};

export default ExamResources;
