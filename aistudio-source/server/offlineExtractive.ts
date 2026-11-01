/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PaperNote, SearchResult, ActionLogStep, QueryResponse } from '../src/types/research.ts';
import { rankNotesByWholeTokenOverlap, validateCitations, tokenizeWholeWords } from './tokenOverlap.ts';

/**
 * Deterministic, offline extractive assistant that requires zero API key.
 * Strictly adheres to PaperTrail system prompt and citation constraints.
 */
export function runOfflineExtractiveDemo(
  userQuestion: string,
  notes: PaperNote[]
): QueryResponse {
  const startTime = Date.now();
  const steps: ActionLogStep[] = [];
  const retrievedDocIds = new Set<string>();

  const step1Start = Date.now();

  // Step 1: Simulated Tool Call (first turn must search)
  const callId = `offline_call_1_${Date.now()}`;
  const searchResults = rankNotesByWholeTokenOverlap(notes, userQuestion, 5);

  for (const res of searchResults) {
    retrievedDocIds.add(res.id);
  }

  steps.push({
    step: 1,
    type: 'tool_call',
    timestamp: new Date().toISOString(),
    toolName: 'search_documents',
    callId,
    args: { query: userQuestion.trim(), limit: 5 },
    status: 'success',
    observation: {
      results: searchResults,
      retrieved_count: searchResults.length,
      message: searchResults.length > 0
        ? `Retrieved ${searchResults.length} documents matching whole-token overlap.`
        : `No matching documents found with whole-token overlap for: "${userQuestion.trim()}".`,
    },
    latencyMs: Date.now() - step1Start,
  });

  const step2Start = Date.now();
  let synthesizedAnswer = '';

  if (searchResults.length === 0) {
    // Grounded missing evidence response
    synthesizedAnswer = `The available documents do not report evidence regarding "${userQuestion.trim()}". A relevant document or measurement is missing from the collection.`;
  } else {
    // Extract sentences from matching documents that contain query tokens
    const queryTokens = new Set(tokenizeWholeWords(userQuestion));
    const evidenceExtracts: { id: string; sentence: string; matches: number }[] = [];

    for (const doc of searchResults) {
      // Split into sentences
      const sentences = doc.text.match(/[^.!?]+[.!?]+(\s|$)/g) || [doc.text];
      for (const s of sentences) {
        const sentenceTokens = tokenizeWholeWords(s);
        let matchCount = 0;
        for (const t of sentenceTokens) {
          if (queryTokens.has(t)) matchCount++;
        }
        if (matchCount > 0) {
          evidenceExtracts.push({
            id: doc.id,
            sentence: s.trim(),
            matches: matchCount,
          });
        }
      }
    }

    if (evidenceExtracts.length === 0) {
      // Top document has overlap in title or author, cite top document's first sentence
      const topDoc = searchResults[0];
      const firstSentence = (topDoc.text.match(/[^.!?]+[.!?]+(\s|$)/g) || [topDoc.text])[0].trim();
      synthesizedAnswer = `${firstSentence} [${topDoc.id}]. Additional specific findings for "${userQuestion.trim()}" are not reported in the available documents.`;
    } else {
      // Sort extracts by match count
      evidenceExtracts.sort((a, b) => b.matches - a.matches);

      // Group extracts by document ID
      const byDoc = new Map<string, string[]>();
      for (const ext of evidenceExtracts) {
        if (!byDoc.has(ext.id)) byDoc.set(ext.id, []);
        const list = byDoc.get(ext.id)!;
        if (list.length < 2 && !list.includes(ext.sentence)) {
          list.push(ext.sentence);
        }
      }

      const answerParts: string[] = [];
      for (const [docId, sentences] of byDoc.entries()) {
        const joined = sentences.join(' ');
        answerParts.push(`${joined} [${docId}]`);
      }

      if (byDoc.size > 1) {
        synthesizedAnswer = `${answerParts.join(' ')} Comparative evaluation reveals distinct methodological frameworks; a shared benchmark is missing.`;
      } else {
        synthesizedAnswer = answerParts.join(' ');
      }
    }
  }

  steps.push({
    step: 2,
    type: 'final_answer',
    timestamp: new Date().toISOString(),
    text: synthesizedAnswer,
    status: 'success',
    latencyMs: Date.now() - step2Start,
  });

  const citationReport = validateCitations(synthesizedAnswer, retrievedDocIds, notes.length);

  const totalLatencyMs = Date.now() - startTime;

  return {
    question: userQuestion,
    mode: 'offline_extractive',
    model: 'extractive-offline-engine',
    answer: synthesizedAnswer,
    steps,
    evidenceCards: searchResults,
    citationReport,
    totalSteps: steps.length,
    totalLatencyMs,
    isOfflineDemo: true,
  };
}
