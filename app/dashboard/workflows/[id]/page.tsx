'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getWorkflowTemplate } from '@/lib/workflows/templates';
import { WorkflowCanvas } from '@/components/workflows/workflow-canvas';

interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  totalCost: number;
  duration: number;
  nodesExecuted: number;
  nodesFailed: number;
}

type ViewMode = 'simple' | 'canvas';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');

  useEffect(() => {
    // Load workflow template
    const template = getWorkflowTemplate(workflowId);
    if (template) {
      setWorkflow(template);

      // Initialize inputs based on workflow type
      if (workflowId === 'auto-image-generation') {
        setInputs({
          postContent: 'Excited to announce our new AI-powered platform!',
          platform: 'linkedin',
          budget: '0.04',
        });
      } else if (workflowId === 'multi-platform-optimization') {
        setInputs({
          baseContent: 'Just launched something amazing!',
          platforms: 'linkedin,instagram,twitter',
          includeHashtags: 'true',
        });
      } else if (workflowId === 'complete-content-pipeline') {
        setInputs({
          baseIdea: 'AI automation for social media',
          platforms: 'linkedin,instagram,twitter',
          generateImages: 'true',
        });
      } else if (workflowId === 'video-content-creation') {
        setInputs({
          concept: 'Product demo showcasing features',
          platform: 'instagram-reels',
          duration: '7',
        });
      }
    }
  }, [workflowId]);

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      // Parse inputs
      const parsedInputs: Record<string, any> = {};
      for (const [key, value] of Object.entries(inputs)) {
        if (key === 'platforms') {
          parsedInputs[key] = value.split(',').map(p => p.trim());
        } else if (key === 'includeHashtags' || key === 'generateImages') {
          parsedInputs[key] = value === 'true';
        } else if (key === 'budget' || key === 'duration') {
          parsedInputs[key] = parseFloat(value);
        } else {
          parsedInputs[key] = value;
        }
      }

      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: parsedInputs }),
      });

      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      console.error('Execution error:', error);
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalCost: 0,
        duration: 0,
        nodesExecuted: 0,
        nodesFailed: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!workflow) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Workflow Not Found</h1>
          <Button onClick={() => router.push('/dashboard/workflows')}>
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/workflows')}
          className="mb-4 text-slate-400 hover:text-white"
        >
          ← Back to Workflows
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{workflow.name}</h1>
            <p className="text-slate-400">
              {workflow.nodes.length} nodes • Max cost: ${workflow.maxCostPerRun} • Timeout: {workflow.timeoutSeconds}s
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'simple'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Simple
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'canvas'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Canvas
            </button>
          </div>
        </div>
      </div>

      {/* Canvas View */}
      {viewMode === 'canvas' && (
        <div className="mb-8">
          <div className="h-[500px] bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] border border-white/10 rounded-xl overflow-hidden">
            <WorkflowCanvas nodes={workflow.nodes} readOnly={true} />
          </div>
        </div>
      )}

      {/* Execution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Configuration */}
        <div className="bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Input Configuration</h2>

          <div className="space-y-4">
            {Object.entries(inputs).map(([key, value]) => (
              <div key={key}>
                <Label className="text-slate-300 mb-2 block capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                {key === 'platform' ? (
                  <select
                    value={value}
                    onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="discord">Discord</option>
                    <option value="instagram-reels">Instagram Reels</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube-shorts">YouTube Shorts</option>
                  </select>
                ) : key.includes('Content') || key.includes('Idea') || key.includes('concept') ? (
                  <Textarea
                    value={value}
                    onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                    rows={3}
                    className="bg-white/5 border-white/20 text-white"
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={executeWorkflow}
            disabled={isExecuting}
            className="w-full mt-6 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white"
          >
            {isExecuting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Executing...
              </>
            ) : (
              'Execute Workflow'
            )}
          </Button>
        </div>

        {/* Execution Result */}
        <div className="bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Execution Result</h2>

          {!executionResult && (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p>Configure inputs and click "Execute Workflow" to see results</p>
            </div>
          )}

          {executionResult && (
            <div className="space-y-4">
              {/* Status */}
              <div className={`p-4 rounded-lg border ${
                executionResult.success
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {executionResult.success ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`font-semibold ${executionResult.success ? 'text-green-300' : 'text-red-300'}`}>
                    {executionResult.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {executionResult.error && (
                  <p className="text-sm text-red-300">{executionResult.error}</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Cost</div>
                  <div className="text-lg font-semibold text-white">
                    ${executionResult.totalCost.toFixed(4)}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Duration</div>
                  <div className="text-lg font-semibold text-white">
                    {executionResult.duration}ms
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Nodes Executed</div>
                  <div className="text-lg font-semibold text-white">
                    {executionResult.nodesExecuted}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Nodes Failed</div>
                  <div className="text-lg font-semibold text-white">
                    {executionResult.nodesFailed}
                  </div>
                </div>
              </div>

              {/* Output */}
              {executionResult.output && (
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-xs text-slate-400 mb-2">Output</div>
                  <pre className="text-sm text-white overflow-x-auto">
                    {JSON.stringify(executionResult.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Simple View - Workflow Nodes List */}
      {viewMode === 'simple' && (
        <div className="mt-8 bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Workflow Nodes ({workflow.nodes.length})</h2>

          <div className="space-y-3">
            {workflow.nodes.map((node: any, index: number) => (
              <div key={node.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-fuchsia-500/20 text-fuchsia-300 px-2 py-1 rounded text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="font-semibold text-white">{node.nodeKey}</div>
                  <div className="bg-white/10 px-2 py-1 rounded text-xs text-slate-300">
                    {node.nodeType}
                  </div>
                </div>

                {node.nodeType === 'claude-agent' && (
                  <div className="mt-2 text-sm text-slate-400">
                    <div>Agent: <span className="text-fuchsia-300">{node.config.agentName}</span></div>
                    <div>Operation: <span className="text-slate-300">{node.config.operation}</span></div>
                  </div>
                )}

                {node.nodeType === 'ai' && (
                  <div className="mt-2 text-sm text-slate-400">
                    <div>Type: <span className="text-slate-300">{node.config.aiType}</span></div>
                    {node.config.model && <div>Model: <span className="text-slate-300">{node.config.model}</span></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
