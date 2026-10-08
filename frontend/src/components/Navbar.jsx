import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, User, Bookmark, CheckCircle2, LogOut, LogIn, Menu, X, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <div className="top-gov-header">
        <div className="container top-gov-content">
          <div className="gov-flag-badge">
            <span style={{ fontSize: '1rem' }}>🇮🇳</span>
            <span>Government of India Welfare Assistance Initiative</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Language:
              <button
                onClick={() => changeLanguage('en')}
                style={{ background: 'none', border: 'none', color: i18n.language === 'en' ? '#00a884' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', padding: '0.1rem 0.3rem' }}
              >
                EN
              </button>
              <span style={{ color: '#475569' }}>|</span>
              <button
                onClick={() => changeLanguage('hi')}
                style={{ background: 'none', border: 'none', color: i18n.language === 'hi' ? '#00a884' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', padding: '0.1rem 0.3rem' }}
              >
                हिं
              </button>
            </span>
            <span style={{ color: '#64748b' }}>Helpdesk: 1800-111-555</span>
          </div>
        </div>
      </div>

      <nav className="navbar">
        <div className="container nav-container">
          <Link to="/" className="nav-brand">
            <div className="nav-brand-logo">
              <Landmark style={{ width: '1.4rem', height: '1.4rem', color: 'white' }} />
            </div>
            <div className="nav-brand-text">
              <h1>GovScheme AI</h1>
              <p>Intelligent Citizen Welfare Portal</p>
            </div>
          </Link>

          <button className="nav-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X style={{ width: '1.5rem', height: '1.5rem' }} /> : <Menu style={{ width: '1.5rem', height: '1.5rem' }} />}
          </button>

          <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
            <li>
              <Link to="/schemes" className="nav-link" onClick={() => setMobileOpen(false)}>
                {t('navbar.schemes')}
              </Link>
            </li>
            <li>
              <Link to="/eligibility-checker" className="nav-link" onClick={() => setMobileOpen(false)}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: 'var(--accent-emerald)' }} />
                {t('navbar.check_eligibility')}
              </Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link to="/profile" className="nav-link" onClick={() => setMobileOpen(false)}>
                    <User style={{ width: '1rem', height: '1rem' }} />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                    <Bookmark style={{ width: '1rem', height: '1rem' }} />
                    {t('navbar.dashboard')}
                  </Link>
                </li>
                {user.is_staff && (
                  <li>
                    <Link to="/admin-panel" className="nav-link" onClick={() => setMobileOpen(false)}>
                      <Shield style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                      Admin
                    </Link>
                  </li>
                )}
                <li>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>
                      Hi, {profile?.full_name || user.username}
                    </span>
                    <button onClick={handleLogout} className="btn btn-outline-navy btn-sm">
                      <LogOut style={{ width: '0.85rem', height: '0.85rem' }} />
                      {t('navbar.logout')}
                    </button>
                  </div>
                </li>
              </>
            ) : (
              <li>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to="/login" className="btn btn-outline-navy btn-sm" onClick={() => setMobileOpen(false)}>
                    <LogIn style={{ width: '0.85rem', height: '0.85rem' }} />
                    {t('navbar.login')}
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
                    {t('navbar.register')}
                  </Link>
                </div>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </>
  );
};
