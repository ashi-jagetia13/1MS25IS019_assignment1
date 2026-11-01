/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PaperNote } from '../types/research.ts';

/**
 * 5 Explicitly Fictional Research-Method Teaching Notes.
 * Each note has exactly 4 sentences, stable source IDs, focuses purely on methodology,
 * and contains zero fabricated authors, zero publication years, and zero numerical empirical claims.
 */
export const DEFAULT_TEACHING_NOTES: PaperNote[] = [
  {
    id: "method_triangulation",
    title: "Triangulation and Cross-Modal Convergence in Behavioral Epistemology",
    category: "Methodology",
    isTeachingNote: true,
    text: "Triangulation combines qualitative interviews, observational telemetry, and quantitative survey instruments to cross-validate social behavioral phenomena. Researchers establish construct validity by demanding convergent evidence across at least two independent empirical modalities before accepting a primary hypothesis. The primary operational limitation lies in divergent instrument sensitivity, where high-resolution logs reveal micro-fluctuations that self-reported survey scales routinely miss. Investigators must pre-register divergence arbitration protocols to avoid post-hoc justification when conflicting observations emerge."
  },
  {
    id: "method_rct_blinding",
    title: "Cryptographic Masking and Expectancy Bias in Non-Pharmacological Trials",
    category: "Clinical & Behavioral Trials",
    isTeachingNote: true,
    text: "Double-blind randomized controlled trials minimize allocation and observer bias through automated cryptographic treatment assignment and masked outcome adjudications. In educational and behavioral interventions, complete blinding remains challenging because participants can often deduce whether they belong to experimental or control cohorts. Active sham comparators and objective performance metrics provide partial mitigation against expectancy artifacts in non-pharmacological settings. Methodologists emphasize that failure to maintain blinding introduces systematic performance bias that distorts comparative intervention outcomes."
  },
  {
    id: "method_synthetic_control",
    title: "Convex Weighting and Counterfactual Permutations in Policy Shock Estimation",
    category: "Econometrics & Causal Inference",
    isTeachingNote: true,
    text: "Synthetic control methodology evaluates policy impacts by constructing a convex weighted combination of untreated comparative units to mimic the counterfactual trajectory of a treated entity. The estimator requires extensive pre-intervention time series data to demonstrate that the weighted synthetic peer tracked the target unit accurately prior to shock exposure. Confounding arises when idiosyncratic shocks hit donor pool members during the post-treatment window, corrupting the estimated counterfactual trajectory. Placebo permutation tests across all donor candidates must be conducted to establish whether the observed effect size exceeds chance distribution thresholds."
  },
  {
    id: "method_grounded_theory",
    title: "Theoretical Saturation and Reflexivity Safeguards in Inductive Fieldwork",
    category: "Qualitative Methods",
    isTeachingNote: true,
    text: "Constructivist grounded theory employs iterative inductive coding and continuous theoretical sampling to derive substantive conceptual models directly from empirical participant narratives. Rather than testing pre-existing deductive hypotheses, researchers pursue category saturation until incremental interview rounds yield zero novel thematic dimensions. A major vulnerability is researcher reflexivity bias, wherein analysts inadvertently project personal epistemological assumptions onto unstructured field transcripts. Peer debriefing panels and transparent coding audit trails serve as necessary methodological safeguards against idiosyncratic conceptual drift."
  },
  {
    id: "method_benchmark_drift",
    title: "Longitudinal Decay and Leakage Auditing in Computational Evaluation Suites",
    category: "AI & Computational Benchmarking",
    isTeachingNote: true,
    text: "Longitudinal benchmark calibration quantifies metric degradation and data contamination across standard academic machine-learning evaluation suites over multi-year cycles. Models evaluated on static leaderboards exhibit synthetic score inflation as training corpora inadvertently ingest leaked test splits or test-adjacent syntaxes. Dynamic canary token auditing and periodically refreshed private test distributions reveal that true generalizability lags published state-of-the-art claims by substantial margins. Reproducibility guidelines strongly advocate for isolated holdout validation sets administered strictly by independent third-party audit repositories."
  }
];

/**
 * Counts sentences in a text block based on punctuation terminators (.!?).
 */
export function countSentences(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  const sentences = text.trim().match(/[^.!?]+[.!?]+(\s|$)/g);
  return sentences ? sentences.length : (text.trim().length > 0 ? 1 : 0);
}

/**
 * Validates a collection of notes: must be between 1 and 30 items with valid stable IDs.
 */
export function validateNotesCollection(notes: unknown): { valid: boolean; error?: string; cleanNotes?: PaperNote[] } {
  if (!Array.isArray(notes)) {
    return { valid: false, error: "Notes collection must be an array of paper note objects." };
  }

  if (notes.length < 1 || notes.length > 30) {
    return { valid: false, error: `Paper collection must contain between 1 and 30 notes (received ${notes.length}).` };
  }

  const seenIds = new Set<string>();
  const cleanNotes: PaperNote[] = [];

  for (let i = 0; i < notes.length; i++) {
    const item = notes[i];
    if (!item || typeof item !== 'object') {
      return { valid: false, error: `Item at index ${i} is not a valid object.` };
    }

    const id = String(item.id || '').trim();
    if (!id) {
      return { valid: false, error: `Item at index ${i} is missing a required stable 'id'.` };
    }
    if (seenIds.has(id)) {
      return { valid: false, error: `Duplicate note ID detected: '${id}'. IDs must be unique.` };
    }
    seenIds.add(id);

    const title = String(item.title || 'Untitled Note').trim();
    const authors = item.authors ? String(item.authors).trim() : undefined;
    const year = item.year ? String(item.year).trim() : undefined;
    const text = String(item.text || '').trim();

    cleanNotes.push({
      id,
      title,
      authors,
      year,
      text,
      category: item.category ? String(item.category).trim() : 'Methodology',
      isTeachingNote: item.isTeachingNote !== undefined ? Boolean(item.isTeachingNote) : countSentences(text) === 4
    });
  }

  return { valid: true, cleanNotes };
}
