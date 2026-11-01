/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PaperNote {
  id: string; // Stable source ID e.g. "method_triangulation"
  title: string;
  authors?: string; // Omitted for fictional teaching samples
  year?: number | string; // Omitted for fictional teaching samples
  text: string; // Untrusted paper content (4 sentences in teaching notes)
  category?: string;
  isTeachingNote?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  authors?: string;
  year?: number | string;
  text: string;
  overlap_score: number;
  matched_tokens: string[];
}

export interface ActionLogStep {
  step: number;
  type: 'tool_call' | 'tool_observation' | 'final_answer' | 'system_guard';
  timestamp: string;
  toolName?: string;
  callId?: string;
  args?: Record<string, unknown>;
  observation?: {
    results?: SearchResult[];
    retrieved_count?: number;
    message?: string;
    raw?: unknown;
  } | string;
  text?: string;
  status: 'success' | 'warning' | 'error' | 'info';
  latencyMs?: number;
}

export interface CitationVerification {
  citedIds: string[];
  validCitations: string[];
  ungroundedCitations: string[];
  isFullyGrounded: boolean;
  retrievedDocIds: string[];
  allNotesCount: number;
}

export interface QueryRequest {
  question: string;
  notes: PaperNote[];
  mode?: 'live_gemini' | 'offline_extractive';
  model?: string;
}

export interface QueryResponse {
  question: string;
  mode: 'live_gemini' | 'offline_extractive';
  model: string;
  answer: string;
  steps: ActionLogStep[];
  evidenceCards: SearchResult[];
  citationReport: CitationVerification;
  totalSteps: number;
  totalLatencyMs: number;
  error?: string;
  isOfflineDemo?: boolean;
}

export interface ServerConfig {
  hasApiKey: boolean;
  defaultModel: string;
  availableModels: string[];
  maxNotes: number;
  maxSteps: number;
}
