import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3 style={{ color: 'white', fontSize: '1.15rem', marginBottom: '0.75rem' }}>GovScheme AI Portal</h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#94a3b8' }}>
              An intelligent citizen assistance platform providing explainable scheme eligibility analysis, document guidance, and verified direct links to official government application portals.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 600 }}>Scheme Domains</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <li><Link to="/schemes?category=FARMER" style={{ color: '#cbd5e1' }}>🌾 Farmers & Agriculture</Link></li>
              <li><Link to="/schemes?category=EDUCATION" style={{ color: '#cbd5e1' }}>🎓 Education & Students</Link></li>
              <li><Link to="/schemes?category=WOMEN_CHILD" style={{ color: '#cbd5e1' }}>👩 Women & Child Welfare</Link></li>
              <li><Link to="/schemes" style={{ color: '#cbd5e1' }}>🏥 Healthcare & Livelihood</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 600 }}>Important Notice</h4>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-saffron)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fef3c7', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                <ShieldCheck style={{ width: '0.95rem', height: '0.95rem' }} />
                Official Application Directives
              </div>
              This platform serves as an informational guidance system. All scheme applications must be submitted directly through official government portals.
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AI-Powered Government Scheme Assistance Platform. Final Year Engineering Project.</p>
          <p style={{ color: '#64748b' }}>Built with React, Django REST Framework & PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
};
