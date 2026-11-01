/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Send,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Cpu,
  BookOpen,
  Search,
  ExternalLink,
  HelpCircle,
  FileDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { QueryResponse, ActionLogStep, SearchResult } from '../types/research.ts';
import { EvidenceCards } from './EvidenceCards.tsx';
import { ActionLog } from './ActionLog.tsx';

interface ResearchDeskProps {
  session: QueryResponse | null;
  loading: boolean;
  error: string | null;
  mode: 'live_gemini' | 'offline_extractive';
  setMode: (m: 'live_gemini' | 'offline_extractive') => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  availableModels: string[];
  hasApiKey: boolean;
  question: string;
  setQuestion: (q: string) => void;
  onSubmitQuery: (question?: string) => void;
  onOpenExport: () => void;
  activeCitationId: string | null;
  setActiveCitationId: (id: string | null) => void;
  onRunPreset: (presetType: string) => void;
}

export const ResearchDesk: React.FC<ResearchDeskProps> = ({
  session,
  loading,
  error,
  mode,
  setMode,
  selectedModel,
  setSelectedModel,
  availableModels,
  hasApiKey,
  question,
  setQuestion,
  onSubmitQuery,
  onOpenExport,
  activeCitationId,
  setActiveCitationId,
  onRunPreset,
}) => {
  const suggestedQuestions = [
    {
      label: 'Compare RCTs vs Synthetic Controls',
      question: 'How do randomized controlled trials and synthetic controls handle counterfactuals and confounding?',
    },
    {
      label: 'Construct Validity in Triangulation',
      question: 'How does triangulation establish construct validity, and what are its operational limitations?',
    },
    {
      label: 'Benchmark Drift & Contamination',
      question: 'Do static benchmark evaluations reflect true generalizability, and what audits are recommended?',
    },
    {
      label: 'Participant Count (Missing Evidence Test)',
      question: 'What is the exact participant sample size reported for the intervention trials?',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    onSubmitQuery(question.trim());
  };

  const handleSelectSuggestion = (q: string) => {
    setQuestion(q);
    onSubmitQuery(q);
  };

  const renderAnswerWithInteractiveCitations = (answerText: string) => {
    if (!answerText) return null;

    // Split text by [document_id] citations to make them clickable anchors
    const parts = answerText.split(/(\[[a-zA-Z0-9_\-]+\])/g);

    return (
      <div className="font-serif text-sm leading-relaxed text-[#1C2922] select-text">
        {parts.map((part, index) => {
          const match = part.match(/^\[([a-zA-Z0-9_\-]+)\]$/);
          if (match) {
            const docId = match[1];
            const isRetrieved = session?.citationReport.validCitations.includes(docId);
            const isUngrounded = session?.citationReport.ungroundedCitations.includes(docId);
            const isSelected = activeCitationId === docId;

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setActiveCitationId(isSelected ? null : docId);
                  const el = document.getElementById(`evidence-card-${docId}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                title={
                  isUngrounded
                    ? `Warning: [${docId}] was NOT retrieved in search`
                    : `Grounded in retrieved evidence [${docId}]. Click to view card.`
                }
                className={`inline-flex items-center font-mono text-xs font-semibold px-1 py-0.5 mx-0.5 rounded transition-all cursor-pointer ${
                  isUngrounded
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : isSelected
                    ? 'bg-[#163326] text-white shadow-xs'
                    : 'bg-[#EAE5DA] text-[#163326] hover:bg-[#DCD5C6] border border-[#D5CEC2]'
                }`}
              >
                [{docId}]
              </button>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Console Controls: Mode & Model */}
      <div className="p-4 bg-white border border-[#E6E1D8] rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#4D6054]">Execution Engine:</span>
            <div className="flex items-center gap-1 p-1 bg-[#ECE6DB] rounded-lg">
              <button
                type="button"
                onClick={() => setMode('offline_extractive')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  mode === 'offline_extractive'
                    ? 'bg-white text-[#163326] shadow-xs'
                    : 'text-[#4D6054] hover:text-[#163326]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                <span>Offline Extractive Demo (No Key Required)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('live_gemini')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  mode === 'live_gemini'
                    ? 'bg-white text-[#163326] shadow-xs'
                    : 'text-[#4D6054] hover:text-[#163326]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#163326]" />
                <span>Live Gemini Mode</span>
              </button>
            </div>
          </div>

          {/* Model Selector & Key Telemetry */}
          <div className="flex items-center gap-3">
            {mode === 'live_gemini' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5C6E64]">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono bg-[#FAF8F5] border border-[#D5CEC2] rounded-md text-[#163326] focus:outline-none focus:ring-1 focus:ring-[#163326] cursor-pointer"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Offline Engine Active · Zero API Key Required</span>
              </div>
            )}

            {/* Server key badge */}
            <div className="text-xs font-mono text-[#5C6E64] flex items-center gap-1">
              <span>Server Key:</span>
              <span className={`font-semibold ${hasApiKey ? 'text-emerald-700' : 'text-amber-700'}`}>
                {hasApiKey ? 'Configured' : 'Missing (Use Offline Demo)'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Test Presets Bar */}
        <div className="mt-3 pt-3 border-t border-[#EDE8DF] flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-[#163326] mr-1">Verification Presets:</span>
          <button
            type="button"
            onClick={() => onRunPreset('retrieval')}
            className="px-2.5 py-1 font-mono text-[11px] bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#DCD5C9] text-[#163326] rounded-md transition-colors cursor-pointer"
          >
            Test Retrieval
          </button>
          <button
            type="button"
            onClick={() => onRunPreset('no_matches')}
            className="px-2.5 py-1 font-mono text-[11px] bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#DCD5C9] text-[#163326] rounded-md transition-colors cursor-pointer"
          >
            Test No Matches
          </button>
          <button
            type="button"
            onClick={() => onRunPreset('method_comparison')}
            className="px-2.5 py-1 font-mono text-[11px] bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#DCD5C9] text-[#163326] rounded-md transition-colors cursor-pointer"
          >
            Test Comparison
          </button>
          <button
            type="button"
            onClick={() => onRunPreset('loop_boundary')}
            className="px-2.5 py-1 font-mono text-[11px] bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#DCD5C9] text-[#163326] rounded-md transition-colors cursor-pointer"
          >
            Test Loop Bounds (8 steps)
          </button>
          <button
            type="button"
            onClick={onOpenExport}
            className="px-2.5 py-1 font-mono text-[11px] bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#DCD5C9] text-[#163326] rounded-md transition-colors cursor-pointer flex items-center gap-1"
          >
            <FileDown className="w-3 h-3 text-[#5C6E64]" />
            <span>Test Exports</span>
          </button>
        </div>
      </div>

      {/* Query Input Card */}
      <div className="p-4 bg-white border border-[#E6E1D8] rounded-xl shadow-xs space-y-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#163326] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#163326]" />
                <span>Research Question</span>
              </label>
              <span className="text-[11px] text-[#5C6E64]">
                Model will call <code className="font-mono text-[#163326]">search_documents</code> on first turn
              </span>
            </div>

            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How does triangulation establish construct validity, and what are its operational limitations?"
              className="w-full p-3 text-xs leading-relaxed bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163326]/20 focus:border-[#163326] text-[#163326] placeholder-[#889B90] resize-y select-text"
              required
            />
          </div>

          {/* Suggested Questions */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-[#5C6E64]">
              Suggested queries:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedQuestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(s.question)}
                  className="px-2.5 py-1 text-xs bg-[#FAF8F5] hover:bg-[#EDE7DC] border border-[#DCD5C9] text-[#2C3A33] rounded-md transition-colors cursor-pointer text-left"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setQuestion('')}
              className="text-xs text-[#5C6E64] hover:text-[#163326] cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#163326] hover:bg-[#1D4233] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E2D8C3]" />
                  <span>{mode === 'offline_extractive' ? 'Searching Local Notes...' : 'Executing Bounded Loop...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#E2D8C3]" />
                  <span>Run Research Assistant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Assistant Execution Error</span>
          </div>
          <p className="leading-relaxed">{error}</p>
          <p className="text-[11px] text-rose-700">
            Tip: Switch to &ldquo;Offline Extractive Demo&rdquo; to test without any external API calls or quota requirements.
          </p>
        </div>
      )}

      {/* Grounded Synthesis Answer Card */}
      {session && (
        <div className="p-5 bg-white border border-[#E6E1D8] rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#E6E1D8] pb-3">
            <div>
              <h3 className="text-sm font-serif font-bold text-[#163326]">
                Synthesized Grounded Answer
              </h3>
              <p className="text-xs text-[#5C6E64]">
                Strictly grounded on retrieved notes · Every claim cited with [document_id]
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenExport}
              className="px-2.5 py-1 text-xs text-[#163326] bg-[#FAF8F5] border border-[#D5CEC2] hover:bg-[#F0EBE1] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <FileDown className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>

          {/* Answer Text with Clickable Citations */}
          <div className="p-4 bg-[#FAF8F5] border border-[#ECE6DB] rounded-lg">
            {renderAnswerWithInteractiveCitations(session.answer)}
          </div>

          {/* Citation Verification Ribbon */}
          <div className="p-3 bg-[#F4F0E8] border border-[#DCD5C9] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {session.citationReport.isFullyGrounded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                )}
                <span className="text-xs font-semibold text-[#163326]">
                  Citation Verification Report
                </span>
              </div>

              <span className="text-xs font-mono font-medium text-[#4D6054]">
                {session.citationReport.validCitations.length} / {session.citationReport.citedIds.length} Citations Grounded
              </span>
            </div>

            {/* Citations status list */}
            <div className="text-xs text-[#4D6054] space-y-1 font-mono text-[11px]">
              <div>
                <span className="text-[#5C6E64]">Retrieved in search:</span>{' '}
                {session.citationReport.retrievedDocIds.length > 0 ? (
                  session.citationReport.retrievedDocIds.map((id) => (
                    <span key={id} className="text-[#163326] font-semibold mr-1.5">
                      [{id}]
                    </span>
                  ))
                ) : (
                  <span className="text-stone-500">None</span>
                )}
              </div>

              {session.citationReport.ungroundedCitations.length > 0 && (
                <div className="text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-md">
                  <strong>Warning - Ungrounded Citations Detected:</strong> The response cited IDs that were never retrieved: {session.citationReport.ungroundedCitations.map(id => `[${id}]`).join(', ')}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Retrieved Evidence Cards Section */}
      <div id="evidence-section">
        <EvidenceCards
          evidenceCards={session?.evidenceCards || []}
          activeCitationId={activeCitationId}
          onSelectCard={(id) => setActiveCitationId(id)}
        />
      </div>

      {/* Execution Trace Inspector (Action Log) */}
      <div id="trace-section">
        <ActionLog
          steps={session?.steps || []}
          totalLatencyMs={session?.totalLatencyMs}
          totalSteps={session?.totalSteps}
          maxSteps={8}
        />
      </div>
    </div>
  );
};
