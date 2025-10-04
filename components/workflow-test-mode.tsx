'use client';

import React, { useState } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';

interface TestDataInput {
  nodeId: string;
  nodeKey: string;
  nodeType: string;
  data: any;
}

interface TestResult {
  nodeId: string;
  nodeKey: string;
  status: 'success' | 'failed' | 'skipped';
  output?: any;
  error?: string;
  duration: number;
}

interface WorkflowTestModeProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  onRunTest: (testData: Record<string, any>) => Promise<TestResult[]>;
}

export function WorkflowTestMode({
  isOpen,
  onClose,
  nodes,
  onRunTest,
}: WorkflowTestModeProps) {
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(
    nodes.length > 0 ? nodes[0].id : null
  );

  const handleRunTest = async () => {
    setIsRunning(true);
    setShowResults(false);

    try {
      const results = await onRunTest(testData);
      setTestResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const updateNodeTestData = (nodeId: string, data: any) => {
    setTestData(prev => ({
      ...prev,
      [nodeId]: data,
    }));
  };

  const getDefaultTestData = (node: Node) => {
    const nodeType = node.data.nodeType;

    switch (nodeType) {
      case 'trigger':
        return {
          topic: 'AI and Machine Learning',
          context: 'Latest trends in generative AI',
          timestamp: new Date().toISOString(),
        };

      case 'ai':
        const aiType = node.data.config?.aiType;
        if (aiType === 'text-generation') {
          return {
            prompt: node.data.config?.prompt || 'Write a LinkedIn post about AI',
            temperature: node.data.config?.temperature || 0.7,
          };
        }
        return {};

      case 'claude-agent':
        return {
          content: 'Sample social media post that needs optimization',
          instructions: 'Make it more engaging and professional',
        };

      case 'transform':
        return {
          input: { text: 'Sample text', metadata: { author: 'Test User' } },
        };

      case 'condition':
        return {
          value: 'test value',
          field: node.data.config?.field || 'status',
        };

      default:
        return {};
    }
  };

  const renderTestDataInput = (node: Node) => {
    const currentData = testData[node.id] || getDefaultTestData(node);
    const dataStr = typeof currentData === 'string'
      ? currentData
      : JSON.stringify(currentData, null, 2);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-slate-300 text-sm font-medium">Sample Input Data (JSON)</label>
          <button
            onClick={() => updateNodeTestData(node.id, getDefaultTestData(node))}
            className="text-xs text-fuchsia-400 hover:text-fuchsia-300"
          >
            Load Example
          </button>
        </div>
        <textarea
          value={dataStr}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              updateNodeTestData(node.id, parsed);
            } catch {
              // Invalid JSON, allow raw text editing
              updateNodeTestData(node.id, e.target.value);
            }
          }}
          rows={12}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-xs focus:border-fuchsia-500 focus:outline-none resize-none"
          placeholder="Enter sample data as JSON..."
        />
        <p className="text-xs text-slate-400">
          This data will be passed to the node during test execution
        </p>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border-t border-white/20 shadow-2xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Test Mode</h3>
            <p className="text-slate-400 text-sm">Run workflow with sample data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunTest}
            disabled={isRunning || nodes.length === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Test...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Test
              </>
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-96">
        {/* Node Selector */}
        <div className="w-64 border-r border-white/10 overflow-y-auto">
          <div className="p-4">
            <p className="text-slate-400 text-xs font-semibold mb-3">Select Node to Configure</p>
            <div className="space-y-1">
              {nodes.map((node, index) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    selectedNode === node.id
                      ? 'bg-fuchsia-500/20 border border-fuchsia-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-white text-sm font-semibold truncate">
                      {node.data.nodeKey}
                    </p>
                  </div>
                  <p className="text-slate-400 text-xs capitalize ml-8">
                    {node.data.nodeType}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Data Input */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedNode && nodes.find(n => n.id === selectedNode) ? (
            renderTestDataInput(nodes.find(n => n.id === selectedNode)!)
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-400 text-sm">Select a node to configure test data</p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        {showResults && (
          <div className="w-96 border-l border-white/10 overflow-y-auto bg-black/20">
            <div className="p-4">
              <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Test Results
              </h4>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={result.nodeId}
                    className={`rounded-lg border p-3 ${
                      result.status === 'success'
                        ? 'bg-green-500/10 border-green-500/30'
                        : result.status === 'failed'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-slate-500/10 border-slate-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">{result.nodeKey}</p>
                          <p className={`text-xs font-medium ${
                            result.status === 'success' ? 'text-green-300' :
                            result.status === 'failed' ? 'text-red-300' :
                            'text-slate-300'
                          }`}>
                            {result.status}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs">{result.duration}ms</p>
                    </div>

                    {result.output && (
                      <div className="mt-2 bg-black/30 rounded p-2">
                        <p className="text-green-300 text-xs font-mono truncate">
                          {typeof result.output === 'string'
                            ? result.output.substring(0, 50)
                            : JSON.stringify(result.output).substring(0, 50)}
                          {(typeof result.output === 'string' ? result.output : JSON.stringify(result.output)).length > 50 && '...'}
                        </p>
                      </div>
                    )}

                    {result.error && (
                      <div className="mt-2 bg-black/30 rounded p-2">
                        <p className="text-red-300 text-xs">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {testResults.length === 0 && (
                <p className="text-slate-400 text-xs text-center py-8">
                  No results yet. Click "Run Test" to execute.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
