import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { schemeApi } from '../api/schemeApi';
import { SchemeCard } from '../components/SchemeCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { SearchBar } from '../components/SearchBar';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';

const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
};

export const SchemeListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schemes, setSchemes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    state: searchParams.get('state') || '',
    scheme_type: searchParams.get('scheme_type') || '',
    benefit_type: searchParams.get('benefit_type') || '',
    search: searchParams.get('search') || '',
  });
  const resultsTopRef = useRef(null);

  const fetchSchemes = async (pageNum = 1) => {
    setLoading(true);
    try {
      const activeFilters = {};
      Object.keys(filters).forEach(k => {
        if (filters[k]) activeFilters[k] = filters[k];
      });
      const res = await schemeApi.getSchemes({ ...activeFilters, page: pageNum });
      const list = res.results || res;
      setSchemes(list);
      setTotalCount(res.count ?? list.length);
      setTotalPages(res.total_pages ?? 1);
      if (res.page_size) setPageSize(res.page_size);
      setPage(res.current_page ?? pageNum);
    } catch (err) {
      console.error("Error fetching schemes:", err);
      setSchemes([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes(1);
  }, [filters]);

  const goToPage = (target) => {
    if (loading || target < 1 || target > totalPages || target === page) return;
    fetchSchemes(target);
    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = (page - 1) * pageSize + schemes.length;
  const pageNumbers = getPageNumbers(page, totalPages);

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
          <div ref={resultsTopRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', scrollMarginTop: '90px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: 500 }}>
              {totalCount > 0 ? (
                <>
                  Showing <strong style={{ color: 'var(--gray-900)' }}>{rangeStart}–{rangeEnd}</strong> of{' '}
                  <strong style={{ color: 'var(--gray-900)' }}>{totalCount}</strong> scheme{totalCount !== 1 ? 's' : ''}
                  {totalPages > 1 && <span style={{ color: 'var(--gray-400)' }}> · Page {page} of {totalPages}</span>}
                </>
              ) : (
                <>Showing <strong style={{ color: 'var(--gray-900)' }}>0</strong> schemes</>
              )}
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
            <>
              <div className="scheme-grid">
                {schemes.map(scheme => (
                  <SchemeCard key={scheme.scheme_id} scheme={scheme} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="pagination" aria-label="Scheme pages">
                  <button
                    className="pagination-btn pagination-arrow"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1 || loading}
                    aria-label="Previous page"
                  >
                    <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
                    Prev
                  </button>

                  {pageNumbers.map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-btn ${p === page ? 'pagination-active' : ''}`}
                        onClick={() => goToPage(p)}
                        disabled={loading}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    className="pagination-btn pagination-arrow"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages || loading}
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
