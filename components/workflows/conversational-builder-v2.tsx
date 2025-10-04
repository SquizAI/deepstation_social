'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  options?: Array<{ label: string; value: string; category?: string }>;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  maxCostPerRun: number;
  timeoutSeconds: number;
}

interface ConversationalBuilderProps {
  onWorkflowCreated?: (workflow: WorkflowDefinition) => void;
}

export function ConversationalBuilderV2({ onWorkflowCreated }: ConversationalBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your AI workflow builder. I'll help you create a custom automation workflow.\n\nWhat would you like to automate today?",
      timestamp: new Date(),
      options: [
        { label: 'LinkedIn content & posting', value: 'linkedin-automation', category: 'Social Media' },
        { label: 'Multi-platform content', value: 'multi-platform', category: 'Social Media' },
        { label: 'Image generation workflow', value: 'image-workflow', category: 'Content Creation' },
        { label: 'Video creation workflow', value: 'video-workflow', category: 'Content Creation' },
        { label: 'Analytics & reporting', value: 'analytics', category: 'Analytics' },
        { label: 'Custom workflow (describe it)', value: 'custom', category: 'Custom' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOptionClick = async (option: string, category?: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: option,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/workflows/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: option,
          conversationHistory: messages,
          selectedOption: option,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        options: data.options || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.workflow) {
        onWorkflowCreated?.(data.workflow);
      }
    } catch (error) {
      console.error('Failed to process message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/workflows/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, conversationHistory: messages }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        options: data.options || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.workflow) {
        onWorkflowCreated?.(data.workflow);
      }
    } catch (error) {
      console.error('Failed to process message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#1a0f2e] via-[#0f0820] to-[#0a0513] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-purple-600/20 border-b border-white/10 p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">Workflow Builder AI</h3>
            <p className="text-sm text-purple-300">Powered by Claude Sonnet 4.5</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm font-medium text-green-300">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center shadow-lg ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-fuchsia-500 to-purple-600'
              }`}
            >
              {message.role === 'user' ? (
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block p-5 rounded-2xl shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-50'
                    : 'bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{message.content}</p>

                {/* Clickable Options */}
                {message.options && message.options.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {/* Group by category */}
                    {Array.from(new Set(message.options.map(o => o.category || 'Options'))).map(category => (
                      <div key={category}>
                        {message.options!.filter(o => (o.category || 'Options') === category).length > 1 && (
                          <div className="text-xs font-semibold text-purple-300 mb-2">{category}</div>
                        )}
                        <div className="grid grid-cols-1 gap-2">
                          {message.options!
                            .filter(o => (o.category || 'Options') === category)
                            .map((option, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleOptionClick(option.label, option.category)}
                                disabled={isProcessing}
                                className="px-4 py-3 bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 hover:from-purple-600/50 hover:to-fuchsia-600/50 border border-purple-400/30 hover:border-purple-400/60 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-white">{option.label}</span>
                                  <svg
                                    className="h-4 w-4 text-purple-300 group-hover:text-white transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2 px-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="flex-1">
              <div className="inline-block p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 bg-purple-400 rounded-full animate-bounce"></span>
                  <span className="h-2.5 w-2.5 bg-fuchsia-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-2.5 w-2.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gradient-to-r from-purple-600/10 via-fuchsia-600/10 to-purple-600/10 border-t border-white/10 p-6">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your workflow... (Shift+Enter for new line)"
            className="flex-1 px-5 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-slate-400 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
            rows={2}
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="self-end bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 px-6 py-4 rounded-2xl shadow-lg shadow-purple-500/30"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click any option above or type your custom requirement
        </p>
      </div>
    </div>
  );
}
