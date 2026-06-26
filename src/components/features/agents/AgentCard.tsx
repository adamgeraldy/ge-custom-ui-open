import React, { useState, useRef, useEffect } from 'react';
import type { Agent } from '../../../context/AppContext';
import { useApp } from '../../../context/AppContext';
import { useI18n } from '../../../context/i18n';
import { MoreVertical, Trash2, Pencil } from 'lucide-react';
import './AgentCard.css';

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  const { deleteAgent, editAgent } = useApp();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    const confirmed = window.confirm(t('agentCard.deleteConfirm', { name: agent.name }));
    if (!confirmed) {
      setMenuOpen(false);
      return;
    }
    setDeleting(true);
    await deleteAgent(agent.id);
    setDeleting(false);
    setMenuOpen(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    editAgent(agent.id);
  };

  // Compute visibility label
  const getVisibilityLabel = (): { text: string; className: string } | null => {
    if (agent.sharingScope === 'ALL_USERS') {
      return { text: t('agentCard.public'), className: 'badge-public' };
    }
    if (agent.state === 'PRIVATE') {
      return { text: t('agentCard.private'), className: 'badge-private' };
    }
    if (agent.state === 'ENABLED' && agent.sharingScope === 'RESTRICTED') {
      return { text: t('agentCard.restricted'), className: 'badge-restricted' };
    }
    return null;
  };

  const visibilityLabel = getVisibilityLabel();
  const firstLetter = agent.name.charAt(0).toUpperCase();

  return (
    <div className={`agent-card animate-scale-in ${deleting ? 'agent-card--deleting' : ''}`} onClick={onClick}>
      {/* Header row: icon + kebab menu */}
      <div className="agent-card-header">
        <div className="agent-icon-container">
          <span className="agent-card-letter">{firstLetter}</span>
        </div>

        {/* 3-dot menu (not shown for Google-managed agents) */}
        {!agent.isGoogleAgent && (
          <div className="agent-card-menu-wrapper" ref={menuRef}>
            <button
              className="agent-card-kebab"
              onClick={handleMenuToggle}
              title={t('agentCard.moreOptions')}
            >
              <MoreVertical className="kebab-icon" />
            </button>

            {menuOpen && (
              <div className="agent-card-dropdown animate-scale-in">
                {agent.agentType === 'LOW_CODE' && agent.canEdit && (
                  <button className="dropdown-item" onClick={handleEdit}>
                    <Pencil className="dropdown-item-icon" />
                    <span>{t('agentCard.editAgent')}</span>
                  </button>
                )}
                <button className="dropdown-item dropdown-delete" onClick={handleDelete} disabled={deleting}>
                  <Trash2 className="dropdown-item-icon" />
                  <span>{deleting ? t('agentCard.deleting') : t('agentCard.deleteAgent')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="agent-card-body">
        <h3 className="agent-card-name">{agent.name}</h3>
        <p className="agent-card-desc">{agent.description}</p>
      </div>

      {/* Footer with badges */}
      <div className="agent-card-footer">
        {agent.isGoogleAgent && (
          <span className="agent-badge-google">{t('agentCard.google')}</span>
        )}
        {visibilityLabel && (
          <span className={`agent-badge-visibility ${visibilityLabel.className}`}>
            {visibilityLabel.text}
          </span>
        )}
      </div>
    </div>
  );
};
