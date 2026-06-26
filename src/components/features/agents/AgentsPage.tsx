import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useI18n } from '../../../context/i18n';
import { AgentCard } from './AgentCard';
import { Search, SlidersHorizontal, RefreshCcw } from 'lucide-react';
import './AgentsPage.css';

export const AgentsPage: React.FC = () => {
  const { agents, startChat } = useApp();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Categories list extracted from agents + "All"
  const categories = ['All', ...Array.from(new Set(agents.map(a => a.tag)))];

  // Filter logic
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || agent.tag === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <div className="agents-page dark-scroll animate-fade-in">
      <div className="page-header-group">
        <div className="title-section">
          <h2>{t('agents.title')}</h2>
          <p>{t('agents.description')}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="search-filter-bar">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder={t('agents.searchPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-search-input"
          />
        </div>

        <div className="category-scroll-container">
          <div className="category-list">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agents Catalog Grid */}
      <div className="catalog-results-section">
        <div className="results-count">
          {t('agents.showing', { count: String(filteredAgents.length), total: String(agents.length) })}
        </div>

        {filteredAgents.length === 0 ? (
          <div className="empty-results flex-center flex-column">
            <SlidersHorizontal className="empty-icon" />
            <h3>{t('agents.noResults')}</h3>
            <p>{t('agents.noResultsDesc')}</p>
            <button className="reset-filter-btn flex-center" onClick={handleResetFilters}>
              <RefreshCcw className="reset-icon" />
              <span>{t('agents.resetSearch')}</span>
            </button>
          </div>
        ) : (
          <div className="agents-grid">
            {filteredAgents.map((agent) => (
              <AgentCard 
                key={agent.id}
                agent={agent}
                onClick={() => startChat(agent.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
