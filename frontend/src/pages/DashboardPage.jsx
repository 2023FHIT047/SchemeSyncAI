import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schemeApi } from '../api/schemeApi';
import { SchemeCard } from '../components/SchemeCard';
import { DocumentScanner } from '../components/DocumentScanner';
import { User, Bookmark, Edit3, Save, X } from 'lucide-react';

export const DashboardPage = () => {
  const { user, profile, updateProfile } = useAuth();
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const loadSaved = async () => {
    try {
      const res = await schemeApi.getSavedSchemes();
      setSavedSchemes(res.results || res);
    } catch (err) {
      console.error("Failed to load saved schemes:", err);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleOCRProfileUpdate = async (updates) => {
    const merged = { ...formData, ...updates };
    setFormData(merged);
    try {
      await updateProfile(merged);
    } catch (err) {
      console.error("Failed to apply OCR updates:", err);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div className="page-header">
        <h1>Citizen Dashboard</h1>
        <p>Manage your personal profile and saved government welfare schemes.</p>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Profile + OCR Scanner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="profile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <User style={{ width: '1.1rem', height: '1.1rem', color: 'var(--primary-700)' }} /> Personal Profile
            </h3>
            <button
              onClick={() => setEditing(!editing)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.35rem 0.7rem' }}
            >
              {editing ? <X style={{ width: '0.8rem', height: '0.8rem' }} /> : <Edit3 style={{ width: '0.8rem', height: '0.8rem' }} />}
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="full_name" value={formData.full_name || ''} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" value={formData.gender || ''} onChange={handleChange} className="form-select">
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input type="text" name="state" value={formData.state || ''} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Annual Family Income (₹)</label>
                <input type="number" name="annual_family_income" value={formData.annual_family_income || ''} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Occupation</label>
                <select name="occupation" value={formData.occupation || ''} onChange={handleChange} className="form-select">
                  <option value="">Select Occupation</option>
                  <option value="FARMER">Farmer</option>
                  <option value="STUDENT">Student</option>
                  <option value="SELF_EMPLOYED">Self-Employed</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                  <option value="PRIVATE_JOB">Private Job</option>
                  <option value="GOVT_JOB">Government Job</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.25rem' }}>
                <label className="form-checkbox">
                  <input type="checkbox" name="is_farmer" checked={!!formData.is_farmer} onChange={handleChange} />
                  Registered Farmer Status
                </label>
                <label className="form-checkbox">
                  <input type="checkbox" name="is_student" checked={!!formData.is_student} onChange={handleChange} />
                  Enrolled Student Status
                </label>
                <label className="form-checkbox">
                  <input type="checkbox" name="land_ownership" checked={!!formData.land_ownership} onChange={handleChange} />
                  Cultivable Land Ownership
                </label>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '0.5rem', width: '100%' }}>
                <Save style={{ width: '0.9rem', height: '0.9rem' }} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          ) : (
            <div>
              <div className="profile-item"><span>Full Name</span><span>{profile?.full_name || '—'}</span></div>
              <div className="profile-item"><span>Age</span><span>{profile?.age ? `${profile.age} yrs` : '—'}</span></div>
              <div className="profile-item"><span>Gender</span><span>{profile?.gender || '—'}</span></div>
              <div className="profile-item"><span>State</span><span>{profile?.state || '—'}</span></div>
              <div className="profile-item"><span>Family Income</span><span>{profile?.annual_family_income ? `₹${profile.annual_family_income.toLocaleString('en-IN')}/yr` : '—'}</span></div>
              <div className="profile-item"><span>Occupation</span><span>{profile?.occupation || '—'}</span></div>
              <div className="profile-item"><span>Farmer</span><span>{profile?.is_farmer ? '🌾 Yes' : 'No'}</span></div>
              <div className="profile-item"><span>Student</span><span>{profile?.is_student ? '🎓 Yes' : 'No'}</span></div>
              <div className="profile-item"><span>Land Ownership</span><span>{profile?.land_ownership ? 'Yes' : 'No'}</span></div>
            </div>
          )}
        </div>

        {/* OCR Document Scanner */}
        <DocumentScanner onProfileUpdate={handleOCRProfileUpdate} />
        </div>

        {/* Saved Schemes */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bookmark style={{ width: '1.15rem', height: '1.15rem', color: 'var(--accent-saffron)' }} />
            Saved Schemes
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '0.15rem 0.55rem', borderRadius: '9999px' }}>
              {savedSchemes.length}
            </span>
          </h2>

          {savedSchemes.length === 0 ? (
            <div className="empty-state">
              <Bookmark style={{ width: '2.5rem', height: '2.5rem', color: 'var(--gray-300)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>No saved schemes yet</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                Browse the scheme directory and bookmark schemes for quick access here.
              </p>
            </div>
          ) : (
            <div className="scheme-grid">
              {savedSchemes.map(item => (
                <SchemeCard key={item.id} scheme={item.scheme} onSaveToggle={loadSaved} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
