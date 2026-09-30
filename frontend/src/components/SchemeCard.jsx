import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, Building2, CheckCircle, ExternalLink } from 'lucide-react';
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
    switch (cat) {
      case 'FARMER': return 'badge-farmer';
      case 'EDUCATION': return 'badge-education';
      case 'WOMEN_CHILD': return 'badge-women';
      case 'HEALTHCARE': return 'badge-healthcare';
      case 'EMPLOYMENT': return 'badge-employment';
      case 'SKILL_DEV': return 'badge-skill';
      case 'HOUSING': return 'badge-housing';
      case 'SENIOR_CITIZEN': return 'badge-senior';
      default: return 'badge-central';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'FARMER': return '🌾';
      case 'EDUCATION': return '🎓';
      case 'WOMEN_CHILD': return '👩';
      case 'HEALTHCARE': return '🏥';
      case 'EMPLOYMENT': return '💼';
      case 'SKILL_DEV': return '🛠️';
      case 'HOUSING': return '🏠';
      case 'SENIOR_CITIZEN': return '👴';
      default: return '🏛️';
    }
  };

  return (
    <div className="scheme-card">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
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
              color: isSaved ? '#d97706' : 'var(--gray-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isSaved ? "Saved in your dashboard" : "Save scheme"}
          >
            <Bookmark style={{ width: '1rem', height: '1rem', fill: isSaved ? '#d97706' : 'none' }} />
          </button>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', lineHeight: '1.3' }}>
          <Link to={`/schemes/${scheme.scheme_id}`} style={{ color: 'var(--primary-900)' }}>
            {scheme.scheme_name}
          </Link>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
          <Building2 style={{ width: '0.85rem', height: '0.85rem' }} />
          <span>{scheme.ministry}</span>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {scheme.short_description}
        </p>

        {scheme.benefit_amount && (
          <div style={{ backgroundColor: 'var(--gray-50)', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', borderLeft: '3px solid var(--accent-emerald)', fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent-emerald-dark)' }}>
            Benefit: {scheme.benefit_amount}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.775rem', color: 'var(--gray-500)', fontWeight: 500 }}>
          {scheme.applicable_state} • {scheme.scheme_type_display || scheme.scheme_type}
        </span>

        <Link to={`/schemes/${scheme.scheme_id}`} className="btn btn-primary btn-sm">
          View Scheme <ArrowRight style={{ width: '0.85rem', height: '0.85rem' }} />
        </Link>
      </div>
    </div>
  );
};
