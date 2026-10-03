import React, { useState } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export const FilterSidebar = ({ filters, onFilterChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(true);

  const indianStates = [
    'All India', 'Maharashtra', 'Karnataka', 'Uttar Pradesh', 'Tamil Nadu',
    'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'West Bengal', 'Bihar', 'Punjab', 'Kerala'
  ];

  return (
    <div>
      <button className="filter-mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
        <Filter style={{ width: '1rem', height: '1rem' }} />
        Filters
        {isOpen ? <ChevronUp style={{ width: '0.9rem', height: '0.9rem' }} /> : <ChevronDown style={{ width: '0.9rem', height: '0.9rem' }} />}
      </button>

      <div className={`filter-sidebar ${!isOpen ? 'collapsed' : ''}`}>
        <div className="filter-header">
          <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Filter style={{ width: '1rem', height: '1rem', color: 'var(--primary-700)' }} />
            Filter Schemes
          </h3>
          <button onClick={onReset} className="filter-reset-btn">
            <RotateCcw style={{ width: '0.75rem', height: '0.75rem' }} /> Reset
          </button>
        </div>

        <div className="filter-group">
          <label className="filter-label">Domain Category</label>
          <select
            className="filter-select"
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
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

        <div className="filter-group">
          <label className="filter-label">Applicable State</label>
          <select
            className="filter-select"
            value={filters.state || ''}
            onChange={(e) => onFilterChange('state', e.target.value)}
          >
            <option value="">All States / Pan-India</option>
            {indianStates.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Scheme Type</label>
          <select
            className="filter-select"
            value={filters.scheme_type || ''}
            onChange={(e) => onFilterChange('scheme_type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="CENTRAL">Central Sector Scheme</option>
            <option value="STATE">State Sponsored Scheme</option>
            <option value="JOINT">Joint Centrally Sponsored</option>
          </select>
        </div>

        <div className="filter-group" style={{ marginBottom: 0 }}>
          <label className="filter-label">Benefit Mode</label>
          <select
            className="filter-select"
            value={filters.benefit_type || ''}
            onChange={(e) => onFilterChange('benefit_type', e.target.value)}
          >
            <option value="">All Benefit Types</option>
            <option value="FINANCIAL">Cash Transfer / Financial</option>
            <option value="SUBSIDY">Subsidy Support</option>
            <option value="SCHOLARSHIP">Scholarship</option>
            <option value="LOAN">Subsidized Credit / Loan</option>
          </select>
        </div>
      </div>
    </div>
  );
};
