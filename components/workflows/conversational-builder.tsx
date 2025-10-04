'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
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

export function ConversationalBuilder({ onWorkflowCreated }: ConversationalBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your workflow builder assistant. Describe what you want to automate, and I'll create a custom workflow for you.\n\nFor example:\n• \"Create a workflow that generates LinkedIn posts and images automatically\"\n• \"I need to optimize content for Instagram, Twitter, and LinkedIn\"\n• \"Build a workflow that analyzes post performance and suggests improvements\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If workflow was created, notify parent
      if (data.workflow) {
        onWorkflowCreated?.(data.workflow);
      }
    } catch (error) {
      console.error('Failed to process message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again or rephrase your request.",
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
    <div className="flex flex-col h-full bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Workflow Builder AI</h3>
            <p className="text-xs text-slate-400">Powered by Claude Sonnet 4.5</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white'
              }`}
            >
              {message.role === 'user' ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              )}
            </div>

            {/* Message */}
            <div
              className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500/20 text-blue-100'
                    : 'bg-white/5 text-slate-200'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="flex-1">
              <div className="inline-block p-4 rounded-lg bg-white/5">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white/5 border-t border-white/10 p-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your workflow... (Shift+Enter for new line)"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:border-fuchsia-500/50 transition-colors"
            rows={2}
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="self-end bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          💡 Tip: Be specific about your goals, platforms, and any special requirements
        </p>
      </div>
    </div>
  );
}
