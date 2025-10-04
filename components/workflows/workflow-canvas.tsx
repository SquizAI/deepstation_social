'use client';

import { useCallback, useMemo } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

interface WorkflowNode {
  id: string;
  nodeKey: string;
  nodeType: string;
  config: any;
}

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  onNodesChange?: (nodes: WorkflowNode[]) => void;
  readOnly?: boolean;
}

// Custom node component for workflow nodes
function WorkflowNodeComponent({ data }: { data: any }) {
  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'trigger':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'claude-agent':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        );
      case 'ai':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'action':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'condition':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
    }
  };

  const getNodeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'trigger':
        return 'from-green-500 to-emerald-500';
      case 'claude-agent':
        return 'from-fuchsia-500 to-purple-500';
      case 'ai':
        return 'from-blue-500 to-cyan-500';
      case 'action':
        return 'from-orange-500 to-red-500';
      case 'condition':
        return 'from-yellow-500 to-amber-500';
      default:
        return 'from-slate-500 to-gray-500';
    }
  };

  return (
    <div className="workflow-node">
      <div className={`bg-gradient-to-r ${getNodeColor(data.nodeType)} p-0.5 rounded-lg`}>
        <div className="bg-[#1a0f2e] rounded-lg p-4 min-w-[200px]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`bg-gradient-to-r ${getNodeColor(data.nodeType)} p-2 rounded-lg text-white`}>
              {getNodeIcon(data.nodeType)}
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">{data.nodeKey}</div>
              <div className="text-slate-400 text-xs capitalize">{data.nodeType}</div>
            </div>
          </div>

          {/* Config Preview */}
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="bg-white/5 rounded-lg p-2 space-y-1">
              {Object.entries(data.config).slice(0, 3).map(([key, value]: [string, any]) => (
                <div key={key} className="text-xs">
                  <span className="text-slate-400">{key}:</span>{' '}
                  <span className="text-slate-300">{String(value).substring(0, 30)}{String(value).length > 30 ? '...' : ''}</span>
                </div>
              ))}
              {Object.keys(data.config).length > 3 && (
                <div className="text-xs text-slate-500">+{Object.keys(data.config).length - 3} more</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkflowCanvas({ nodes: workflowNodes, onNodesChange, readOnly = false }: WorkflowCanvasProps) {
  // Convert workflow nodes to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    return workflowNodes.map((node, index) => ({
      id: node.id,
      type: 'workflowNode',
      position: { x: index * 300, y: 100 },
      data: {
        nodeKey: node.nodeKey,
        nodeType: node.nodeType,
        config: node.config,
      },
    }));
  }, [workflowNodes]);

  // Create edges based on node order
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < initialNodes.length - 1; i++) {
      edges.push({
        id: `e${initialNodes[i].id}-${initialNodes[i + 1].id}`,
        source: initialNodes[i].id,
        target: initialNodes[i + 1].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#a855f7',
        },
      });
    }
    return edges;
  }, [initialNodes]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      workflowNode: WorkflowNodeComponent,
    }),
    []
  );

  return (
    <div className="h-full w-full bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] rounded-xl overflow-hidden border border-white/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChangeInternal}
        onEdgesChange={readOnly ? undefined : onEdgesChangeInternal}
        onConnect={readOnly ? undefined : onConnect}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#a855f7"
          gap={20}
          size={1}
          style={{ opacity: 0.1 }}
        />
        <Controls
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden"
          style={{ button: { backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'white' } }}
        />
        <MiniMap
          nodeColor={(node) => {
            const nodeType = node.data.nodeType;
            switch (nodeType) {
              case 'trigger': return '#10b981';
              case 'claude-agent': return '#a855f7';
              case 'ai': return '#3b82f6';
              case 'action': return '#f97316';
              case 'condition': return '#eab308';
              default: return '#64748b';
            }
          }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden"
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
