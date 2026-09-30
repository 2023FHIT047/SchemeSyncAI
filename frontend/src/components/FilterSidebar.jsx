import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export const FilterSidebar = ({ filters, onFilterChange, onReset }) => {
  const indianStates = [
    'All India', 'Maharashtra', 'Karnataka', 'Uttar Pradesh', 'Tamil Nadu', 
    'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'West Bengal', 'Bihar', 'Punjab', 'Kerala'
  ];

  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter style={{ width: '1rem', height: '1rem', color: 'var(--primary-700)' }} />
          Filter Schemes
        </h3>
        <button onClick={onReset} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <RotateCcw style={{ width: '0.75rem', height: '0.75rem' }} /> Reset
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Domain Category</label>
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange('category', e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '0.875rem' }}
        >
          <option value="">All Domains</option>
          <option value="FARMER">🌾 Farmers & Agriculture</option>
          <option value="EDUCATION">🎓 Education & Students</option>
          <option value="WOMEN_CHILD">👩 Women & Child Welfare</option>
          <option value="HEALTHCARE">🏥 Healthcare & Insurance</option>
          <option value="EMPLOYMENT">💼 Employment & Livelihood</option>
          <option value="SKILL_DEV">🛠️ Skill Development</option>
        </select>
      </div>

      {/* State Filter */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Applicable State</label>
        <select
          value={filters.state || ''}
          onChange={(e) => onFilterChange('state', e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '0.875rem' }}
        >
          <option value="">All States / Pan-India</option>
          {indianStates.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      {/* Scheme Type Filter */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Scheme Type</label>
        <select
          value={filters.scheme_type || ''}
          onChange={(e) => onFilterChange('scheme_type', e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '0.875rem' }}
        >
          <option value="">All Types</option>
          <option value="CENTRAL">Central Sector Scheme</option>
          <option value="STATE">State Sponsored Scheme</option>
          <option value="JOINT">Joint Centrally Sponsored</option>
        </select>
      </div>

      {/* Benefit Type Filter */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Benefit Mode</label>
        <select
          value={filters.benefit_type || ''}
          onChange={(e) => onFilterChange('benefit_type', e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '0.875rem' }}
        >
          <option value="">All Benefit Types</option>
          <option value="FINANCIAL">Cash Transfer / Financial</option>
          <option value="SUBSIDY">Subsidy Support</option>
          <option value="SCHOLARSHIP">Scholarship</option>
          <option value="LOAN">Subsidized Credit / Loan</option>
        </select>
      </div>
    </div>
  );
};
