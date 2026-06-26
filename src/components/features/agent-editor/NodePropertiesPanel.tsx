import React from 'react';
import { useI18n } from '../../../context/i18n';
import { X, Trash2, Database } from 'lucide-react';
import type { AgentNodeData } from './AgentNode';
import type { DataStoreItem } from '../../../context/AppContext';

const AVAILABLE_MODELS = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

const TOOL_I18N_KEYS: Record<string, string> = {
  googleSearch: 'nodeProps.googleSearch',
  codeExecution: 'nodeProps.codeExecution',
  urlFetch: 'nodeProps.urlFetch',
};

const AVAILABLE_TOOLS = [
  { id: 'googleSearch' },
  { id: 'codeExecution' },
  { id: 'urlFetch' },
];

/* ── Inline SVG icons for Google workspace products ─────── */
const GoogleDriveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.71 3.5L1.15 15l2.86 4.95h5.72L3.17 8.45 7.71 3.5z" fill="#0066DA"/>
    <path d="M16.29 3.5H7.71l6.56 11.5h8.58L16.29 3.5z" fill="#00AC47"/>
    <path d="M22.85 15H14.27l-2.86 4.95L14.27 24h5.72l2.86-4.95V15z" fill="#EA4335"/>
    <path d="M7.71 3.5l-4.54 4.95 6.56 11.5 4.54-4.95L7.71 3.5z" fill="#00832D"/>
    <path d="M14.27 15L7.71 3.5h8.58l6.56 11.5H14.27z" fill="#2684FC"/>
    <path d="M14.27 15l-2.86 4.95H3.99l2.86-4.95h7.42z" fill="#FFBA00"/>
  </svg>
);

const GmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6l10 7 10-7v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="#EA4335"/>
    <path d="M22 6l-10 7L2 6V4a2 2 0 012-2h16a2 2 0 012 2v2z" fill="#C5221F"/>
    <path d="M2 6l10 7 10-7" fill="none" stroke="#fff" strokeWidth="0.5"/>
  </svg>
);

const getDsIcon = (type: DataStoreItem['type']) => {
  switch (type) {
    case 'drive': return <GoogleDriveIcon />;
    case 'mail': return <GmailIcon />;
    default: return <Database size={16} style={{ opacity: 0.5 }} />;
  }
};

interface NodePropertiesPanelProps {
  nodeData: AgentNodeData;
  onUpdate: (field: keyof AgentNodeData, value: unknown) => void;
  onClose: () => void;
  onDelete: () => void;
  availableDataStores: DataStoreItem[];
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  nodeData,
  onUpdate,
  onClose,
  onDelete,
  availableDataStores,
}) => {
  const { t } = useI18n();

  const handleToolToggle = (toolId: string) => {
    const currentTools = nodeData.tools || [];
    if (currentTools.includes(toolId)) {
      onUpdate('tools', currentTools.filter((t: string) => t !== toolId));
    } else {
      onUpdate('tools', [...currentTools, toolId]);
    }
  };

  const handleDataStoreToggle = (dsId: string) => {
    const current = nodeData.dataStoreIds || [];
    if (current.includes(dsId)) {
      onUpdate('dataStoreIds', current.filter((id: string) => id !== dsId));
    } else {
      onUpdate('dataStoreIds', [...current, dsId]);
    }
  };

  const selectedDsIds = nodeData.dataStoreIds || [];

  return (
    <div className="node-properties-panel">
      <div className="npp-header">
        <h3 className="npp-title">{t('nodeProps.title')}</h3>
        <button className="npp-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="npp-body">
        {/* Agent Name */}
        <div className="npp-field">
          <label className="npp-label">{t('nodeProps.agentName')}</label>
          <input
            type="text"
            className="npp-input"
            value={nodeData.displayName}
            onChange={(e) => onUpdate('displayName', e.target.value)}
            placeholder={t('nodeProps.agentNamePlaceholder')}
          />
        </div>

        {/* Description */}
        <div className="npp-field">
          <label className="npp-label">{t('nodeProps.description')}</label>
          <textarea
            className="npp-textarea npp-textarea--sm"
            value={nodeData.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder={t('nodeProps.descriptionPlaceholder')}
            rows={2}
          />
        </div>

        {/* Model */}
        <div className="npp-field">
          <label className="npp-label">{t('nodeProps.model')}</label>
          <select
            className="npp-select"
            value={nodeData.model}
            onChange={(e) => onUpdate('model', e.target.value)}
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Instructions */}
        <div className="npp-field">
          <label className="npp-label">{t('nodeProps.instructions')}</label>
          <textarea
            className="npp-textarea"
            value={nodeData.instruction}
            onChange={(e) => onUpdate('instruction', e.target.value)}
            placeholder={t('nodeProps.instructionsPlaceholder')}
            rows={6}
          />
        </div>

        {/* Tools */}
        <div className="npp-field">
          <label className="npp-label">{t('nodeProps.tools')}</label>
          <div className="npp-tools-list">
            {AVAILABLE_TOOLS.map((tool) => (
              <label key={tool.id} className="npp-tool-item">
                <input
                  type="checkbox"
                  checked={(nodeData.tools || []).includes(tool.id)}
                  onChange={() => handleToolToggle(tool.id)}
                />
                <span>{t(TOOL_I18N_KEYS[tool.id] || tool.id)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Data Sources — only on root node */}
        {nodeData.isRoot && availableDataStores.length > 0 && (
          <div className="npp-field">
            <label className="npp-label">
              <Database size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              {t('nodeProps.dataSources')}
            </label>
            <p className="npp-hint">{t('nodeProps.dataSourcesHint')}</p>
            <div className="npp-ds-list">
              {availableDataStores.map((ds) => (
                <label key={ds.id} className="npp-ds-item">
                  <input
                    type="checkbox"
                    checked={selectedDsIds.includes(ds.id)}
                    onChange={() => handleDataStoreToggle(ds.id)}
                  />
                  <span className="npp-ds-icon">{getDsIcon(ds.type)}</span>
                  <span className="npp-ds-name">{ds.displayName}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        {!nodeData.isRoot && (
          <div className="npp-field npp-field--danger">
            <button className="npp-delete-btn" onClick={onDelete}>
              <Trash2 size={16} />
              <span>{t('nodeProps.deleteNode')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
