import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { schemeApi } from '../api/schemeApi';
import { SchemeCard } from '../components/SchemeCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { SearchBar } from '../components/SearchBar';
import { Layers } from 'lucide-react';

export const SchemeListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    state: searchParams.get('state') || '',
    scheme_type: searchParams.get('scheme_type') || '',
    benefit_type: searchParams.get('benefit_type') || '',
    search: searchParams.get('search') || '',
  });

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      Object.keys(filters).forEach(k => {
        if (filters[k]) activeFilters[k] = filters[k];
      });
      const res = await schemeApi.getSchemes(activeFilters);
      setSchemes(res.results || res);
    } catch (err) {
      console.error("Error fetching schemes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);

    const newParams = new URLSearchParams();
    Object.keys(updated).forEach(k => {
      if (updated[k]) newParams.set(k, updated[k]);
    });
    setSearchParams(newParams);
  };

  const handleReset = () => {
    const resetObj = { category: '', state: '', scheme_type: '', benefit_type: '', search: '' };
    setFilters(resetObj);
    setSearchParams({});
  };

  const handleSearchSubmit = (query) => {
    handleFilterChange('search', query);
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div className="page-header">
        <h1>Government Scheme Directory</h1>
        <p>Browse verified central and state welfare initiatives across Farmers, Education, and Women & Child domains.</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <SearchBar onSearch={handleSearchSubmit} initialValue={filters.search} />
      </div>

      <div className="scheme-list-layout">
        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: 500 }}>
              Showing <strong style={{ color: 'var(--gray-900)' }}>{schemes.length}</strong> scheme{schemes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading government schemes...</p>
            </div>
          ) : schemes.length === 0 ? (
            <div className="empty-state">
              <Layers style={{ width: '3rem', height: '3rem', color: 'var(--gray-300)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>No schemes match your criteria</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Try resetting filters or searching with different keywords.
              </p>
              <button onClick={handleReset} className="btn btn-secondary btn-sm">Reset All Filters</button>
            </div>
          ) : (
            <div className="scheme-grid">
              {schemes.map(scheme => (
                <SchemeCard key={scheme.scheme_id} scheme={scheme} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
