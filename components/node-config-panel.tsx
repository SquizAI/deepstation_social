'use client';

import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { ScheduleBuilder } from '@/components/schedule-builder';
import { VariableAutocompleteInput } from '@/components/variable-autocomplete-input';

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (nodeId: string, updates: any) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  allNodes?: Node[]; // For variable autocomplete
}

// Helper component for tooltips/help text
function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{children}</p>
  );
}

// Helper component for section headers with optional help icon
function SectionHeader({ title, tooltip }: { title: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-slate-300 text-sm font-medium">{title}</label>
      {tooltip && (
        <div className="group relative">
          <svg className="h-4 w-4 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute left-6 top-0 w-64 p-3 bg-slate-900 border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <p className="text-xs text-slate-300 leading-relaxed">{tooltip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to copy text to clipboard
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export function NodeConfigPanel({ node, onUpdate, onClose, onDelete, allNodes = [] }: NodeConfigPanelProps) {
  const [nodeKey, setNodeKey] = useState(node.data.nodeKey);
  const [config, setConfig] = useState(node.data.config || {});
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [useVisualScheduler, setUseVisualScheduler] = useState(true);

  useEffect(() => {
    setNodeKey(node.data.nodeKey);
    setConfig(node.data.config || {});
  }, [node]);

  const handleSave = () => {
    onUpdate(node.id, { nodeKey, config });
  };

  const renderConfigForm = () => {
    const nodeType = node.data.nodeType;

    switch (nodeType) {
      case 'trigger':
        const webhookUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/api/webhooks/${node.id}`
          : `https://deepstation.ai/api/webhooks/${node.id}`;

        return (
          <div className="space-y-4">
            <div>
              <SectionHeader
                title="Trigger Type"
                tooltip="Choose how this workflow starts. Manual requires you to click Run, Scheduled runs automatically, and Webhook allows external services to trigger it."
              />
              <select
                value={config.triggerType || 'manual'}
                onChange={(e) => setConfig({ ...config, triggerType: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="manual">⚡ Manual - Click to Run</option>
                <option value="scheduled">⏰ Scheduled - Runs Automatically</option>
                <option value="webhook">🔗 Webhook - External Trigger</option>
              </select>
              <HelpText>
                {config.triggerType === 'manual' && "You manually click 'Run Workflow' button to start this workflow."}
                {config.triggerType === 'scheduled' && "Workflow runs automatically on your chosen schedule (e.g., every day at 9am)."}
                {config.triggerType === 'webhook' && "External services can trigger this workflow by sending a POST request to the webhook URL."}
              </HelpText>
            </div>

            {config.triggerType === 'scheduled' && (
              <>
                {/* Phase 3: Visual Schedule Builder Toggle */}
                <div className="flex items-center justify-between">
                  <SectionHeader
                    title="Schedule Configuration"
                    tooltip="Choose between visual scheduler or manual cron expression input"
                  />
                  <button
                    onClick={() => setUseVisualScheduler(!useVisualScheduler)}
                    className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    {useVisualScheduler ? 'Switch to Cron' : 'Switch to Visual'}
                  </button>
                </div>

                {useVisualScheduler ? (
                  <ScheduleBuilder
                    initialCron={config.schedule}
                    onChange={(cron) => setConfig({ ...config, schedule: cron })}
                  />
                ) : (
                  <>
                    <div>
                      <input
                        type="text"
                        value={config.schedule || '0 9 * * *'}
                        onChange={(e) => setConfig({ ...config, schedule: e.target.value })}
                        placeholder="0 9 * * *"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-sm focus:border-fuchsia-500 focus:outline-none"
                      />
                      <HelpText>Format: minute hour day month weekday</HelpText>
                    </div>

                    {/* Quick schedule options */}
                    <div>
                      <label className="text-slate-300 text-xs mb-2 block font-medium">Quick Options:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Daily at 9am', value: '0 9 * * *' },
                          { label: 'Every 6 hours', value: '0 */6 * * *' },
                          { label: 'Every hour', value: '0 * * * *' },
                          { label: 'Weekdays at noon', value: '0 12 * * 1-5' },
                        ].map(({ label, value }) => (
                          <button
                            key={value}
                            onClick={() => setConfig({ ...config, schedule: value })}
                            className={`px-3 py-2 rounded-lg text-xs transition-all ${
                              config.schedule === value
                                ? 'bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300'
                                : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {config.triggerType === 'webhook' && (
              <div>
                <SectionHeader
                  title="Webhook URL"
                  tooltip="Use this URL to trigger the workflow from external services like Zapier, Make.com, or custom applications."
                />
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/20 rounded-lg p-3 overflow-x-auto">
                    <code className="text-xs text-fuchsia-300 break-all">
                      {webhookUrl}
                    </code>
                  </div>
                  <Button
                    onClick={() => {
                      copyToClipboard(webhookUrl);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 2000);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white whitespace-nowrap"
                  >
                    {copiedWebhook ? (
                      <>
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <HelpText>
                  Send a POST request to this URL to trigger the workflow. Include any data in the request body as JSON.
                </HelpText>
                <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-300 font-semibold mb-2">Example cURL command:</p>
                  <code className="text-xs text-slate-300 font-mono block bg-black/30 p-2 rounded overflow-x-auto">
                    curl -X POST {webhookUrl} \<br />
                    &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                    &nbsp;&nbsp;-d '{`{"message": "Hello from webhook"}`}'
                  </code>
                </div>
              </div>
            )}
          </div>
        );

      case 'claude-agent':
        return (
          <div className="space-y-4">
            <div>
              <SectionHeader
                title="Agent Type"
                tooltip="Pre-built AI agents designed for specific social media tasks. Each agent is optimized for different use cases."
              />
              <select
                value={config.agentName || 'content-optimizer'}
                onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="content-optimizer">Content Optimizer - Improve existing posts</option>
                <option value="content-generator">Content Generator - Create new posts</option>
                <option value="image-analyzer">Image Analyzer - Describe images</option>
                <option value="hashtag-generator">Hashtag Generator - Create trending hashtags</option>
                <option value="custom">Custom Agent - Build your own</option>
              </select>
              <HelpText>
                {config.agentName === 'content-optimizer' && "Enhances existing content by improving grammar, tone, and engagement factors."}
                {config.agentName === 'content-generator' && "Creates original social media posts based on your input and brand voice."}
                {config.agentName === 'image-analyzer' && "Analyzes images and generates descriptions, captions, or alt text."}
                {config.agentName === 'hashtag-generator' && "Suggests relevant, trending hashtags based on your content."}
                {config.agentName === 'custom' && "Define your own agent with custom behavior and instructions."}
              </HelpText>
            </div>

            {config.agentName === 'custom' && (
              <div>
                <SectionHeader
                  title="Custom Agent Name"
                  tooltip="Give your custom agent a unique identifier (lowercase, hyphens allowed)."
                />
                <input
                  type="text"
                  value={config.customAgentName || ''}
                  onChange={(e) => setConfig({ ...config, customAgentName: e.target.value })}
                  placeholder="e.g., brand-voice-optimizer"
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
                />
                <HelpText>Use lowercase letters and hyphens only (e.g., my-custom-agent).</HelpText>
              </div>
            )}

            <div>
              <SectionHeader
                title="Operation"
                tooltip="What should the agent do with the input data? Choose the operation that matches your workflow needs."
              />
              <select
                value={config.operation || 'optimize-single'}
                onChange={(e) => setConfig({ ...config, operation: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="optimize-single">Optimize Single - Improve one post</option>
                <option value="optimize-batch">Optimize Batch - Improve multiple posts</option>
                <option value="generate">Generate - Create new content</option>
                <option value="analyze">Analyze - Review and provide feedback</option>
                <option value="transform">Transform - Modify structure/format</option>
              </select>
              <HelpText>
                {config.operation === 'optimize-single' && "Process one piece of content at a time, perfect for real-time improvements."}
                {config.operation === 'optimize-batch' && "Process multiple items efficiently, ideal for bulk operations."}
                {config.operation === 'generate' && "Create completely new content from scratch or based on prompts."}
                {config.operation === 'analyze' && "Review content and provide insights, metrics, or recommendations."}
                {config.operation === 'transform' && "Change the format or structure of content (e.g., long-form to short-form)."}
              </HelpText>
            </div>

            <div>
              <SectionHeader
                title="Additional Instructions (Optional)"
                tooltip="Add specific guidelines for the agent. For example: 'Use professional tone' or 'Include emoji'."
              />
              {/* Phase 3: Variable Autocomplete for Instructions */}
              <VariableAutocompleteInput
                value={config.instructions || ''}
                onChange={(value) => setConfig({ ...config, instructions: value })}
                nodes={allNodes}
                currentNodeId={node.id}
                placeholder="Example: Always maintain a professional tone, include 3-5 relevant emojis, and keep posts under 1000 characters."
                rows={4}
              />
            </div>
          </div>
        );

      case 'ai':
        const examplePrompts = {
          'text-generation': `Write a compelling LinkedIn post about {{topic}}. Include:
- 3 key insights or benefits
- Relevant statistics or data points
- A thought-provoking question
- 3-5 trending hashtags
Keep it under 1,500 characters and maintain a professional yet conversational tone.`,
          'image-generation': `A professional header image for LinkedIn featuring:
- Abstract technology patterns with neural network visualization
- Purple and blue gradient background
- Modern, clean aesthetic with minimalist design
- High quality, 1200x627 dimensions
- Professional corporate style`,
          'video-generation': `Create a 5-second video clip showing:
- Smooth camera movement through abstract shapes
- Purple and blue color scheme
- Modern tech aesthetic
- Professional quality for social media`
        };

        return (
          <div className="space-y-4">
            <div>
              <SectionHeader
                title="AI Type"
                tooltip="Choose what type of content you want to generate: text for posts/captions, images for visuals, or videos for motion content."
              />
              <select
                value={config.aiType || 'text-generation'}
                onChange={(e) => setConfig({ ...config, aiType: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="text-generation">📝 Text Generation - Posts & Captions</option>
                <option value="image-generation">🎨 Image Generation - Visual Content</option>
                <option value="video-generation">🎬 Video Generation - Motion Content</option>
              </select>
            </div>

            <div>
              <SectionHeader
                title="AI Model"
                tooltip="Different models have different strengths. GPT-4o is great for text, DALL-E 3 for images, etc."
              />
              <select
                value={config.model || 'gpt-4o'}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                {config.aiType === 'text-generation' && (
                  <>
                    <option value="gpt-4o">GPT-4o - Best overall quality</option>
                    <option value="gpt-4o-mini">GPT-4o Mini - Faster, cost-effective</option>
                    <option value="claude-3.7-sonnet">Claude 3.7 Sonnet - Creative writing</option>
                    <option value="claude-3.5-haiku">Claude 3.5 Haiku - Quick responses</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash - Google's latest</option>
                    <option value="llama-3.3-70b">Llama 3.3 70B - Open source</option>
                  </>
                )}
                {config.aiType === 'image-generation' && (
                  <>
                    <option value="dall-e-3">DALL-E 3 - High quality, photorealistic</option>
                    <option value="stable-diffusion">Stable Diffusion - Artistic, flexible</option>
                    <option value="midjourney">Midjourney - Creative, stylized</option>
                  </>
                )}
                {config.aiType === 'video-generation' && (
                  <>
                    <option value="runway">Runway Gen-3 - Professional quality</option>
                    <option value="pika">Pika Labs - Fast generation</option>
                    <option value="luma">Luma Dream Machine - Cinematic</option>
                  </>
                )}
              </select>
              <HelpText>
                {config.aiType === 'text-generation' && "Text models vary in speed, cost, and quality. GPT-4o offers the best results, while Mini is faster and cheaper."}
                {config.aiType === 'image-generation' && "Image models excel at different styles. DALL-E 3 for realism, Stable Diffusion for art, Midjourney for creative styles."}
                {config.aiType === 'video-generation' && "Video generation is experimental. Each model has unique strengths in motion quality and style."}
              </HelpText>
            </div>

            <div>
              <SectionHeader
                title="Prompt"
                tooltip="Describe exactly what you want the AI to create. Be specific about style, tone, length, and requirements."
              />
              {/* Phase 3: Variable Autocomplete Input */}
              <VariableAutocompleteInput
                value={config.prompt || ''}
                onChange={(value) => setConfig({ ...config, prompt: value })}
                nodes={allNodes}
                currentNodeId={node.id}
                placeholder={examplePrompts[config.aiType as keyof typeof examplePrompts] || 'Enter your prompt here...'}
                rows={8}
              />

              {/* Example prompt button */}
              <button
                onClick={() => setConfig({ ...config, prompt: examplePrompts[config.aiType as keyof typeof examplePrompts] })}
                className="mt-2 text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Load example prompt
              </button>
            </div>

            {(config.aiType === 'text-generation') && (
              <>
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature || 0.7}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Precise (0)</span>
                    <span className="text-fuchsia-400 font-semibold">{config.temperature || 0.7}</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Max Tokens</label>
                  <input
                    type="number"
                    value={config.maxTokens || 1000}
                    onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                    min="1"
                    max="8000"
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'action':
        return (
          <div className="space-y-4">
            <div>
              <SectionHeader
                title="Action Type"
                tooltip="What should happen with the content? Post immediately, save for review, schedule for later, or send a notification."
              />
              <select
                value={config.actionType || 'post'}
                onChange={(e) => setConfig({ ...config, actionType: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="post">📤 Post - Publish immediately</option>
                <option value="save">💾 Save - Store as draft</option>
                <option value="schedule">📅 Schedule - Post at specific time</option>
                <option value="send">📧 Send - Notification/webhook</option>
              </select>
              <HelpText>
                {config.actionType === 'post' && "Immediately publish the content to the selected platform(s). No approval needed."}
                {config.actionType === 'save' && "Save as a draft for manual review and approval before posting."}
                {config.actionType === 'schedule' && "Set a specific date and time to publish the content automatically."}
                {config.actionType === 'send' && "Send a notification or trigger a webhook instead of posting to social media."}
              </HelpText>
            </div>

            {(config.actionType === 'post' || config.actionType === 'schedule') && (
              <div>
                <SectionHeader
                  title="Platform"
                  tooltip="Choose which social media platform(s) to publish to. Make sure you've connected your accounts first."
                />
                <select
                  value={config.platform || 'linkedin'}
                  onChange={(e) => setConfig({ ...config, platform: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
                >
                  <option value="linkedin">LinkedIn - Professional network</option>
                  <option value="twitter">X (Twitter) - Microblogging</option>
                  <option value="instagram">Instagram - Visual content</option>
                  <option value="facebook">Facebook - Social network</option>
                  <option value="discord">Discord - Community platform</option>
                  <option value="all">All Connected Platforms</option>
                </select>
                <HelpText>
                  Ensure you've connected your account in Settings before posting. Content will be automatically formatted for each platform.
                </HelpText>
              </div>
            )}

            {config.actionType === 'schedule' && (
              <div>
                <SectionHeader
                  title="Schedule Time"
                  tooltip="Select the exact date and time when you want this content to be posted."
                />
                <input
                  type="datetime-local"
                  value={config.scheduledTime || ''}
                  onChange={(e) => setConfig({ ...config, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
                />
                <HelpText>
                  Time is in your local timezone. The post will be published automatically at this time.
                </HelpText>
              </div>
            )}

            {config.actionType === 'send' && (
              <>
                <div>
                  <SectionHeader
                    title="Notification Type"
                    tooltip="Choose how you want to be notified or where to send the data."
                  />
                  <select
                    value={config.notificationType || 'email'}
                    onChange={(e) => setConfig({ ...config, notificationType: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
                  >
                    <option value="email">📧 Email - Send to inbox</option>
                    <option value="slack">💬 Slack - Team notification</option>
                    <option value="discord">🎮 Discord - Webhook message</option>
                  </select>
                </div>

                <div>
                  <SectionHeader
                    title="Recipient"
                    tooltip="Enter the email address, Slack channel, or Discord webhook URL to receive notifications."
                  />
                  <input
                    type="text"
                    value={config.recipient || ''}
                    onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                    placeholder={
                      config.notificationType === 'email' ? 'your@email.com' :
                      config.notificationType === 'slack' ? '#channel-name or @username' :
                      'https://discord.com/api/webhooks/...'
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
                  />
                  <HelpText>
                    {config.notificationType === 'email' && "Enter the email address where you want to receive workflow notifications."}
                    {config.notificationType === 'slack' && "Use #channel-name for channels or @username for direct messages."}
                    {config.notificationType === 'discord' && "Paste your Discord webhook URL from Server Settings > Integrations."}
                  </HelpText>
                </div>
              </>
            )}
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Condition Type</label>
              <select
                value={config.conditionType || 'if'}
                onChange={(e) => setConfig({ ...config, conditionType: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="if">If/Else</option>
                <option value="switch">Switch</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-sm mb-2 block">Field</label>
              <input
                type="text"
                value={config.field || ''}
                onChange={(e) => setConfig({ ...config, field: e.target.value })}
                placeholder="e.g., output.sentiment"
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm mb-2 block">Operator</label>
              <select
                value={config.operator || 'equals'}
                onChange={(e) => setConfig({ ...config, operator: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-sm mb-2 block">Value</label>
              <input
                type="text"
                value={config.value || ''}
                onChange={(e) => setConfig({ ...config, value: e.target.value })}
                placeholder="Comparison value"
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              />
            </div>
          </div>
        );

      case 'transform':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Transform Type</label>
              <select
                value={config.transformType || 'map'}
                onChange={(e) => setConfig({ ...config, transformType: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="map">Map Fields</option>
                <option value="filter">Filter Data</option>
                <option value="merge">Merge Objects</option>
                <option value="extract">Extract Values</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-sm mb-2 block">Mapping (JSON)</label>
              <textarea
                value={typeof config.mapping === 'string' ? config.mapping : JSON.stringify(config.mapping || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setConfig({ ...config, mapping: parsed });
                  } catch {
                    setConfig({ ...config, mapping: e.target.value });
                  }
                }}
                placeholder='{\n  "newField": "{{oldField}}"\n}'
                rows={8}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none resize-none font-mono text-sm"
              />
            </div>
          </div>
        );

      default:
        // Fallback to JSON editor for unknown node types
        return (
          <div>
            <label className="text-slate-300 text-sm mb-2 block">Configuration (JSON)</label>
            <textarea
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig(parsed);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-sm focus:border-fuchsia-500 focus:outline-none"
              rows={10}
            />
          </div>
        );
    }
  };

  return (
    <div className="w-96 bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border-l border-white/10 flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Node Properties</h3>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white -mr-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div>
          <label className="text-slate-300 text-sm mb-2 block">Node Key</label>
          <input
            type="text"
            value={nodeKey}
            onChange={(e) => setNodeKey(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <label className="text-slate-300 text-sm mb-2 block">Type</label>
          <div className="text-white capitalize bg-white/5 px-3 py-2 rounded-lg border border-white/10">
            {node.data.nodeType.replace('-', ' ')}
          </div>
        </div>

        {renderConfigForm()}

        {node.data.output && (
          <div>
            <label className="text-slate-300 text-sm mb-2 block">Output</label>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 max-h-40 overflow-y-auto">
              <pre className="text-green-300 text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(node.data.output, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {node.data.error && (
          <div>
            <label className="text-slate-300 text-sm mb-2 block">Error</label>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <pre className="text-red-300 text-xs whitespace-pre-wrap">
                {node.data.error}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 space-y-3">
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Changes
        </Button>

        <Button
          onClick={() => onDelete(node.id)}
          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Node
        </Button>
      </div>
    </div>
  );
}
