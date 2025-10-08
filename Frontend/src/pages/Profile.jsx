import React, { useEffect, useMemo, useState } from 'react';
import './Profile.css';
import { useAuth } from '../context/AuthContext';
import { fetchAvatarByEmail } from '../api/users';

const emptyForm = {
  name: '',
  collegeId: '',
  place: '',
  about: '',
  instagram: '',
  linkedin: '',
  github: ''
};

const PROFILE_COMPLETION_FIELDS = ['name', 'collegeId', 'place', 'about', 'instagram', 'linkedin', 'github'];

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'Add your Instagram profile link' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'Link your LinkedIn profile' },
  { key: 'github', label: 'GitHub', icon: '💻', placeholder: 'Share your GitHub username or repository' }
];

const PROFILE_TIPS = [
  'Highlight recent projects or societies you contribute to.',
  'Share how peers can collaborate with you or the tech you love.',
  'Keep your links updated for upcoming recruitment season.'
];

const deriveBatchYear = (collegeId = '') => {
  const match = collegeId.trim().toLowerCase().match(/^b(\d{3})/);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  if (Number.isNaN(value)) return null;
  return 1500 + value;
};

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(() => user?.avatarUrl || null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const rollLocked = Boolean(user?.collegeId);

  const initials = useMemo(() => {
    if (!user?.name) {
      return user?.email?.[0]?.toUpperCase() || '?';
    }
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || '',
      collegeId: user.collegeId || '',
      place: user.place || '',
      about: user.about || '',
      instagram: user.instagram || '',
      linkedin: user.linkedin || '',
      github: user.github || ''
    });
  }, [user]);

  useEffect(() => () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
  }, [avatarPreview]);

  useEffect(() => {
    if (!user || avatarFile) {
      return;
    }

    if (user.avatarUrl) {
      setAvatarPreview(user.avatarUrl);
    } else {
      setAvatarPreview(null);
    }
  }, [user, avatarFile]);

  useEffect(() => {
    let isMounted = true;

    const hasDataUrl = (value) => typeof value === 'string' && value.startsWith('data:');

    if (!user?.email || avatarFile) {
      return () => {
        isMounted = false;
      };
    }

    if (avatarPreview || hasDataUrl(user?.avatarUrl)) {
      return () => {
        isMounted = false;
      };
    }

    (async () => {
      try {
        const blob = await fetchAvatarByEmail(user.email);
        if (!isMounted) return;
        const objectUrl = URL.createObjectURL(blob);
        setAvatarPreview(objectUrl);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Unable to fetch avatar by email', error);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.email, avatarFile, avatarPreview, user?.avatarUrl]);

  const completion = useMemo(() => {
    const total = PROFILE_COMPLETION_FIELDS.length;
    const filled = PROFILE_COMPLETION_FIELDS.reduce((count, field) => {
      const value = form[field];
      return count + (value && value.toString().trim() ? 1 : 0);
    }, 0);
    const percent = total === 0 ? 100 : Math.round((filled / total) * 100);
    return {
      percent,
      filled,
      missing: Math.max(total - filled, 0),
      total
    };
  }, [form]);

  const highlightChips = useMemo(() => {
    const chips = [];
    const roll = form.collegeId?.trim();
    if (roll) {
      chips.push(`Roll • ${roll.toUpperCase()}`);
    }

    const batchYear = deriveBatchYear(roll || user?.collegeId);
    if (batchYear) {
      chips.push(`Batch ${batchYear}`);
    }

    if (form.place?.trim()) {
      chips.push(`Based in ${form.place.trim()}`);
    }

    return chips.slice(0, 3);
  }, [form.collegeId, form.place, user?.collegeId]);

  const socialList = useMemo(
    () => SOCIAL_FIELDS.map((item) => ({
      ...item,
      value: form[item.key]?.trim() || ''
    })),
    [form]
  );

  const aboutPreview = form.about?.trim() || 'Add a quick introduction so peers know what you are excited about.';
  const firstName = form.name?.trim()?.split(' ')[0];
  const heroHeading = firstName ? `Hey ${firstName}, let’s polish your story.` : 'Let’s get your story ready.';
  const progressHint = completion.missing === 0
    ? 'Your profile looks complete! 🎉'
    : `Add ${completion.missing} more ${completion.missing === 1 ? 'detail' : 'details'} to reach 100%.`;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus(null);
  };

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value ?? '');
    });

    if (avatarFile) {
      formData.append('profilePicture', avatarFile);
    }

    try {
      setSubmitting(true);
      setStatus({ type: 'pending', message: 'Updating your profile…' });
      const response = await updateProfile(formData);
      setStatus({ type: 'success', message: response?.message || 'Profile updated successfully.' });
      if (avatarFile) {
        setAvatarFile(null);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.payload?.error || error.message || 'Unable to update your profile right now.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  const displayedAvatar = avatarPreview || user.avatarUrl || null;

  return (
    <section className="profile-page" aria-labelledby="profile-heading">
      <div className="profile-hero">
        <div className="profile-hero__media">
          <div className="profile-avatar" aria-hidden>
            {displayedAvatar ? (
              <img src={displayedAvatar} alt="Profile avatar preview" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <label className="profile-upload">
            <span>Upload a new photo</span>
            <input type="file" accept="image/*" onChange={handleAvatar} />
          </label>
          <p className="profile-hero__signed">
            Signed in as <strong>{user.email}</strong>
          </p>
        </div>
        <div className="profile-hero__body">
          <span className="profile-hero__eyebrow">Bootcamp profile</span>
          <h1 id="profile-heading">{heroHeading}</h1>
          <p className="profile-hero__intro">{aboutPreview}</p>
          <dl className="profile-hero__meta">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Roll ID</dt>
              <dd>{form.collegeId?.trim() ? form.collegeId.trim().toUpperCase() : 'Add your roll ID'}</dd>
            </div>
            <div>
              <dt>Profile status</dt>
              <dd>{completion.percent}% complete</dd>
            </div>
          </dl>
          {highlightChips.length > 0 && (
            <div className="profile-hero__chips">
              {highlightChips.map((chip) => (
                <span key={chip} className="profile-chip">{chip}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <aside className="profile-sidebar">
          <section className="profile-card profile-card--progress">
            <header>
              <h2>Profile completion</h2>
              <span>{completion.percent}%</span>
            </header>
            <div className="profile-progress">
              <div className="profile-progress__bar" aria-hidden>
                <span style={{ width: `${completion.percent}%` }} />
              </div>
              <p className="profile-progress__hint">{progressHint}</p>
            </div>
          </section>

          <section className="profile-card profile-card--socials">
            <h2>Reach out</h2>
            <ul className="profile-social-list">
              {socialList.map((social) => (
                <li key={social.key} className={social.value ? 'is-active' : ''}>
                  <span className="profile-social-list__icon" aria-hidden>{social.icon}</span>
                  <div className="profile-social-list__content">
                    <p className="profile-social-list__label">{social.label}</p>
                    <p className="profile-social-list__value">{social.value || social.placeholder}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="profile-card profile-card--tips">
            <h2>Make it stand out</h2>
            <ul>
              {PROFILE_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="profile-main">
          <form className="profile-form" onSubmit={handleSubmit} noValidate>
            <div className="form-section">
              <div className="form-section__header">
                <h2>Basics</h2>
                <p>Update the essentials that appear on the batches directory.</p>
              </div>
              <div className="form-grid form-grid--two">
                <div className="form-field">
                  <label htmlFor="name">Full name</label>
                  <input id="name" name="name" value={form.name} onChange={handleChange} autoComplete="name" />
                  <p className="field-hint">Use your preferred name for collaborations and the batches page.</p>
                </div>

                <div className="form-field">
                  <label htmlFor="collegeId">Roll ID</label>
                  <input
                    id="collegeId"
                    name="collegeId"
                    value={form.collegeId}
                    onChange={handleChange}
                    autoComplete="off"
                    disabled={rollLocked}
                  />
                  <p className="field-hint">
                    {rollLocked
                      ? 'Roll ID is locked. Contact the bootcamp team if it needs to be corrected.'
                      : 'Example: b520123. This links you to the correct cohort.'}
                  </p>
                </div>

                <div className="form-field">
                  <label htmlFor="place">Location</label>
                  <input id="place" name="place" value={form.place} onChange={handleChange} placeholder="Where are you currently based?" />
                </div>

                <div className="form-field form-field--full">
                  <label htmlFor="about">About you</label>
                  <textarea
                    id="about"
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell the community what you are excited about."
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__header">
                <h2>Online presence</h2>
                <p>Connect your socials so people can follow your work.</p>
              </div>
              <div className="form-grid form-grid--two">
                <div className="form-field">
                  <label htmlFor="instagram">Instagram</label>
                  <input id="instagram" name="instagram" value={form.instagram} onChange={handleChange} placeholder="https://instagram.com/username" />
                </div>

                <div className="form-field">
                  <label htmlFor="linkedin">LinkedIn</label>
                  <input id="linkedin" name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
                </div>

                <div className="form-field">
                  <label htmlFor="github">GitHub</label>
                  <input id="github" name="github" value={form.github} onChange={handleChange} placeholder="https://github.com/username" />
                </div>
              </div>
            </div>

            {status && (
              <div className={`profile-status profile-status--${status.type}`} role="status">
                <strong>
                  {status.type === 'success'
                    ? 'All set!'
                    : status.type === 'pending'
                      ? 'Working on it'
                      : 'Let’s try that again'}
                </strong>
                <span>{status.message}</span>
              </div>
            )}

            <div className="profile-actions">
              <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Profile;
