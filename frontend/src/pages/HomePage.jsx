import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { SchemeCard } from '../components/SchemeCard';
import { schemeApi } from '../api/schemeApi';
import { ArrowRight, Sparkles, Sprout, GraduationCap, HeartHandshake } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const HomePage = () => {
  const { t } = useTranslation();
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const data = await schemeApi.getSchemes({ limit: 6 });
        setFeaturedSchemes((data.results || data).slice(0, 6));
      } catch (err) {
        console.error("Failed to load featured schemes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const handleSearchSubmit = (query) => {
    navigate(`/schemes?search=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(145deg, var(--primary-900) 0%, #0f2d52 50%, var(--primary-800) 100%)', color: 'white', padding: '4.5rem 0 5.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', opacity: 0.04, backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}></div>
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,132,0.12) 0%, transparent 70%)' }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.4rem 1.1rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '1.5rem', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,168,132,0.2)' }}>
              <Sparkles style={{ width: '0.95rem', height: '0.95rem' }} /> {t('home.hero_badge')}
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.85rem)', color: 'white', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '1.25rem', lineHeight: 1.15 }}>
              {t('home.hero_title')}
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '2.5rem', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              {t('home.hero_subtitle')}
            </p>

            <div style={{ marginBottom: '1.75rem', maxWidth: '560px', margin: '0 auto 1.75rem' }}>
              <SearchBar onSearch={handleSearchSubmit} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#64748b', alignItems: 'center' }}>
              <span>{t('home.popular_searches')}</span>
              <Link to="/schemes?category=FARMER" style={{ color: 'var(--accent-emerald)', fontWeight: 600, padding: '0.2rem 0.6rem', background: 'rgba(0,168,132,0.1)', borderRadius: '9999px' }}>PM-KISAN</Link>
              <Link to="/schemes?category=EDUCATION" style={{ color: 'var(--accent-emerald)', fontWeight: 600, padding: '0.2rem 0.6rem', background: 'rgba(0,168,132,0.1)', borderRadius: '9999px' }}>Post-Matric Scholarship</Link>
              <Link to="/schemes?category=WOMEN_CHILD" style={{ color: 'var(--accent-emerald)', fontWeight: 600, padding: '0.2rem 0.6rem', background: 'rgba(0,168,132,0.1)', borderRadius: '9999px' }}>Sukanya Samriddhi</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="container" style={{ marginTop: '-2.75rem', position: 'relative', zIndex: 10 }}>
        <div className="category-grid">
          <Link to="/schemes?category=FARMER" className="category-card farmer">
            <div className="category-icon-box">
              <Sprout />
            </div>
            <div className="category-card-content">
              <h3>{t('home.cat_farmer')}</h3>
              <p>{t('home.cat_farmer_desc')}</p>
            </div>
          </Link>

          <Link to="/schemes?category=EDUCATION" className="category-card education">
            <div className="category-icon-box">
              <GraduationCap />
            </div>
            <div className="category-card-content">
              <h3>{t('home.cat_edu')}</h3>
              <p>{t('home.cat_edu_desc')}</p>
            </div>
          </Link>

          <Link to="/schemes?category=WOMEN_CHILD" className="category-card women">
            <div className="category-icon-box">
              <HeartHandshake />
            </div>
            <div className="category-card-content">
              <h3>{t('home.cat_women')}</h3>
              <p>{t('home.cat_women_desc')}</p>
            </div>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container" style={{ padding: '4.5rem 0' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.65rem', letterSpacing: '-0.02em' }}>{t('home.how_it_works_title')}</h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.925rem', lineHeight: 1.6 }}>
            {t('home.how_it_works_subtitle')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>
          <div style={{ background: 'white', padding: '2rem 1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', textAlign: 'center', boxShadow: 'var(--shadow-xs)', transition: 'all 0.25s ease' }}>
            <div style={{ width: '3.25rem', height: '3.25rem', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#1d4ed8', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 800, fontSize: '1.2rem' }}>1</div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{t('home.step1_title')}</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', lineHeight: 1.6 }}>{t('home.step1_desc')}</p>
          </div>

          <div style={{ background: 'white', padding: '2rem 1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', textAlign: 'center', boxShadow: 'var(--shadow-xs)', transition: 'all 0.25s ease' }}>
            <div style={{ width: '3.25rem', height: '3.25rem', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#047857', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 800, fontSize: '1.2rem' }}>2</div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{t('home.step2_title')}</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', lineHeight: 1.6 }}>{t('home.step2_desc')}</p>
          </div>

          <div style={{ background: 'white', padding: '2rem 1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', textAlign: 'center', boxShadow: 'var(--shadow-xs)', transition: 'all 0.25s ease' }}>
            <div style={{ width: '3.25rem', height: '3.25rem', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#b45309', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 800, fontSize: '1.2rem' }}>3</div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{t('home.step3_title')}</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', lineHeight: 1.6 }}>{t('home.step3_desc')}</p>
          </div>
        </div>
      </section>

      {/* Featured Schemes */}
      <section style={{ backgroundColor: 'white', padding: '4rem 0', borderTop: '1px solid var(--gray-200)', borderBottom: '1px solid var(--gray-200)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>{t('home.featured_title')}</h2>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.925rem' }}>{t('home.featured_subtitle')}</p>
            </div>
            <Link to="/schemes" className="btn btn-secondary">
              {t('home.explore_all')} <ArrowRight style={{ width: '1rem', height: '1rem' }} />
            </Link>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{t('home.loading')}</p>
            </div>
          ) : (
            <div className="scheme-grid">
              {featuredSchemes.map((scheme) => (
                <SchemeCard key={scheme.scheme_id} scheme={scheme} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
