/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plus,
  FileCode,
  RotateCcw,
  Search,
  Edit2,
  Trash2,
  FileText,
  CheckCircle2,
  Info,
  GraduationCap,
} from 'lucide-react';
import { PaperNote } from '../types/research.ts';
import { countSentences } from '../data/defaultNotes.ts';

interface PaperCollectionProps {
  notes: PaperNote[];
  retrievedIds: Set<string>;
  onAddNote: () => void;
  onEditNote: (note: PaperNote) => void;
  onDeleteNote: (id: string) => void;
  onOpenJsonEditor: () => void;
  onResetDefaults: () => void;
}

export const PaperCollection: React.FC<PaperCollectionProps> = ({
  notes,
  retrievedIds,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onOpenJsonEditor,
  onResetDefaults,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredNotes = notes.filter((note) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      note.id.toLowerCase().includes(q) ||
      note.title.toLowerCase().includes(q) ||
      (note.authors && note.authors.toLowerCase().includes(q)) ||
      note.text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl shadow-xs overflow-hidden">
      {/* Column Header */}
      <div className="px-5 py-4 border-b border-[#E6E1D8] bg-[#F4F0E8]/70">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#163326] flex items-center justify-center text-[#E2D8C3]">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-serif font-bold text-[#163326] tracking-tight">
              Paper Collection
            </h2>
          </div>
          {/* Metadata counter */}
          <span className="text-xs font-mono font-medium text-[#4D6054]">
            {notes.length} / 30 Notes
          </span>
        </div>

        <p className="text-xs text-[#5C6E64] mb-3 leading-relaxed">
          Source documents indexed for whole-token overlap retrieval.
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddNote}
            disabled={notes.length >= 30}
            className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#163326] hover:bg-[#1D4233] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>

          <button
            type="button"
            onClick={onOpenJsonEditor}
            className="px-2.5 py-1.5 text-xs font-medium text-[#163326] bg-white border border-[#D5CEC2] hover:bg-stone-50 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileCode className="w-3.5 h-3.5 text-[#5C6E64]" />
            <span>Edit JSON</span>
          </button>

          <button
            type="button"
            onClick={onResetDefaults}
            title="Reset to 5 explicitly fictional research-method teaching notes (4 sentences each)"
            className="px-2.5 py-1.5 text-xs font-medium text-[#4D6054] hover:text-[#163326] hover:bg-[#163326]/5 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset 5 Fictional</span>
          </button>
        </div>

        {/* Filter search input */}
        <div className="relative mt-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#889B90]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by title, ID, or methodology..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DCD5C9] rounded-md focus:outline-none focus:ring-1 focus:ring-[#163326] text-[#163326] placeholder-[#889B90]"
          />
        </div>
      </div>

      {/* Permanent Collection Notice */}
      <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200/90 rounded-lg text-xs text-amber-950 flex items-start gap-2.5 shrink-0">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold block text-amber-900">Permanent Collection Notice:</span>
          All sample notes in this collection are fictional teaching examples designed to demonstrate research methodology, not published empirical papers.
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {filteredNotes.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6F8278]">
            {notes.length === 0 ? (
              <div className="space-y-2">
                <p>No paper notes in collection.</p>
                <button
                  type="button"
                  onClick={onResetDefaults}
                  className="text-xs font-semibold text-[#163326] underline cursor-pointer"
                >
                  Load 5 Fictional Method Notes
                </button>
              </div>
            ) : (
              <p>No notes matching &ldquo;{filterQuery}&rdquo;.</p>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const sentenceCount = countSentences(note.text);
            const isRetrieved = retrievedIds.has(note.id);
            const isTeachingSample = note.isTeachingNote || sentenceCount === 4;

            return (
              <div
                key={note.id}
                id={`collection-note-${note.id}`}
                className={`p-3.5 bg-white border rounded-lg transition-all ${
                  isRetrieved
                    ? 'border-[#163326] ring-1 ring-[#163326]/20 bg-[#FAF9F5]'
                    : 'border-[#E2DDCF] hover:border-[#C8BFB0]'
                }`}
              >
                {/* Mandatory Sample Notice Badge */}
                {isTeachingSample && (
                  <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Fictional teaching example — not a published paper</span>
                  </div>
                )}

                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-serif font-semibold text-[#163326] leading-snug break-words">
                      {note.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={() => onEditNote(note)}
                      title="Edit note"
                      className="p-1 text-[#6F8278] hover:text-[#163326] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      disabled={notes.length <= 1}
                      title={notes.length <= 1 ? "At least 1 note required" : "Delete note"}
                      className="p-1 text-[#889B90] hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Zero-pill metadata with typographic separators */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#5C6E64] mb-2 font-mono">
                  <span className="font-semibold text-[#163326]">[{note.id}]</span>
                  <span aria-hidden="true">·</span>
                  <span>{note.category || 'Methodology'}</span>
                  {note.year && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{note.year}</span>
                    </>
                  )}
                  {note.authors && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate max-w-[140px]">{note.authors}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className={sentenceCount === 4 ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                    {sentenceCount} {sentenceCount === 1 ? 'sentence' : 'sentences'}
                  </span>
                  {isRetrieved && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#163326] font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                        retrieved
                      </span>
                    </>
                  )}
                </div>

                {/* Untrusted Text Rendering (Safe plain text) */}
                <div className="p-2.5 bg-[#FAF8F5] border border-[#ECE6DB] rounded-md text-xs text-[#2C3A33] leading-relaxed select-text font-serif break-words">
                  {note.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-[#E6E1D8] bg-[#F4F0E8]/40 text-[11px] text-[#5C6E64] flex items-center justify-between">
        <span>Documents are untrusted: rendered strictly as text.</span>
        <span className="font-mono text-[#163326]">min 1 · max 30</span>
      </div>
    </div>
  );
};
