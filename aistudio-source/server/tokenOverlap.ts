/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PaperNote, SearchResult, CitationVerification } from '../src/types/research.ts';

/**
 * Common English stop words to skip unless the query exclusively consists of them.
 */
const COMMON_STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
  'with', 'as', 'by', 'that', 'this', 'it', 'from', 'or', 'are', 'was', 'were',
  'be', 'been', 'has', 'have', 'had', 'do', 'does', 'did', 'can', 'could', 'should',
  'would', 'what', 'how', 'when', 'where', 'who', 'why'
]);

/**
 * Tokenize a text string into normalized lowercase whole-word tokens.
 */
export function tokenizeWholeWords(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const matches = text.toLowerCase().match(/\b[a-z0-9_\-]{2,}\b/g);
  return matches || [];
}

/**
 * Executes whole-token overlap ranking on a collection of paper notes.
 * Ranks notes by number of matching unique query tokens and total occurrences.
 */
export function rankNotesByWholeTokenOverlap(
  notes: PaperNote[],
  query: string,
  limit: number = 5
): SearchResult[] {
  if (!query || typeof query !== 'string' || notes.length === 0) {
    return [];
  }

  // 1. Extract query tokens
  const rawTokens = tokenizeWholeWords(query);
  if (rawTokens.length === 0) return [];

  // Filter stop words unless all words are stop words
  const nonStopTokens = rawTokens.filter(t => !COMMON_STOP_WORDS.has(t));
  const queryTokens = nonStopTokens.length > 0 ? nonStopTokens : rawTokens;
  const uniqueQueryTokens = Array.from(new Set(queryTokens));

  const results: SearchResult[] = [];

  for (const note of notes) {
    const textTokens = tokenizeWholeWords(note.text);
    const titleTokens = tokenizeWholeWords(note.title);
    const authorTokens = note.authors ? tokenizeWholeWords(note.authors) : [];
    const idTokens = tokenizeWholeWords(note.id);

    // Combine tokens with weighting
    const tokenFrequency = new Map<string, number>();
    for (const t of textTokens) tokenFrequency.set(t, (tokenFrequency.get(t) || 0) + 1);
    for (const t of titleTokens) tokenFrequency.set(t, (tokenFrequency.get(t) || 0) + 2); // Title matches weighted 2x
    for (const t of authorTokens) tokenFrequency.set(t, (tokenFrequency.get(t) || 0) + 1);
    for (const t of idTokens) tokenFrequency.set(t, (tokenFrequency.get(t) || 0) + 2);

    const matchedTokens: string[] = [];
    let occurrenceScore = 0;

    for (const qToken of uniqueQueryTokens) {
      if (tokenFrequency.has(qToken)) {
        matchedTokens.push(qToken);
        occurrenceScore += tokenFrequency.get(qToken)!;
      }
    }

    if (matchedTokens.length > 0) {
      // Primary score: number of distinct query tokens matched (breadth of coverage)
      // Secondary score: total occurrences
      const overlapScore = (matchedTokens.length * 100) + occurrenceScore;

      results.push({
        id: note.id,
        title: note.title,
        authors: note.authors,
        year: note.year,
        text: note.text,
        overlap_score: overlapScore,
        matched_tokens: matchedTokens
      });
    }
  }

  // Sort descending by overlap score
  results.sort((a, b) => b.overlap_score - a.overlap_score);

  const boundedLimit = Math.min(Math.max(1, limit || 5), 10);
  return results.slice(0, boundedLimit);
}

/**
 * Validates citations in the format [document_id] in synthesized text.
 * Checks against the set of document IDs actually retrieved during the tool loop.
 */
export function validateCitations(
  synthesizedText: string,
  retrievedDocIds: Set<string>,
  allNotesCount: number = 0
): CitationVerification {
  // Regex to match [document_id]
  const citationRegex = /\[([a-zA-Z0-9_\-]+)\]/g;
  const citedIds: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(synthesizedText)) !== null) {
    const id = match[1];
    if (!citedIds.includes(id)) {
      citedIds.push(id);
    }
  }

  const validCitations: string[] = [];
  const ungroundedCitations: string[] = [];

  for (const id of citedIds) {
    if (retrievedDocIds.has(id)) {
      validCitations.push(id);
    } else {
      ungroundedCitations.push(id);
    }
  }

  return {
    citedIds,
    validCitations,
    ungroundedCitations,
    isFullyGrounded: ungroundedCitations.length === 0,
    retrievedDocIds: Array.from(retrievedDocIds),
    allNotesCount
  };
}
