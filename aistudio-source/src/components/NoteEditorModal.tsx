/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { PaperNote } from '../types/research.ts';
import { countSentences } from '../data/defaultNotes.ts';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: PaperNote) => void;
  initialNote?: PaperNote | null;
  existingIds: string[];
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  existingIds,
}) => {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('Methodology');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialNote) {
      setId(initialNote.id);
      setTitle(initialNote.title);
      setAuthors(initialNote.authors || '');
      setYear(initialNote.year ? String(initialNote.year) : '');
      setCategory(initialNote.category || 'Methodology');
      setText(initialNote.text);
    } else {
      setId(`method_${Date.now().toString(36)}`);
      setTitle('');
      setAuthors('');
      setYear('');
      setCategory('Methodology');
      setText('');
    }
    setError(null);
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const sentenceCount = countSentences(text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = id.trim();
    if (!cleanId) {
      setError('A unique, stable note ID is required.');
      return;
    }

    // Check unique ID if new note or changed ID
    if (!initialNote || initialNote.id !== cleanId) {
      if (existingIds.includes(cleanId)) {
        setError(`A paper note with ID "${cleanId}" already exists. Source IDs must be unique.`);
        return;
      }
    }

    if (!title.trim()) {
      setError('Paper title is required.');
      return;
    }

    if (!text.trim()) {
      setError('Document text content is required.');
      return;
    }

    onSave({
      id: cleanId,
      title: title.trim(),
      authors: authors.trim() || undefined,
      year: year.trim() || undefined,
      category: category.trim() || 'Methodology',
      text: text.trim(),
      isTeachingNote: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border border-[#DCD5C9] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E1D8] bg-[#F4F0E8]">
          <div>
            <h3 className="text-base font-serif font-bold text-[#163326]">
              {initialNote ? 'Edit Paper Note' : 'Add New Paper Note'}
            </h3>
            <p className="text-xs text-[#5C6E64] mt-0.5">
              Specify stable source ID, citation metadata, and text content.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6F8278] hover:text-[#163326] p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#163326] mb-1">
                Stable Source ID <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. method_triangulation_2024"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163326]/20 focus:border-[#163326] text-[#163326]"
                required
              />
              <span className="text-[11px] text-[#6F8278] mt-1 block">
                Used in citations: [id]
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#163326] mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Methodology, Causal Inference"
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163326]/20 focus:border-[#163326] text-[#163326]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#163326] mb-1">
              Paper Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Longitudinal Benchmark Calibration in Machine Learning"
              className="w-full px-3 py-2 text-xs bg-white border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163326]/20 focus:border-[#163326] text-[#163326]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#163326] mb-1">
                Authors
              </label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="e.g. E. Vance & K. Chen"
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163326]/20 focus:border-[#163326] text-[#163326]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#163326] mb-1">
                Publication Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163326]/20 focus:border-[#163326] text-[#163326]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#163326]">
                Untrusted Document Text <span className="text-rose-600">*</span>
              </label>
              <div className="text-[11px] font-mono text-[#5C6E64] flex items-center gap-1.5">
                <span>Sentence count:</span>
                <span className={`font-semibold ${sentenceCount === 4 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {sentenceCount} {sentenceCount === 4 ? '(4 sentences - standard)' : ''}
                </span>
              </div>
            </div>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter paper abstract, findings, or methodology text. For teaching notes, exactly 4 sentences are recommended."
              className="w-full px-3 py-2 text-xs leading-relaxed bg-white border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163326]/20 focus:border-[#163326] text-[#163326] resize-y"
              required
            />
            <p className="text-[11px] text-[#6F8278] mt-1">
              Untrusted text is sanitized and indexed for whole-token overlap retrieval.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E1D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#4D6054] hover:text-[#163326] hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#163326] hover:bg-[#1D4233] rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialNote ? 'Save Changes' : 'Add Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
