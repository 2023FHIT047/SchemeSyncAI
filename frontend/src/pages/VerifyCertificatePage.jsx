import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eligibilityApi } from '../api/eligibilityApi';
import { ShieldCheck, ShieldX, Award, Calendar, User as UserIcon, Building2 } from 'lucide-react';

export const VerifyCertificatePage = () => {
  const { verificationId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await eligibilityApi.verifyCertificate(verificationId);
        setResult(data);
      } catch (err) {
        setResult(null);
        setError('No certificate found with this verification ID. It may be invalid or revoked.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [verificationId]);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Certificate Verification
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Confirm the authenticity of an eligibility certificate.
          </p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Verifying certificate...</p>
          </div>
        ) : result && result.valid ? (
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ background: '#ecfdf5', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.9rem', borderBottom: '1px solid #a7f3d0' }}>
              <ShieldCheck style={{ width: '2.4rem', height: '2.4rem', color: '#047857', flexShrink: 0 }} />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#047857', margin: 0 }}>
                  Valid Certificate
                </h2>
                <p style={{ fontSize: '0.83rem', color: '#065f46', margin: '0.2rem 0 0' }}>
                  This certificate is genuine and was issued by the platform.
                </p>
              </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <DetailRow icon={<Award style={{ width: '1rem', height: '1rem' }} />} label="Verification ID" value={result.verification_id} mono />
              <DetailRow icon={<UserIcon style={{ width: '1rem', height: '1rem' }} />} label="Certificate Holder" value={result.holder_name} />
              <DetailRow icon={<Building2 style={{ width: '1rem', height: '1rem' }} />} label="Scheme" value={result.scheme_name} />
              <DetailRow icon={<ShieldCheck style={{ width: '1rem', height: '1rem' }} />} label="Eligibility Score" value={`${result.eligibility_score}%`} />
              <DetailRow icon={<Calendar style={{ width: '1rem', height: '1rem' }} />} label="Issued On" value={new Date(result.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
            <ShieldX style={{ width: '3rem', height: '3rem', color: '#dc2626', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
              Certificate Not Found
            </h2>
            <p style={{ fontSize: '0.87rem', color: '#7f1d1d', lineHeight: 1.6, marginBottom: '1.2rem' }}>
              {error}
            </p>
            <code style={{ display: 'inline-block', background: '#fef2f2', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#991b1b' }}>
              {verificationId}
            </code>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.8rem' }}>
          <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value, mono }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
    <span style={{ color: 'var(--primary)', marginTop: '0.15rem', flexShrink: 0 }}>{icon}</span>
    <div>
      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-500)', margin: 0, fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: '0.92rem', color: 'var(--gray-800)', margin: '0.15rem 0 0', fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </p>
    </div>
  </div>
);
