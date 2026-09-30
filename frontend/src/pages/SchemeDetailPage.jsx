import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schemeApi } from '../api/schemeApi';
import { eligibilityApi } from '../api/eligibilityApi';
import { useAuth } from '../context/AuthContext';
import { EligibilityBadge } from '../components/EligibilityBadge';
import { 
  Building2, ExternalLink, ShieldCheck, FileCheck, CheckCircle2, 
  XCircle, AlertTriangle, ArrowLeft, Bookmark, PhoneCall, Mail, Calendar 
} from 'lucide-react';

export const SchemeDetailPage = () => {
  const { schemeId } = useParams();
  const { user } = useAuth();
  const [scheme, setScheme] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await schemeApi.getSchemeDetail(schemeId);
        setScheme(data);
        setIsSaved(data.is_saved || false);

        if (user) {
          setEvaluating(true);
          try {
            const evalRes = await eligibilityApi.evaluateScheme(schemeId);
            setEligibilityResult(evalRes);
          } catch (e) {
            console.error("Failed to evaluate eligibility:", e);
          } finally {
            setEvaluating(false);
          }
        }
      } catch (err) {
        console.error("Failed to load scheme detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [schemeId, user]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      alert("Please login to save schemes.");
      return;
    }
    try {
      const res = await schemeApi.toggleSaveScheme(schemeId);
      setIsSaved(res.saved);
    } catch (err) {
      console.error("Toggle bookmark error:", err);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading scheme details...</div>;
  }

  if (!scheme) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Scheme not found.</div>;
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <Link to="/schemes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-600)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
        <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> Back to Scheme Directory
      </Link>

      {/* Header Banner */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '2rem', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <span className={`scheme-badge badge-farmer`} style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
              {scheme.category_display || scheme.category}
            </span>
            <h1 style={{ fontSize: '2.1rem', color: 'var(--primary-900)', lineHeight: '1.25' }}>{scheme.scheme_name}</h1>
            <p style={{ color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              <Building2 style={{ width: '1rem', height: '1rem', color: 'var(--primary-700)' }} /> {scheme.ministry}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handleBookmarkToggle} className="btn btn-secondary">
              <Bookmark style={{ width: '1rem', height: '1rem', fill: isSaved ? '#d97706' : 'none', color: isSaved ? '#d97706' : 'inherit' }} />
              {isSaved ? 'Saved' : 'Save Scheme'}
            </button>
            <a href={scheme.application_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Apply on Official Portal <ExternalLink style={{ width: '1rem', height: '1rem' }} />
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
          <div><strong>State:</strong> {scheme.applicable_state}</div>
          <div><strong>Type:</strong> {scheme.scheme_type_display || scheme.scheme_type}</div>
          <div><strong>Benefit Mode:</strong> {scheme.benefit_type_display || scheme.benefit_type}</div>
          <div><strong>Application Mode:</strong> {scheme.application_mode}</div>
          {scheme.launch_year && <div><strong>Launch Year:</strong> {scheme.launch_year}</div>}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Overview & Objective */}
          <div style={{ background: 'white', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Scheme Description & Objective</h2>
            <p style={{ color: 'var(--gray-800)', lineHeight: '1.7', marginBottom: '1.25rem' }}>{scheme.detailed_description || scheme.short_description}</p>
            {scheme.objective && (
              <div style={{ background: 'var(--primary-50)', padding: '1rem 1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--primary-600)' }}>
                <h4 style={{ color: 'var(--primary-900)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>Core Objective</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)', margin: 0 }}>{scheme.objective}</p>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div style={{ background: 'white', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Scheme Benefits & Financial Assistance</h2>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1.25rem', borderRadius: '8px', color: '#065f46', marginBottom: '1rem' }}>
              <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                Key Benefit: {scheme.benefit_amount || 'Direct Government Support'}
              </strong>
              <p style={{ fontSize: '0.925rem', margin: 0 }}>{scheme.benefits}</p>
            </div>
          </div>

          {/* Explainable Eligibility Criteria Breakdown */}
          <div style={{ background: 'white', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Structured Eligibility Rules</h2>
              {eligibilityResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your Result:</span>
                  <EligibilityBadge status={eligibilityResult.is_eligible ? 'PASSED' : 'FAILED'} text={eligibilityResult.is_eligible ? 'Eligible' : 'Not Eligible'} />
                </div>
              )}
            </div>

            {user && eligibilityResult && (
              <div style={{ background: eligibilityResult.is_eligible ? '#ecfdf5' : '#fff1f2', border: `1px solid ${eligibilityResult.is_eligible ? '#a7f3d0' : '#fecdd3'}`, padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h4 style={{ color: eligibilityResult.is_eligible ? '#047857' : '#991b1b', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                  {eligibilityResult.is_eligible ? '🎉 You meet all mandatory conditions' : '⚠️ Unmet condition breakdown for your profile'}
                </h4>
                <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--gray-800)' }}>{eligibilityResult.summary}</p>
              </div>
            )}

            {scheme.eligibility_rules && scheme.eligibility_rules.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheme.eligibility_rules.map((rule) => {
                  let evalStatus = null;
                  if (eligibilityResult) {
                    const match = eligibilityResult.matched_conditions.find(m => m.rule_id === rule.id);
                    const fail = eligibilityResult.failed_conditions.find(f => f.rule_id === rule.id);
                    const miss = eligibilityResult.missing_information.find(ms => ms.rule_id === rule.id);
                    if (match) evalStatus = 'PASSED';
                    else if (fail) evalStatus = 'FAILED';
                    else if (miss) evalStatus = 'MISSING_INFO';
                  }

                  return (
                    <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--gray-900)' }}>{rule.description}</strong>
                        <span style={{ fontSize: '0.775rem', color: 'var(--gray-500)' }}>
                          Condition: <code>{rule.attribute} {rule.operator} {rule.value}</code>
                        </span>
                      </div>
                      <div>
                        {evalStatus ? (
                          <EligibilityBadge status={evalStatus} />
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', background: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}>
                            {rule.is_mandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>Open for general citizens meeting standard state residency guidelines.</p>
            )}
          </div>

          {/* Required Documents Guidance */}
          <div style={{ background: 'white', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck style={{ width: '1.25rem', height: '1.25rem', color: 'var(--accent-emerald)' }} />
              Required Document Checklist
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.25rem' }}>
              Ensure you have the following valid documents ready before proceeding to the official government application portal.
            </p>

            {scheme.required_documents && scheme.required_documents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheme.required_documents.map(doc => (
                  <div key={doc.id} style={{ padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.925rem', color: 'var(--gray-900)' }}>📄 {doc.document_name}</strong>
                      <span style={{ fontSize: '0.725rem', fontWeight: 600, color: doc.is_mandatory ? '#b91c1c' : '#047857', background: doc.is_mandatory ? '#fee2e2' : '#d1fae5', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {doc.is_mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </div>
                    {doc.description && <p style={{ fontSize: '0.825rem', color: 'var(--gray-600)', margin: 0 }}>{doc.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--gray-600)' }}>Aadhaar Card and Bank Passbook required for general verification.</p>
            )}
          </div>

        </div>

        {/* Right Sidebar - Official Links & Helpline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Official Government Direct Links Box */}
          <div style={{ background: 'var(--primary-900)', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              <ShieldCheck style={{ width: '1.25rem', height: '1.25rem' }} /> Official Application Portal
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Submit your formal application directly on the government website:
            </p>

            <a href={scheme.application_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }}>
              Go to Official Portal <ExternalLink style={{ width: '1rem', height: '1rem' }} />
            </a>

            {scheme.official_website && (
              <a href={scheme.official_website} target="_blank" rel="noopener noreferrer" className="btn btn-outline-navy btn-sm" style={{ width: '100%', fontSize: '0.8rem' }}>
                Visit Nodal Ministry Website
              </a>
            )}
          </div>

          {/* Helpline & Support */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Government Helpline & Contact</h3>
            {scheme.helpline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <PhoneCall style={{ width: '1rem', height: '1rem', color: 'var(--accent-emerald-dark)' }} />
                <span>Toll-Free: <strong>{scheme.helpline}</strong></span>
              </div>
            )}
            {scheme.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                <Mail style={{ width: '1rem', height: '1rem', color: 'var(--primary-700)' }} />
                <span>{scheme.email}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
