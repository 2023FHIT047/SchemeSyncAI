import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { BadgeCheck, ChevronRight, PlusCircle } from 'lucide-react';

const DECLARATION_ICONS = {
  is_student: '🎓',
  is_farmer: '🌾',
  land_ownership: '🌱',
  is_disabled: '♿',
  bpl_card_holder: '💳',
};

export const ProfileCompletionCard = ({ variant = 'light', compact = false, onJumpToSection = null }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    authApi.getProfileCompletion()
      .then((res) => { if (alive) setData(res); })
      .catch((err) => console.error('Failed to load profile completion:', err));
    return () => { alive = false; };
  }, [profile?.updated_at]);

  if (!data) return null;

  const dark = variant === 'dark';
  const { percent, completed_count, total_count, missing_fields, declarations, is_complete } = data;

  const colors = {
    text: dark ? '#e2e8f0' : 'var(--gray-800)',
    sub: dark ? '#94a3b8' : 'var(--gray-500)',
    border: dark ? '#334159' : 'var(--gray-200)',
    cardBg: dark ? 'rgba(30, 41, 59, 0.65)' : 'var(--white, #ffffff)',
    trackBg: dark ? '#0f172a' : 'var(--gray-100)',
    chipBg: dark ? 'rgba(16, 185, 129, 0.10)' : 'var(--primary-50, #eef4fb)',
    chipBorder: dark ? 'rgba(16, 185, 129, 0.35)' : 'var(--primary-100, #d8e6f5)',
    chipText: dark ? '#a7f3d0' : 'var(--primary-700, #1a5490)',
    percentColor: is_complete ? '#047857' : (dark ? '#34d399' : 'var(--primary-700, #1a5490)'),
    fill: is_complete ? 'var(--accent-emerald)' : 'var(--primary-600)',
  };

  const schemeWord = (n) => `${n.toLocaleString('en-IN')} scheme${n === 1 ? '' : 's'}`;

  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.7rem',
    background: colors.chipBg,
    border: `1px solid ${colors.chipBorder}`,
    borderRadius: '9999px',
    color: colors.chipText,
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    lineHeight: 1.3,
  };

  const handleJump = (section) => {
    if (onJumpToSection) onJumpToSection(section);
    else navigate('/profile');
  };

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
        background: colors.cardBg, border: `1px solid ${colors.border}`,
        borderRadius: '12px', padding: '1rem 1.4rem', marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ flex: '0 0 230px', minWidth: '190px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text }}>Profile Completion</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: colors.percentColor }}>{percent}%</span>
          </div>
          <div className="readiness-bar" style={{ height: '0.5rem', background: colors.trackBg }}>
            <div className="readiness-bar-fill" style={{ width: `${percent}%`, background: colors.fill }} />
          </div>
          <span style={{ fontSize: '0.72rem', color: colors.sub }}>{completed_count} of {total_count} details filled</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minWidth: '220px' }}>
          {is_complete ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#047857' }}>
              <BadgeCheck style={{ width: '1rem', height: '1rem' }} />
              Profile complete — eligibility results are fully personalized.
            </span>
          ) : (
            <>
              <span style={{ fontSize: '0.78rem', color: colors.sub, alignSelf: 'center' }}>Missing:</span>
              {missing_fields.slice(0, 3).map((m) => (
                <button key={m.field} type="button" onClick={() => handleJump(m.section)} style={chipStyle}>
                  {m.label}
                  {m.affects_schemes > 0 && (
                    <span style={{ opacity: 0.8, fontWeight: 700 }}>+{m.affects_schemes.toLocaleString('en-IN')}</span>
                  )}
                </button>
              ))}
              {missing_fields.length > 3 && (
                <button type="button" onClick={() => handleJump(missing_fields[3].section)} style={{ ...chipStyle, background: 'transparent', borderColor: colors.border, color: colors.sub }}>
                  +{missing_fields.length - 3} more
                </button>
              )}
            </>
          )}
        </div>

        {!is_complete && (
          <button type="button" onClick={() => handleJump(missing_fields[0]?.section)} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Complete Profile
            <ChevronRight style={{ width: '0.85rem', height: '0.85rem' }} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: colors.cardBg, border: `1px solid ${colors.border}`,
      borderRadius: '12px', padding: '1.25rem 1.4rem', marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
          <BadgeCheck style={{ width: '1.1rem', height: '1.1rem', color: colors.percentColor }} />
          Profile Completion
        </h2>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: colors.percentColor }}>{percent}%</span>
      </div>

      <div className="readiness-bar" style={{ height: '0.5rem', background: colors.trackBg }}>
        <div className="readiness-bar-fill" style={{ width: `${percent}%`, background: colors.fill }} />
      </div>
      <p style={{ fontSize: '0.78rem', color: colors.sub, marginTop: '0.55rem' }}>
        {completed_count} of {total_count} details filled
        {is_complete && ' — your eligibility results are fully personalized.'}
      </p>

      {!is_complete && (
        <div style={{ marginTop: '0.9rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: colors.sub, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <PlusCircle style={{ width: '0.85rem', height: '0.85rem' }} />
            Add these details to sharpen your results:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {missing_fields.map((m) => (
              <button key={m.field} type="button" onClick={() => handleJump(m.section)} style={chipStyle}>
                {m.label}
                {m.affects_schemes > 0 && (
                  <span style={{ opacity: 0.8, fontWeight: 700 }}>+{schemeWord(m.affects_schemes)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {declarations.some((d) => !d.confirmed) && (
        <div style={{ marginTop: '1rem', paddingTop: '0.9rem', borderTop: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: colors.sub, marginBottom: '0.5rem' }}>
            If any of these apply to you, declaring them can change your results:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {declarations.filter((d) => !d.confirmed).map((d) => (
              <button key={d.field} type="button" onClick={() => handleJump(d.section)} style={chipStyle}>
                <span>{DECLARATION_ICONS[d.field]}</span>
                {d.label}
                {d.affects_schemes > 0 && (
                  <span style={{ opacity: 0.8, fontWeight: 700 }}>{schemeWord(d.affects_schemes)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
