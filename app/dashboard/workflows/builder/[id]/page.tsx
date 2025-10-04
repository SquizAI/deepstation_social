'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { WorkflowBuilderModal } from '@/components/workflow-builder-modal';
import { NodeConfigPanel } from '@/components/node-config-panel';
import { WorkflowTemplatesModal, WorkflowTemplate } from '@/components/workflow-templates';
import { WorkflowValidationPanel } from '@/components/workflow-validation-panel';
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts-modal';
import { WorkflowExecutionHistory, saveExecutionToHistory } from '@/components/workflow-execution-history';
import { WorkflowTestMode } from '@/components/workflow-test-mode';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useWorkflowHistory } from '@/hooks/useWorkflowHistory';

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

// Helper function to generate human-readable preview of node configuration
function getNodePreview(nodeData: any): string {
  const config = nodeData.config || {};

  switch (nodeData.nodeType) {
    case 'trigger':
      if (config.triggerType === 'manual') {
        return '▶ Click "Run Workflow" to start';
      }
      if (config.triggerType === 'scheduled') {
        const schedule = config.schedule || '0 9 * * *';
        return `⏰ Scheduled: ${formatCronSchedule(schedule)}`;
      }
      if (config.triggerType === 'webhook') {
        return '🔗 Triggered by external webhook';
      }
      return 'Trigger not configured';

    case 'claude-agent':
      const agentName = config.agentName === 'custom'
        ? config.customAgentName || 'Custom Agent'
        : formatAgentName(config.agentName || 'content-optimizer');
      const operation = formatOperation(config.operation || 'optimize-single');
      return `🤖 ${agentName} - ${operation}`;

    case 'ai':
      const aiType = config.aiType === 'text-generation' ? 'Text' :
                     config.aiType === 'image-generation' ? 'Image' :
                     config.aiType === 'video-generation' ? 'Video' : 'AI';
      const model = config.model || 'No model selected';
      return `✨ ${aiType} - ${formatModelName(model)}`;

    case 'action':
      const actionType = config.actionType || 'post';
      const platform = config.platform || 'linkedin';
      if (actionType === 'post') {
        return `📤 Post to ${formatPlatformName(platform)}`;
      }
      if (actionType === 'save') {
        return '💾 Save as draft';
      }
      if (actionType === 'schedule') {
        return `📅 Schedule for ${formatPlatformName(platform)}`;
      }
      if (actionType === 'send') {
        return `📧 Send ${config.notificationType || 'notification'}`;
      }
      return 'Action not configured';

    case 'condition':
      const field = config.field || 'field';
      const operator = config.operator || 'equals';
      const value = config.value || 'value';
      return `🔀 If ${field} ${operator} ${value}`;

    case 'transform':
      const transformType = config.transformType || 'map';
      return `🔄 ${transformType.charAt(0).toUpperCase() + transformType.slice(1)} data`;

    default:
      return nodeData.nodeKey || 'Configure this node';
  }
}

// Helper function to check if a node is properly configured
function isNodeConfigured(nodeData: any): boolean {
  const config = nodeData.config || {};

  switch (nodeData.nodeType) {
    case 'trigger':
      if (!config.triggerType) return false;
      if (config.triggerType === 'scheduled' && !config.schedule) return false;
      return true;

    case 'claude-agent':
      if (!config.agentName) return false;
      if (config.agentName === 'custom' && !config.customAgentName) return false;
      if (!config.operation) return false;
      return true;

    case 'ai':
      if (!config.aiType || !config.model) return false;
      if (!config.prompt || config.prompt.trim().length === 0) return false;
      return true;

    case 'action':
      if (!config.actionType) return false;
      if ((config.actionType === 'post' || config.actionType === 'schedule') && !config.platform) return false;
      if (config.actionType === 'schedule' && !config.scheduledTime) return false;
      if (config.actionType === 'send' && (!config.notificationType || !config.recipient)) return false;
      return true;

    case 'condition':
      return !!(config.field && config.operator && config.value);

    case 'transform':
      return !!(config.transformType && config.mapping);

    default:
      return true; // Unknown types are considered configured
  }
}

// Format helper functions
function formatCronSchedule(cron: string): string {
  const schedules: Record<string, string> = {
    '0 9 * * *': 'Every day at 9am',
    '0 */6 * * *': 'Every 6 hours',
    '0 * * * *': 'Every hour',
    '*/15 * * * *': 'Every 15 minutes',
    '0 0 * * 0': 'Every Sunday at midnight',
    '0 12 * * 1-5': 'Weekdays at noon',
  };
  return schedules[cron] || cron;
}

function formatAgentName(name: string): string {
  return name.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function formatOperation(op: string): string {
  const operations: Record<string, string> = {
    'optimize-single': 'Optimize Single',
    'optimize-batch': 'Optimize Batch',
    'generate': 'Generate Content',
    'analyze': 'Analyze Content',
    'transform': 'Transform Data',
  };
  return operations[op] || op;
}

function formatModelName(model: string): string {
  const names: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'claude-3.7-sonnet': 'Claude 3.7 Sonnet',
    'claude-3.5-haiku': 'Claude 3.5 Haiku',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'llama-3.3-70b': 'Llama 3.3 70B',
    'dall-e-3': 'DALL-E 3',
    'stable-diffusion': 'Stable Diffusion',
    'midjourney': 'Midjourney',
    'runway': 'Runway Gen-3',
    'pika': 'Pika Labs',
    'luma': 'Luma Dream Machine',
  };
  return names[model] || model;
}

function formatPlatformName(platform: string): string {
  const names: Record<string, string> = {
    'linkedin': 'LinkedIn',
    'twitter': 'X (Twitter)',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'discord': 'Discord',
    'all': 'All Platforms',
  };
  return names[platform] || platform;
}

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

  const [showMenu, setShowMenu] = React.useState(false);

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
          {/* Three-Dot Menu Button - Always visible */}
          <div className="absolute -top-2 -right-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20"
              title="Node actions"
            >
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-8 w-40 bg-[#1a0f2e] border border-white/20 rounded-lg shadow-2xl overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    // Trigger edit - clicking the node will open inspector
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    data.onDuplicate?.(id);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Duplicate
                </button>
                <div className="border-t border-white/10"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    data.onDelete?.(id);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>

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
            <div className={`bg-gradient-to-r ${getNodeColor(data.nodeType)} p-2.5 rounded-xl text-white flex-shrink-0 shadow-lg relative`}>
              {/* Node Type Icon */}
              {data.nodeType === 'trigger' && (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {(data.nodeType === 'claude-agent' || data.nodeType === 'ai') && (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              {data.nodeType === 'action' && (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              )}
              {(data.nodeType === 'condition' || data.nodeType === 'transform') && (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              )}

              {/* Platform Badge - Shows on action nodes */}
              {data.nodeType === 'action' && data.config?.platform && (
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white flex items-center justify-center text-[10px] font-bold border border-white/20">
                  {data.config.platform === 'linkedin' && '💼'}
                  {data.config.platform === 'twitter' && '🐦'}
                  {data.config.platform === 'instagram' && '📸'}
                  {data.config.platform === 'discord' && '💬'}
                  {data.config.platform === 'facebook' && '👥'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-base truncate">{data.nodeKey || 'Unnamed'}</div>
              <div className="text-slate-400 text-xs font-medium capitalize mt-0.5">{data.nodeType.replace('-', ' ')}</div>
            </div>
          </div>

          {/* Config Preview - Smart preview based on node type */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <div className="text-xs text-slate-300 font-medium">
              {getNodePreview(data)}
            </div>
            {!isNodeConfigured(data) && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-400">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Click to configure</span>
              </div>
            )}
          </div>

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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: 'idle',
    nodeStates: {},
  });
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['triggers', 'ai'])); // Default open

  // Phase 1 feature states
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Phase 3 feature states
  const [showTestMode, setShowTestMode] = useState(false);
  const [showExecutionHistory, setShowExecutionHistory] = useState(false);

  // Phase 2 feature states
  const [nodeSearchQuery, setNodeSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [connectionSuggestion, setConnectionSuggestion] = useState<{
    sourceId: string;
    targetId: string;
    sourceName: string;
    targetName: string;
  } | null>(null);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);

  // Phase 2.1: Undo/Redo hook
  const { pushState, undo, redo, canUndo, canRedo, getUndoActionName, getRedoActionName } = useWorkflowHistory();

  const nodeTypes: NodeTypes = {
    custom: CustomNode,
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Wrap onEdgesChange to detect deletions
  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);

    // Check if any edge was removed
    const hasRemoval = changes.some(change => change.type === 'remove');
    if (hasRemoval && !isRestoringHistory) {
      // We need to wait for the state update, so use a timeout
      setTimeout(() => {
        pushState(nodes, edges, 'delete_edge');
      }, 0);
    }
  }, [onEdgesChange, nodes, edges, isRestoringHistory, pushState]);

  // Phase 2.2: Filter nodes function
  const filterNodes = useCallback((categoryNodes: any, query: string) => {
    if (!query.trim()) return Object.entries(categoryNodes);

    const lowerQuery = query.toLowerCase();
    return Object.entries(categoryNodes).filter(([key, node]: [string, any]) => {
      return (
        node.label.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery) ||
        node.nodeType.toLowerCase().includes(lowerQuery) ||
        key.toLowerCase().includes(lowerQuery)
      );
    });
  }, []);

  // Phase 2.4: Auto-connect suggestion function
  const checkForAutoConnectSuggestion = useCallback((newNode: Node, existingNodes: Node[]) => {
    const PROXIMITY_THRESHOLD = 250; // pixels

    // Find nearby nodes
    const nearbyNodes = existingNodes.filter(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - newNode.position.x, 2) +
        Math.pow(node.position.y - newNode.position.y, 2)
      );
      return distance < PROXIMITY_THRESHOLD && node.id !== newNode.id;
    });

    if (nearbyNodes.length === 0) return;

    // Find most logical connection (closest node to the left = source, new node = target)
    const leftNodes = nearbyNodes.filter(n => n.position.x < newNode.position.x);
    if (leftNodes.length === 0) return;

    const closestLeft = leftNodes.reduce((closest, node) => {
      const distClosest = Math.abs(closest.position.x - newNode.position.x);
      const distNode = Math.abs(node.position.x - newNode.position.x);
      return distNode < distClosest ? node : closest;
    });

    // Check if connection makes sense (not already connected)
    const alreadyConnected = edges.some(
      e => e.source === closestLeft.id && e.target === newNode.id
    );

    if (alreadyConnected) return;

    // Show suggestion
    setConnectionSuggestion({
      sourceId: closestLeft.id,
      targetId: newNode.id,
      sourceName: closestLeft.data.nodeKey,
      targetName: newNode.data.nodeKey,
    });

    // Auto-dismiss after 8 seconds
    setTimeout(() => setConnectionSuggestion(null), 8000);
  }, [edges]);

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
              onDuplicate: duplicateNode,
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

  const getEdgeLabel = (sourceNode: Node, targetNode: Node) => {
    const sourceType = sourceNode.data.nodeType;
    const targetType = targetNode.data.nodeType;

    // Determine what data flows between these nodes
    if (sourceType === 'trigger') return '⚡ Start';
    if (sourceType === 'ai' && sourceNode.data.config?.aiType === 'text-generation') return '📝 Text';
    if (sourceType === 'ai' && sourceNode.data.config?.aiType === 'image-generation') return '🖼️ Image';
    if (sourceType === 'ai' && sourceNode.data.config?.aiType === 'video-generation') return '🎥 Video';
    if (sourceType === 'claude-agent') return '🤖 Optimized Content';
    if (sourceType === 'transform') return '🔄 Transformed Data';
    if (sourceType === 'condition') return '✓ Passed';
    return '→';
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            label: sourceNode && targetNode ? getEdgeLabel(sourceNode, targetNode) : undefined,
            labelStyle: { fill: '#e9d5ff', fontWeight: 700, fontSize: 12 },
            labelBgStyle: { fill: '#1a0f2e', fillOpacity: 0.9 },
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 6,
            style: { stroke: '#a855f7', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
          },
          eds
        );

        // Push to history (unless we're restoring)
        if (!isRestoringHistory) {
          pushState(nodes, newEdges, 'add_edge');
        }

        return newEdges;
      });
    },
    [setEdges, nodes, isRestoringHistory, pushState]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedNodeId(node.id);
    setShowNodeEditor(true);
  }, []);

  const addNode = (nodeType: string, position?: { x: number; y: number }) => {
    const template = NODE_TEMPLATES[nodeType as keyof typeof NODE_TEMPLATES];
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: position || { x: Math.random() * 500, y: Math.random() * 300 },
      data: {
        nodeKey: `${nodeType}_${Date.now()}`,
        nodeType: template.nodeType,
        config: { ...template.config },
        status: 'idle',
        onDelete: deleteNode,
        onDuplicate: duplicateNode,
      },
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);

    // Phase 2.4: Check for auto-connect suggestion
    checkForAutoConnectSuggestion(newNode, nodes);

    // Phase 2.1: Push to history
    if (!isRestoringHistory) {
      pushState(updatedNodes, edges, 'add_node');
    }
  };

  const updateNode = (nodeId: string, updates: any) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      );

      // Push to history (unless we're restoring)
      if (!isRestoringHistory) {
        pushState(updatedNodes, edges, 'update_config');
      }

      return updatedNodes;
    });
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => {
      const newNodes = nds.filter((node) => node.id !== nodeId);

      setEdges((eds) => {
        const newEdges = eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);

        // Push to history (unless we're restoring)
        if (!isRestoringHistory) {
          pushState(newNodes, newEdges, 'delete_node');
        }

        return newEdges;
      });

      return newNodes;
    });
    setShowNodeEditor(false);
  };

  const duplicateNode = (nodeId: string) => {
    const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newNode: Node = {
      ...nodeToDuplicate,
      id: `node-${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
      data: {
        ...nodeToDuplicate.data,
        nodeKey: `${nodeToDuplicate.data.nodeType}_${Date.now()}`,
        onDelete: deleteNode,
        onDuplicate: duplicateNode,
      },
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);

    // Push to history (unless we're restoring)
    if (!isRestoringHistory) {
      pushState(updatedNodes, edges, 'duplicate_node');
    }
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

  // Phase 2.1: Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setIsRestoringHistory(true);
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setTimeout(() => setIsRestoringHistory(false), 0);
    }
  }, [undo, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setIsRestoringHistory(true);
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setTimeout(() => setIsRestoringHistory(false), 0);
    }
  }, [redo, setNodes, setEdges]);

  // Phase 2.3: Drag & Drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeKey = event.dataTransfer.getData('application/reactflow');
      if (!nodeKey) return;

      // Get drop position relative to ReactFlow viewport
      const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      addNode(nodeKey, position);
      setIsDragging(false);
    },
    [addNode]
  );

  const onDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const executeWorkflow = async () => {
    const startTime = Date.now();
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
      const endTime = Date.now();

      setExecutionState({
        status: result.success ? 'completed' : 'failed',
        nodeStates: result.nodeStates || {},
      });

      // Update node statuses
      let successCount = 0;
      const executionLogs: any[] = [];

      nodes.forEach((node) => {
        const state = result.nodeStates?.[node.id];
        if (state) {
          updateNode(node.id, {
            status: state.status,
            output: state.output,
            error: state.error,
          });

          if (state.status === 'success') successCount++;

          executionLogs.push({
            nodeId: node.id,
            nodeKey: node.data.nodeKey,
            nodeType: node.data.nodeType,
            status: state.status,
            startTime: new Date(state.startTime || startTime),
            endTime: new Date(state.endTime || endTime),
            duration: state.duration || 0,
            output: state.output,
            error: state.error,
            metadata: state.metadata,
          });
        }
      });

      // Save execution to history
      saveExecutionToHistory(workflowId, {
        workflowId,
        timestamp: new Date(startTime),
        status: result.success ? 'success' : successCount > 0 ? 'partial' : 'failed',
        duration: endTime - startTime,
        nodesExecuted: successCount,
        totalNodes: nodes.length,
        logs: executionLogs,
      });
    } catch (error) {
      setExecutionState({ status: 'failed', nodeStates: {} });
    }
  };

  // Phase 3: Test mode execution
  const executeTestWorkflow = async (testData: Record<string, any>) => {
    const results: any[] = [];

    for (const node of nodes) {
      const startTime = Date.now();

      try {
        // Simulate node execution with test data
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        const nodeTestData = testData[node.id];
        const output = nodeTestData
          ? `Processed: ${JSON.stringify(nodeTestData).substring(0, 50)}...`
          : 'Test output';

        results.push({
          nodeId: node.id,
          nodeKey: node.data.nodeKey,
          status: 'success',
          output,
          duration: Date.now() - startTime,
        });

        // Update node visual status
        updateNode(node.id, {
          status: 'success',
          output,
        });
      } catch (error) {
        results.push({
          nodeId: node.id,
          nodeKey: node.data.nodeKey,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        });

        updateNode(node.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
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

  const [isNodePaletteOpen, setIsNodePaletteOpen] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(true);

  // Close the builder when navigating away
  const handleClose = () => {
    setIsBuilderOpen(false);
    setTimeout(() => {
      router.push('/dashboard/workflows');
    }, 100);
  };

  // Phase 1.1: Load workflow template
  const loadTemplate = (template: WorkflowTemplate) => {
    // Clear current workflow
    setNodes([]);
    setEdges([]);

    // Create nodes from template
    const newNodes: Node[] = template.nodes.map((templateNode, index) => ({
      id: `node-${Date.now()}-${index}`,
      type: 'custom',
      position: templateNode.position,
      data: {
        nodeKey: templateNode.nodeKey,
        nodeType: templateNode.nodeType,
        config: templateNode.config,
        status: 'idle',
        onDelete: deleteNode,
        onDuplicate: duplicateNode,
      },
    }));

    setNodes(newNodes);

    // Create edges from template
    const newEdges: Edge[] = template.edges.map((edge, idx) => {
      const sourceNode = newNodes[edge.source];
      const targetNode = newNodes[edge.target];

      return {
        id: `e${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: 'smoothstep',
        animated: true,
        label: getEdgeLabel(sourceNode, targetNode),
        labelStyle: { fill: '#e9d5ff', fontWeight: 700, fontSize: 12 },
        labelBgStyle: { fill: '#1a0f2e', fillOpacity: 0.9 },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 6,
        style: { stroke: '#a855f7', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
      };
    });

    setEdges(newEdges);
  };

  // Phase 1.4: Auto-layout nodes
  const organizeNodes = () => {
    if (nodes.length === 0) return;

    // Find nodes with no incoming edges (triggers)
    const triggers = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    // BFS to assign levels
    const levels: Map<string, number> = new Map();
    const queue = triggers.map((t) => ({ id: t.id, level: 0 }));

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (levels.has(id)) continue; // Already processed

      levels.set(id, level);

      // Find children
      edges
        .filter((e) => e.source === id)
        .forEach((edge) => {
          if (!levels.has(edge.target)) {
            queue.push({ id: edge.target, level: level + 1 });
          }
        });
    }

    // Handle orphaned nodes (not connected to any trigger)
    nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });

    // Position nodes based on levels
    const levelCounts = new Map<number, number>();
    const newNodes = nodes.map((node) => {
      const level = levels.get(node.id) || 0;
      const count = levelCounts.get(level) || 0;
      levelCounts.set(level, count + 1);

      return {
        ...node,
        position: {
          x: 100 + level * 350,
          y: 100 + count * 200,
        },
      };
    });

    setNodes(newNodes);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: (nodeId) => {
      if (nodeId) {
        deleteNode(nodeId);
        setSelectedNodeId(null);
        setShowNodeEditor(false);
      }
    },
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: () => {
      saveWorkflow();
    },
    onShowHelp: () => {
      setShowKeyboardShortcuts(true);
    },
    onEscape: () => {
      setShowNodeEditor(false);
      setShowValidationPanel(false);
      setShowKeyboardShortcuts(false);
      setConnectionSuggestion(null);
      setSelectedNodeId(null);
    },
    onRunWorkflow: () => {
      if (executionState.status !== 'running') {
        executeWorkflow();
      }
    },
    selectedNodeId,
    enabled: true,
  });

  // Helper to select a node and open inspector
  const selectAndEditNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setSelectedNodeId(nodeId);
      setShowNodeEditor(true);
    }
  };

  // Helper to copy webhook URL
  const copyWebhookUrl = (nodeId: string) => {
    const webhookUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/api/webhooks/${nodeId}`
        : `https://deepstation.ai/api/webhooks/${nodeId}`;

    navigator.clipboard.writeText(webhookUrl);
    alert('Webhook URL copied to clipboard!');
  };

  return (
    <WorkflowBuilderModal isOpen={isBuilderOpen}>
      <div className="fixed inset-0 z-[9999] bg-[#0a0513] flex flex-col">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#201033] via-[#15092b] to-[#0a0513] border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setIsNodePaletteOpen(!isNodePaletteOpen)}
            className="text-slate-400 hover:text-white"
            title="Toggle node palette"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
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
          {/* Phase 2.1: Undo/Redo Buttons */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-3">
            <Button
              onClick={handleUndo}
              disabled={!canUndo}
              className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed px-3"
              title={canUndo ? `Undo: ${getUndoActionName()}` : 'Nothing to undo'}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </Button>
            <Button
              onClick={handleRedo}
              disabled={!canRedo}
              className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed px-3"
              title={canRedo ? `Redo: ${getRedoActionName()}` : 'Nothing to redo'}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </Button>
          </div>

          {/* Phase 3: Test Mode & History Buttons */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-3">
            <Button
              onClick={() => setShowTestMode(!showTestMode)}
              className={`${
                showTestMode
                  ? 'bg-blue-500/30 border border-blue-500/50'
                  : 'bg-white/10 hover:bg-white/20'
              } text-white`}
              title="Toggle test mode"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Test Mode
            </Button>
            <Button
              onClick={() => setShowExecutionHistory(true)}
              className="bg-white/10 hover:bg-white/20 text-white"
              title="View execution history"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </Button>
          </div>

          <Button
            onClick={() => setShowTemplatesModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white"
            title="Load workflow template"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Templates
          </Button>
          <Button
            onClick={() => setShowValidationPanel(true)}
            className="bg-white/10 hover:bg-white/20 text-white"
            title="Validate workflow"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Validate
          </Button>
          <Button
            onClick={organizeNodes}
            className="bg-white/10 hover:bg-white/20 text-white"
            title="Auto-organize nodes"
            disabled={nodes.length === 0}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7H4V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7h-6V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            Organize
          </Button>
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
            onClick={handleClose}
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
        <div className={`${isNodePaletteOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border-r border-white/10 overflow-y-auto overflow-x-hidden`}>
          {isNodePaletteOpen && (
            <>
          <div className="p-5 border-b border-white/10">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <svg className="h-6 w-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Nodes
            </h3>
            <p className="text-slate-400 text-sm mt-1">Drag & drop or click to add</p>
          </div>

          {/* Phase 2.2: Search Input */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <input
                type="text"
                placeholder="Search nodes..."
                value={nodeSearchQuery}
                onChange={(e) => setNodeSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-9 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-fuchsia-500 text-sm"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {nodeSearchQuery && (
                <button
                  onClick={() => setNodeSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-2">
            {(() => {
              let visibleCategoriesCount = 0;
              const categoryElements = Object.entries(NODE_CATEGORIES).map(([categoryKey, category]) => {
                const filteredNodes = filterNodes(category.nodes, nodeSearchQuery);
                if (filteredNodes.length === 0 && nodeSearchQuery) return null;
                visibleCategoriesCount++;
                return (
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
                    {filteredNodes.map(([nodeKey, template]: [string, any]) => (
                      <button
                        key={nodeKey}
                        onClick={() => addNode(nodeKey)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/reactflow', nodeKey);
                          e.dataTransfer.effectAllowed = 'move';
                          onDragStart();
                        }}
                        onDragEnd={onDragEnd}
                        className="w-full group cursor-move"
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
                );
              });

              // Show empty state if no results
              if (nodeSearchQuery && visibleCategoriesCount === 0) {
                return (
                  <div className="p-8 text-center">
                    <svg className="h-12 w-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-400 text-sm">No nodes found for <span className="text-white font-semibold">"{nodeSearchQuery}"</span></p>
                    <button
                      onClick={() => setNodeSearchQuery('')}
                      className="mt-3 text-xs text-fuchsia-400 hover:text-fuchsia-300"
                    >
                      Clear search
                    </button>
                  </div>
                );
              }

              return categoryElements;
            })()}
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
            </>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            connectionLineStyle={{ stroke: '#a855f7', strokeWidth: 2 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#a855f7', strokeWidth: 2 },
            }}
            className={isDragging ? 'ring-2 ring-fuchsia-500/50 ring-inset' : ''}
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

          {/* Phase 2.4: Auto-Connect Suggestion Tooltip */}
          {connectionSuggestion && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-lg shadow-2xl p-4 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="text-white text-sm">
                  Connect <strong className="font-bold">{connectionSuggestion.sourceName}</strong> to <strong className="font-bold">{connectionSuggestion.targetName}</strong>?
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => {
                      // Create the connection
                      const newEdge: Edge = {
                        id: `e${connectionSuggestion.sourceId}-${connectionSuggestion.targetId}`,
                        source: connectionSuggestion.sourceId,
                        target: connectionSuggestion.targetId,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#a855f7', strokeWidth: 2 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
                      };
                      const updatedEdges = [...edges, newEdge];
                      setEdges(updatedEdges);
                      pushState(nodes, updatedEdges, 'add_edge');
                      setConnectionSuggestion(null);
                    }}
                    className="px-3 py-1 bg-white text-purple-600 rounded font-semibold text-xs hover:bg-gray-100 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConnectionSuggestion(null)}
                    className="px-3 py-1 bg-white/20 text-white rounded font-semibold text-xs hover:bg-white/30 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Node Inspector */}
        {showNodeEditor && selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={updateNode}
            onClose={() => {
              setShowNodeEditor(false);
              setSelectedNodeId(null);
            }}
            onDelete={deleteNode}
            allNodes={nodes}
          />
        )}

        {/* Validation Panel */}
        {showValidationPanel && (
          <WorkflowValidationPanel
            isOpen={showValidationPanel}
            onClose={() => setShowValidationPanel(false)}
            nodes={nodes}
            edges={edges}
            isNodeConfigured={isNodeConfigured}
            onSelectNode={selectAndEditNode}
            onCopyWebhook={copyWebhookUrl}
          />
        )}
      </div>

      {/* Modals */}
      <WorkflowTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={loadTemplate}
      />

      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* Phase 3: Execution History Modal */}
      <WorkflowExecutionHistory
        isOpen={showExecutionHistory}
        onClose={() => setShowExecutionHistory(false)}
        workflowId={workflowId}
      />
    </div>

    {/* Phase 3: Test Mode Panel (outside main modal) */}
    <WorkflowTestMode
      isOpen={showTestMode}
      onClose={() => setShowTestMode(false)}
      nodes={nodes}
      onRunTest={executeTestWorkflow}
    />
    </WorkflowBuilderModal>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
