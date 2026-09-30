import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { SchemeCard } from '../components/SchemeCard';
import { schemeApi } from '../api/schemeApi';
import { ShieldCheck, CheckCircle2, FileText, ArrowRight, Sparkles, Sprout, GraduationCap, HeartHandshake } from 'lucide-react';
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
        setFeaturedSchemes(data.results || data.slice(0, 6));
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
      <section style={{ background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-800) 100%)', color: 'white', padding: '4rem 0 5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', opacity: 0.05, backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.35rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '1.25rem', backdropFilter: 'blur(4px)' }}>
              <Sparkles style={{ width: '1rem', height: '1rem' }} /> {t('home.hero_badge')}
            </div>

            <h1 style={{ fontSize: '2.75rem', color: 'white', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.25rem', lineHeight: '1.2' }}>
              {t('home.hero_title')}
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              {t('home.hero_subtitle')}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <SearchBar onSearch={handleSearchSubmit} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>{t('home.popular_searches')}</span>
              <Link to="/schemes?category=FARMER" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>PM-KISAN</Link>
              <Link to="/schemes?category=EDUCATION" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Post-Matric Scholarship</Link>
              <Link to="/schemes?category=WOMEN_CHILD" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Sukanya Samriddhi</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Categories Grid */}
      <section className="container" style={{ marginTop: '-2.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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

      {/* Platform Features / Workflow */}
      <section className="container" style={{ padding: '4rem 0' }}>
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem' }}>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem' }}>{t('home.how_it_works_title')}</h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem' }}>
            {t('home.how_it_works_subtitle')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'white', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', textAlign: 'center' }}>
            <div style={{ width: '3rem', height: '3rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 700, fontSize: '1.2rem' }}>1</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('home.step1_title')}</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{t('home.step1_desc')}</p>
          </div>

          <div style={{ background: 'white', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', textAlign: 'center' }}>
            <div style={{ width: '3rem', height: '3rem', background: '#ecfdf5', color: '#047857', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 700, fontSize: '1.2rem' }}>2</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('home.step2_title')}</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{t('home.step2_desc')}</p>
          </div>

          <div style={{ background: 'white', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', textAlign: 'center' }}>
            <div style={{ width: '3rem', height: '3rem', background: '#fef3c7', color: '#b45309', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 700, fontSize: '1.2rem' }}>3</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('home.step3_title')}</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{t('home.step3_desc')}</p>
          </div>
        </div>
      </section>

      {/* Featured Schemes Section */}
      <section style={{ backgroundColor: 'white', padding: '4rem 0', borderTop: '1px solid var(--gray-200)', borderBottom: '1px solid var(--gray-200)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>{t('home.featured_title')}</h2>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem' }}>{t('home.featured_subtitle')}</p>
            </div>
            <Link to="/schemes" className="btn btn-secondary">
              {t('home.explore_all')} <ArrowRight style={{ width: '1rem', height: '1rem' }} />
            </Link>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--gray-500)' }}>{t('home.loading')}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
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
