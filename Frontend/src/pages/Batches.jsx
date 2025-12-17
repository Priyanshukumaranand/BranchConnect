import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Batches.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchBatchMembers } from '../api/batches';
import { API_BASE_URL } from '../api/client';

const DEFAULT_BATCH_YEARS = [];
const DEFAULT_BRANCH_KEY = 'all';
const BASE_BRANCH_OPTION = { key: 'all', label: 'All branches', shortLabel: 'All branches', alias: null };
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

const deriveBatchYearFromId = (id) => {
  if (!id || typeof id !== 'string') return null;
  const match = id.toLowerCase().match(/^b\d(\d{2})/);
  if (!match) return null;
  const digits = Number.parseInt(match[1], 10);
  if (Number.isNaN(digits)) return null;
  return 2000 + digits;
};

const truncate = (value, limit = 180) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  const sliceEnd = trimmed.lastIndexOf(' ', limit - 3);
  const safeIndex = sliceEnd > limit / 2 ? sliceEnd : limit - 3;
  return `${trimmed.slice(0, safeIndex).trim()}...`;
};

const normaliseProfile = (user) => {
  const name = user.name || user.email?.split('@')[0] || 'Branch Connect Member';
  const roll = user.collegeId ? user.collegeId.toUpperCase() : user.email?.substring(0, 7)?.toUpperCase() || '—';
  const email = user.email || '';
  const batchYear = user.batchYear || deriveBatchYearFromId(user.collegeId || roll) || null;
  const batchTag = batchYear ? `Batch ${batchYear}` : null;
  const branchKey = user.branch?.key || user.branch?.code || user.branch?.short?.toLowerCase() || null;
  const branchShort = user.branch?.short || user.branch?.label || branchKey || null;
  const branchLabel = user.branch?.label || branchShort || null;
  const branchDetails = branchKey || branchShort || branchLabel
    ? { key: branchKey, short: branchShort, label: branchLabel }
    : null;
  const focus = Array.from(new Set([
    batchTag,
    branchShort,
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
    about: truncate(user.about || 'Details coming soon. Reach out to the Branch Connect organisers to update this profile.'),
    focus: focus.length > 0 ? focus : ['Branch Connect Member'],
    links,
    image,
    location: user.place || null,
    batchYear,
    branch: branchDetails
  };
};

const Batches = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialYearFromQuery = searchParams.get('year');
  const initialBranchFromQuery = searchParams.get('branch');
  const [searchTerm, setSearchTerm] = useState('');

  const initialBranchKey = useMemo(() => {
    if (!initialBranchFromQuery) {
      return DEFAULT_BRANCH_KEY;
    }
    return initialBranchFromQuery.toLowerCase();
  }, [initialBranchFromQuery]);

  const initialYears = useMemo(() => {
    const base = ['all', ...DEFAULT_BATCH_YEARS];
    if (initialYearFromQuery && !base.includes(initialYearFromQuery)) {
      return ['all', initialYearFromQuery, ...DEFAULT_BATCH_YEARS];
    }
    return base;
  }, [initialYearFromQuery]);

  const [availableYears, setAvailableYears] = useState(initialYears);
  const [activeYear, setActiveYear] = useState(() => initialYearFromQuery || 'all');
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

  // Temporarily disable branch filtering
  const branchAlias = null;

  const {
    data,
    status,
    error,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['batches', 'all', activeYear],
    queryFn: ({ pageParam = 1, signal }) => fetchBatchMembers({
      year: activeYear === 'all' ? undefined : activeYear,
      branch: null,
      page: pageParam,
      limit: PAGE_SIZE,
      signal
    }),
    enabled: Boolean(activeYear),
    initialPageParam: 1,
    staleTime: 120000,
    refetchOnWindowFocus: false,
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

  const metaYears = useMemo(() => {
    const fromYears = data?.pages?.map((page) => page?.meta?.years || []).flat() || [];
    const fromBatches = data?.pages?.map((page) => page?.meta?.batches || []).flat() || [];
    const batchYears = fromBatches
      .map((entry) => entry?.year)
      .filter(Boolean);

    const normalized = [...fromYears, ...batchYears]
      .filter(Boolean)
      .map((year) => year.toString());

    return Array.from(new Set(normalized)).sort((a, b) => Number(b) - Number(a));
  }, [data]);

  const metaBranches = useMemo(() => {
    const fromMeta = data?.pages?.map((page) => page?.meta?.branches || []).flat() || [];
    const byKey = new Map();
    fromMeta.forEach((branch) => {
      if (!branch?.key) return;
      const key = branch.key.toString().toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          shortLabel: branch.short || branch.label || key,
          label: branch.label || branch.short || key
        });
      }
    });
    return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const filteredProfiles = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) {
      return currentProfiles;
    }

    return currentProfiles.filter((profile) => {
      const haystack = [
        profile.name,
        profile.roll,
        profile.about,
        ...profile.focus
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [currentProfiles, searchTerm]);

  const totalProfiles = data?.pages?.[0]?.total ?? 0;

  const yearsFromProfiles = useMemo(() => {
    const fromData = currentProfiles
      .map((profile) => profile.batchYear || null)
      .filter(Boolean)
      .map((year) => year.toString());
    const unique = Array.from(new Set(fromData));
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [currentProfiles]);

  const branchesFromProfiles = useMemo(() => {
    const entries = currentProfiles
      .map((profile) => profile.branch)
      .filter(Boolean)
      .map((branch) => ({
        key: (branch.key || branch.short || branch.label || '').toString().toLowerCase(),
        shortLabel: branch.short || branch.label || 'Branch',
        label: branch.label || branch.short || 'Branch'
      }))
      .filter((branch) => branch.key);

    const byKey = new Map();
    entries.forEach((branch) => {
      if (!byKey.has(branch.key)) {
        byKey.set(branch.key, branch);
      }
    });

    return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [currentProfiles]);

  useEffect(() => {
    setAvailableYears((prev) => {
      const merged = ['all', ...metaYears, ...yearsFromProfiles];
      if (activeYear && !merged.includes(activeYear)) {
        merged.splice(1, 0, activeYear);
      }
      return Array.from(new Set(merged));
    });
  }, [yearsFromProfiles, metaYears, activeYear]);

  const branchOptions = useMemo(() => [BASE_BRANCH_OPTION], []);

  useEffect(() => {
    setActiveBranch(DEFAULT_BRANCH_KEY);
  }, []);

  useEffect(() => {
    const branchExists = branchOptions.some((option) => option.key === activeBranch);
    if (!branchExists) {
      setActiveBranch(DEFAULT_BRANCH_KEY);
    }
  }, [branchOptions, activeBranch]);

  const activeBranchOption = useMemo(
    () => branchOptions.find((option) => option.key === activeBranch) || BASE_BRANCH_OPTION,
    [branchOptions, activeBranch]
  );

  const years = useMemo(
    () => Array.from(new Set(availableYears.filter(Boolean))),
    [availableYears]
  );

  const searchValue = searchTerm.trim();
  const searchActive = searchValue.length > 0;
  const visibleProfiles = filteredProfiles;
  const visibleCount = visibleProfiles.length;

  const handleYearChange = (year) => {
    setActiveYear(year);
    const next = new URLSearchParams(searchParams);
    if (year === 'all') {
      next.delete('year');
    } else {
      next.set('year', year);
    }
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

  const branchDescriptor = 'all branches';

  const yearDescriptor = activeYear === 'all' ? 'all years' : `Batch ${activeYear}`;

  const description = searchActive
    ? visibleCount
      ? `${visibleCount} match${visibleCount === 1 ? '' : 'es'} for "${searchValue}" in ${yearDescriptor} across ${branchDescriptor}.`
      : `No matches for "${searchValue}" in ${yearDescriptor} across ${branchDescriptor} yet.`
    : `Core members and contributors from ${yearDescriptor} in ${branchDescriptor}${totalProfiles ? ` · Showing ${visibleCount} of ${totalProfiles}` : ''}.`;

  return (
    <div className="batches-page">
      <header className="batches-header">
        <h1>Connect across every branch.</h1>
        <p>
          Browse by branch and batch, discover mentors, and connect with peers. Profiles highlight interests, recent projects, and the communities they build on campus.
        </p>
      </header>

      <div className="batch-controls">
        <div className="batch-filters">
          <div className="batch-filter-group">
            <span className="batch-filter-label">Branch</span>
            <div className="batch-tabs" role="tablist" aria-label="Select branch">
              {branchOptions.map((option) => (
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
                      {/* Branch filter hidden intentionally */}
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
                  {year === 'all' ? 'All years' : `Batch ${year}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="batch-search">
          <input
            type="search"
            aria-label="Search members"
            placeholder="Search by name, roll, or focus"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
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
            <p className="batch-description">{description}</p>
            {visibleProfiles.length > 0 ? (
              <div className="profile-grid">
                {visibleProfiles.map((profile) => (
                  <article className="profile-card" key={profile.id}>
                    <Link className="profile-card__link" to={`/members/${profile.id}`}>
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
                          <div className="profile-heading__row">
                            <span className="meta-chip">{profile.roll}</span>
                            {profile.location && <span className="meta-chip meta-chip--muted">{profile.location}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="focus-chips">
                        {profile.focus.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="profile-empty">
                <p>
                  No matches yet.{searchActive ? ' Adjust your search or load more profiles to explore the community.' : ' Load more profiles to discover more members.'}
                </p>
              </div>
            )}
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
