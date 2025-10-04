'use client';

import { Button } from '@/components/ui/button';
import { Node, Edge } from 'reactflow';

interface ValidationIssue {
  type: 'error' | 'warning' | 'success';
  message: string;
  nodeId?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface WorkflowValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  isNodeConfigured: (nodeData: any) => boolean;
  onSelectNode: (nodeId: string) => void;
  onCopyWebhook?: (nodeId: string) => void;
}

export function WorkflowValidationPanel({
  isOpen,
  onClose,
  nodes,
  edges,
  isNodeConfigured,
  onSelectNode,
  onCopyWebhook,
}: WorkflowValidationPanelProps) {
  if (!isOpen) return null;

  // Calculate validation status
  const getValidationStatus = () => {
    const issues: ValidationIssue[] = [];
    let configuredCount = 0;
    let totalNodes = nodes.length;

    // Check if workflow has nodes
    if (nodes.length === 0) {
      issues.push({
        type: 'error',
        message: 'No nodes in workflow. Add nodes to get started.',
      });
    }

    // Check each node's configuration
    nodes.forEach((node) => {
      const configured = isNodeConfigured(node.data);
      if (configured) {
        configuredCount++;
      } else {
        issues.push({
          type: 'warning',
          message: `"${node.data.nodeKey}" needs configuration`,
          nodeId: node.id,
          action: {
            label: 'Configure',
            onClick: () => {
              onSelectNode(node.id);
              onClose();
            },
          },
        });
      }
    });

    // Check for trigger nodes
    const triggerNodes = nodes.filter((n) => n.data.nodeType === 'trigger');
    if (triggerNodes.length === 0) {
      issues.push({
        type: 'error',
        message: 'No trigger node found. Add a trigger to start your workflow.',
      });
    } else if (triggerNodes.length > 1) {
      issues.push({
        type: 'warning',
        message: `Multiple triggers found (${triggerNodes.length}). Only the first will execute.`,
      });
    }

    // Check for webhook URLs that need to be copied
    const webhookTriggers = nodes.filter(
      (n) => n.data.nodeType === 'trigger' && n.data.config?.triggerType === 'webhook'
    );
    webhookTriggers.forEach((node) => {
      issues.push({
        type: 'warning',
        message: `Webhook URL for "${node.data.nodeKey}" - Remember to copy`,
        nodeId: node.id,
        action: onCopyWebhook
          ? {
              label: 'Copy URL',
              onClick: () => onCopyWebhook(node.id),
            }
          : undefined,
      });
    });

    // Check for disconnected nodes
    const disconnectedNodes = nodes.filter((node) => {
      const hasIncoming = edges.some((edge) => edge.target === node.id);
      const hasOutgoing = edges.some((edge) => edge.source === node.id);
      const isTrigger = node.data.nodeType === 'trigger';

      // Trigger nodes don't need incoming edges, but should have outgoing
      if (isTrigger) {
        return !hasOutgoing;
      }
      // Other nodes should have at least incoming edges
      return !hasIncoming;
    });

    if (disconnectedNodes.length > 0) {
      issues.push({
        type: 'warning',
        message: `${disconnectedNodes.length} disconnected node${
          disconnectedNodes.length > 1 ? 's' : ''
        }. Connect them to the workflow.`,
      });
    }

    // Check for action nodes
    const actionNodes = nodes.filter((n) => n.data.nodeType === 'action');
    if (actionNodes.length === 0 && nodes.length > 0) {
      issues.push({
        type: 'warning',
        message: 'No action nodes. Add an action to complete your workflow.',
      });
    }

    // Add success message if everything is configured
    if (
      nodes.length > 0 &&
      configuredCount === totalNodes &&
      triggerNodes.length === 1 &&
      actionNodes.length > 0 &&
      disconnectedNodes.length === 0
    ) {
      issues.unshift({
        type: 'success',
        message: 'All nodes configured correctly. Workflow is ready to run!',
      });
    }

    return {
      issues,
      configuredCount,
      totalNodes,
      hasErrors: issues.some((i) => i.type === 'error'),
      hasWarnings: issues.some((i) => i.type === 'warning'),
    };
  };

  const validation = getValidationStatus();

  const getFirstUnconfiguredNode = () => {
    return nodes.find((node) => !isNodeConfigured(node.data));
  };

  const handleFixIssues = () => {
    const firstUnconfigured = getFirstUnconfiguredNode();
    if (firstUnconfigured) {
      onSelectNode(firstUnconfigured.id);
      onClose();
    }
  };

  const getStatusIcon = (type: 'error' | 'warning' | 'success') => {
    switch (type) {
      case 'error':
        return (
          <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="h-4 w-4 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'success':
        return (
          <svg
            className="h-4 w-4 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  return (
    <div className="w-96 bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border-l border-white/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <svg
              className="h-5 w-5 text-fuchsia-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Workflow Validation
          </h3>
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white -mr-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Summary */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-sm">Configuration Status</span>
            <span className="text-white font-bold">
              {validation.configuredCount} / {validation.totalNodes}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-all duration-300"
              style={{
                width: `${
                  validation.totalNodes > 0
                    ? (validation.configuredCount / validation.totalNodes) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {validation.hasErrors
              ? `${validation.issues.filter((i) => i.type === 'error').length} error${
                  validation.issues.filter((i) => i.type === 'error').length > 1 ? 's' : ''
                } need attention`
              : validation.hasWarnings
              ? `${validation.issues.filter((i) => i.type === 'warning').length} warning${
                  validation.issues.filter((i) => i.type === 'warning').length > 1 ? 's' : ''
                } to review`
              : 'All checks passed!'}
          </p>
        </div>
      </div>

      {/* Validation Issues */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {validation.issues.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-slate-400 text-sm">No issues found!</p>
          </div>
        ) : (
          validation.issues.map((issue, index) => (
            <div
              key={index}
              className={`rounded-lg border p-3 ${
                issue.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30'
                  : issue.type === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getStatusIcon(issue.type)}</div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      issue.type === 'error'
                        ? 'text-red-300'
                        : issue.type === 'warning'
                        ? 'text-yellow-300'
                        : 'text-green-300'
                    }`}
                  >
                    {issue.message}
                  </p>
                  {issue.action && (
                    <button
                      onClick={issue.action.onClick}
                      className={`mt-2 text-xs font-semibold hover:underline ${
                        issue.type === 'error'
                          ? 'text-red-400'
                          : issue.type === 'warning'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {issue.action.label} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/10 space-y-3">
        {validation.hasErrors || validation.hasWarnings ? (
          <Button
            onClick={handleFixIssues}
            disabled={!getFirstUnconfiguredNode()}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-50"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Fix Next Issue
          </Button>
        ) : (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
            <p className="text-green-300 text-sm font-semibold">Ready to run!</p>
          </div>
        )}

        <Button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 text-white">
          Close
        </Button>
      </div>
    </div>
  );
}
