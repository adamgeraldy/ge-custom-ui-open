import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useI18n } from '../../../context/i18n';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Plus, Save, Loader2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AgentNode, type AgentNodeData } from './AgentNode';
import { NodePropertiesPanel } from './NodePropertiesPanel';
import {
  getAgent as apiGetAgent,
  type CreateAgentRequest,
  type LowCodeAgentNode,
} from '../../../utils/discovery-engine';
import './AgentEditorView.css';

const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
};

const DEFAULT_ROOT_DATA: AgentNodeData = {
  nodeId: 'root_agent',
  displayName: 'Root Agent',
  model: 'gemini-3.5-flash',
  instruction: 'You are the root agent. Describe your behavior here.',
  description: '',
  tools: ['googleSearch'],
  isRoot: true,
};

const INITIAL_NODES: Node[] = [
  {
    id: 'root_agent',
    type: 'agentNode',
    position: { x: 300, y: 80 },
    data: { ...DEFAULT_ROOT_DATA },
  },
];

let subAgentCounter = 0;

export const AgentEditorView: React.FC = () => {
  const { t } = useI18n();
  const { setView, createNewAgent, editingAgentId, updateAgent, accessToken, dataStores, agents } = useApp();
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState(t('editor.newAgent'));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const isEditMode = !!editingAgentId;

  // Load existing agent data in edit mode
  useEffect(() => {
    if (!editingAgentId || !accessToken || loadedRef.current) return;
    loadedRef.current = true;

    const loadAgent = async () => {
      setLoading(true);
      try {
        const agent = await apiGetAgent(accessToken, editingAgentId);
        const def = agent.lowCodeAgentDefinition;
        if (!def?.nodes?.length) {
          setError(t('editor.noNodeDef'));
          setLoading(false);
          return;
        }

        // Set the agent name
        setAgentName(agent.displayName || 'Unnamed Agent');

        // Convert API nodes to React Flow nodes
        const flowNodes: Node[] = [];
        const flowEdges: Edge[] = [];
        let subCount = 0;

        // Find rootAgentId
        const rootAgentId = def.rootAgentId || 'root_agent';

        // Get data store IDs for this agent.
        // Primary source: agents from context (from listAvailableAgentViews which has dataStoreSpecs)
        // Fallback: getAgent response (may not include dataStoreSpecs)
        const contextAgent = agents.find(a => a.id === editingAgentId);
        let loadedDsIds: string[] = contextAgent?.dataStoreIds || [];

        // Fallback: try parsing from the getAgent response
        if (loadedDsIds.length === 0) {
          const agentDsSpecs = agent.dataStoreSpecs as { specs?: { dataStore: string }[] } | undefined;
          if (agentDsSpecs?.specs) {
            for (const s of agentDsSpecs.specs) {
              if (s.dataStore) {
                const parts = s.dataStore.split('/');
                loadedDsIds.push(parts[parts.length - 1]);
              }
            }
          }
        }

        def.nodes.forEach((apiNode: LowCodeAgentNode) => {
          const isRoot = apiNode.id === rootAgentId;
          if (!isRoot) subCount += 1;

          // Extract tools
          const tools: string[] = [];
          if (apiNode.llmAgentNode?.selectedTools?.tool) {
            apiNode.llmAgentNode.selectedTools.tool.forEach((t: { name: string }) => {
              tools.push(t.name);
            });
          }

          const nodeData: AgentNodeData = {
            nodeId: apiNode.id,
            displayName: apiNode.displayName || apiNode.id,
            model: apiNode.llmAgentNode?.model || 'gemini-3.5-flash',
            instruction: apiNode.llmAgentNode?.instruction || '',
            description: apiNode.llmAgentNode?.description || '',
            tools,
            isRoot,
            ...(isRoot && loadedDsIds.length > 0 ? { dataStoreIds: loadedDsIds } : {}),
          };

          // Position: root at top center, sub-agents below in a grid
          const position = isRoot
            ? { x: 300, y: 80 }
            : { x: 100 + ((subCount - 1) % 3) * 250, y: 280 + Math.floor((subCount - 1) / 3) * 180 };

          flowNodes.push({
            id: apiNode.id,
            type: 'agentNode',
            position,
            data: nodeData,
          });

          // Create edges from subAgentIds
          if (apiNode.llmAgentNode?.subAgentIds) {
            apiNode.llmAgentNode.subAgentIds.forEach((childId: string) => {
              flowEdges.push({
                id: `edge-${apiNode.id}-${childId}`,
                source: apiNode.id,
                target: childId,
                animated: true,
              });
            });
          }
        });

        subAgentCounter = subCount;
        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [editingAgentId, accessToken, setNodes, setEdges]);

  // Reset loaded ref when component unmounts
  useEffect(() => {
    return () => {
      loadedRef.current = false;
    };
  }, []);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges],
  );

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Get selected node data
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeData = selectedNode?.data as unknown as AgentNodeData | undefined;

  // Update node data
  const updateNodeData = useCallback(
    (field: keyof AgentNodeData, value: unknown) => {
      if (!selectedNodeId) return;
      setNodes((nds: Node[]) =>
        nds.map((n) => {
          if (n.id === selectedNodeId) {
            return {
              ...n,
              data: { ...n.data, [field]: value },
            };
          }
          return n;
        }),
      );
    },
    [selectedNodeId, setNodes],
  );

  // Add new sub-agent node
  const addSubAgent = useCallback(() => {
    subAgentCounter += 1;
    const newId = `sub_agent_${subAgentCounter}`;
    const newNode: Node = {
      id: newId,
      type: 'agentNode',
      position: {
        x: 150 + subAgentCounter * 200,
        y: 280 + Math.floor((subAgentCounter - 1) / 3) * 180,
      },
      data: {
        nodeId: newId,
        displayName: `Sub Agent ${subAgentCounter}`,
        model: 'gemini-3.5-flash',
        instruction: t('editor.subInstruction'),
        description: '',
        tools: ['googleSearch'],
        isRoot: false,
      } as AgentNodeData,
    };

    setNodes((nds: Node[]) => [...nds, newNode]);

    // Auto-connect to root
    const rootNode = nodes.find((n) => (n.data as unknown as AgentNodeData).isRoot);
    const rootId = rootNode?.id || 'root_agent';
    const newEdge: Edge = {
      id: `edge-${rootId}-${newId}`,
      source: rootId,
      target: newId,
      animated: true,
    };
    setEdges((eds) => [...eds, newEdge]);
  }, [setNodes, setEdges, nodes]);

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    // Prevent deleting root node
    const nodeData = nodes.find(n => n.id === selectedNodeId)?.data as unknown as AgentNodeData | undefined;
    if (nodeData?.isRoot) return;

    setNodes((nds: Node[]) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges, nodes]);

  // Build API payload and save (create or update)
  const handleSave = useCallback(async () => {
    setError(null);
    setSaving(true);

    try {
      // Build the lowCodeAgentDefinition from the visual graph
      const apiNodes: LowCodeAgentNode[] = nodes.map((node) => {
        const data = node.data as unknown as AgentNodeData;

        // Find sub-agent IDs from edges where this node is the source
        const childEdges = edges.filter((e) => e.source === node.id);
        const subAgentIds = childEdges.map((e) => e.target);

        const llmNode: LowCodeAgentNode = {
          id: node.id,
          displayName: data.displayName,
          llmAgentNode: {
            model: data.model,
            instruction: data.instruction,
          },
        };

        if (data.description) {
          llmNode.llmAgentNode.description = data.description;
        }

        if (subAgentIds.length > 0) {
          llmNode.llmAgentNode.subAgentIds = subAgentIds;
        }

        if (data.tools && data.tools.length > 0) {
          llmNode.llmAgentNode.selectedTools = {
            tool: data.tools.map((name: string) => ({ name })),
          };
        }

        return llmNode;
      });

      const rootNode = nodes.find((n) => (n.data as unknown as AgentNodeData).isRoot);
      const rootDescription = rootNode
        ? (rootNode.data as unknown as AgentNodeData).description || agentName
        : agentName;

      // Build dataStoreSpecs from root node's dataStoreIds
      const rootData = rootNode?.data as unknown as AgentNodeData | undefined;
      const selectedDsIds = rootData?.dataStoreIds || [];
      const dataStoreSpecs = selectedDsIds.length > 0
        ? {
            specs: selectedDsIds.map((id: string) => ({
              dataStore: `projects/${import.meta.env.VITE_GCP_PROJECT_NUMBER}/locations/global/collections/default_collection/dataStores/${id}`,
            })),
          }
        : undefined;

      const payload: CreateAgentRequest = {
        displayName: agentName,
        description: rootDescription,
        lowCodeAgentDefinition: {
          nodes: apiNodes,
          rootAgentId: rootNode?.id || 'root_agent',
        },
        dataStoreSpecs,
      };

      let success: boolean;
      if (isEditMode && editingAgentId) {
        success = await updateAgent(editingAgentId, payload);
      } else {
        success = await createNewAgent(payload);
      }

      if (!success) {
        setError(`Failed to ${isEditMode ? 'update' : 'create'} agent. Please try again.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, agentName, createNewAgent, updateAgent, isEditMode, editingAgentId]);

  const handleBack = useCallback(() => {
    setView('agents');
  }, [setView]);

  if (loading) {
    return (
      <div className="agent-editor">
        <div className="agent-editor-loading">
          <Loader2 size={32} className="aet-spinner" />
          <span>{t('editor.loadingAgent')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-editor">
      {/* Toolbar */}
      <div className="agent-editor-toolbar">
        <div className="aet-left">
          <button className="aet-back-btn" onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>{t('editor.back')}</span>
          </button>
          <div className="aet-separator" />
          <input
            type="text"
            className="aet-name-input"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder={t('editor.agentNamePlaceholder')}
          />
          {isEditMode && (
            <span className="aet-edit-badge">{t('editor.editing')}</span>
          )}
        </div>
        <div className="aet-right">
          {error && <span className="aet-error">{error}</span>}
          <button className="aet-btn aet-btn--secondary" onClick={addSubAgent}>
            <Plus size={16} />
            <span>{t('editor.addNode')}</span>
          </button>
          <button
            className="aet-btn aet-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="aet-spinner" />
                <span>{t('editor.saving')}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isEditMode ? t('editor.updateAgent') : t('editor.saveAgent')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas + Properties */}
      <div className="agent-editor-body">
        <div className="agent-editor-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{ animated: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.08)" />
            <Controls
              showInteractive={false}
              className="agent-editor-controls"
            />
          </ReactFlow>
        </div>

        {/* Properties Panel — only when node selected */}
        {selectedNodeData && (
          <NodePropertiesPanel
            nodeData={selectedNodeData}
            onUpdate={updateNodeData}
            onClose={() => setSelectedNodeId(null)}
            onDelete={deleteSelectedNode}
            availableDataStores={dataStores}
          />
        )}
      </div>
    </div>
  );
};
