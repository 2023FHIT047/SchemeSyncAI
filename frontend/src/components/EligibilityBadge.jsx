import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const EligibilityBadge = ({ status, text }) => {
  if (status === 'PASSED') {
    return (
      <span className="status-badge status-passed">
        <CheckCircle2 style={{ width: '0.9rem', height: '0.9rem' }} /> {text || 'Passed'}
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="status-badge status-failed">
        <XCircle style={{ width: '0.9rem', height: '0.9rem' }} /> {text || 'Unmet'}
      </span>
    );
  }
  return (
    <span className="status-badge status-missing">
      <AlertCircle style={{ width: '0.9rem', height: '0.9rem' }} /> {text || 'Missing Info'}
    </span>
  );
};
