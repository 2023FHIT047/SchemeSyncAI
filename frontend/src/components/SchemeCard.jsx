import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, Building2, MapPin } from 'lucide-react';
import { schemeApi } from '../api/schemeApi';
import { useAuth } from '../context/AuthContext';

export const SchemeCard = ({ scheme, onSaveToggle }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = React.useState(scheme.is_saved || false);
  const [saving, setSaving] = React.useState(false);

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to save schemes to your dashboard.");
      return;
    }
    setSaving(true);
    try {
      const res = await schemeApi.toggleSaveScheme(scheme.scheme_id);
      setIsSaved(res.saved);
      if (onSaveToggle) onSaveToggle(scheme.scheme_id, res.saved);
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryClass = (cat) => {
    const map = {
      FARMER: 'badge-farmer', EDUCATION: 'badge-education', WOMEN_CHILD: 'badge-women',
      HEALTHCARE: 'badge-healthcare', EMPLOYMENT: 'badge-employment', SKILL_DEV: 'badge-skill',
      HOUSING: 'badge-housing', SENIOR_CITIZEN: 'badge-senior'
    };
    return map[cat] || 'badge-central';
  };

  const getCategoryIcon = (cat) => {
    const map = {
      FARMER: '🌾', EDUCATION: '🎓', WOMEN_CHILD: '👩', HEALTHCARE: '🏥',
      EMPLOYMENT: '💼', SKILL_DEV: '🛠️', HOUSING: '🏠', SENIOR_CITIZEN: '👴'
    };
    return map[cat] || '🏛️';
  };

  return (
    <div className="scheme-card">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <span className={`scheme-badge ${getCategoryClass(scheme.category)}`}>
            {getCategoryIcon(scheme.category)} {scheme.category_display || scheme.category}
          </span>
          <button
            onClick={handleBookmark}
            disabled={saving}
            style={{
              background: isSaved ? '#fef3c7' : 'var(--gray-100)',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.4rem',
              cursor: 'pointer',
              color: isSaved ? '#d97706' : 'var(--gray-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title={isSaved ? "Saved in your dashboard" : "Save scheme"}
          >
            <Bookmark style={{ width: '0.95rem', height: '0.95rem', fill: isSaved ? '#d97706' : 'none' }} />
          </button>
        </div>

        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', lineHeight: 1.35, fontWeight: 700 }}>
          <Link to={`/schemes/${scheme.scheme_id}`} style={{ color: 'var(--primary-900)' }}>
            {scheme.scheme_name}
          </Link>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
          <Building2 style={{ width: '0.8rem', height: '0.8rem' }} />
          <span>{scheme.ministry}</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '1rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {scheme.short_description}
        </p>

        {scheme.benefit_amount && (
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            borderLeft: '3px solid var(--accent-emerald)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#065f46'
          }}>
            {scheme.benefit_amount}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <MapPin style={{ width: '0.7rem', height: '0.7rem' }} />
          {scheme.applicable_state} · {scheme.scheme_type_display || scheme.scheme_type}
        </span>

        <Link to={`/schemes/${scheme.scheme_id}`} className="btn btn-primary btn-sm">
          View Details <ArrowRight style={{ width: '0.8rem', height: '0.8rem' }} />
        </Link>
      </div>
    </div>
  );
};
