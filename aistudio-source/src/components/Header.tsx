/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  mode: 'live_gemini' | 'offline_extractive';
  hasApiKey: boolean;
  onNewQuery: () => void;
  onOpenExport: () => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  hasApiKey,
  onNewQuery,
  onOpenExport,
  activeSection,
  setActiveSection,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E6E1D8] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#163326] flex items-center justify-center text-[#FAF8F5] shadow-xs">
              <BookOpen className="w-4 h-4 text-[#E2D8C3]" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('desk');
              }}
              className="text-xl font-serif font-bold tracking-tight text-[#163326] whitespace-nowrap shrink-0 hover:opacity-90"
            >
              PaperTrail
            </a>
            <span className="hidden sm:inline text-xs font-mono text-[#5C6E64] ml-2">
              v1.0 · Private Desk
            </span>
          </div>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4D6054]">
            <button
              type="button"
              onClick={() => setActiveSection('desk')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeSection === 'desk'
                  ? 'text-[#163326] font-semibold border-b-2 border-[#163326]'
                  : 'hover:text-[#163326]'
              }`}
            >
              Research Desk
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('collection')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeSection === 'collection'
                  ? 'text-[#163326] font-semibold border-b-2 border-[#163326]'
                  : 'hover:text-[#163326]'
              }`}
            >
              Paper Collection
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('evidence')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeSection === 'evidence'
                  ? 'text-[#163326] font-semibold border-b-2 border-[#163326]'
                  : 'hover:text-[#163326]'
              }`}
            >
              Evidence Cards
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('trace')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeSection === 'trace'
                  ? 'text-[#163326] font-semibold border-b-2 border-[#163326]'
                  : 'hover:text-[#163326]'
              }`}
            >
              Execution Trace
            </button>
            <button
              type="button"
              onClick={onOpenExport}
              className="whitespace-nowrap shrink-0 transition-colors py-1 hover:text-[#163326] cursor-pointer"
            >
              Export Report
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNewQuery}
              className="px-4 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#163326] hover:bg-[#1D4233] active:bg-[#0F241A] rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E2D8C3]" />
              <span>New Query</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
