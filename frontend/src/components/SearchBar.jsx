import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const SearchBar = ({ onSearch, initialValue = '' }) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', color: 'var(--gray-400)' }}>
          <Search style={{ width: '1.25rem', height: '1.25rem' }} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by scheme name, category, state (e.g. PM Kisan, Maharashtra student, Farmer scholarship)..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem', padding: '0.5rem 0' }}
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Search Schemes
        </button>
      </div>
    </form>
  );
};
