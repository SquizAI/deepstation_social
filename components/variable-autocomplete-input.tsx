'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { useVariableAutocomplete, VariableSuggestion } from '@/hooks/useVariableAutocomplete';

interface VariableAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  nodes: Node[];
  currentNodeId: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function VariableAutocompleteInput({
  value,
  onChange,
  nodes,
  currentNodeId,
  placeholder,
  rows = 4,
  className = '',
}: VariableAutocompleteInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);

  const {
    suggestions,
    showSuggestions,
    cursorPosition,
    handleInputChange,
    insertVariable,
    closeSuggestions,
  } = useVariableAutocomplete({ nodes, currentNodeId });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPos(selectionStart);

    if (textareaRef.current) {
      handleInputChange(newValue, selectionStart, textareaRef.current);
    }
  };

  const handleSelectSuggestion = (suggestion: VariableSuggestion) => {
    if (textareaRef.current) {
      insertVariable(suggestion, value, cursorPos, onChange);

      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && (e.key === 'Escape' || e.key === 'Tab')) {
      e.preventDefault();
      closeSuggestions();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textareaRef.current &&
        event.target instanceof HTMLElement &&
        !textareaRef.current.contains(event.target) &&
        showSuggestions
      ) {
        closeSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions, closeSuggestions]);

  const getCategoryIcon = (category: VariableSuggestion['category']) => {
    switch (category) {
      case 'trigger':
        return (
          <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'node':
        return (
          <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'env':
        return (
          <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none resize-none text-sm leading-relaxed ${className}`}
      />

      {/* Variable Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="fixed bg-[#1a0f2e] border border-white/20 rounded-lg shadow-2xl overflow-hidden z-[10000] max-h-64 overflow-y-auto"
          style={{
            top: `${cursorPosition.top}px`,
            left: `${cursorPosition.left}px`,
            width: '320px',
          }}
        >
          <div className="p-2">
            <div className="px-2 py-1 mb-1">
              <p className="text-xs text-slate-400 font-semibold">
                Available Variables
              </p>
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-fuchsia-500/20 rounded-lg transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{getCategoryIcon(suggestion.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs text-fuchsia-300 font-mono font-semibold">
                        {suggestion.label}
                      </code>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        {suggestion.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-1">
                      {suggestion.description}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      e.g., {suggestion.example}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-2 flex items-start gap-2">
        <svg className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-slate-400 leading-relaxed">
          Type <code className="text-fuchsia-400 font-mono">{'{{'}</code> to insert variables from previous nodes.
          Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px] font-mono">Esc</kbd> to close suggestions.
        </p>
      </div>
    </div>
  );
}
