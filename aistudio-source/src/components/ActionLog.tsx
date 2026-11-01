/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Terminal,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  KeyRound,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { ActionLogStep } from '../types/research.ts';

interface ActionLogProps {
  steps: ActionLogStep[];
  totalLatencyMs?: number;
  totalSteps?: number;
  maxSteps?: number;
}

export const ActionLog: React.FC<ActionLogProps> = ({
  steps,
  totalLatencyMs = 0,
  totalSteps = 0,
  maxSteps = 8,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  const toggleStep = (stepNum: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    steps.forEach((s) => (all[s.step] = true));
    setExpandedSteps(all);
  };

  const collapseAll = () => {
    setExpandedSteps({});
  };

  if (steps.length === 0) {
    return (
      <div className="p-6 bg-white border border-[#E6E1D8] rounded-xl text-center">
        <Activity className="w-8 h-8 text-[#A0B0A7] mx-auto mb-2" />
        <h4 className="text-sm font-serif font-semibold text-[#163326]">
          Execution Log Idle
        </h4>
        <p className="text-xs text-[#5C6E64] mt-1 max-w-sm mx-auto">
          The bounded loop trace will record each model turn, tool call, whitelist check, and observation here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with summary stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-[#E6E1D8] rounded-xl">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#163326]" />
          <h3 className="text-sm font-serif font-bold text-[#163326]">
            Action Log & Bounded Execution Trace
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#4D6054]">
          <span className="tabular-nums">
            {totalSteps || steps.length} / {maxSteps} Steps Max
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#5C6E64]" />
            {totalLatencyMs} ms
          </span>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={expandAll}
              className="text-[#163326] hover:underline cursor-pointer"
            >
              Expand All
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[#5C6E64] hover:underline cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-2.5">
        {steps.map((step) => {
          const isExpanded = Boolean(expandedSteps[step.step]);

          return (
            <div
              key={`${step.step}-${step.timestamp}`}
              className="bg-white border border-[#E6E1D8] rounded-xl overflow-hidden shadow-2xs"
            >
              {/* Step Header */}
              <button
                type="button"
                onClick={() => toggleStep(step.step)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 bg-[#FAF8F5] hover:bg-[#F4F0E8] text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#5C6E64] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#5C6E64] shrink-0" />
                  )}

                  <span className="font-mono text-xs font-bold text-[#FAF8F5] bg-[#163326] px-2 py-0.5 rounded">
                    Step {step.step}
                  </span>

                  <span className="text-xs font-semibold text-[#163326] truncate">
                    {step.type === 'tool_call' && (
                      <span>Tool Call: <code className="font-mono text-[#163326]">{step.toolName}</code></span>
                    )}
                    {step.type === 'final_answer' && (
                      <span>Synthesized Grounded Answer</span>
                    )}
                    {step.type === 'system_guard' && (
                      <span>System Guard & Validation</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                  {step.latencyMs !== undefined && (
                    <span className="text-[#6F8278] tabular-nums">
                      {step.latencyMs} ms
                    </span>
                  )}
                  {step.status === 'success' && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {step.status === 'warning' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {step.status === 'error' && (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
              </button>

              {/* Step Details Body */}
              {isExpanded && (
                <div className="p-4 space-y-3 border-t border-[#E6E1D8] text-xs">
                  {/* Call ID & Whitelist metadata */}
                  {step.callId && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#5C6E64]">
                      <span>Call ID: <code className="text-[#163326] font-semibold">{step.callId}</code></span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700">Tool Whitelisted: search_documents</span>
                      <span aria-hidden="true">·</span>
                      <span>Turn 1 Enforced</span>
                    </div>
                  )}

                  {/* Action Arguments */}

                  {/* Function Arguments */}
                  {step.args && (
                    <div>
                      <div className="font-semibold text-[#163326] mb-1">
                        Validated Input Arguments:
                      </div>
                      <pre className="p-2.5 bg-[#FAF8F5] border border-[#ECE6DB] rounded-md font-mono text-[11px] text-[#163326] overflow-x-auto">
                        {JSON.stringify(step.args, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Tool Observation / Response */}
                  {step.observation && (
                    <div>
                      <div className="font-semibold text-[#163326] mb-1 flex items-center justify-between">
                        <span>Tool Observation (Returned to Model):</span>
                        {typeof step.observation === 'object' && 'retrieved_count' in step.observation && (
                          <span className="font-mono text-[#4D6054]">
                            Retrieved: {step.observation.retrieved_count} docs
                          </span>
                        )}
                      </div>
                      <pre className="p-2.5 bg-[#FAF8F5] border border-[#ECE6DB] rounded-md font-mono text-[11px] text-[#2C3A33] max-h-48 overflow-y-auto">
                        {JSON.stringify(step.observation, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Text or Error Message */}
                  {step.text && (
                    <div>
                      <div className="font-semibold text-[#163326] mb-1">
                        Output Text / Guard Note:
                      </div>
                      <div className="p-2.5 bg-[#FAF8F5] border border-[#ECE6DB] rounded-md font-serif text-xs text-[#163326] leading-relaxed select-text">
                        {step.text}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
