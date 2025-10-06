import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Batches.css';
import { fetchBatchMembers } from '../api/batches';

const DEFAULT_BATCH_YEARS = ['2024', '2023', '2022'];

const LINK_LABELS = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'X',
  instagram: 'Instagram',
  behance: 'Behance',
  dribbble: 'Dribbble',
  portfolio: 'Portfolio',
  website: 'Website'
};

const linkIcon = (key) => LINK_LABELS[key] || 'Profile';

const tokenise = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => item.trim());
  return value
    .split(/[,|;/]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normaliseProfile = (user) => {
  const name = user.name || user.email?.split('@')[0] || 'Bootcamp Member';
  const roll = user.collegeId ? user.collegeId.toUpperCase() : '—';
  const focus = Array.from(new Set([
    ...tokenise(user.secret),
    ...tokenise(user.place)
  ])).slice(0, 4);

  const links = Object.entries({
    github: user.github,
    linkedin: user.linkedin,
    twitter: user.twitter,
    instagram: user.instagram,
    behance: user.behance,
    dribbble: user.dribbble,
    portfolio: user.portfolio || user.website
  }).filter(([, value]) => Boolean(value));

  return {
    id: user._id || user.id || user.email || roll || name,
    initials: name.slice(0, 1).toUpperCase(),
    name,
    roll,
    about: user.about || 'Details coming soon. Reach out to the bootcamp organisers to update this profile.',
    focus: focus.length > 0 ? focus : ['Bootcamp Member'],
    links
  };
};

const Batches = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialYearFromQuery = searchParams.get('year');

  const initialYears = useMemo(() => {
    const base = [...DEFAULT_BATCH_YEARS];
    if (initialYearFromQuery && !base.includes(initialYearFromQuery)) {
      base.unshift(initialYearFromQuery);
    }
    return base;
  }, [initialYearFromQuery]);

  const [availableYears, setAvailableYears] = useState(initialYears);
  const [activeYear, setActiveYear] = useState(() => initialYearFromQuery || initialYears[0]);
  const [profilesByYear, setProfilesByYear] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialYearFromQuery && !availableYears.includes(initialYearFromQuery)) {
      setAvailableYears((prev) => [initialYearFromQuery, ...prev]);
    }

    if (initialYearFromQuery && initialYearFromQuery !== activeYear) {
      setActiveYear(initialYearFromQuery);
    }
  }, [initialYearFromQuery, availableYears, activeYear]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (profilesByYear[activeYear]) {
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchBatchMembers({
          year: activeYear,
          signal: controller.signal
        });

        if (cancelled) return;

        const members = Array.isArray(response?.users)
          ? response.users.map(normaliseProfile)
          : [];

        if (!availableYears.includes(activeYear)) {
          setAvailableYears((prev) => [activeYear, ...prev]);
        }

        setProfilesByYear((prev) => ({
          ...prev,
          [activeYear]: members
        }));
      } catch (fetchError) {
        if (fetchError.name === 'AbortError' || cancelled) {
          return;
        }
        setError(fetchError?.message || 'Unable to load batch data right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeYear, profilesByYear, availableYears]);

  const currentProfiles = profilesByYear[activeYear] || [];
  const years = useMemo(
    () => Array.from(new Set(availableYears.filter(Boolean))),
    [availableYears]
  );

  const handleTabChange = (year) => {
    setActiveYear(year);
    const next = new URLSearchParams(searchParams);
    next.set('year', year);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="batches-page">
      <header className="batches-header">
        <h1>Find your cohort.</h1>
        <p>
          Browse through every batch, discover mentors, and connect with peers. Profiles highlight interests, recent projects, and the communities they nurture.
        </p>
      </header>

      <div className="batch-tabs" role="tablist" aria-label="Select bootcamp batch">
        {years.map((year) => (
          <button
            key={year}
            role="tab"
            aria-selected={activeYear === year}
            className={activeYear === year ? 'active' : ''}
            onClick={() => handleTabChange(year)}
          >
            Batch {year}
          </button>
        ))}
      </div>

      <section aria-live="polite" className="batch-section">
        {loading && (
          <p className="batch-description">Fetching bootcamp profiles for {activeYear}…</p>
        )}

        {error && (
          <p className="batch-description error">{error}</p>
        )}

        {!loading && !error && currentProfiles.length === 0 && (
          <p className="batch-description">
            No profiles found for {activeYear}. If you believe this is an error, please ask the bootcamp team to update the database.
          </p>
        )}

        {!loading && !error && currentProfiles.length > 0 && (
          <>
            <p className="batch-description">
              Core members and contributors from the {activeYear} cohort.
            </p>
            <div className="profile-grid">
              {currentProfiles.map((profile) => (
                <article className="profile-card" key={profile.id}>
                  <div className="card-face card-face--front">
                    <div className="avatar" aria-hidden>{profile.initials}</div>
                    <h3>{profile.name}</h3>
                    <span>{profile.roll}</span>
                    <div className="focus-chips">
                      {profile.focus.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-face card-face--back">
                    <p>{profile.about}</p>
                    <div className="profile-links">
                      {profile.links.map(([key, url]) => (
                        <a key={key} href={url} target="_blank" rel="noreferrer">
                          {linkIcon(key)}
                        </a>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Batches;
