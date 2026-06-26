import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/i18n';
import { Plus, ChevronRight, LogOut } from 'lucide-react';
import './Header.css';

export const Header: React.FC = () => {
  const { user, currentView, activeAgent, clearActiveChat, logout } = useApp();
  const { t } = useI18n();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const renderBreadcrumbs = () => {
    const items = [];

    if (currentView === 'home') {
      items.push(<span key="home">{t('header.breadcrumbHome')}</span>);
      items.push(<ChevronRight key="s1" className="crumb-arrow" />);
      items.push(<span key="version" className="crumb-active">{t('header.breadcrumbTitle')}</span>);
    } else if (currentView === 'agents') {
      items.push(<span key="home" onClick={clearActiveChat} className="crumb-link">{t('header.breadcrumbHome')}</span>);
      items.push(<ChevronRight key="s1" className="crumb-arrow" />);
      items.push(<span key="agents" className="crumb-active">{t('nav.agents')}</span>);
    } else if (currentView === 'chat' && activeAgent) {
      items.push(<span key="home" onClick={clearActiveChat} className="crumb-link">{t('header.breadcrumbHome')}</span>);
      items.push(<ChevronRight key="s1" className="crumb-arrow" />);
      items.push(<span key="chat-agent" className="crumb-active">{activeAgent.name}</span>);
    }

    return <div className="breadcrumbs">{items}</div>;
  };

  if (!user) return null;

  return (
    <header className="app-header">
      {/* Left side: Logo & Breadcrumbs */}
      <div className="header-left">
        <div className="header-brand-badge">
          <img src="/mascot.png" alt="BT-GE" className="header-logo-img" />
          <span className="header-brand-text">{t('footer.brand')}</span>
        </div>
        <div className="divider-vertical"></div>
        {renderBreadcrumbs()}
      </div>

      {/* Right side: New Chat + Avatar */}
      <div className="header-right">
        <button className="new-chat-btn" onClick={clearActiveChat}>
          <Plus className="new-chat-icon" />
          <span>{t('header.newChat')}</span>
        </button>

        <div className="header-avatar-wrapper" ref={menuRef}>
          <div
            className="header-avatar flex-center"
            title={`${user.username} (${user.role})`}
            onClick={() => setShowMenu(!showMenu)}
          >
            {user.picture ? (
              <img src={user.picture} alt={user.username} className="header-avatar-img" referrerPolicy="no-referrer" />
            ) : (
              <span className="header-avatar-initial">{user.username?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
          </div>

          {showMenu && (
            <div className="avatar-dropdown">
              <div className="avatar-dropdown-info">
                <span className="avatar-dropdown-name">{user.username}</span>
                <span className="avatar-dropdown-role">{user.role}</span>
              </div>
              <div className="avatar-dropdown-divider" />
              <button className="avatar-dropdown-item" onClick={logout}>
                <LogOut className="avatar-dropdown-icon" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
