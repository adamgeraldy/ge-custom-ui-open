import React, { useState, useRef, useEffect } from 'react';
import { useApp, type DataStoreItem } from '../../../context/AppContext';
import { useI18n } from '../../../context/i18n';
import { Database, Loader2, Lock } from 'lucide-react';
import './DataStorePopup.css';

/* ── Inline SVG icons for Google workspace products ─────── */
const GoogleDriveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.71 3.5L1.15 15l2.86 4.95h5.72L3.17 8.45 7.71 3.5z" fill="#0066DA"/>
    <path d="M16.29 3.5H7.71l6.56 11.5h8.58L16.29 3.5z" fill="#00AC47"/>
    <path d="M22.85 15H14.27l-2.86 4.95L14.27 24h5.72l2.86-4.95V15z" fill="#EA4335"/>
    <path d="M7.71 3.5l-4.54 4.95 6.56 11.5 4.54-4.95L7.71 3.5z" fill="#00832D"/>
    <path d="M14.27 15L7.71 3.5h8.58l6.56 11.5H14.27z" fill="#2684FC"/>
    <path d="M14.27 15l-2.86 4.95H3.99l2.86-4.95h7.42z" fill="#FFBA00"/>
  </svg>
);

const GmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6l10 7 10-7v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="#EA4335"/>
    <path d="M22 6l-10 7L2 6V4a2 2 0 012-2h16a2 2 0 012 2v2z" fill="#C5221F"/>
    <path d="M2 6l10 7 10-7" fill="none" stroke="#fff" strokeWidth="0.5"/>
  </svg>
);

const GenericDataIcon = () => (
  <Database size={20} className="ds-icon-generic" />
);

const getIcon = (type: DataStoreItem['type']) => {
  switch (type) {
    case 'drive': return <GoogleDriveIcon />;
    case 'mail': return <GmailIcon />;
    default: return <GenericDataIcon />;
  }
};

interface DataStorePopupProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export const DataStorePopup: React.FC<DataStorePopupProps> = ({ anchorRef }) => {
  const {
    dataStores, dataStoresLoading, toggleDataStore, toggleAllDataStores,
    agentDataStoreLocked, activeAgent,
  } = useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, anchorRef]);

  const allEnabled = dataStores.length > 0 && dataStores.every(ds => ds.enabled);

  return (
    <>
      <button
        ref={anchorRef as React.RefObject<HTMLButtonElement>}
        type="button"
        className="input-icon-btn flex-center"
        title={t('dataStore.title')}
        onClick={() => setOpen(prev => !prev)}
      >
        <svg className="input-bar-icon bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" />
          <line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" />
          <line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" />
          <line x1="2" x2="6" y1="14" y2="14" /><line x1="10" x2="14" y1="8" y2="8" /><line x1="18" x2="22" y1="16" y2="16" />
        </svg>
      </button>

      {open && (
        <div ref={popupRef} className="ds-popup">
          {dataStoresLoading ? (
            <div className="ds-popup-loading">
              <Loader2 size={18} className="ds-spinner" />
              <span>{t('dataStore.loading')}</span>
            </div>
          ) : dataStores.length === 0 ? (
            <div className="ds-popup-empty">{t('dataStore.empty')}</div>
          ) : (
            <>
              {/* Agent-locked banner */}
              {agentDataStoreLocked && (
                <div className="ds-agent-locked-banner">
                  <Lock size={14} />
                  <span>{t('dataStore.managedBy', { name: activeAgent?.name || 'agent' })}</span>
                </div>
              )}

              {/* Enable All toggle */}
              <div className={`ds-item ds-item--all ${agentDataStoreLocked ? 'ds-item--disabled' : ''}`}>
                <span className="ds-item-name">{t('dataStore.enableAll')}</span>
                <label className="ds-toggle">
                  <input
                    type="checkbox"
                    checked={allEnabled}
                    onChange={() => toggleAllDataStores(!allEnabled)}
                    disabled={agentDataStoreLocked}
                  />
                  <span className={`ds-toggle-slider ${agentDataStoreLocked ? 'ds-toggle-slider--disabled' : ''}`} />
                </label>
              </div>

              <div className="ds-divider" />

              {/* Individual data stores */}
              {dataStores.map((ds) => (
                <div key={ds.id} className={`ds-item ${agentDataStoreLocked ? 'ds-item--disabled' : ''}`}>
                  <div className="ds-item-left">
                    <span className="ds-item-icon">{getIcon(ds.type)}</span>
                    <span className="ds-item-name">{ds.displayName}</span>
                  </div>
                  <label className="ds-toggle">
                    <input
                      type="checkbox"
                      checked={ds.enabled}
                      onChange={() => toggleDataStore(ds.id)}
                      disabled={agentDataStoreLocked}
                    />
                    <span className={`ds-toggle-slider ${agentDataStoreLocked ? 'ds-toggle-slider--disabled' : ''}`} />
                  </label>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
};
