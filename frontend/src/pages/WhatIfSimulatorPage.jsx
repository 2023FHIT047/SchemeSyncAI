import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eligibilityApi } from '../api/eligibilityApi';
import { FlaskConical, Sparkles, TrendingUp, TrendingDown, CheckCircle2, RotateCcw, Info, Lightbulb } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const DEFAULTS = {
  age: 25,
  annual_family_income: 100000,
  state: '',
  gender: '',
  caste_category: '',
  occupation: '',
  is_student: false,
  is_farmer: false,
  land_ownership: false,
  bpl_card_holder: false,
  is_disabled: false,
};

const fromProfile = (profile) => ({
  age: profile?.age || DEFAULTS.age,
  annual_family_income: profile?.annual_family_income
    ? Number(profile.annual_family_income) : DEFAULTS.annual_family_income,
  state: profile?.state || '',
  gender: profile?.gender || '',
  caste_category: profile?.caste_category || '',
  occupation: profile?.occupation || '',
  is_student: !!profile?.is_student,
  is_farmer: !!profile?.is_farmer,
  land_ownership: !!profile?.land_ownership,
  bpl_card_holder: !!profile?.bpl_card_holder,
  is_disabled: !!profile?.is_disabled,
});

const PRESETS = [
  {
    label: 'School/College Student',
    values: { age: 18, annual_family_income: 250000, occupation: 'STUDENT', is_student: true, is_farmer: false, land_ownership: false },
  },
  {
    label: 'Senior Citizen',
    values: { age: 65, annual_family_income: 100000, occupation: '', is_student: false, is_farmer: false, land_ownership: false },
  },
  {
    label: 'Small Farmer',
    values: { age: 38, annual_family_income: 120000, occupation: 'FARMER', is_student: false, is_farmer: true, land_ownership: true },
  },
  {
    label: 'Low-income Family (BPL)',
    values: { age: 35, annual_family_income: 60000, bpl_card_holder: true },
  },
];

const formatMoney = (v) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2).replace(/\.?0+$/, '')} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
};

const buildPayload = (sim) => {
  const payload = {};
  Object.entries(sim).forEach(([k, v]) => {
    if (v === '' || v === null || v === undefined) return;
    payload[k] = v;
  });
  return payload;
};

const ToggleChip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '0.4rem 0.85rem',
      borderRadius: '999px',
      fontSize: '0.8rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s',
      border: active ? '1.5px solid var(--accent-emerald-dark)' : '1px solid var(--gray-300)',
      background: active ? 'var(--accent-emerald-light)' : 'white',
      color: active ? '#047857' : 'var(--gray-600)',
    }}
  >
    {children}
  </button>
);

const FieldLabel = ({ children, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>{children}</label>
    {value !== undefined && (
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-700)' }}>{value}</span>
    )}
  </div>
);

const selectStyle = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--gray-300)',
  fontSize: '0.875rem',
  background: 'white',
  color: 'var(--gray-800)',
};

export const WhatIfSimulatorPage = () => {
  const { user, profile } = useAuth();
  const [sim, setSim] = useState(DEFAULTS);
  const [seeded, setSeeded] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const reqSeq = useRef(0);
  const debounceRef = useRef();

  useEffect(() => {
    if (profile && !seeded) {
      setSim(fromProfile(profile));
      setSeeded(true);
    }
  }, [profile, seeded]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runSimulation, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim]);

  const runSimulation = async () => {
    const seq = ++reqSeq.current;
    setLoading(true);
    try {
      const res = await eligibilityApi.simulate(buildPayload(sim));
      if (seq === reqSeq.current) {
        setResult(res);
        if (!res.is_authenticated) setActiveTab('all');
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      if (seq === reqSeq.current) setLoading(false);
    }
  };

  const update = (key, value) => setSim(prev => ({ ...prev, [key]: value }));

  const applyPreset = (preset) => {
    setSim(prev => ({ ...DEFAULTS, state: prev.state, gender: prev.gender, caste_category: prev.caste_category, ...preset.values }));
  };

  const resetToBase = () => {
    if (profile) setSim(fromProfile(profile));
    else setSim(DEFAULTS);
  };

  const newlyEligible = result?.newly_eligible || [];
  const lostEligible = result?.no_longer_eligible || [];
  const allEligible = result?.eligible_schemes || [];
  const delta = result?.is_authenticated ? result.simulated_eligible_count - result.real_eligible_count : null;

  const tabs = result?.is_authenticated
    ? [
        { id: 'new', label: `New unlocks (${newlyEligible.length})` },
        { id: 'lost', label: `No longer eligible (${lostEligible.length})` },
        { id: 'all', label: `All eligible (${allEligible.length}${result.eligible_truncated ? '+' : ''})` },
      ]
    : [
        { id: 'all', label: `All eligible (${allEligible.length}${result?.eligible_truncated ? '+' : ''})` },
      ];

  const activeList = activeTab === 'new' ? newlyEligible : activeTab === 'lost' ? lostEligible : allEligible;

  const emptyMessages = {
    new: 'Nothing new unlocks under these settings — try moving a slider or toggling an option.',
    lost: 'You keep every scheme you currently qualify for under these settings.',
    all: 'No schemes match this hypothetical profile. Try adjusting age, income, or state.',
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-700), var(--accent-emerald))', borderRadius: '12px', padding: '0.65rem', display: 'flex' }}>
            <FlaskConical style={{ width: '1.6rem', height: '1.6rem', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.9rem', margin: 0 }}>What-If Simulator</h1>
            <p style={{ color: 'var(--gray-600)', margin: '0.2rem 0 0', fontSize: '0.925rem' }}>
              Explore how changing your circumstances affects scheme eligibility — <strong>nothing here is saved to your profile</strong>.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: '1.75rem', alignItems: 'start' }} className="sim-grid">
        {/* ============ CONTROL PANEL ============ */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', padding: '1.5rem', position: 'sticky', top: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles style={{ width: '1rem', height: '1rem', color: 'var(--accent-emerald)' }} />
              Hypothetical Profile
            </h3>
            <button
              onClick={resetToBase}
              className="btn btn-outline-navy btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              title={profile ? 'Reset to your saved profile values' : 'Reset to defaults'}
            >
              <RotateCcw style={{ width: '0.75rem', height: '0.75rem' }} />
              {profile ? 'My Profile' : 'Reset'}
            </button>
          </div>

          {/* Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <FieldLabel>Quick scenarios</FieldLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {PRESETS.map(p => (
                <ToggleChip key={p.label} active={false} onClick={() => applyPreset(p)}>{p.label}</ToggleChip>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--gray-100)', margin: '0 0 1.25rem' }} />

          {/* Age */}
          <div style={{ marginBottom: '1.25rem' }}>
            <FieldLabel value={`${sim.age} years`}>Age</FieldLabel>
            <input
              type="range" min="12" max="90" value={sim.age}
              onChange={(e) => update('age', Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-emerald)' }}
            />
          </div>

          {/* Income */}
          <div style={{ marginBottom: '1.25rem' }}>
            <FieldLabel value={formatMoney(sim.annual_family_income)}>Annual Family Income</FieldLabel>
            <input
              type="range" min="0" max="2000000" step="25000" value={sim.annual_family_income}
              onChange={(e) => update('annual_family_income', Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-emerald)' }}
            />
          </div>

          {/* State */}
          <div style={{ marginBottom: '1rem' }}>
            <FieldLabel>State / UT</FieldLabel>
            <select value={sim.state} onChange={(e) => update('state', e.target.value)} style={selectStyle}>
              <option value="">— Not specified —</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Gender + Caste */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <FieldLabel>Gender</FieldLabel>
              <select value={sim.gender} onChange={(e) => update('gender', e.target.value)} style={selectStyle}>
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="TRANSGENDER">Transgender</option>
              </select>
            </div>
            <div>
              <FieldLabel>Caste Category</FieldLabel>
              <select value={sim.caste_category} onChange={(e) => update('caste_category', e.target.value)} style={selectStyle}>
                <option value="">—</option>
                <option value="GENERAL">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
          </div>

          {/* Occupation */}
          <div style={{ marginBottom: '1.25rem' }}>
            <FieldLabel>Occupation</FieldLabel>
            <select value={sim.occupation} onChange={(e) => update('occupation', e.target.value)} style={selectStyle}>
              <option value="">— Not specified —</option>
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

          {/* Flags */}
          <div style={{ marginBottom: '0.5rem' }}>
            <FieldLabel>Additional attributes</FieldLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <ToggleChip active={sim.is_student} onClick={() => update('is_student', !sim.is_student)}>Student</ToggleChip>
              <ToggleChip active={sim.is_farmer} onClick={() => update('is_farmer', !sim.is_farmer)}>Farmer</ToggleChip>
              <ToggleChip active={sim.land_ownership} onClick={() => update('land_ownership', !sim.land_ownership)}>Owns Land</ToggleChip>
              <ToggleChip active={sim.bpl_card_holder} onClick={() => update('bpl_card_holder', !sim.bpl_card_holder)}>BPL Card</ToggleChip>
              <ToggleChip active={sim.is_disabled} onClick={() => update('is_disabled', !sim.is_disabled)}>Disabled</ToggleChip>
            </div>
          </div>
        </div>

        {/* ============ RESULTS PANEL ============ */}
        <div>
          {/* Anonymous hint */}
          {!user && (
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
              <Info style={{ width: '1.1rem', height: '1.1rem', color: '#1d4ed8', flexShrink: 0, marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                You are simulating anonymously. <Link to="/login" style={{ fontWeight: 700 }}>Log in</Link> to compare
                these results against your saved profile and see exactly which schemes you would gain or lose.
              </span>
            </div>
          )}

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-800) 100%)', borderRadius: 'var(--radius-md)', padding: '1.25rem', color: 'white' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Eligible under simulation</span>
              <h2 style={{ color: 'white', fontSize: '2.2rem', margin: '0.25rem 0 0' }}>
                {loading && !result ? '…' : (result?.simulated_eligible_count ?? '—')}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>of {result?.total_schemes_checked ?? '…'} schemes checked</span>
            </div>

            {result?.is_authenticated && (
              <>
                <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Your real profile</span>
                  <h2 style={{ fontSize: '2.2rem', margin: '0.25rem 0 0', color: 'var(--gray-800)' }}>{result.real_eligible_count}</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>schemes currently eligible</span>
                </div>
                <div style={{
                  background: delta > 0 ? 'var(--accent-emerald-light)' : delta < 0 ? '#fef2f2' : 'white',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${delta > 0 ? '#a7f3d0' : delta < 0 ? '#fecaca' : 'var(--gray-200)'}`,
                  padding: '1.25rem'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {delta > 0 ? <TrendingUp style={{ width: '0.9rem', height: '0.9rem', color: '#047857' }} />
                      : delta < 0 ? <TrendingDown style={{ width: '0.9rem', height: '0.9rem', color: '#dc2626' }} />
                      : <CheckCircle2 style={{ width: '0.9rem', height: '0.9rem', color: 'var(--gray-500)' }} />}
                    Change vs your profile
                  </span>
                  <h2 style={{ fontSize: '2.2rem', margin: '0.25rem 0 0', color: delta > 0 ? '#047857' : delta < 0 ? '#dc2626' : 'var(--gray-800)' }}>
                    {delta > 0 ? `+${delta}` : delta < 0 ? delta : '±0'}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    {newlyEligible.length > 0 || lostEligible.length > 0
                      ? `${newlyEligible.length} gained · ${lostEligible.length} lost`
                      : 'same schemes as your profile'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          {result && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: activeTab === tab.id ? '1.5px solid var(--primary-700)' : '1px solid var(--gray-300)',
                      background: activeTab === tab.id ? 'var(--primary-900)' : 'white',
                      color: activeTab === tab.id ? 'white' : 'var(--gray-600)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {loading && (
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                  Re-evaluating {result.total_schemes_checked} schemes…
                </div>
              )}

              {activeList.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', padding: '2rem', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                  {emptyMessages[activeTab]}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeList.map(item => (
                    <div
                      key={item.scheme_id}
                      style={{
                        background: 'white',
                        borderRadius: '10px',
                        border: '1px solid var(--gray-200)',
                        borderLeft: `4px solid ${activeTab === 'new' ? 'var(--accent-emerald)' : activeTab === 'lost' ? '#ef4444' : 'var(--primary-600)'}`,
                        padding: '1rem 1.15rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <Link to={`/schemes/${item.scheme_id}`} style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-800)' }}>
                            {item.scheme_name}
                          </Link>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '0.15rem 0.55rem', borderRadius: '999px' }}>
                              {item.category_display}
                            </span>
                            {item.matched?.length > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                                {item.matched.join(' · ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link to={`/schemes/${item.scheme_id}`} className="btn btn-outline-navy btn-sm" style={{ fontSize: '0.75rem' }}>
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                  {activeTab === 'all' && result.eligible_truncated && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'center', padding: '0.5rem' }}>
                      Showing first {allEligible.length} of {result.simulated_eligible_count} eligible schemes.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!result && loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
              Evaluating hypothetical profile against all schemes…
            </div>
          )}

          {/* Footer note */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginTop: '1.5rem', background: 'var(--gray-100)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <Lightbulb style={{ width: '1.05rem', height: '1.05rem', color: 'var(--gray-500)', flexShrink: 0, marginTop: '0.1rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
              This simulator is a planning tool: use it to discover schemes for family members, plan for a future age
              or income bracket, or see what a certificate would unlock. Your saved profile is never modified.
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sim-grid { grid-template-columns: 1fr !important; }
          .sim-grid > div:first-child { position: static !important; }
        }
      `}</style>
    </div>
  );
};

export default WhatIfSimulatorPage;
