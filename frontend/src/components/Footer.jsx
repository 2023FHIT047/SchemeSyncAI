import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--primary-900)', color: '#94a3b8', paddingTop: '3rem', paddingBottom: '2rem', marginTop: '4rem', borderTop: '4px solid var(--accent-emerald)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.75rem' }}>GovScheme AI Portal</h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
              An intelligent citizen assistance platform providing explainable scheme eligibility analysis, document guidance, and verified direct links to official government application portals.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.85rem' }}>Scheme Domains</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <li><Link to="/schemes?category=FARMER" style={{ color: '#cbd5e1' }}>🌾 Farmers & Agriculture</Link></li>
              <li><Link to="/schemes?category=EDUCATION" style={{ color: '#cbd5e1' }}>🎓 Education & Students</Link></li>
              <li><Link to="/schemes?category=WOMEN_CHILD" style={{ color: '#cbd5e1' }}>👩 Women & Child Welfare</Link></li>
              <li><Link to="/schemes" style={{ color: '#cbd5e1' }}>🏥 Healthcare & Livelihood</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.85rem' }}>Important Notice</h4>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-saffron)', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fef3c7', fontWeight: 600, marginBottom: '0.3rem' }}>
                <ShieldCheck style={{ width: '1rem', height: '1rem' }} />
                Official Application Directives
              </div>
              This platform serves as an informational guidance system. All scheme applications must be submitted directly through official government portals linked on scheme detail pages.
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem' }}>
          <p>© {new Date().getFullYear()} AI-Powered Intelligent Government Scheme Assistance Platform. Final Year Engineering Project.</p>
          <p>Built with React, Django REST Framework, & PostgreSQL.</p>
        </div>
      </div>
    </footer>
  );
};
