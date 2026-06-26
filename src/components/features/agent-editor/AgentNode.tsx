import React, { memo } from 'react';
import { useI18n } from '../../../context/i18n';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot, Crown } from 'lucide-react';

export interface AgentNodeData {
  nodeId: string;
  displayName: string;
  model: string;
  instruction: string;
  description: string;
  tools: string[];
  isRoot: boolean;
  dataStoreIds?: string[];  // data store IDs attached to this agent (root node only)
  [key: string]: unknown;
}

const AgentNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const { t } = useI18n();
  const nodeData = data as unknown as AgentNodeData;
  const initial = (nodeData.displayName || 'A').charAt(0).toUpperCase();
  const isRoot = nodeData.isRoot;

  return (
    <div className={`agent-node ${isRoot ? 'agent-node--root' : 'agent-node--sub'} ${selected ? 'agent-node--selected' : ''}`}>
      {/* Target handle (top) — not shown on root */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="agent-node-handle"
        />
      )}

      {/* Header */}
      <div className={`agent-node-header ${isRoot ? 'agent-node-header--root' : 'agent-node-header--sub'}`}>
        {isRoot ? (
          <Crown className="agent-node-header-icon" />
        ) : (
          <Bot className="agent-node-header-icon" />
        )}
        <span className="agent-node-header-label">
          {isRoot ? t('nodeProps.rootAgent') : t('nodeProps.subAgent')}
        </span>
      </div>

      {/* Body */}
      <div className="agent-node-body">
        <div className="agent-node-avatar">{initial}</div>
        <div className="agent-node-info">
          <div className="agent-node-name">{nodeData.displayName || t('nodeProps.untitled')}</div>
          <div className="agent-node-model">{nodeData.model}</div>
        </div>
      </div>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="agent-node-handle"
      />
    </div>
  );
};

export const AgentNode = memo(AgentNodeComponent);
