import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schemeApi } from '../api/schemeApi';
import { SchemeCard } from '../components/SchemeCard';
import { User, Bookmark, CheckCircle2, Edit3, Save } from 'lucide-react';

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

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Citizen Dashboard</h1>
        <p style={{ color: 'var(--gray-600)' }}>Manage your personal circumstances profile and saved government welfare schemes.</p>
      </div>

      <div className="dashboard-grid">
        {/* Profile Card & Form */}
        <div>
          <div className="profile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User style={{ width: '1.2rem', height: '1.2rem', color: 'var(--primary-700)' }} /> Personal Profile
              </h3>
              <button onClick={() => setEditing(!editing)} className="btn btn-secondary btn-sm">
                <Edit3 style={{ width: '0.8rem', height: '0.8rem' }} /> {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                  <input type="text" name="full_name" value={formData.full_name || ''} onChange={handleChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Age</label>
                  <input type="number" name="age" value={formData.age || ''} onChange={handleChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Gender</label>
                  <select name="gender" value={formData.gender || ''} onChange={handleChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}>
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>State</label>
                  <input type="text" name="state" value={formData.state || ''} onChange={handleChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Annual Family Income (₹)</label>
                  <input type="number" name="annual_family_income" value={formData.annual_family_income || ''} onChange={handleChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Occupation</label>
                  <select name="occupation" value={formData.occupation || ''} onChange={handleChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}>
                    <option value="">Select Occupation</option>
                    <option value="FARMER">Farmer</option>
                    <option value="STUDENT">Student</option>
                    <option value="SELF_EMPLOYED">Self-Employed</option>
                    <option value="UNEMPLOYED">Unemployed</option>
                    <option value="PRIVATE_JOB">Private Job</option>
                    <option value="GOVT_JOB">Government Job</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" name="is_farmer" checked={!!formData.is_farmer} onChange={handleChange} /> Registered Farmer Status
                  </label>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" name="is_student" checked={!!formData.is_student} onChange={handleChange} /> Enrolled Student Status
                  </label>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" name="land_ownership" checked={!!formData.land_ownership} onChange={handleChange} /> Cultivable Land Ownership
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ marginTop: '1rem' }}>
                  <Save style={{ width: '0.85rem', height: '0.85rem' }} /> {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            ) : (
              <div>
                <div className="profile-item"><span>Full Name</span><span>{profile?.full_name || 'Not set'}</span></div>
                <div className="profile-item"><span>Age</span><span>{profile?.age || 'Not set'} yrs</span></div>
                <div className="profile-item"><span>Gender</span><span>{profile?.gender || 'Not set'}</span></div>
                <div className="profile-item"><span>State</span><span>{profile?.state || 'Not set'}</span></div>
                <div className="profile-item"><span>Family Income</span><span>₹{profile?.annual_family_income || '0'} / year</span></div>
                <div className="profile-item"><span>Occupation</span><span>{profile?.occupation || 'Not set'}</span></div>
                <div className="profile-item"><span>Farmer Status</span><span>{profile?.is_farmer ? 'Yes 🌾' : 'No'}</span></div>
                <div className="profile-item"><span>Student Status</span><span>{profile?.is_student ? 'Yes 🎓' : 'No'}</span></div>
                <div className="profile-item"><span>Land Ownership</span><span>{profile?.land_ownership ? 'Yes' : 'No'}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Saved Schemes */}
        <div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bookmark style={{ width: '1.2rem', height: '1.2rem', color: 'var(--accent-saffron)' }} /> Saved Schemes ({savedSchemes.length})
          </h2>

          {savedSchemes.length === 0 ? (
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--gray-200)' }}>
              <p style={{ color: 'var(--gray-600)' }}>You haven't saved any schemes yet. Browse the scheme directory to bookmark schemes for quick reference.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
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
