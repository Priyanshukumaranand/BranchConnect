import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Batches.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchBatchMembers } from '../api/batches';
import { API_BASE_URL } from '../api/client';

const DEFAULT_BATCH_YEARS = ['2024', '2023', '2022'];
const DEFAULT_BRANCH_KEY = 'all';
const BRANCH_OPTIONS = [
  { key: 'all', label: 'All branches', shortLabel: 'All branches', alias: null },
  { key: 'cse', label: 'Computer Science & Engineering', shortLabel: 'CSE', alias: 'cse' },
  { key: 'ece', label: 'Electronics & Communication Engineering', shortLabel: 'ECE', alias: 'ece' },
  { key: 'eee', label: 'Electrical & Electronics Engineering', shortLabel: 'EEE', alias: 'eee' },
  { key: 'it', label: 'Information Technology', shortLabel: 'IT', alias: 'it' },
  { key: 'ce', label: 'Civil Engineering', shortLabel: 'CE', alias: 'ce' }
];
const PAGE_SIZE = 12;

const LINK_LABELS = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'X',
  instagram: 'Instagram',
  behance: 'Behance',
  dribbble: 'Dribbble',
  portfolio: 'Portfolio',
  website: 'Website',
  email: 'Email'
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
  const name = user.name || user.email?.split('@')[0] || 'Branch Connect Member';
  const roll = user.collegeId ? user.collegeId.toUpperCase() : user.email?.substring(0, 7)?.toUpperCase() || '—';
  const email = user.email || '';
  const batchTag = user.batchYear ? `Batch ${user.batchYear}` : null;
  const branchTag = user.branch?.short || user.branch?.label || null;
  const focus = Array.from(new Set([
    batchTag,
    branchTag,
    ...tokenise(user.place),
    ...tokenise(user.secret)
  ].filter(Boolean))).slice(0, 3);

  const socials = user.socials || {};
  const links = Object.entries({
    instagram: socials.instagram,
    github: socials.github,
    linkedin: socials.linkedin,
    email: socials.email || email
  })
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => [key, key === 'email' && !value.startsWith('mailto:') ? `mailto:${value}` : value]);

  const avatarCandidate = user.image || user.avatarUrl || user.avatarPath;
  const image = avatarCandidate
    ? avatarCandidate.startsWith('data:')
      ? avatarCandidate
      : (() => {
        try {
          return new URL(avatarCandidate, API_BASE_URL).toString();
        } catch (error) {
          return avatarCandidate;
        }
      })()
    : null;

  return {
    id: user.id || user._id || email || roll || name,
    initials: name.slice(0, 1).toUpperCase(),
    name,
    roll,
    email,
    about: user.about || 'Details coming soon. Reach out to the Branch Connect organisers to update this profile.',
    focus: focus.length > 0 ? focus : ['Branch Connect Member'],
    links,
    image,
    location: user.place || null
  };
};

const Batches = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialYearFromQuery = searchParams.get('year');
  const initialBranchFromQuery = searchParams.get('branch');

  const initialBranchKey = useMemo(() => {
    if (!initialBranchFromQuery) {
      return DEFAULT_BRANCH_KEY;
    }
    const normalized = initialBranchFromQuery.toLowerCase();
    const match = BRANCH_OPTIONS.find((option) => option.key === normalized);
    return match ? match.key : DEFAULT_BRANCH_KEY;
  }, [initialBranchFromQuery]);

  const initialYears = useMemo(() => {
    const base = [...DEFAULT_BATCH_YEARS];
    if (initialYearFromQuery && !base.includes(initialYearFromQuery)) {
      base.unshift(initialYearFromQuery);
    }
    return base;
  }, [initialYearFromQuery]);

  const [availableYears, setAvailableYears] = useState(initialYears);
  const [activeYear, setActiveYear] = useState(() => initialYearFromQuery || initialYears[0]);
  const [activeBranch, setActiveBranch] = useState(initialBranchKey);
  useEffect(() => {
    setAvailableYears((prev) => (
      initialYearFromQuery && !prev.includes(initialYearFromQuery)
        ? [initialYearFromQuery, ...prev]
        : prev
    ));

    if (initialYearFromQuery && initialYearFromQuery !== activeYear) {
      setActiveYear(initialYearFromQuery);
    }
  }, [initialYearFromQuery, activeYear]);

  useEffect(() => {
    if (activeYear) {
      setAvailableYears((prev) => (prev.includes(activeYear) ? prev : [activeYear, ...prev]));
    }
  }, [activeYear]);

  useEffect(() => {
    if (initialBranchKey && initialBranchKey !== activeBranch) {
      setActiveBranch(initialBranchKey);
    }
  }, [initialBranchKey, activeBranch]);

  const activeBranchOption = useMemo(
    () => BRANCH_OPTIONS.find((option) => option.key === activeBranch) || BRANCH_OPTIONS[0],
    [activeBranch]
  );

  const branchAlias = activeBranchOption.alias;

  const {
    data,
    status,
    error,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['batches', branchAlias || 'all', activeYear],
    queryFn: ({ pageParam = 1, signal }) => fetchBatchMembers({
      year: activeYear,
      branch: branchAlias,
      page: pageParam,
      limit: PAGE_SIZE,
      signal
    }),
    enabled: Boolean(activeYear),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      if (lastPage.hasMore) {
        return lastPage.nextPage || (lastPage.page ? lastPage.page + 1 : undefined);
      }
      return undefined;
    }
  });

  const loadMoreRef = useRef(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, {
      rootMargin: '240px 0px'
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, activeYear, activeBranch]);

  const currentProfiles = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => (
      Array.isArray(page?.users)
        ? page.users.map(normaliseProfile)
        : []
    ));
  }, [data]);

  const totalProfiles = data?.pages?.[0]?.total ?? 0;

  const years = useMemo(
    () => Array.from(new Set(availableYears.filter(Boolean))),
    [availableYears]
  );

  const handleYearChange = (year) => {
    setActiveYear(year);
    const next = new URLSearchParams(searchParams);
    next.set('year', year);
    if (activeBranch === DEFAULT_BRANCH_KEY) {
      next.delete('branch');
    } else {
      next.set('branch', activeBranch);
    }
    setSearchParams(next, { replace: true });
  };

  const handleBranchChange = (branchKey) => {
    setActiveBranch(branchKey);
    const next = new URLSearchParams(searchParams);
    if (branchKey === DEFAULT_BRANCH_KEY) {
      next.delete('branch');
    } else {
      next.set('branch', branchKey);
    }
    if (activeYear) {
      next.set('year', activeYear);
    }
    setSearchParams(next, { replace: true });
  };

  const isInitialLoading = status === 'pending';
  const isError = status === 'error';
  const isRefreshing = isFetching && !isFetchingNextPage;

  const branchDescriptor = activeBranchOption.key === DEFAULT_BRANCH_KEY
    ? 'all branches'
    : `${activeBranchOption.shortLabel || activeBranchOption.label} branch`;

  return (
    <div className="batches-page">
      <header className="batches-header">
        <h1>Connect across every branch.</h1>
        <p>
          Browse by branch and batch, discover mentors, and connect with peers. Profiles highlight interests, recent projects, and the communities they build on campus.
        </p>
      </header>

      <div className="batch-filters">
        <div className="batch-filter-group">
          <span className="batch-filter-label">Branch</span>
          <div className="batch-tabs" role="tablist" aria-label="Select branch">
            {BRANCH_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={activeBranch === option.key}
                className={activeBranch === option.key ? 'active' : ''}
                onClick={() => handleBranchChange(option.key)}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="batch-filter-group">
          <span className="batch-filter-label">Batch year</span>
          <div className="batch-tabs" role="tablist" aria-label="Select batch year">
            {years.map((year) => (
              <button
                key={year}
                role="tab"
                aria-selected={activeYear === year}
                className={activeYear === year ? 'active' : ''}
                onClick={() => handleYearChange(year)}
              >
                Batch {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section aria-live="polite" className="batch-section">
        {(isInitialLoading || isRefreshing) && (
          <p className="batch-description">Fetching {branchDescriptor} profiles for {activeYear}…</p>
        )}

        {isError && (
          <p className="batch-description error">{error?.message || 'Unable to load batch data right now.'}</p>
        )}

        {!isInitialLoading && !isRefreshing && !isError && currentProfiles.length === 0 && (
          <p className="batch-description">
            No profiles found for {activeYear} in {branchDescriptor}. If you believe this is an error, please ask the Branch Connect team to update the database.
          </p>
        )}

        {!isError && currentProfiles.length > 0 && (
          <>
            <p className="batch-description">
              Core members and contributors from the {activeYear} {branchDescriptor} community{totalProfiles ? ` · Showing ${currentProfiles.length} of ${totalProfiles}` : ''}.
            </p>
            <div className="profile-grid">
              {currentProfiles.map((profile) => (
                <article className="profile-card" key={profile.id}>
                  <div className="card-face card-face--front">
                    <div className="profile-card__header">
                      <div className={`profile-portrait${profile.image ? ' profile-portrait--photo' : ''}`} aria-hidden>
                        {profile.image ? (
                          <img src={profile.image} alt={profile.name} loading="lazy" />
                        ) : (
                          <span>{profile.initials}</span>
                        )}
                      </div>
                      <div className="profile-heading">
                        <h3>{profile.name}</h3>
                        <span>{profile.roll}</span>
                        {profile.location && <small>{profile.location}</small>}
                      </div>
                    </div>
                    <div className="focus-chips">
                      {profile.focus.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-face card-face--back">
                    <h3 className="card-back-title">About</h3>
                    <p>{profile.about}</p>
                    <div className="profile-links">
                      {profile.links.map(([key, url]) => (
                        <a key={key} href={url} target="_blank" rel="noreferrer noopener">
                          {linkIcon(key)}
                        </a>
                      ))}
                    </div>
                    <Link className="profile-message-link" to={`/chats/${profile.id}`}>
                      Message {profile.name.split(' ')?.[0] || 'member'}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="batch-pagination" aria-live="polite">
              <div ref={loadMoreRef} />
              {hasNextPage && (
                <button
                  type="button"
                  className="load-more"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading more profiles…' : 'Load more profiles'}
                </button>
              )}
              {!hasNextPage && currentProfiles.length > 0 && (
                <p className="batch-description">You have reached the end of the {activeYear} community list.</p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Batches;
