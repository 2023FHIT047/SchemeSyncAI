import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/adminApi';
import { Navigate } from 'react-router-dom';
import {
  Shield, Plus, Trash2, Send, CheckCircle2, AlertCircle,
  Loader2, Bell, FileText, List, ChevronDown, ChevronUp
} from 'lucide-react';

const CATEGORIES = [
  { value: 'FARMER', label: 'Farmers & Agriculture' },
  { value: 'EDUCATION', label: 'Education & Student Welfare' },
  { value: 'WOMEN_CHILD', label: 'Women & Child Welfare' },
  { value: 'HEALTHCARE', label: 'Healthcare & Health Insurance' },
  { value: 'EMPLOYMENT', label: 'Employment & Livelihood' },
  { value: 'HOUSING', label: 'Housing & Urban Infrastructure' },
  { value: 'SENIOR_CITIZEN', label: 'Senior Citizens & Pension' },
  { value: 'SKILL_DEV', label: 'Skill Development & Entrepreneurship' },
  { value: 'OTHER', label: 'Other Welfare Schemes' },
];

const SCHEME_TYPES = [
  { value: 'CENTRAL', label: 'Central Sector Scheme' },
  { value: 'STATE', label: 'State Sponsored Scheme' },
  { value: 'JOINT', label: 'Centrally Sponsored Scheme (Joint)' },
];

const BENEFIT_TYPES = [
  { value: 'FINANCIAL', label: 'Direct Financial Assistance / Cash Transfer' },
  { value: 'SUBSIDY', label: 'Subsidy / Price Support' },
  { value: 'SCHOLARSHIP', label: 'Scholarship / Fellowship' },
  { value: 'PENSION', label: 'Pension / Annuity' },
  { value: 'LOAN', label: 'Subsidized Loan / Credit Facility' },
  { value: 'IN_KIND', label: 'In-Kind Assistance / Equipment / Goods' },
  { value: 'CERTIFICATE', label: 'Certificate / Skill Training' },
  { value: 'OTHER', label: 'Other Support' },
];

const APPLICATION_MODES = [
  { value: 'ONLINE', label: 'Online Portal' },
  { value: 'OFFLINE', label: 'Physical Office / CSC Centre' },
  { value: 'HYBRID', label: 'Online & Offline Available' },
];

const ATTRIBUTES = [
  'age', 'annual_family_income', 'state', 'district', 'occupation',
  'gender', 'is_farmer', 'is_student', 'land_ownership', 'land_holding_acres',
  'caste_category', 'is_disabled', 'disability_percentage', 'marital_status',
  'employment_status', 'bpl_card_holder', 'education_level'
];

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN'];
const VALUE_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'LIST'];

const emptyRule = { attribute: '', operator: '=', value: '', value_type: 'STRING', description: '', is_mandatory: true };
const emptyDoc = { document_name: '', is_mandatory: true, description: '' };

const initialForm = {
  scheme_id: '', scheme_name: '', category: 'FARMER', subcategory: '',
  ministry: '', scheme_type: 'CENTRAL', applicable_state: 'All India',
  short_description: '', detailed_description: '', objective: '', benefits: '',
  benefit_type: 'FINANCIAL', benefit_amount: '', application_mode: 'ONLINE',
  application_link: '', official_website: '', official_guidelines_pdf: '',
  helpline: '', email: '', scheme_status: 'ACTIVE', launch_year: '',
};

export const AdminPanelPage = () => {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('create');
  const [form, setForm] = useState(initialForm);
  const [rules, setRules] = useState([]);
  const [docs, setDocs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [showDocs, setShowDocs] = useState(true);

  useEffect(() => {
    if (tab === 'notifications') loadNotifications();
    if (tab === 'schemes') loadSchemes();
  }, [tab]);

  const loadNotifications = async () => {
    setLoadingData(true);
    try {
      const res = await adminApi.getNotifications();
      setNotifications(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const loadSchemes = async () => {
    setLoadingData(true);
    try {
      const res = await adminApi.getSchemes();
      setSchemes(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addRule = () => setRules(prev => [...prev, { ...emptyRule }]);
  const removeRule = (i) => setRules(prev => prev.filter((_, idx) => idx !== i));
  const updateRule = (i, field, value) => {
    setRules(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const addDoc = () => setDocs(prev => [...prev, { ...emptyDoc }]);
  const removeDoc = (i) => setDocs(prev => prev.filter((_, idx) => idx !== i));
  const updateDoc = (i, field, value) => {
    setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const payload = {
      ...form,
      launch_year: form.launch_year ? parseInt(form.launch_year) : null,
      eligibility_rules: rules.filter(r => r.attribute && r.value),
      required_documents: docs.filter(d => d.document_name),
    };

    try {
      const res = await adminApi.createScheme(payload);
      setResult(res);
      setForm(initialForm);
      setRules([]);
      setDocs([]);
    } catch (err) {
      const msg = err.response?.data;
      if (msg && typeof msg === 'object') {
        setError(Object.entries(msg).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
      } else {
        setError('Failed to create scheme. Please check all required fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;
  if (!user || !user.is_staff) return <Navigate to="/" replace />;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '960px' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Shield style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary-600)' }} />
          Admin Panel
        </h1>
        <p>Add new government schemes and manage eligibility notifications.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-100)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'create', label: 'Add Scheme', icon: Plus },
          { id: 'notifications', label: 'Notifications Log', icon: Bell },
          { id: 'schemes', label: 'All Schemes', icon: List },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none',
              background: tab === t.id ? 'var(--primary-600)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--gray-600)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <t.icon style={{ width: '1rem', height: '1rem' }} /> {t.label}
          </button>
        ))}
      </div>

      {/* CREATE TAB */}
      {tab === 'create' && (
        <form onSubmit={handleSubmit} className="scheme-section-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Scheme Details</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Scheme ID (slug) *</label>
              <input name="scheme_id" value={form.scheme_id} onChange={handleChange} className="form-input" placeholder="e.g. pm-kisan-2026" required />
            </div>
            <div className="form-group">
              <label className="form-label">Scheme Name *</label>
              <input name="scheme_name" value={form.scheme_name} onChange={handleChange} className="form-input" placeholder="Full scheme name" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="form-select">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Scheme Type</label>
              <select name="scheme_type" value={form.scheme_type} onChange={handleChange} className="form-select">
                {SCHEME_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Benefit Type</label>
              <select name="benefit_type" value={form.benefit_type} onChange={handleChange} className="form-select">
                {BENEFIT_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Application Mode</label>
              <select name="application_mode" value={form.application_mode} onChange={handleChange} className="form-select">
                {APPLICATION_MODES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Ministry *</label>
              <input name="ministry" value={form.ministry} onChange={handleChange} className="form-input" placeholder="e.g. Ministry of Agriculture" required />
            </div>
            <div className="form-group">
              <label className="form-label">Applicable State</label>
              <input name="applicable_state" value={form.applicable_state} onChange={handleChange} className="form-input" placeholder="All India or specific state" />
            </div>
            <div className="form-group">
              <label className="form-label">Benefit Amount</label>
              <input name="benefit_amount" value={form.benefit_amount} onChange={handleChange} className="form-input" placeholder="e.g. ₹6,000/year" />
            </div>
            <div className="form-group">
              <label className="form-label">Launch Year</label>
              <input name="launch_year" type="number" value={form.launch_year} onChange={handleChange} className="form-input" placeholder="2026" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Short Description *</label>
            <textarea name="short_description" value={form.short_description} onChange={handleChange} className="form-input" rows={2} placeholder="Brief summary of the scheme" required />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea name="detailed_description" value={form.detailed_description} onChange={handleChange} className="form-input" rows={4} placeholder="Full details about the scheme..." />
          </div>

          <div className="form-group">
            <label className="form-label">Objective</label>
            <textarea name="objective" value={form.objective} onChange={handleChange} className="form-input" rows={3} placeholder="What is the purpose/goal of this scheme?" />
          </div>

          <div className="form-group">
            <label className="form-label">Benefits *</label>
            <textarea name="benefits" value={form.benefits} onChange={handleChange} className="form-input" rows={3} placeholder="What benefits does this scheme provide?" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Application Link *</label>
              <input name="application_link" type="url" value={form.application_link} onChange={handleChange} className="form-input" placeholder="https://..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Official Website *</label>
              <input name="official_website" type="url" value={form.official_website} onChange={handleChange} className="form-input" placeholder="https://..." required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Helpline</label>
              <input name="helpline" value={form.helpline} onChange={handleChange} className="form-input" placeholder="1800-xxx-xxxx" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="form-input" placeholder="scheme@gov.in" />
            </div>
            <div className="form-group">
              <label className="form-label">Guidelines PDF URL</label>
              <input name="official_guidelines_pdf" type="url" value={form.official_guidelines_pdf} onChange={handleChange} className="form-input" placeholder="https://..." />
            </div>
          </div>

          {/* Eligibility Rules Section */}
          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.25rem' }}>
            <button type="button" onClick={() => setShowRules(!showRules)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.75rem' }}>
              {showRules ? <ChevronUp style={{ width: '1rem' }} /> : <ChevronDown style={{ width: '1rem' }} />}
              Eligibility Rules ({rules.length})
            </button>

            {showRules && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rules.map((rule, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 100px 1fr auto', gap: '0.5rem', alignItems: 'end', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)' }}>Attribute</label>
                      <select value={rule.attribute} onChange={e => updateRule(i, 'attribute', e.target.value)} className="form-select" style={{ fontSize: '0.8rem' }}>
                        <option value="">Select...</option>
                        {ATTRIBUTES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)' }}>Op</label>
                      <select value={rule.operator} onChange={e => updateRule(i, 'operator', e.target.value)} className="form-select" style={{ fontSize: '0.8rem' }}>
                        {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)' }}>Value</label>
                      <input value={rule.value} onChange={e => updateRule(i, 'value', e.target.value)} className="form-input" style={{ fontSize: '0.8rem' }} placeholder="e.g. 500000" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)' }}>Type</label>
                      <select value={rule.value_type} onChange={e => updateRule(i, 'value_type', e.target.value)} className="form-select" style={{ fontSize: '0.8rem' }}>
                        {VALUE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)' }}>Description</label>
                      <input value={rule.description} onChange={e => updateRule(i, 'description', e.target.value)} className="form-input" style={{ fontSize: '0.8rem' }} placeholder="Human readable" />
                    </div>
                    <button type="button" onClick={() => removeRule(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.4rem', cursor: 'pointer', color: '#dc2626' }}>
                      <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addRule} className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                  <Plus style={{ width: '0.9rem', height: '0.9rem' }} /> Add Rule
                </button>
              </div>
            )}
          </div>

          {/* Required Documents Section */}
          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.25rem' }}>
            <button type="button" onClick={() => setShowDocs(!showDocs)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.75rem' }}>
              {showDocs ? <ChevronUp style={{ width: '1rem' }} /> : <ChevronDown style={{ width: '1rem' }} />}
              Required Documents ({docs.length})
            </button>

            {showDocs && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {docs.map((doc, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px auto', gap: '0.5rem', alignItems: 'end', padding: '0.6rem 0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)' }}>Document Name</label>
                      <input value={doc.document_name} onChange={e => updateDoc(i, 'document_name', e.target.value)} className="form-input" style={{ fontSize: '0.8rem' }} placeholder="e.g. Aadhaar Card" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)' }}>Description</label>
                      <input value={doc.description} onChange={e => updateDoc(i, 'description', e.target.value)} className="form-input" style={{ fontSize: '0.8rem' }} placeholder="Optional guidance" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)' }}>Mandatory</label>
                      <select value={doc.is_mandatory} onChange={e => updateDoc(i, 'is_mandatory', e.target.value === 'true')} className="form-select" style={{ fontSize: '0.8rem' }}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <button type="button" onClick={() => removeDoc(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.4rem', cursor: 'pointer', color: '#dc2626' }}>
                      <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addDoc} className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                  <Plus style={{ width: '0.9rem', height: '0.9rem' }} /> Add Document
                </button>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Send style={{ width: '1rem', height: '1rem', color: '#2563eb', flexShrink: 0, marginTop: '0.15rem' }} />
            <p style={{ fontSize: '0.8rem', color: '#1e40af', margin: 0, lineHeight: 1.5 }}>
              After creation, the system will automatically evaluate this scheme against all registered user profiles and send email notifications to eligible users.
            </p>
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}>
            {submitting ? <><Loader2 style={{ width: '1.1rem', height: '1.1rem', animation: 'spin 1s linear infinite' }} /> Creating & Notifying Users...</> : <><Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Create Scheme & Notify Eligible Users</>}
          </button>

          {/* Result */}
          {result && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <CheckCircle2 style={{ width: '1.2rem', height: '1.2rem', color: '#16a34a', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#166534', margin: 0 }}>{result.message}</p>
                <p style={{ fontSize: '0.8rem', color: '#4ade80', margin: '0.25rem 0 0' }}>
                  Scheme ID: {result.scheme?.scheme_id} | Notified: {result.notified_count} user(s)
                </p>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <AlertCircle style={{ width: '1.2rem', height: '1.2rem', color: '#dc2626', flexShrink: 0 }} />
              <pre style={{ fontSize: '0.8rem', color: '#991b1b', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{error}</pre>
            </div>
          )}
        </form>
      )}

      {/* NOTIFICATIONS TAB */}
      {tab === 'notifications' && (
        <div className="scheme-section-card">
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell style={{ width: '1.1rem', height: '1.1rem', color: 'var(--primary-600)' }} />
            Email Notifications Log
          </h2>
          {loadingData ? (
            <p style={{ color: 'var(--gray-500)' }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No notifications sent yet. Create a scheme to trigger notifications.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Scheme</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Score</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map(n => (
                    <tr key={n.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '0.55rem' }}>{n.user_name}</td>
                      <td style={{ padding: '0.55rem' }}>{n.user_email}</td>
                      <td style={{ padding: '0.55rem' }}>{n.scheme_name}</td>
                      <td style={{ padding: '0.55rem' }}>
                        <span style={{ background: n.eligibility_score >= 80 ? '#dcfce7' : '#fef9c3', color: n.eligibility_score >= 80 ? '#166534' : '#854d0e', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600, fontSize: '0.75rem' }}>
                          {n.eligibility_score}%
                        </span>
                      </td>
                      <td style={{ padding: '0.55rem' }}>
                        {n.email_sent ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Sent</span> : <span style={{ color: '#dc2626' }}>Pending</span>}
                      </td>
                      <td style={{ padding: '0.55rem', color: 'var(--gray-500)' }}>
                        {n.email_sent_at ? new Date(n.email_sent_at).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SCHEMES TAB */}
      {tab === 'schemes' && (
        <div className="scheme-section-card">
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText style={{ width: '1.1rem', height: '1.1rem', color: 'var(--primary-600)' }} />
            All Schemes ({schemes.length})
          </h2>
          {loadingData ? (
            <p style={{ color: 'var(--gray-500)' }}>Loading...</p>
          ) : schemes.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No schemes in database.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {schemes.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>{s.scheme_name}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {s.scheme_id} · {s.category_display} · {s.ministry}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px',
                    background: s.scheme_status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6',
                    color: s.scheme_status === 'ACTIVE' ? '#166534' : '#6b7280'
                  }}>
                    {s.scheme_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
