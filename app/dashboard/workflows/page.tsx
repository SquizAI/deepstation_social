'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ConversationalBuilderV2 } from '@/components/workflows/conversational-builder-v2';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type: string;
  last_run_at: string | null;
  created_at: string;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAIBuilder, setShowAIBuilder] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workflows');

      if (!response.ok) {
        throw new Error('Failed to load workflows');
      }

      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkflow = async () => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Workflow',
          description: 'Created with workflow builder',
          triggerType: 'manual',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }

      const data = await response.json();
      router.push(`/dashboard/workflows/${data.workflow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Workflows</h1>
              <p className="text-slate-400">
                Build autonomous AI workflows with visual drag-and-drop
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAIBuilder(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Create with AI
              </Button>
              <Button
                onClick={createWorkflow}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Manually
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl h-48 animate-pulse"
              ></div>
            ))}
          </div>
        )}

        {/* Workflows Grid */}
        {!isLoading && workflows.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <svg
              className="h-16 w-16 mx-auto text-slate-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">
              No workflows yet
            </h3>
            <p className="text-slate-400 mb-6">
              Create your first autonomous workflow to get started
            </p>
            <Button
              onClick={createWorkflow}
              className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white"
            >
              Create Your First Workflow
            </Button>
          </div>
        )}

        {!isLoading && workflows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-fuchsia-500/50 transition-all group">
                <Link href={`/dashboard/workflows/${workflow.id}`} className="block">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        workflow.status === 'active'
                          ? 'bg-green-500/20 text-green-300'
                          : workflow.status === 'draft'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {workflow.status}
                    </span>
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>

                  {/* Workflow Info */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-fuchsia-300 transition-colors">
                    {workflow.name}
                  </h3>
                  {workflow.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {workflow.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>Trigger:</span>
                      <span className="text-slate-400">{workflow.trigger_type}</span>
                    </div>
                    {workflow.last_run_at && (
                      <div className="flex items-center gap-2">
                        <span>Last run:</span>
                        <span className="text-slate-400">
                          {new Date(workflow.last_run_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                  <Link
                    href={`/dashboard/workflows/builder/${workflow.id}`}
                    className="flex-1"
                  >
                    <Button className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                  </Link>
                  <Link
                    href={`/dashboard/workflows/${workflow.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Run
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
            <svg
              className="h-8 w-8 text-blue-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">Templates</h3>
            <p className="text-sm text-slate-400 mb-4">
              Start with pre-built workflow templates
            </p>
            <Link
              href="/dashboard/workflows/templates"
              className="text-blue-400 text-sm font-medium hover:text-blue-300"
            >
              Browse Templates →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-xl p-6">
            <svg
              className="h-8 w-8 text-purple-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
            <p className="text-sm text-slate-400 mb-4">
              Learn how to build powerful workflows
            </p>
            <a
              href="#"
              className="text-purple-400 text-sm font-medium hover:text-purple-300"
            >
              Read Docs →
            </a>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
            <svg
              className="h-8 w-8 text-green-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
            <p className="text-sm text-slate-400 mb-4">
              View workflow performance metrics
            </p>
            <Link
              href="/dashboard/workflows/analytics"
              className="text-green-400 text-sm font-medium hover:text-green-300"
            >
              View Analytics →
            </Link>
          </div>
        </div>

        {/* AI Workflow Builder Modal */}
        {showAIBuilder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl h-[80vh] relative">
              <Button
                onClick={() => setShowAIBuilder(false)}
                variant="ghost"
                className="absolute -top-12 right-0 text-white hover:text-slate-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
              <ConversationalBuilderV2
                onWorkflowCreated={(workflow) => {
                  setShowAIBuilder(false);
                  loadWorkflows(); // Refresh the list
                  router.push(`/dashboard/workflows/${workflow.id}`);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
