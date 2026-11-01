/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, AlertCircle, FileCode } from 'lucide-react';
import { PaperNote } from '../types/research.ts';
import { validateNotesCollection, DEFAULT_TEACHING_NOTES } from '../data/defaultNotes.ts';

interface JsonCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (notes: PaperNote[]) => void;
  currentNotes: PaperNote[];
}

export const JsonCollectionModal: React.FC<JsonCollectionModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentNotes,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(currentNotes, null, 2));
      setError(null);
    }
  }, [isOpen, currentNotes]);

  if (!isOpen) return null;

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(`JSON Parse Error: ${e.message}`);
    }
  };

  const handleResetDefaults = () => {
    setJsonText(JSON.stringify(DEFAULT_TEACHING_NOTES, null, 2));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateNotesCollection(parsed);
      if (!validation.valid || !validation.cleanNotes) {
        setError(validation.error || 'Invalid collection schema.');
        return;
      }

      onApply(validation.cleanNotes);
      onClose();
    } catch (e: any) {
      setError(`JSON Syntax Error: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border border-[#DCD5C9] rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E1D8] bg-[#F4F0E8]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#163326] text-[#E2D8C3] flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#163326]">
                Paper Collection JSON Editor
              </h3>
              <p className="text-xs text-[#5C6E64]">
                Accepts 1 to 30 paper note objects with stable source IDs.
              </p>
            </div>
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

          <div className="flex items-center justify-between text-xs text-[#5C6E64]">
            <span>Expected format: Array of objects with `id`, `title`, `authors`, `year`, `text`</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFormat}
                className="px-2.5 py-1 text-xs font-mono bg-white border border-[#D5CEC2] hover:bg-stone-50 rounded-md transition-colors cursor-pointer"
              >
                Format JSON
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-2.5 py-1 text-xs text-[#163326] hover:bg-[#163326]/10 rounded-md transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset 5 Fictional Notes</span>
              </button>
            </div>
          </div>

          <textarea
            rows={14}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full p-3 font-mono text-xs leading-relaxed bg-[#FFFFFF] border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163326]/20 focus:border-[#163326] text-[#163326] resize-y select-text"
            required
            spellCheck={false}
          />

          <div className="flex items-center justify-between pt-4 border-t border-[#E6E1D8]">
            <span className="text-xs text-[#6F8278]">
              Constraint: 1 – 30 notes · Unique source IDs
            </span>
            <div className="flex items-center gap-3">
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
                <span>Apply Collection</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
