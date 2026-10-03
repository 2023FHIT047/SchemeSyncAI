import React, { useState, useRef } from 'react';
import { ocrApi } from '../api/ocrApi';
import { Upload, FileText, Camera, CheckCircle2, AlertCircle, Loader2, X, Sparkles } from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: '', label: 'Auto-Detect', icon: '🔍' },
  { value: 'AADHAAR', label: 'Aadhaar Card', icon: '🪪' },
  { value: 'INCOME_CERTIFICATE', label: 'Income Certificate', icon: '📋' },
  { value: 'RATION_CARD', label: 'Ration Card', icon: '🏠' },
  { value: 'LAND_RECORD', label: 'Land Record (7/12)', icon: '🌾' },
];

export const DocumentScanner = ({ onProfileUpdate }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [docType, setDocType] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or WebP).');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(selected);
    setError(null);
    setResult(null);
    setApplied(false);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      setError(null);
      setResult(null);
      setApplied(false);
      setPreview(URL.createObjectURL(dropped));
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const res = await ocrApi.scanDocument(file, docType || null);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || 'Failed to extract data from document.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Scan failed. Please check your connection and try again.';
      setError(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleApplyToProfile = () => {
    if (result?.profile_updates && onProfileUpdate) {
      onProfileUpdate(result.profile_updates);
      setApplied(true);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setApplied(false);
    setDocType('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="scheme-section-card">
      <h2 className="scheme-section-title">
        <Camera style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary-600)' }} />
        Document Scanner (OCR)
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Upload a photo of your government document to auto-extract details and fill your profile instantly.
      </p>

      {/* Document Type Selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label className="form-label" style={{ marginBottom: '0.5rem' }}>Document Type</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {DOCUMENT_TYPES.map(dt => (
            <button
              key={dt.value}
              onClick={() => setDocType(dt.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '9999px',
                border: `1.5px solid ${docType === dt.value ? 'var(--primary-600)' : 'var(--gray-200)'}`,
                background: docType === dt.value ? 'var(--primary-50)' : 'white',
                color: docType === dt.value ? 'var(--primary-700)' : 'var(--gray-600)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>{dt.icon}</span> {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--gray-300)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: 'var(--gray-50)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.background = 'var(--primary-50)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gray-300)'; e.currentTarget.style.background = 'var(--gray-50)'; }}
        >
          <Upload style={{ width: '2.5rem', height: '2.5rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.3rem' }}>
            Drop your document image here
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
            or click to browse · JPEG, PNG, WebP · Max 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Preview */}
          <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
            <img src={preview} alt="Document preview" style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', background: 'var(--gray-100)' }} />
            <button
              onClick={handleReset}
              style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '9999px', padding: '0.4rem', cursor: 'pointer', color: 'white' }}
            >
              <X style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>

          {/* Scan Button */}
          {!result && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem' }}
            >
              {scanning ? (
                <>
                  <Loader2 style={{ width: '1.1rem', height: '1.1rem', animation: 'spin 1s linear infinite' }} />
                  Scanning Document...
                </>
              ) : (
                <>
                  <Sparkles style={{ width: '1.1rem', height: '1.1rem' }} />
                  Extract Data with AI
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
          <AlertCircle style={{ width: '1.1rem', height: '1.1rem', color: '#dc2626', flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{ fontSize: '0.85rem', color: '#991b1b', margin: 0, lineHeight: 1.5 }}>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle2 style={{ width: '1.2rem', height: '1.2rem', color: 'var(--success)' }} />
            <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--gray-900)' }}>
              Data Extracted Successfully
            </h4>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--primary-50)', color: 'var(--primary-700)', padding: '0.2rem 0.6rem', borderRadius: '9999px', marginLeft: 'auto' }}>
              {result.document_type}
            </span>
          </div>

          {/* Extracted Fields */}
          <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {Object.entries(result.data).map(([key, value]) => {
              if (value === null || value === '' || key === 'other_fields') return null;
              if (typeof value === 'object' && !Array.isArray(value)) return null;
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-900)', fontWeight: 600 }}>
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Profile Updates Preview */}
          {result.profile_updates && Object.keys(result.profile_updates).length > 0 && (
            <div style={{ background: 'var(--accent-emerald-light)', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem' }}>
                Fields that can be auto-filled in your profile:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {Object.keys(result.profile_updates).map(field => (
                  <span key={field} style={{ fontSize: '0.72rem', background: 'white', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
                    {field.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {result.profile_updates && Object.keys(result.profile_updates).length > 0 && (
              <button
                onClick={handleApplyToProfile}
                disabled={applied}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {applied ? (
                  <><CheckCircle2 style={{ width: '1rem', height: '1rem' }} /> Applied to Profile</>
                ) : (
                  <><FileText style={{ width: '1rem', height: '1rem' }} /> Auto-Fill Profile</>
                )}
              </button>
            )}
            <button onClick={handleReset} className="btn btn-secondary" style={{ flex: applied ? 1 : 'none' }}>
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
