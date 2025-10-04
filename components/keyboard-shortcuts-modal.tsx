'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: 'Workflow Actions',
      items: [
        { action: 'Save workflow', shortcut: `${modKey} + S` },
        { action: 'Run workflow', shortcut: `${modKey} + Enter` },
      ],
    },
    {
      category: 'Node Operations',
      items: [
        { action: 'Delete selected node', shortcut: 'Delete / Backspace' },
        { action: 'Undo', shortcut: `${modKey} + Z` },
        { action: 'Redo', shortcut: `${modKey} + Y` },
      ],
    },
    {
      category: 'Navigation',
      items: [
        { action: 'Close panels', shortcut: 'Escape' },
        { action: 'Show this help', shortcut: '?' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#201033] via-[#15092b] to-[#0a0513] border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
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
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Keyboard Shortcuts
            </h2>
            <p className="text-slate-400 text-sm mt-1">Boost your productivity with these shortcuts</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
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

        {/* Shortcuts List */}
        <div className="p-6 space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-fuchsia-300 font-semibold text-sm uppercase tracking-wide mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between py-2 px-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-slate-300 text-sm">{item.action}</span>
                    <kbd className="px-3 py-1 bg-gradient-to-br from-slate-700 to-slate-800 border border-white/20 rounded-md text-white text-xs font-mono font-semibold shadow-lg">
                      {item.shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">?</kbd>{' '}
              anytime to see shortcuts
            </p>
            <Button onClick={onClose} className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90">
              Got it!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
