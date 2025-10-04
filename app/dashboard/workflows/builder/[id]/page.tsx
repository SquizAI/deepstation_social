'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  MarkerType,
  ReactFlowProvider,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';

interface WorkflowNode {
  id: string;
  nodeKey: string;
  nodeType: string;
  config: any;
  status?: 'idle' | 'running' | 'success' | 'error';
  output?: any;
  error?: string;
}

interface ExecutionState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentNode?: string;
  nodeStates: Record<string, { status: string; output?: any; error?: string }>;
}

const NODE_CATEGORIES = {
  triggers: {
    label: 'Triggers',
    icon: '⚡',
    nodes: {
      trigger: {
        nodeType: 'trigger',
        config: { triggerType: 'manual' },
        label: 'Manual Trigger',
        description: 'Start workflow manually',
        color: 'from-green-500 to-emerald-500',
      },
    },
  },
  ai: {
    label: 'AI & Agents',
    icon: '🤖',
    nodes: {
      'claude-agent': {
        nodeType: 'claude-agent',
        config: { agentName: 'content-optimizer', operation: 'optimize-single' },
        label: 'Claude Agent',
        description: 'AI-powered automation',
        color: 'from-fuchsia-500 to-purple-500',
      },
      ai: {
        nodeType: 'ai',
        config: { aiType: 'text-generation', model: 'gpt-4o' },
        label: 'AI Generation',
        description: 'Generate text, images, or video',
        color: 'from-blue-500 to-cyan-500',
      },
    },
  },
  actions: {
    label: 'Actions',
    icon: '🎯',
    nodes: {
      action: {
        nodeType: 'action',
        config: { actionType: 'post', platform: 'linkedin' },
        label: 'Action',
        description: 'Post, save, or send',
        color: 'from-orange-500 to-red-500',
      },
    },
  },
  logic: {
    label: 'Logic & Transform',
    icon: '🔀',
    nodes: {
      condition: {
        nodeType: 'condition',
        config: { conditionType: 'if', field: '', operator: 'equals', value: '' },
        label: 'Condition',
        description: 'Branching logic',
        color: 'from-yellow-500 to-amber-500',
      },
      transform: {
        nodeType: 'transform',
        config: { transformType: 'map', mapping: {} },
        label: 'Transform',
        description: 'Modify data',
        color: 'from-purple-500 to-pink-500',
      },
    },
  },
};

// Flatten for backwards compatibility
const NODE_TEMPLATES = Object.values(NODE_CATEGORIES).reduce((acc, category) => {
  return { ...acc, ...category.nodes };
}, {} as Record<string, any>);

function CustomNode({ data, id, selected }: any) {
  const getNodeColor = (nodeType: string) => {
    const template = Object.values(NODE_TEMPLATES).find(t => t.nodeType === nodeType);
    return template?.color || 'from-slate-500 to-gray-500';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'border-blue-500 shadow-blue-500/50';
      case 'success': return 'border-green-500 shadow-green-500/50';
      case 'error': return 'border-red-500 shadow-red-500/50';
      default: return 'border-white/10';
    }
  };

  return (
    <div className={`min-w-[280px] group relative ${selected ? 'ring-2 ring-fuchsia-500' : ''}`}>
      {/* Input Handle - left side (not on trigger nodes) */}
      {data.nodeType !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-fuchsia-500 !border-2 !border-white"
        />
      )}

      {/* Output Handle - right side */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-fuchsia-500 !border-2 !border-white"
      />

      <div className={`bg-gradient-to-r ${getNodeColor(data.nodeType)} p-0.5 rounded-xl ${getStatusColor(data.status)} ${data.status === 'running' ? 'animate-pulse shadow-lg' : ''}`}>
        <div className="bg-[#1a0f2e] rounded-xl p-4 relative">
          {/* Delete Button - appears on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.(id);
            }}
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="Delete node"
          >
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Status Indicator */}
          {data.status && data.status !== 'idle' && (
            <div className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-[#1a0f2e] flex items-center justify-center border-2 border-white/10">
              {data.status === 'running' && (
                <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse"></div>
              )}
              {data.status === 'success' && (
                <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {data.status === 'error' && (
                <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`bg-gradient-to-r ${getNodeColor(data.nodeType)} p-2.5 rounded-xl text-white flex-shrink-0 shadow-lg`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-base truncate">{data.nodeKey || 'Unnamed'}</div>
              <div className="text-slate-400 text-xs font-medium capitalize mt-0.5">{data.nodeType.replace('-', ' ')}</div>
            </div>
          </div>

          {/* Config Preview */}
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="bg-white/5 rounded-lg p-3 space-y-1.5 text-xs border border-white/5">
              {Object.entries(data.config).slice(0, 2).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-slate-400 truncate font-medium">{key}:</span>
                  <span className="text-slate-200 truncate font-mono font-semibold">{String(value).substring(0, 20)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Output Preview */}
          {data.output && (
            <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-2.5">
              <div className="text-xs text-green-300 font-bold mb-1.5">Output:</div>
              <div className="text-xs text-slate-200 font-mono font-medium truncate">
                {typeof data.output === 'string' ? data.output.substring(0, 30) : JSON.stringify(data.output).substring(0, 30)}...
              </div>
            </div>
          )}

          {/* Error Preview */}
          {data.error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
              <div className="text-xs text-red-300 font-bold mb-1.5">Error:</div>
              <div className="text-xs text-slate-200 font-medium truncate">{data.error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkflowBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: 'idle',
    nodeStates: {},
  });
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['triggers', 'ai'])); // Default open

  const nodeTypes: NodeTypes = {
    custom: CustomNode,
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // Load workflow
    fetch(`/api/workflows/${workflowId}`)
      .then(res => res.json())
      .then(data => {
        if (data.workflow) {
          setWorkflowName(data.workflow.name);
          // Convert to React Flow format
          const flowNodes: Node[] = (data.workflow.nodes || []).map((node: any, index: number) => ({
            id: node.id || `node-${index}`,
            type: 'custom',
            position: { x: index * 300, y: 100 },
            data: {
              nodeKey: node.nodeKey,
              nodeType: node.nodeType,
              config: node.config,
              status: 'idle',
              onDelete: deleteNode,
            },
          }));
          setNodes(flowNodes);

          // Create edges
          const flowEdges: Edge[] = [];
          for (let i = 0; i < flowNodes.length - 1; i++) {
            flowEdges.push({
              id: `e${flowNodes[i].id}-${flowNodes[i + 1].id}`,
              source: flowNodes[i].id,
              target: flowNodes[i + 1].id,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#a855f7', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
            });
          }
          setEdges(flowEdges);
        }
      });
  }, [workflowId]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#a855f7', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowNodeEditor(true);
  }, []);

  const addNode = (nodeType: string) => {
    const template = NODE_TEMPLATES[nodeType as keyof typeof NODE_TEMPLATES];
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      data: {
        nodeKey: `${nodeType}_${Date.now()}`,
        nodeType: template.nodeType,
        config: { ...template.config },
        status: 'idle',
        onDelete: deleteNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNode = (nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setShowNodeEditor(false);
  };

  const toggleCategory = (categoryKey: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const executeWorkflow = async () => {
    setExecutionState({ status: 'running', nodeStates: {} });

    // Convert nodes to workflow format
    const workflowNodes = nodes.map((node) => ({
      id: node.id,
      nodeKey: node.data.nodeKey,
      nodeType: node.data.nodeType,
      config: node.data.config,
    }));

    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: {},
          workflow: { nodes: workflowNodes },
        }),
      });

      const result = await response.json();

      setExecutionState({
        status: result.success ? 'completed' : 'failed',
        nodeStates: result.nodeStates || {},
      });

      // Update node statuses
      nodes.forEach((node) => {
        const state = result.nodeStates?.[node.id];
        if (state) {
          updateNode(node.id, {
            status: state.status,
            output: state.output,
            error: state.error,
          });
        }
      });
    } catch (error) {
      setExecutionState({ status: 'failed', nodeStates: {} });
    }
  };

  const saveWorkflow = async () => {
    const workflowNodes = nodes.map((node, index) => ({
      id: node.id,
      nodeKey: node.data.nodeKey,
      nodeType: node.data.nodeType,
      config: node.data.config,
      position_x: node.position.x,
      position_y: node.position.y,
      order_index: index,
    }));

    await fetch(`/api/workflows/${workflowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: workflowName,
        nodes: workflowNodes,
      }),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0513] flex flex-col">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#201033] via-[#15092b] to-[#0a0513] border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/workflows')}
            className="text-slate-400 hover:text-white"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-lg font-semibold focus:outline-none focus:border-fuchsia-500/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={saveWorkflow}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </Button>
          <Button
            onClick={executeWorkflow}
            disabled={executionState.status === 'running'}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
          >
            {executionState.status === 'running' ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Workflow
              </>
            )}
          </Button>
          <Button
            onClick={() => router.push('/dashboard/workflows')}
            variant="ghost"
            className="text-slate-400 hover:text-white"
            title="Close workflow builder"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-80 bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border-r border-white/10 overflow-y-auto">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <svg className="h-6 w-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Nodes
            </h3>
            <p className="text-slate-400 text-sm mt-1">Drag & drop or click to add</p>
          </div>

          <div className="p-4 space-y-2">
            {Object.entries(NODE_CATEGORIES).map(([categoryKey, category]) => (
              <div key={categoryKey} className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-white font-semibold">{category.label}</span>
                  </div>
                  <svg
                    className={`h-5 w-5 text-slate-400 transition-transform ${
                      openCategories.has(categoryKey) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Accordion Content */}
                {openCategories.has(categoryKey) && (
                  <div className="px-3 pb-3 space-y-2">
                    {Object.entries(category.nodes).map(([nodeKey, template]) => (
                      <button
                        key={nodeKey}
                        onClick={() => addNode(nodeKey)}
                        className="w-full group"
                      >
                        <div className={`bg-gradient-to-r ${template.color} p-0.5 rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all`}>
                          <div className="bg-[#1a0f2e] rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className={`bg-gradient-to-r ${template.color} p-2 rounded-lg flex-shrink-0`}>
                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-white font-semibold text-sm mb-0.5">{template.label}</div>
                                <div className="text-slate-400 text-xs leading-snug">{template.description}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Execution Status */}
          {executionState.status !== 'idle' && (
            <div className="m-4 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10">
              <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  executionState.status === 'running' ? 'bg-blue-400 animate-pulse' :
                  executionState.status === 'completed' ? 'bg-green-400' :
                  'bg-red-400'
                }`}></div>
                Execution Status
              </h4>
              <div className={`text-sm font-medium capitalize ${
                executionState.status === 'running' ? 'text-blue-300' :
                executionState.status === 'completed' ? 'text-green-300' :
                'text-red-300'
              }`}>
                {executionState.status}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            connectionLineStyle={{ stroke: '#a855f7', strokeWidth: 2 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#a855f7', strokeWidth: 2 },
            }}
          >
            <Background color="#a855f7" gap={20} size={1} style={{ opacity: 0.1 }} />
            <Controls className="bg-white/10 backdrop-blur-sm border border-white/20" />
            <MiniMap
              nodeColor={(node) => {
                const nodeType = node.data.nodeType;
                const template = Object.values(NODE_TEMPLATES).find(t => t.nodeType === nodeType);
                return template ? '#a855f7' : '#64748b';
              }}
              className="bg-white/10 backdrop-blur-sm border border-white/20"
            />
          </ReactFlow>
        </div>

        {/* Node Inspector */}
        {showNodeEditor && selectedNode && (
          <div className="w-96 bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border-l border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">Node Properties</h3>
              <Button
                variant="ghost"
                onClick={() => setShowNodeEditor(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm mb-2 block">Node Key</label>
                <input
                  type="text"
                  value={selectedNode.data.nodeKey}
                  onChange={(e) => updateNode(selectedNode.id, { nodeKey: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">Type</label>
                <div className="text-white capitalize bg-white/5 px-3 py-2 rounded-lg">
                  {selectedNode.data.nodeType}
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">Configuration</label>
                <textarea
                  value={JSON.stringify(selectedNode.data.config, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      updateNode(selectedNode.id, { config });
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-sm"
                  rows={10}
                />
              </div>

              {selectedNode.data.output && (
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Output</label>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <pre className="text-green-300 text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(selectedNode.data.output, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedNode.data.error && (
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Error</label>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <pre className="text-red-300 text-xs whitespace-pre-wrap">
                      {selectedNode.data.error}
                    </pre>
                  </div>
                </div>
              )}

              <Button
                onClick={() => deleteNode(selectedNode.id)}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Node
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
