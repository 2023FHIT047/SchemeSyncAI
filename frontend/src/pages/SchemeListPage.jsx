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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Government Scheme Directory</h1>
        <p style={{ color: 'var(--gray-600)' }}>
          Browse verified central and state welfare initiatives across Farmers, Education, and Women & Child domains.
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <SearchBar onSearch={handleSearchSubmit} initialValue={filters.search} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Sidebar Filters */}
        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />

        {/* Scheme List Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)', fontWeight: 500 }}>
              Showing <strong>{schemes.length}</strong> government schemes
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
              Loading government schemes...
            </div>
          ) : schemes.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--gray-200)' }}>
              <Layers style={{ width: '3rem', height: '3rem', color: 'var(--gray-400)', marginBottom: '1rem' }} />
              <h3>No schemes match your selected criteria</h3>
              <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                Try resetting filters or searching with different keywords.
              </p>
              <button onClick={handleReset} className="btn btn-secondary btn-sm">Reset All Filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
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
