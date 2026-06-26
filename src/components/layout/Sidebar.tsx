import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/i18n';
import { 
  Home, 
  Bot, 
  Clock, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  MessageSquare,
  Loader2,
  PlusCircle
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { 
    user, 
    currentView, 
    setView, 
    chatHistory, 
    activeChatId, 
    loadChatSession,
    clearActiveChat,
    sessionsLoading,
    sessionsHasMore,
    loadMoreSessions
  } = useApp();
  const { t } = useI18n();

  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const handleNavClick = (view: 'home' | 'agents' | 'agent-editor') => {
    setView(view);
    if (view === 'home') {
      clearActiveChat();
    }
  };

  const handleHistoryToggle = () => {
    setIsHistoryExpanded(!isHistoryExpanded);
  };

  const selectHistorySession = (sessionId: string) => {
    loadChatSession(sessionId);
  };

  if (!user) return null;

  return (
    <aside className="app-sidebar dark-scroll">
      {/* Brand Section */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper flex-center">
          <img src="/mascot.png" alt="BT-GE" className="sidebar-brand-svg" />
        </div>
        <div className="brand-text">
          <span className="brand-name">{t('footer.brand')}</span>
          <span className="brand-tagline">{t('footer.tagline')}</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li>
            <button 
              className={`nav-item ${currentView === 'home' && !activeChatId ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              <Home className="nav-icon" />
              <span>{t('nav.home')}</span>
            </button>
          </li>
          
          <li>
            <button 
              className={`nav-item ${currentView === 'agents' ? 'active' : ''}`}
              onClick={() => handleNavClick('agents')}
            >
              <Bot className="nav-icon" />
              <span>{t('nav.agents')}</span>
            </button>
          </li>

          <li>
            <button 
              className={`nav-item ${currentView === 'agent-editor' ? 'active' : ''}`}
              onClick={() => handleNavClick('agent-editor')}
            >
              <PlusCircle className="nav-icon" />
              <span>{t('nav.createAgent')}</span>
            </button>
          </li>

          {/* Expandable Chat History Menu Item */}
          <li className="nav-history-group">
            <button 
              className={`nav-item ${isHistoryExpanded ? 'expanded' : ''} ${activeChatId ? 'active-parent' : ''}`}
              onClick={handleHistoryToggle}
            >
              <Clock className="nav-icon" />
              <span>{t('nav.chatHistory')}</span>
              {isHistoryExpanded ? (
                <ChevronDown className="history-arrow" />
              ) : (
                <ChevronRight className="history-arrow" />
              )}
            </button>

            {isHistoryExpanded && (
              <ul className="history-submenu animate-fade-in">
                {chatHistory.length === 0 && !sessionsLoading ? (
                  <li className="history-empty">{t('nav.noRecentChats')}</li>
                ) : (
                  chatHistory.map(session => (
                    <li key={session.id}>
                      <button
                        className={`history-subitem ${activeChatId === session.id ? 'active' : ''}`}
                        onClick={() => selectHistorySession(session.id)}
                        title={session.lastMessageText}
                      >
                        <MessageSquare className="history-subicon" />
                        <div className="history-subitem-meta">
                          <span className="history-title">{session.agentName}</span>
                          <span className="history-preview">{session.lastMessageText}</span>
                        </div>
                      </button>
                    </li>
                  ))
                )}

                {/* Loading spinner */}
                {sessionsLoading && (
                  <li className="history-loading">
                    <Loader2 className="history-spinner" />
                    <span>{t('nav.loading')}</span>
                  </li>
                )}

                {/* Show more button */}
                {sessionsHasMore && !sessionsLoading && (
                  <li className="history-show-more">
                    <button
                      className="show-more-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadMoreSessions();
                      }}
                    >
                      {t('nav.showMore')}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </li>

        </ul>
      </nav>


      {/* Settings & Footer */}
      <div className="sidebar-bottom">
        <button className="sidebar-settings-btn" onClick={onOpenSettings}>
          <Settings className="settings-icon" />
          <span>{t('nav.settings')}</span>
        </button>

        <div className="sidebar-footer">
          <span>{t('footer.version')}</span>
          <span>{t('footer.powered')}</span>
        </div>
      </div>
    </aside>
  );
};
