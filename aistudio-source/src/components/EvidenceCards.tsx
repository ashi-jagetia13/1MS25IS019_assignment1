/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SearchResult } from '../types/research.ts';
import { Layers, BookmarkCheck, ExternalLink } from 'lucide-react';

interface EvidenceCardsProps {
  evidenceCards: SearchResult[];
  activeCitationId: string | null;
  onSelectCard?: (id: string) => void;
}

export const EvidenceCards: React.FC<EvidenceCardsProps> = ({
  evidenceCards,
  activeCitationId,
  onSelectCard,
}) => {
  if (evidenceCards.length === 0) {
    return (
      <div className="p-6 bg-white border border-[#E6E1D8] rounded-xl text-center">
        <Layers className="w-8 h-8 text-[#A0B0A7] mx-auto mb-2" />
        <h4 className="text-sm font-serif font-semibold text-[#163326]">
          No Evidence Retrieved Yet
        </h4>
        <p className="text-xs text-[#5C6E64] mt-1 max-w-sm mx-auto">
          Submit a question or execute a search query to inspect documents retrieved by the bounded loop.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="w-4 h-4 text-[#163326]" />
          <h3 className="text-sm font-serif font-bold text-[#163326]">
            Retrieved Evidence Cards ({evidenceCards.length})
          </h3>
        </div>
        <span className="text-xs text-[#5C6E64] font-mono">
          Ranked by whole-token overlap
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {evidenceCards.map((card, idx) => {
          const isHighlighted = activeCitationId === card.id;

          return (
            <div
              key={card.id}
              id={`evidence-card-${card.id}`}
              onClick={() => onSelectCard?.(card.id)}
              className={`p-4 bg-white border rounded-xl transition-all ${
                isHighlighted
                  ? 'border-[#163326] ring-2 ring-[#163326]/30 shadow-md bg-[#FAF9F5]'
                  : 'border-[#E6E1D8] hover:border-[#CCD8D1] shadow-xs'
              }`}
            >
              {/* Header with Rank and ID */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#FAF8F5] bg-[#163326] px-2 py-0.5 rounded">
                    Rank #{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#163326]">
                    [{card.id}]
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono tabular-nums text-[#163326] font-semibold">
                    Score: {card.overlap_score}
                  </div>
                  <div className="text-[10px] text-[#5C6E64] font-mono">
                    {card.matched_tokens.length} tokens matched
                  </div>
                </div>
              </div>

              {/* Fictional Teaching Example Badge */}
              <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded">
                <span>Fictional teaching example — not a published paper</span>
              </div>

              {/* Title & Metadata */}
              <h4 className="text-sm font-serif font-semibold text-[#163326] leading-snug mb-1">
                {card.title}
              </h4>

              {(card.year || card.authors) && (
                <div className="text-xs text-[#5C6E64] font-mono mb-2.5">
                  {card.year && <span>{card.year}</span>}
                  {card.year && card.authors && <span className="mx-1.5" aria-hidden="true">·</span>}
                  {card.authors && <span>{card.authors}</span>}
                </div>
              )}

              {/* Matched Tokens Bar */}
              {card.matched_tokens.length > 0 && (
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-[#5C6E64] font-medium">Matched tokens:</span>
                  {card.matched_tokens.map((token, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-1.5 py-0.5 font-mono text-[11px] bg-[#EAE5DA] text-[#163326] rounded-xs font-medium"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              )}

              {/* Document Text Body */}
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE6DB] rounded-lg text-xs leading-relaxed text-[#2C3A33] font-serif select-text">
                {card.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
