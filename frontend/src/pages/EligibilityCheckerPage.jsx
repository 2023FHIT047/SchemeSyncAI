import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eligibilityApi } from '../api/eligibilityApi';
import { EligibilityBadge } from '../components/EligibilityBadge';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const EligibilityCheckerPage = () => {
  const { user, profile } = useAuth();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runEvaluation = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await eligibilityApi.evaluateAllSchemes();
      setResults(res);
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      runEvaluation();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: 'var(--radius-md)', maxWidth: '550px', margin: '0 auto', border: '1px solid var(--gray-200)' }}>
          <ShieldCheck style={{ width: '3.5rem', height: '3.5rem', color: 'var(--primary-700)', marginBottom: '1rem' }} />
          <h2>Check Your Scheme Eligibility</h2>
          <p style={{ color: 'var(--gray-600)', margin: '1rem 0 1.5rem' }}>
            Please log in or register to input your personal circumstances and view an explainable eligibility report across all central and state schemes.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Register Free</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Explainable Scheme Eligibility Analysis</h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Deterministic rule evaluation for <strong>{profile?.full_name || user.username}</strong> ({profile?.state || 'State not set'}, {profile?.occupation || 'Occupation not set'}).
          </p>
        </div>

        <button onClick={runEvaluation} className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? 'Evaluating...' : 'Re-Run Rule Engine'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
          Evaluating rule conditions against your profile attributes...
        </div>
      ) : results ? (
        <div>
          {/* Summary Banner */}
          <div style={{ background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-800) 100%)', color: 'white', padding: '1.75rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Schemes Evaluated</span>
              <h3 style={{ color: 'white', fontSize: '2rem', margin: 0 }}>{results.total_schemes_checked}</h3>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>Eligible Schemes</span>
              <h3 style={{ color: 'var(--accent-emerald)', fontSize: '2rem', margin: 0 }}>{results.eligible_count}</h3>
            </div>
          </div>

          {/* Eligible Schemes Section */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--accent-emerald-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: '1.35rem', height: '1.35rem' }} /> You Are Eligible For ({results.eligible_schemes.length})
            </h2>

            {results.eligible_schemes.length === 0 ? (
              <p style={{ color: 'var(--gray-600)', background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                No schemes currently match all your profile attributes. Update your profile or check back as new schemes are added.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {results.eligible_schemes.map(item => (
                  <div key={item.scheme_id} style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', borderLeft: '4px solid var(--accent-emerald)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                          <Link to={`/schemes/${item.scheme_id}`}>{item.scheme_name}</Link>
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{item.category_display}</span>
                      </div>
                      <Link to={`/schemes/${item.scheme_id}`} className="btn btn-primary btn-sm">
                        View & Apply <ArrowRight style={{ width: '0.85rem', height: '0.85rem' }} />
                      </Link>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '1rem' }}>{item.short_description}</p>

                    {/* Matched Conditions Checklist */}
                    <div style={{ background: '#ecfdf5', padding: '0.85rem 1rem', borderRadius: '6px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#047857', display: 'block', marginBottom: '0.4rem' }}>Matched Rule Conditions:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {item.analysis.matched_conditions.map((mc, i) => (
                          <span key={i} style={{ fontSize: '0.825rem', color: '#065f46' }}>
                            ✓ {mc.description} (Profile Value: <strong>{String(mc.user_value)}</strong>)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
