import React, { useMemo, useState } from 'react';
import './Batches.css';

const batches = [
  {
    id: '2022',
    label: 'Batch 2022 · Seniors',
    description: 'Final-year makers leading capstone projects and mentoring younger cohorts.',
    students: [
      {
        name: 'Aditi Singh',
        roll: 'B522004',
        focus: ['AI Research', 'Edge Computing'],
        about: 'Builds privacy-preserving ML pipelines and leads the campus research paper reading club.',
        links: {
          linkedin: 'https://www.linkedin.com',
          github: 'https://github.com/'
        }
      },
      {
        name: 'Rahul Verma',
        roll: 'B522027',
        focus: ['DevOps', 'Cloud'],
        about: 'SRE-in-training who automated deploys for student projects using GitHub Actions and ArgoCD.',
        links: {
          linkedin: 'https://www.linkedin.com',
          github: 'https://github.com/'
        }
      },
      {
        name: 'Sneha Patra',
        roll: 'B522052',
        focus: ['UX Engineering', 'Design Systems'],
        about: 'Blends interaction design with clean code. Led the design system revamp for bootcamp projects.',
        links: {
          behance: 'https://www.behance.net'
        }
      }
    ]
  },
  {
    id: '2023',
    label: 'Batch 2023 · Sophomores',
    description: 'Sophomores experimenting across domains—from web3 prototypes to embedded builds.',
    students: [
      {
        name: 'Ishaan Mishra',
        roll: 'B523009',
        focus: ['Full-stack', 'Community'],
        about: 'Organises weekend build clubs and ships indie tools using React, Go, and tRPC.',
        links: {
          twitter: 'https://twitter.com'
        }
      },
      {
        name: 'Kavya Nanda',
        roll: 'B523031',
        focus: ['Product', 'AR/VR'],
        about: 'Exploring spatial interfaces for education; prototyped an AR lab assistant for circuits.',
        links: {
          linkedin: 'https://www.linkedin.com'
        }
      },
      {
        name: 'Neel Banerjee',
        roll: 'B523044',
        focus: ['Security', 'C++'],
        about: 'CTF enthusiast building fuzzers and teaching juniors about secure coding practices.',
        links: {
          github: 'https://github.com/'
        }
      }
    ]
  },
  {
    id: '2024',
    label: 'Batch 2024 · Freshers',
    description: 'First-year cohort diving into fundamentals and contributing to open bootcamp repos.',
    students: [
      {
        name: 'Arushi Priya',
        roll: 'B524018',
        focus: ['Frontend', 'Accessibility'],
        about: 'Translates design mockups into inclusive UI and documents component patterns for the team.',
        links: {
          dribbble: 'https://dribbble.com'
        }
      },
      {
        name: 'Dev Malik',
        roll: 'B524028',
        focus: ['Python', 'Automation'],
        about: 'Writes scripts that automate note sharing, event reminders, and campus inventory systems.',
        links: {
          github: 'https://github.com/'
        }
      },
      {
        name: 'Sara Thomas',
        roll: 'B524047',
        focus: ['Hardware', 'IoT'],
        about: 'Building low-cost sensor kits for monitoring campus spaces with real-time dashboards.',
        links: {
          linkedin: 'https://www.linkedin.com'
        }
      }
    ]
  }
];

const linkIcon = (key) => {
  switch (key) {
    case 'github':
      return 'GitHub';
    case 'linkedin':
      return 'LinkedIn';
    case 'twitter':
      return 'X';
    case 'behance':
      return 'Behance';
    case 'dribbble':
      return 'Dribbble';
    default:
      return 'Portfolio';
  }
};

const Batches = () => {
  const [activeBatch, setActiveBatch] = useState(batches[0].id);

  const currentBatch = useMemo(
    () => batches.find((batch) => batch.id === activeBatch) ?? batches[0],
    [activeBatch]
  );

  return (
    <div className="batches-page">
      <header className="batches-header">
        <h1>Find your cohort.</h1>
        <p>
          Browse through every batch, discover mentors, and connect with peers. Profiles highlight interests, recent projects, and the communities they nurture.
        </p>
      </header>

      <div className="batch-tabs" role="tablist" aria-label="Select bootcamp batch">
        {batches.map((batch) => (
          <button
            key={batch.id}
            role="tab"
            aria-selected={activeBatch === batch.id}
            className={activeBatch === batch.id ? 'active' : ''}
            onClick={() => setActiveBatch(batch.id)}
          >
            {batch.label}
          </button>
        ))}
      </div>

      <section aria-live="polite" className="batch-section">
        <p className="batch-description">{currentBatch.description}</p>
        <div className="profile-grid">
          {currentBatch.students.map((student) => (
            <article className="profile-card" key={student.roll}>
              <div className="card-face card-face--front">
                <div className="avatar" aria-hidden>{student.name.slice(0, 1)}</div>
                <h3>{student.name}</h3>
                <span>{student.roll}</span>
                <div className="focus-chips">
                  {student.focus.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div className="card-face card-face--back">
                <p>{student.about}</p>
                <div className="profile-links">
                  {Object.entries(student.links).map(([key, url]) => (
                    <a key={key} href={url} target="_blank" rel="noreferrer">
                      {linkIcon(key)}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Batches;
