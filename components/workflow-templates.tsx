'use client';

import { Button } from '@/components/ui/button';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: Array<{
    nodeKey: string;
    nodeType: string;
    config: any;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    source: number;
    target: number;
  }>;
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'daily-linkedin-post',
    name: 'Daily LinkedIn Post',
    description: 'Automatically generates and posts to LinkedIn every day at 9am',
    icon: '📅',
    nodes: [
      {
        nodeKey: 'daily_trigger',
        nodeType: 'trigger',
        config: { triggerType: 'scheduled', schedule: '0 9 * * *' },
        position: { x: 100, y: 200 },
      },
      {
        nodeKey: 'ai_text_gen',
        nodeType: 'ai',
        config: {
          aiType: 'text-generation',
          model: 'gpt-4o',
          prompt: 'Create a professional LinkedIn post about {{topic}}. Include:\n- 3 key insights\n- Relevant data points\n- A thought-provoking question\n- 3-5 trending hashtags\nKeep it under 1,500 characters.',
          temperature: 0.7,
          maxTokens: 1000,
        },
        position: { x: 450, y: 200 },
      },
      {
        nodeKey: 'post_to_linkedin',
        nodeType: 'action',
        config: { actionType: 'post', platform: 'linkedin' },
        position: { x: 800, y: 200 },
      },
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
    ],
  },
  {
    id: 'multi-platform-image',
    name: 'Multi-Platform Image Share',
    description: 'Generate an AI image and share it across all your connected platforms',
    icon: '🖼️',
    nodes: [
      {
        nodeKey: 'manual_trigger',
        nodeType: 'trigger',
        config: { triggerType: 'manual' },
        position: { x: 100, y: 200 },
      },
      {
        nodeKey: 'ai_image_gen',
        nodeType: 'ai',
        config: {
          aiType: 'image-generation',
          model: 'dall-e-3',
          prompt: 'Create an engaging image about {{topic}}:\n- Professional quality\n- Modern aesthetic\n- Eye-catching colors\n- High resolution for social media',
        },
        position: { x: 450, y: 200 },
      },
      {
        nodeKey: 'post_to_all',
        nodeType: 'action',
        config: { actionType: 'post', platform: 'all' },
        position: { x: 800, y: 200 },
      },
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
    ],
  },
  {
    id: 'content-approval-workflow',
    name: 'Content Approval Workflow',
    description: 'AI generates content, waits for approval, then posts or saves as draft',
    icon: '✅',
    nodes: [
      {
        nodeKey: 'webhook_trigger',
        nodeType: 'trigger',
        config: { triggerType: 'webhook' },
        position: { x: 100, y: 200 },
      },
      {
        nodeKey: 'ai_content_gen',
        nodeType: 'ai',
        config: {
          aiType: 'text-generation',
          model: 'claude-3.7-sonnet',
          prompt: 'Generate a compelling social media post based on the following topic:\n\nTopic: {{trigger.topic}}\n\nRequirements:\n- Professional tone\n- Engaging and concise\n- Include relevant hashtags\n- Optimized for social media engagement',
          temperature: 0.8,
          maxTokens: 800,
        },
        position: { x: 450, y: 200 },
      },
      {
        nodeKey: 'approval_check',
        nodeType: 'condition',
        config: {
          conditionType: 'if',
          field: 'approval',
          operator: 'equals',
          value: 'true',
        },
        position: { x: 800, y: 200 },
      },
      {
        nodeKey: 'post_approved',
        nodeType: 'action',
        config: { actionType: 'post', platform: 'linkedin' },
        position: { x: 1150, y: 100 },
      },
      {
        nodeKey: 'save_draft',
        nodeType: 'action',
        config: { actionType: 'save' },
        position: { x: 1150, y: 300 },
      },
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 }, // true branch
      { source: 2, target: 4 }, // false branch
    ],
  },
];

interface WorkflowTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

export function WorkflowTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: WorkflowTemplatesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg
                className="h-7 w-7 text-fuchsia-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
              Workflow Templates
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Start with a pre-built workflow and customize it to your needs
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WORKFLOW_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-fuchsia-500/50 hover:bg-white/10 transition-all group"
              >
                {/* Template Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{template.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{template.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Node Flow Preview */}
                <div className="bg-black/30 rounded-lg p-4 mb-4 border border-white/5">
                  <div className="text-xs text-slate-500 font-semibold mb-3 uppercase tracking-wide">
                    Workflow Steps:
                  </div>
                  <div className="space-y-2">
                    {template.nodes.map((node, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/50 flex items-center justify-center text-fuchsia-300 text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="text-slate-300">
                          <span className="capitalize font-medium">
                            {node.nodeType.replace('-', ' ')}
                          </span>
                          {node.nodeType === 'trigger' && (
                            <span className="text-slate-500 ml-1">
                              ({node.config.triggerType})
                            </span>
                          )}
                          {node.nodeType === 'ai' && (
                            <span className="text-slate-500 ml-1">
                              ({node.config.model})
                            </span>
                          )}
                          {node.nodeType === 'action' && (
                            <span className="text-slate-500 ml-1">
                              ({node.config.actionType} to {node.config.platform})
                            </span>
                          )}
                        </div>
                        {index < template.nodes.length - 1 && (
                          <svg
                            className="h-3 w-3 text-slate-600 ml-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use Template Button */}
                <Button
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90"
                >
                  <svg
                    className="h-4 w-4 mr-2"
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
                  Use This Template
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              You can customize any template after loading it
            </p>
            <Button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { WorkflowTemplate };
