import React, { useState, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { useI18n } from '../../../context/i18n';
import { AgentCard } from './AgentCard';
import { Paperclip, Send } from 'lucide-react';
import { DataStorePopup } from '../chat/DataStorePopup';
import './DashboardHome.css';

export const DashboardHome: React.FC = () => {
  const { user, agents, agentsLoading, startChat, startNewChat } = useApp();
  const { t } = useI18n();
  const [inputText, setInputText] = useState('');
  const dsAnchorRef = useRef<HTMLButtonElement>(null);

  const handleAgentClick = (agentId: string) => {
    startChat(agentId);
  };

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');
    
    // Start a new session (no specific agent) and send the message
    startNewChat(textToSend);
  };

  if (!user) return null;

  return (
    <div className="dashboard-home animate-fade-in">
      <div className="home-scroll-wrapper dark-scroll">
        <div className="home-scroll-container">
          
          {/* Welcome Section */}
          <div className="welcome-banner">
            {/* Mascot */}
            <div className="mascot-container">
              <img src="/mascot.png" alt="BT-GE Mascot" className="mascot-svg" />
            </div>

            <h2 className="welcome-title">{t('dashboard.welcome', { name: user.username })}</h2>
            <p className="welcome-subtitle">
              {t('dashboard.subtitle')}
            </p>
            <span className="welcome-version">Version 1.0</span>
          </div>

          {/* Catalog Section */}
          <div className="catalog-section">
            <div className="catalog-header">
              <h3>{t('dashboard.catalog')}</h3>
              <p>{t('dashboard.catalogDesc')}</p>
            </div>

            <div className="catalog-grid">
              {agentsLoading ? (
                <div className="agents-loading">
                  <div className="spinner agents-spinner"></div>
                  <p>{t('dashboard.loadingAgents')}</p>
                </div>
              ) : (
                agents.map((agent) => (
                  <AgentCard 
                    key={agent.id}
                    agent={agent}
                    onClick={() => handleAgentClick(agent.id)}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Chat Input Bar */}
      <div className="home-chat-bar-container">
        <form onSubmit={handleSendPrompt} className="home-chat-bar flex-between">
          <div className="bar-left flex-center">
            <DataStorePopup anchorRef={dsAnchorRef} />
            <button type="button" className="bar-icon-btn flex-center" title="Attachment">
              <Paperclip className="bar-icon" />
            </button>
          </div>

          <input 
            type="text" 
            placeholder={t('dashboard.inputPlaceholder')} 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="home-bar-input"
          />

          <button type="submit" className="bar-send-btn flex-center" disabled={!inputText.trim()}>
            <Send className="send-icon" />
          </button>
        </form>
      </div>

    </div>
  );
};
