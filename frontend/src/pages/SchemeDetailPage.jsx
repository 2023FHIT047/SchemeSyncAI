import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schemeApi } from '../api/schemeApi';
import { eligibilityApi } from '../api/eligibilityApi';
import { documentsApi } from '../api/documentsApi';
import { getDocTypeMeta } from '../constants/documentTypes';
import { useAuth } from '../context/AuthContext';
import { EligibilityBadge } from '../components/EligibilityBadge';
import { FormattedText } from '../components/FormattedText';
import {
  Building2, ExternalLink, ShieldCheck, FileCheck, ArrowLeft, Bookmark,
  PhoneCall, Mail, MapPin, Tag, Banknote, Calendar, Globe, Award,
  ClipboardCheck, CheckCircle2, XCircle, FolderOpen, ListOrdered, Info
} from 'lucide-react';

export const SchemeDetailPage = () => {
  const { schemeId } = useParams();
  const { user } = useAuth();
  const [scheme, setScheme] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [certError, setCertError] = useState('');
  const [readiness, setReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await schemeApi.getSchemeDetail(schemeId);
        setScheme(data);
        setIsSaved(data.is_saved || false);

        if (user) {
          setReadinessLoading(true);
          documentsApi.getSchemeReadiness(schemeId)
            .then(setReadiness)
            .catch((e) => console.error("Failed to load document readiness:", e))
            .finally(() => setReadinessLoading(false));

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

  const handleDownloadCertificate = async () => {
    setDownloadingCert(true);
    setCertError('');
    try {
      const res = await eligibilityApi.downloadCertificate(schemeId);
      const vid = res.headers['x-verification-id'] || '';
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eligibility-certificate-${schemeId}${vid ? '-' + vid : ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Certificate download error:", err);
      let msg = 'Unable to generate certificate right now.';
      if (err.response && err.response.data) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error) msg = parsed.error;
        } catch (e) { /* keep default message */ }
      }
      setCertError(msg);
    } finally {
      setDownloadingCert(false);
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

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading scheme details...</p>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="container">
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <h3>Scheme not found</h3>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            The scheme you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/schemes" className="btn btn-primary">Browse All Schemes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 3rem' }}>
      <Link to="/schemes" className="back-link">
        <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> Back to Scheme Directory
      </Link>

      {/* Header Card */}
      <div className="scheme-detail-header">
        <div className="scheme-detail-header-top">
          <div>
            <span className={`scheme-badge ${getCategoryClass(scheme.category)}`}>
              {scheme.category_display || scheme.category}
            </span>
            <h1 className="scheme-detail-title">{scheme.scheme_name}</h1>
            <p className="scheme-detail-ministry">
              <Building2 style={{ width: '1rem', height: '1rem', color: 'var(--primary-600)' }} />
              {scheme.ministry}
            </p>
          </div>

          <div className="scheme-detail-actions">
            <button onClick={handleBookmarkToggle} className="btn btn-secondary">
              <Bookmark style={{ width: '1rem', height: '1rem', fill: isSaved ? '#d97706' : 'none', color: isSaved ? '#d97706' : 'inherit' }} />
              {isSaved ? 'Saved' : 'Save Scheme'}
            </button>
            <a href={scheme.application_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Apply Now <ExternalLink style={{ width: '0.9rem', height: '0.9rem' }} />
            </a>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="scheme-meta-grid">
          <div className="scheme-meta-item">
            <span className="scheme-meta-label">Applicable State</span>
            <span className="scheme-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin style={{ width: '0.85rem', height: '0.85rem', color: 'var(--gray-400)' }} />
              {scheme.applicable_state}
            </span>
          </div>
          <div className="scheme-meta-item">
            <span className="scheme-meta-label">Scheme Type</span>
            <span className="scheme-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag style={{ width: '0.85rem', height: '0.85rem', color: 'var(--gray-400)' }} />
              {scheme.scheme_type_display || scheme.scheme_type}
            </span>
          </div>
          <div className="scheme-meta-item">
            <span className="scheme-meta-label">Benefit Mode</span>
            <span className="scheme-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Banknote style={{ width: '0.85rem', height: '0.85rem', color: 'var(--gray-400)' }} />
              {scheme.benefit_type_display || scheme.benefit_type}
            </span>
          </div>
          <div className="scheme-meta-item">
            <span className="scheme-meta-label">Application Mode</span>
            <span className="scheme-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe style={{ width: '0.85rem', height: '0.85rem', color: 'var(--gray-400)' }} />
              {scheme.application_mode}
            </span>
          </div>
          {scheme.launch_year && (
            <div className="scheme-meta-item">
              <span className="scheme-meta-label">Launch Year</span>
              <span className="scheme-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar style={{ width: '0.85rem', height: '0.85rem', color: 'var(--gray-400)' }} />
                {scheme.launch_year}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="scheme-detail-layout">
        {/* Left Column - Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Description & Objective */}
          <div className="scheme-section-card">
            <h2 className="scheme-section-title">
              <FileCheck style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary-600)' }} />
              Scheme Description & Objective
            </h2>
            <FormattedText text={scheme.detailed_description || scheme.short_description} />
            {scheme.objective && (
              <div className="objective-callout">
                <h4>Core Objective</h4>
                <FormattedText text={scheme.objective} />
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="scheme-section-card">
            <h2 className="scheme-section-title">
              <Banknote style={{ width: '1.15rem', height: '1.15rem', color: 'var(--accent-emerald)' }} />
              Benefits & Financial Assistance
            </h2>
            <div className="benefit-highlight">
              <p className="benefit-amount">
                {scheme.benefit_amount || 'Direct Government Support'}
              </p>
              <FormattedText text={scheme.benefits} />
            </div>
          </div>

          {/* Eligibility Rules */}
          <div className="scheme-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                <ShieldCheck style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary-600)' }} />
                Eligibility Criteria
              </h2>
              {eligibilityResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)' }}>Your Result:</span>
                  <EligibilityBadge status={eligibilityResult.is_eligible ? 'PASSED' : 'FAILED'} text={eligibilityResult.is_eligible ? 'Eligible' : 'Not Eligible'} />
                </div>
              )}
            </div>

            {user && eligibilityResult && (
              <div className={`eligibility-banner ${eligibilityResult.is_eligible ? 'eligibility-banner-pass' : 'eligibility-banner-fail'}`}>
                <h4 style={{ color: eligibilityResult.is_eligible ? '#047857' : '#991b1b' }}>
                  {eligibilityResult.is_eligible ? 'You meet all mandatory conditions' : 'Unmet conditions for your profile'}
                </h4>
                <p>{eligibilityResult.summary}</p>
              </div>
            )}

            {scheme.eligibility_rules && scheme.eligibility_rules.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheme.eligibility_rules.map((rule) => {
                  let evalStatus = null;
                  if (eligibilityResult) {
                    const match = eligibilityResult.matched_conditions?.find(m => m.rule_id === rule.id);
                    const fail = eligibilityResult.failed_conditions?.find(f => f.rule_id === rule.id);
                    const miss = eligibilityResult.missing_information?.find(ms => ms.rule_id === rule.id);
                    if (match) evalStatus = 'PASSED';
                    else if (fail) evalStatus = 'FAILED';
                    else if (miss) evalStatus = 'MISSING_INFO';
                  }

                  return (
                    <div key={rule.id} className="eligibility-rule-item">
                      <div className="eligibility-rule-info">
                        <strong className="eligibility-rule-desc">{rule.description}</strong>
                        <span className="eligibility-rule-condition">
                          {rule.attribute} {rule.operator} {rule.value}
                        </span>
                      </div>
                      <div>
                        {evalStatus ? (
                          <EligibilityBadge status={evalStatus} />
                        ) : (
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                            color: rule.is_mandatory ? 'var(--gray-700)' : 'var(--gray-500)',
                            background: rule.is_mandatory ? 'var(--gray-100)' : 'white',
                            padding: '0.25rem 0.6rem', borderRadius: '9999px',
                            border: `1px solid ${rule.is_mandatory ? 'var(--gray-300)' : 'var(--gray-200)'}`
                          }}>
                            {rule.is_mandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Open for general citizens meeting standard state residency guidelines.
              </p>
            )}
          </div>

          {/* Required Documents */}
          <div className="scheme-section-card">
            <h2 className="scheme-section-title">
              <FileCheck style={{ width: '1.15rem', height: '1.15rem', color: 'var(--accent-emerald)' }} />
              Required Documents
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Keep these documents ready before applying on the official portal.
            </p>

            {scheme.required_documents && scheme.required_documents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheme.required_documents.map(doc => (
                  <div key={doc.id} className="doc-checklist-item">
                    <div className="doc-checklist-header">
                      <span className="doc-checklist-name">
                        <FileCheck style={{ width: '0.9rem', height: '0.9rem', color: 'var(--gray-400)' }} />
                        {doc.document_name}
                      </span>
                      <span className={`doc-checklist-badge ${doc.is_mandatory ? 'doc-mandatory' : 'doc-optional'}`}>
                        {doc.is_mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </div>
                    {doc.description && <p className="doc-checklist-desc">{doc.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                The exact documents required for this scheme are listed in the application
                process below and on the official portal.
              </p>
            )}
          </div>

          {/* Application Process */}
          <div className="scheme-section-card">
            <h2 className="scheme-section-title">
              <ListOrdered style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary-600)' }} />
              How to Apply — Step by Step
            </h2>
            {scheme.application_process ? (
              <FormattedText text={scheme.application_process} />
            ) : (
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                The detailed application steps for this scheme are published on the official
                portal — use the "Go to Official Portal" link to view the latest process.
              </p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Official Portal CTA */}
          <div className="scheme-sidebar-dark">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.85rem' }}>
              <ShieldCheck style={{ width: '1.2rem', height: '1.2rem' }} />
              Official Application Portal
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Submit your application directly through the verified government website.
            </p>

            <a href={scheme.application_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }}>
              Go to Official Portal <ExternalLink style={{ width: '0.9rem', height: '0.9rem' }} />
            </a>

            {scheme.official_website && (
              <a href={scheme.official_website} target="_blank" rel="noopener noreferrer" className="btn btn-outline-navy btn-sm" style={{ width: '100%' }}>
                Visit Ministry Website
              </a>
            )}
          </div>

          {/* Helpline & Contact */}
          <div className="scheme-sidebar-card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 700 }}>
              Helpline & Contact
            </h3>
            {scheme.helpline && (
              <div className="helpline-item">
                <div className="helpline-icon" style={{ background: '#ecfdf5' }}>
                  <PhoneCall style={{ width: '0.9rem', height: '0.9rem', color: 'var(--accent-emerald-dark)' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', display: 'block' }}>Toll-Free</span>
                  <strong style={{ fontSize: '0.9rem' }}>{scheme.helpline}</strong>
                </div>
              </div>
            )}
            {scheme.email && (
              <div className="helpline-item">
                <div className="helpline-icon" style={{ background: 'var(--primary-50)' }}>
                  <Mail style={{ width: '0.9rem', height: '0.9rem', color: 'var(--primary-700)' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', display: 'block' }}>Email</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{scheme.email}</span>
                </div>
              </div>
            )}
            {!scheme.helpline && !scheme.email && (
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                Contact information available on the official portal.
              </p>
            )}
          </div>

          {/* Quick Eligibility Status (for logged-in users) */}
          {user && (
            <div className="scheme-sidebar-card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 700 }}>
                Your Eligibility Status
              </h3>
              {evaluating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                  <div className="loading-spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px' }}></div>
                  Evaluating...
                </div>
              ) : eligibilityResult ? (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <EligibilityBadge
                      status={eligibilityResult.is_eligible ? 'PASSED' : 'FAILED'}
                      text={eligibilityResult.is_eligible ? 'You are Eligible' : 'Not Eligible'}
                    />
                  </div>
                  {eligibilityResult.matched_conditions?.length > 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                      {eligibilityResult.matched_conditions.length} condition(s) matched
                      {eligibilityResult.failed_conditions?.length > 0 &&
                        ` · ${eligibilityResult.failed_conditions.length} unmet`}
                    </p>
                  )}
                  {eligibilityResult.is_eligible && (
                    <div style={{ marginTop: '0.9rem' }}>
                      <button
                        onClick={handleDownloadCertificate}
                        disabled={downloadingCert}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
                      >
                        {downloadingCert ? (
                          <>
                            <div className="loading-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Award style={{ width: '1rem', height: '1rem' }} />
                            Download Eligibility Proof
                          </>
                        )}
                      </button>
                      <p style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                        Official PDF proof that you fully meet this scheme's criteria.
                      </p>
                      {certError && (
                        <p style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.4rem', lineHeight: 1.4 }}>
                          {certError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  Complete your profile to check eligibility.
                </p>
              )}
            </div>
          )}

          {/* Document Readiness (for logged-in users) */}
          {user && (readinessLoading || (readiness && readiness.has_required_documents)) && (
            <div className="scheme-sidebar-card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ClipboardCheck style={{ width: '1rem', height: '1rem', color: 'var(--primary-600)' }} />
                Document Readiness
              </h3>
              {readinessLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                  <div className="loading-spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px' }}></div>
                  Checking your vault...
                </div>
              ) : (
                <div>
                  {readiness.total_count > 0 ? (
                    (() => {
                      const pct = Math.round((readiness.ready_count / readiness.total_count) * 100);
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 600 }}>
                              {readiness.ready_count} of {readiness.total_count} documents ready
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: readiness.is_application_ready ? '#047857' : 'var(--primary-700)' }}>
                              {pct}%
                            </span>
                          </div>
                          <div className="readiness-bar">
                            <div
                              className="readiness-bar-fill"
                              style={{ width: `${pct}%`, background: readiness.is_application_ready ? 'var(--accent-emerald)' : 'var(--primary-600)' }}
                            />
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                      This scheme's checklist has no vault-trackable documents — review the list below before applying.
                    </p>
                  )}

                  {readiness.manual_count > 0 && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.55rem', lineHeight: 1.45 }}>
                      {readiness.manual_count === 1
                        ? '1 checklist item has no vault equivalent — marked “Manual” below.'
                        : `${readiness.manual_count} checklist items have no vault equivalent — marked “Manual” below.`}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.9rem' }}>
                    {readiness.documents.map(doc => {
                      const meta = doc.matched_type ? getDocTypeMeta(doc.matched_type) : null;
                      return (
                        <div key={doc.required_document_id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          {doc.is_ready ? (
                            <CheckCircle2 style={{ width: '1rem', height: '1rem', color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '0.1rem' }} />
                          ) : doc.is_trackable ? (
                            <XCircle style={{ width: '1rem', height: '1rem', color: 'var(--gray-300)', flexShrink: 0, marginTop: '0.1rem' }} />
                          ) : (
                            <Info style={{ width: '1rem', height: '1rem', color: 'var(--gray-400)', flexShrink: 0, marginTop: '0.1rem' }} />
                          )}
                          <span style={{ flex: 1, fontSize: '0.82rem', lineHeight: 1.4, color: doc.is_ready ? 'var(--gray-700)' : 'var(--gray-600)', minWidth: 0 }}>
                            {doc.document_name}
                            {!doc.is_mandatory && <span style={{ fontSize: '0.68rem', color: 'var(--gray-400)', marginLeft: '0.35rem' }}>(optional)</span>}
                            {doc.is_trackable && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.1rem' }}>
                                {doc.is_ready ? `Matched: ${meta.label}` : `Scan your ${meta.label}`}
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginTop: '0.08rem', color: doc.is_ready ? '#047857' : doc.is_trackable ? '#b45309' : 'var(--gray-400)' }}>
                            {doc.is_ready ? 'In vault' : doc.is_trackable ? 'Missing' : 'Manual'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {readiness.is_application_ready ? (
                    <div style={{ marginTop: '1rem', padding: '0.75rem 0.9rem', background: 'var(--accent-emerald-light)', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#065f46', fontWeight: 600, lineHeight: 1.5 }}>
                      All vault-trackable mandatory documents are ready — you can apply with confidence.
                      {readiness.manual_count > 0 && ' Arrange the “Manual” items as per the scheme instructions.'}
                    </div>
                  ) : readiness.mandatory_total > 0 ? (
                    <>
                      <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '1rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                        Scan the missing documents to complete your application checklist.
                      </p>
                      <Link to="/dashboard" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                        <FolderOpen style={{ width: '0.85rem', height: '0.85rem' }} />
                        Open Document Vault
                      </Link>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '1rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                        {readiness.manual_count > 0
                          ? 'Some checklist items live outside your vault — arrange the “Manual” items as per the scheme instructions.'
                          : 'Scan your documents to keep your checklist complete.'}
                      </p>
                      {readiness.total_count > 0 && (
                        <Link to="/dashboard" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                          <FolderOpen style={{ width: '0.85rem', height: '0.85rem' }} />
                          Open Document Vault
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
