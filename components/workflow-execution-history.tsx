'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'partial';
  duration: number; // milliseconds
  nodesExecuted: number;
  totalNodes: number;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  nodeId: string;
  nodeKey: string;
  nodeType: string;
  status: 'success' | 'failed' | 'skipped';
  startTime: Date;
  endTime: Date;
  duration: number;
  output?: any;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    cost?: number;
    retries?: number;
  };
}

interface WorkflowExecutionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
}

export function WorkflowExecutionHistory({
  isOpen,
  onClose,
  workflowId,
}: WorkflowExecutionHistoryProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, workflowId]);

  const loadHistory = () => {
    // Load from localStorage (max 50 entries)
    const storageKey = `workflow_history_${workflowId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const history = parsed.map((exec: any) => ({
          ...exec,
          timestamp: new Date(exec.timestamp),
          logs: exec.logs.map((log: any) => ({
            ...log,
            startTime: new Date(log.startTime),
            endTime: new Date(log.endTime),
          })),
        }));
        setExecutions(history);
      } catch (error) {
        console.error('Failed to load execution history:', error);
        setExecutions([]);
      }
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all execution history?')) {
      const storageKey = `workflow_history_${workflowId}`;
      localStorage.removeItem(storageKey);
      setExecutions([]);
      setSelectedExecution(null);
    }
  };

  const toggleLogExpansion = (nodeId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'partial':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'skipped':
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
      default:
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-6">
      <div className="bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border border-white/20 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg className="h-7 w-7 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Execution History
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {executions.length} execution{executions.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            <div className="flex items-center gap-2">
              {executions.length > 0 && (
                <Button
                  onClick={clearHistory}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear History
                </Button>
              )}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Timeline List */}
          <div className="w-96 border-r border-white/10 overflow-y-auto">
            {executions.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="h-16 w-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-400 text-sm">No executions yet</p>
                <p className="text-slate-500 text-xs mt-2">
                  Run your workflow to see execution history here
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {executions.map((execution) => (
                  <button
                    key={execution.id}
                    onClick={() => setSelectedExecution(execution)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedExecution?.id === execution.id
                        ? 'bg-fuchsia-500/20 border-fuchsia-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {execution.status === 'success' && (
                          <svg className="h-5 w-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {execution.status === 'failed' && (
                          <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {execution.status === 'partial' && (
                          <svg className="h-5 w-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        <div>
                          <p className="text-white text-sm font-semibold">
                            {formatTimestamp(execution.timestamp)}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {execution.nodesExecuted}/{execution.totalNodes} nodes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">{formatDuration(execution.duration)}</p>
                      </div>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Execution Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedExecution ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-white font-bold text-lg mb-4">Execution Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Timestamp</p>
                      <p className="text-white text-sm font-semibold">
                        {formatTimestamp(selectedExecution.timestamp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Duration</p>
                      <p className="text-white text-sm font-semibold">
                        {formatDuration(selectedExecution.duration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Status</p>
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(selectedExecution.status)}`}>
                        {selectedExecution.status}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Nodes Executed</p>
                      <p className="text-white text-sm font-semibold">
                        {selectedExecution.nodesExecuted} / {selectedExecution.totalNodes}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Node Logs */}
                <div>
                  <h3 className="text-white font-bold text-lg mb-3">Node Execution Logs</h3>
                  <div className="space-y-2">
                    {selectedExecution.logs.map((log, index) => (
                      <div
                        key={log.nodeId}
                        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleLogExpansion(log.nodeId)}
                          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="text-left">
                              <p className="text-white font-semibold text-sm">{log.nodeKey}</p>
                              <p className="text-slate-400 text-xs capitalize">{log.nodeType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(log.status)}`}>
                              {log.status}
                            </div>
                            <p className="text-slate-400 text-xs">{formatDuration(log.duration)}</p>
                            <svg
                              className={`h-5 w-5 text-slate-400 transition-transform ${
                                expandedLogs.has(log.nodeId) ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {expandedLogs.has(log.nodeId) && (
                          <div className="border-t border-white/10 p-4 bg-black/20">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Start Time</p>
                                <p className="text-white text-xs font-mono">
                                  {formatTimestamp(log.startTime)}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">End Time</p>
                                <p className="text-white text-xs font-mono">
                                  {formatTimestamp(log.endTime)}
                                </p>
                              </div>
                            </div>

                            {log.metadata && (
                              <div className="mb-4">
                                <p className="text-slate-400 text-xs mb-2">Metadata</p>
                                <div className="bg-slate-900/50 rounded-lg p-3 space-y-1">
                                  {log.metadata.tokensUsed && (
                                    <p className="text-slate-300 text-xs">
                                      <span className="text-slate-400">Tokens:</span> {log.metadata.tokensUsed}
                                    </p>
                                  )}
                                  {log.metadata.cost && (
                                    <p className="text-slate-300 text-xs">
                                      <span className="text-slate-400">Cost:</span> ${log.metadata.cost.toFixed(4)}
                                    </p>
                                  )}
                                  {log.metadata.retries && log.metadata.retries > 0 && (
                                    <p className="text-yellow-300 text-xs">
                                      <span className="text-slate-400">Retries:</span> {log.metadata.retries}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {log.output && (
                              <div className="mb-4">
                                <p className="text-slate-400 text-xs mb-2">Output</p>
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 max-h-48 overflow-y-auto">
                                  <pre className="text-green-300 text-xs font-mono whitespace-pre-wrap">
                                    {typeof log.output === 'string'
                                      ? log.output
                                      : JSON.stringify(log.output, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {log.error && (
                              <div>
                                <p className="text-slate-400 text-xs mb-2">Error</p>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                  <pre className="text-red-300 text-xs font-mono whitespace-pre-wrap">
                                    {log.error}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="h-16 w-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-slate-400 text-sm">Select an execution to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to save execution to history (call this after workflow execution)
export function saveExecutionToHistory(
  workflowId: string,
  execution: Omit<WorkflowExecution, 'id'>
) {
  const storageKey = `workflow_history_${workflowId}`;
  const stored = localStorage.getItem(storageKey);

  let history: WorkflowExecution[] = [];

  if (stored) {
    try {
      history = JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse execution history:', error);
    }
  }

  // Add new execution with generated ID
  const newExecution: WorkflowExecution = {
    ...execution,
    id: `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };

  history.unshift(newExecution);

  // Keep only last 50 executions
  if (history.length > 50) {
    history = history.slice(0, 50);
  }

  localStorage.setItem(storageKey, JSON.stringify(history));
}
