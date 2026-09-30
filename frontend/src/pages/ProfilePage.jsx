import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { User, Save, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export const ProfilePage = () => {
  const { user, profile: authProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(false);
      if (authProfile) {
        setFormData(authProfile);
      } else {
        const data = await authApi.getProfile();
        setFormData(data);
      }
    } catch (err) {
      setError('Failed to load profile. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (sectionName, title) => (
    <button
      type="button"
      onClick={() => setActiveSection(sectionName)}
      className={`section-tab ${activeSection === sectionName ? 'active' : ''}`}
    >
      {title}
      {activeSection === sectionName && <ChevronRight size={16} />}
    </button>
  );

  if (loading || !formData) {
    return (
      <div className="profile-page">
        <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container" style={{ padding: '2.5rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem' }}>
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
            Complete Your Profile
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Fill in your details to get personalized scheme recommendations and eligibility checks.
          </p>
        </div>

        {/* Success / Error Messages */}
        {error && (
          <div className="alert alert-error" style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#fca5a5',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Info size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            color: '#86efac',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Info size={16} />
            {success}
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Section Tabs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            borderBottom: '1px solid #334159'
          }}>
            {renderSection('personal', 'Personal Info')}
            {renderSection('location', 'Location')}
            {renderSection('income', 'Income & Occupation')}
            {renderSection('social', 'Social Category')}
            {renderSection('farm', 'Farm & Land')}
            {renderSection('family', 'Family & Other')}
          </div>

          {/* Personal Info Section */}
          {activeSection === 'personal' && (
            <div className="profile-section">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem' }}>
                Personal Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleNumberChange}
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="Auto-calculated from DOB"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="TRANSGENDER">Transgender</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Location Section */}
          {activeSection === 'location' && (
            <div className="profile-section">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem' }}>
                Location Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="e.g., Maharashtra, Tamil Nadu, Uttar Pradesh"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="Enter your district"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Income & Occupation Section */}
          {activeSection === 'income' && (
            <div className="profile-section">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem' }}>
                Income & Occupation
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Annual Family Income (₹)
                  </label>
                  <input
                    type="number"
                    name="annual_family_income"
                    value={formData.annual_family_income || ''}
                    onChange={handleNumberChange}
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="Enter annual family income"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Occupation
                  </label>
                  <select
                    name="occupation"
                    value={formData.occupation || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Occupation</option>
                    <option value="FARMER">Farmer</option>
                    <option value="STUDENT">Student</option>
                    <option value="SELF_EMPLOYED">Self-Employed</option>
                    <option value="UNEMPLOYED">Unemployed</option>
                    <option value="PRIVATE_JOB">Private Job</option>
                    <option value="GOVT_JOB">Government Job</option>
                    <option value="LABOURER">Daily Wage Labourer</option>
                    <option value="BUSINESS">Small Business / Artisan</option>
                    <option value="HOMEMAKER">Homemaker</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Education Level
                  </label>
                  <select
                    name="education_level"
                    value={formData.education_level || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Education Level</option>
                    <option value="BELOW_10TH">Below 10th Standard</option>
                    <option value="10TH_PASS">10th Pass (SSLC)</option>
                    <option value="12TH_PASS">12th Pass (HSC/Intermediate)</option>
                    <option value="DIPLOMA">Diploma / ITI</option>
                    <option value="GRADUATE">Graduate (Bachelor's Degree)</option>
                    <option value="POST_GRADUATE">Post Graduate (Master's Degree)</option>
                    <option value="DOCTORATE">Ph.D. / Doctorate</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Social Category Section */}
          {activeSection === 'social' && (
            <div className="profile-section">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem' }}>
                Social Category
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Caste Category
                  </label>
                  <select
                    name="caste_category"
                    value={formData.caste_category || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Category</option>
                    <option value="GENERAL">General</option>
                    <option value="OBC">Other Backward Class (OBC)</option>
                    <option value="SC">Scheduled Caste (SC)</option>
                    <option value="ST">Scheduled Tribe (ST)</option>
                    <option value="EWS">Economically Weaker Section (EWS)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="is_disabled"
                      name="is_disabled"
                      checked={formData.is_disabled || false}
                      onChange={handleChange}
                      style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_disabled" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                      Person with Disability
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                      Disability Percentage
                    </label>
                    <input
                      type="number"
                      name="disability_percentage"
                      value={formData.disability_percentage || ''}
                      onChange={handleNumberChange}
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="0 - 100"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Farm & Land Section */}
          {activeSection === 'farm' && (
            <div className="profile-section">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem' }}>
                Farm & Land Ownership
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="is_student"
                      name="is_student"
                      checked={formData.is_student || false}
                      onChange={handleChange}
                      style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_student" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                      I am currently a Student
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="is_farmer"
                      name="is_farmer"
                      checked={formData.is_farmer || false}
                      onChange={handleChange}
                      style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_farmer" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                      I am a Farmer
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="land_ownership"
                      name="land_ownership"
                      checked={formData.land_ownership || false}
                      onChange={handleChange}
                      style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                    />
                    <label htmlFor="land_ownership" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                      I own Land
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                      Land Holding (acres)
                    </label>
                    <input
                      type="number"
                      name="land_holding_acres"
                      value={formData.land_holding_acres || ''}
                      onChange={handleNumberChange}
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="e.g., 2.5"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Family & Other Section */}
          {activeSection === 'family' && (
            <div className="profile-section">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem' }}>
                Family & Other Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Marital Status
                  </label>
                  <select
                    name="marital_status"
                    value={formData.marital_status || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Marital Status</option>
                    <option value="SINGLE">Single / Unmarried</option>
                    <option value="MARRIED">Married</option>
                    <option value="WIDOW">Widow / Widower</option>
                    <option value="DIVORCED">Divorced / Separated</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                    Employment Status
                  </label>
                  <select
                    name="employment_status"
                    value={formData.employment_status || ''}
                    onChange={handleChange}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Employment Status</option>
                    <option value="EMPLOYED">Employed</option>
                    <option value="UNEMPLOYED">Unemployed</option>
                    <option value="SELF_EMPLOYED">Self-Employed</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="bpl_card_holder"
                    name="bpl_card_holder"
                    checked={formData.bpl_card_holder || false}
                    onChange={handleChange}
                    style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                  />
                  <label htmlFor="bpl_card_holder" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                    Do you hold a Below Poverty Line (BPL) card?
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #334159' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none' }}>
              <X size={16} /> Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .section-tab {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid transparent;
          border-bottom: 2px solid transparent;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.2s;
        }
        .section-tab:hover {
          color: #cbd5e1;
          border-color: #334159;
        }
        .section-tab.active {
          color: #10b981;
          border-bottom-color: #10b981;
        }
        .profile-section h2 {
          grid-column: 1 / -1;
        }
        .form-input {
          padding: 0.5rem 0.75rem;
          background: #1e293b;
          border: 1px solid #334159;
          border-radius: 6px;
          color: #f1f5f9;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: #10b981;
        }
        .form-input::placeholder {
          color: #64748b;
        }
        .spinner-border {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
        }
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
          animation: spinner-border 0.8s linear infinite;
        }
        .spinner-border {
          animation: spinner-border 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
};
