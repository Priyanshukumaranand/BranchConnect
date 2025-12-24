import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from '../api/users';
import './Profile.css';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

// Social platform configuration
const SOCIAL_PLATFORMS = [
  { id: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { id: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/username' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { id: 'website', label: 'Personal Website', placeholder: 'https://your-portfolio.com' }
];

const CP_PLATFORMS = [
  { id: 'leetcode', label: 'LeetCode', placeholder: 'https://leetcode.com/username' },
  { id: 'codeforces', label: 'Codeforces', placeholder: 'https://codeforces.com/profile/username' },
  { id: 'codechef', label: 'CodeChef', placeholder: 'https://www.codechef.com/users/username' },
  { id: 'hackerrank', label: 'HackerRank', placeholder: 'https://hackerrank.com/username' }
];

const Profile = () => {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    batch: '',
    branch: '',
    skills: '', // stored as comma-separated string for editing
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    website: '',
    leetcode: '',
    codeforces: '',
    codechef: '',
    hackerrank: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [feedback, setFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        batch: user.batch || '',
        branch: user.branch || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
        github: user.socialLinks?.github || '',
        linkedin: user.socialLinks?.linkedin || '',
        twitter: user.socialLinks?.twitter || '',
        instagram: user.socialLinks?.instagram || '',
        website: user.socialLinks?.website || '',
        leetcode: user.cpProfiles?.leetcode || '',
        codeforces: user.cpProfiles?.codeforces || '',
        codechef: user.cpProfiles?.codechef || '',
        hackerrank: user.cpProfiles?.hackerrank || ''
      });
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: (updatedUser) => {
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
      refetchUser(); // Update auth context
      queryClient.setQueryData(['user', user.id], updatedUser);
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error?.message || 'Failed to update profile.' });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => updatePassword(data),
    onSuccess: () => {
      setPasswordFeedback({ type: 'success', message: 'Password changed successfully.' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordFeedback(null), 3000);
    },
    onError: (error) => {
      setPasswordFeedback({ type: 'error', message: error?.message || 'Failed to update password.' });
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setFeedback(null);

    // Prepare payload
    const payload = {
      name: formData.name,
      bio: formData.bio,
      batch: formData.batch,
      branch: formData.branch,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      socialLinks: {
        github: formData.github,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        instagram: formData.instagram,
        website: formData.website
      },
      cpProfiles: {
        leetcode: formData.leetcode,
        codeforces: formData.codeforces,
        codechef: formData.codechef,
        hackerrank: formData.hackerrank
      }
    };

    profileMutation.mutate(payload);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    passwordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  // Helper to calculate profile completion (rough estimate)
  const completionPercentage = (() => {
    if (!user) return 0;
    const fields = ['name', 'bio', 'batch', 'branch', 'skills', 'image'];
    const filled = fields.filter(f => user[f] && user[f].length > 0).length;
    const socialFilled = Object.values(user.socialLinks || {}).filter(Boolean).length > 0 ? 1 : 0;
    return Math.round(((filled + socialFilled) / (fields.length + 1)) * 100);
  })();

  return (
    <div className="profile-page">
      <header className="profile-page__header">
        <h1>Your Profile</h1>
        <p>Manage your public presence and account settings.</p>
      </header>

      <div className="profile-grid">

        {/* Left Column: Avatar & Basic Info */}
        <div className="profile-col-left">
          <Card className="profile-card profile-card--hero" variant="glass">
            <div className="profile-card__avatar-section">
              <Avatar
                src={user?.image || user?.avatarPath}
                name={user?.name || user?.email}
                size="xl"
                className="profile-avatar-xl"
              />
              {/* Image upload logic would go here, maybe a small button overlay */}
              <div className="profile-completion">
                <span>Profile Completion</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${completionPercentage}%` }}></div>
                </div>
                <span className="progress-text">{completionPercentage}%</span>
              </div>
            </div>

            <div className="profile-card__summary">
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
              {user?.role && <span className="role-badge">{user.role}</span>}
            </div>
          </Card>

          <Card className="profile-card" variant="default">
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              {passwordFeedback && (
                <div className={`form-feedback form-feedback--${passwordFeedback.type}`}>
                  {passwordFeedback.message}
                </div>
              )}

              <Button
                type="submit"
                variant="secondary"
                loading={passwordMutation.isPending}
                fullWidth
              >
                Update Password
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Edit Details */}
        <div className="profile-col-right">
          <Card className="profile-card" variant="default">
            <header className="card-header">
              <div>
                <h2>Public Details</h2>
                <p>This information will be displayed on your public profile.</p>
              </div>
            </header>

            <form onSubmit={handleProfileSubmit} className="profile-form">
              {/* Basic Info */}
              <fieldset className="form-section">
                <legend>Basic Information</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Aditi Sharma"
                    />
                  </div>
                  <div className="form-group">
                    <label>Batch</label>
                    <input
                      type="text"
                      name="batch"
                      value={formData.batch}
                      onChange={handleInputChange}
                      placeholder="e.g. 2k21"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Branch</label>
                    <select name="branch" value={formData.branch} onChange={handleInputChange}>
                      <option value="">Select Branch</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Skills <small>(comma separated)</small></label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="React, Python, Machine Learning..."
                  />
                </div>
              </fieldset>

              {/* Social Links */}
              <fieldset className="form-section">
                <legend>Social Profiles</legend>
                <div className="form-grid">
                  {SOCIAL_PLATFORMS.map(platform => (
                    <div className="form-group" key={platform.id}>
                      <label>{platform.label}</label>
                      <input
                        type="url"
                        name={platform.id}
                        value={formData[platform.id]}
                        onChange={handleInputChange}
                        placeholder={platform.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* CP Profiles */}
              <fieldset className="form-section">
                <legend>Competitive Programming</legend>
                <div className="form-grid">
                  {CP_PLATFORMS.map(platform => (
                    <div className="form-group" key={platform.id}>
                      <label>{platform.label}</label>
                      <input
                        type="url"
                        name={platform.id}
                        value={formData[platform.id]}
                        onChange={handleInputChange}
                        placeholder={platform.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              {feedback && (
                <div className={`form-feedback form-feedback--${feedback.type}`}>
                  {feedback.message}
                </div>
              )}

              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={profileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Profile;
