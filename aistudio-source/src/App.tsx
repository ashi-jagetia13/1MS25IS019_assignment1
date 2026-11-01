/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PaperNote, QueryResponse, ServerConfig } from './types/research.ts';
import { DEFAULT_TEACHING_NOTES, validateNotesCollection } from './data/defaultNotes.ts';
import { Header } from './components/Header.tsx';
import { PaperCollection } from './components/PaperCollection.tsx';
import { ResearchDesk } from './components/ResearchDesk.tsx';
import { NoteEditorModal } from './components/NoteEditorModal.tsx';
import { JsonCollectionModal } from './components/JsonCollectionModal.tsx';
import { ExportModal } from './components/ExportModal.tsx';

const LOCAL_STORAGE_KEY = 'papertrail_notes_v2';

export default function App() {
  const [notes, setNotes] = useState<PaperNote[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const val = validateNotesCollection(parsed);
        if (val.valid && val.cleanNotes) return val.cleanNotes;
      }
    } catch (e) {
      console.warn('Could not parse saved notes, reverting to defaults:', e);
    }
    return DEFAULT_TEACHING_NOTES;
  });

  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    hasApiKey: false,
    defaultModel: 'gemini-3.8-flash',
    availableModels: ['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-flash-lite'],
    maxNotes: 30,
    maxSteps: 8,
  });

  const [mode, setMode] = useState<'live_gemini' | 'offline_extractive'>('offline_extractive');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [question, setQuestion] = useState<string>('');
  const [session, setSession] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('desk');

  // Modals state
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PaperNote | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fetch server config
  useEffect(() => {
    fetch('/api/config')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ServerConfig) => {
        setServerConfig(data);
        if (data.defaultModel) setSelectedModel(data.defaultModel);
      })
      .catch((err) => {
        console.warn('Server config unreachable:', err);
      });
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [notes]);

  // Execute research query with AbortController timeout and robust JSON parsing
  const handleExecuteQuery = async (queryText?: string, overrideMode?: 'live_gemini' | 'offline_extractive') => {
    const activeQuestion = (queryText !== undefined ? queryText : question).trim();
    if (!activeQuestion || loading) return;

    const queryMode = overrideMode || mode;
    setLoading(true);
    setError(null);
    setActiveCitationId(null);

    // Timeout: 8 seconds for offline mode (deterministic & immediate), 30 seconds for live Gemini
    const timeoutMs = queryMode === 'offline_extractive' ? 8000 : 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          question: activeQuestion,
          notes,
          mode: queryMode,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      const responseText = await response.text();
      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(
          `Server returned invalid JSON (${response.status} ${response.statusText}): ${responseText.slice(0, 150) || 'Empty response'}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || `Server error (${response.status} ${response.statusText}): ${JSON.stringify(data)}`
        );
      }

      setSession(data);
    } catch (err: any) {
      console.error('Query execution error:', err);
      if (err.name === 'AbortError') {
        setError(
          `Query timed out after ${timeoutMs / 1000}s. The ${queryMode === 'offline_extractive' ? 'offline' : 'live'} search took too long to complete.`
        );
      } else {
        setError(err.message || 'An unexpected error occurred during query execution.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Add or update note
  const handleSaveNote = (newNote: PaperNote) => {
    setNotes((prev) => {
      const index = prev.findIndex((n) => n.id === newNote.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = newNote;
        return copy;
      } else {
        if (prev.length >= 30) return prev;
        return [newNote, ...prev];
      }
    });
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleResetDefaults = () => {
    setNotes(DEFAULT_TEACHING_NOTES);
  };

  // Run test presets
  const handleRunPreset = (presetType: string) => {
    let q = '';
    switch (presetType) {
      case 'retrieval':
        q = 'How does triangulation establish construct validity, and what are its operational limitations?';
        break;
      case 'no_matches':
        q = 'What are the superconducting qubit coherence times at 15 millikelvin?';
        break;
      case 'method_comparison':
        q = 'How do randomized controlled trials and synthetic controls handle counterfactuals and confounding?';
        break;
      case 'loop_boundary':
        q = 'Compare theoretical saturation safeguards in grounded theory against cryptographic masking in randomized controlled trials.';
        break;
      default:
        return;
    }
    setQuestion(q);
    handleExecuteQuery(q);
  };

  const retrievedIdsSet = new Set(session?.citationReport.retrievedDocIds || []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A2621] flex flex-col font-sans selection:bg-[#163326]/15">
      {/* 3-Zone Header Contract */}
      <Header
        mode={mode}
        hasApiKey={serverConfig.hasApiKey}
        onNewQuery={() => {
          setSession(null);
          setError(null);
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        activeSection={activeSection}
        setActiveSection={(s) => {
          setActiveSection(s);
          if (s === 'evidence') {
            document.getElementById('evidence-section')?.scrollIntoView({ behavior: 'smooth' });
          } else if (s === 'trace') {
            document.getElementById('trace-section')?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Main Workspace Stage: Ivory/Forest-Green Two-Column Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Editable Paper Collection (4-5 cols) */}
          <div className="lg:col-span-5 h-[calc(100vh-8.5rem)] sticky top-20">
            <PaperCollection
              notes={notes}
              retrievedIds={retrievedIdsSet}
              onAddNote={() => {
                setEditingNote(null);
                setIsNoteEditorOpen(true);
              }}
              onEditNote={(note) => {
                setEditingNote(note);
                setIsNoteEditorOpen(true);
              }}
              onDeleteNote={handleDeleteNote}
              onOpenJsonEditor={() => setIsJsonModalOpen(true)}
              onResetDefaults={handleResetDefaults}
            />
          </div>

          {/* Right Column: Research Desk (7 cols) */}
          <div className="lg:col-span-7 min-h-[calc(100vh-8.5rem)]">
            <ResearchDesk
              session={session}
              loading={loading}
              error={error}
              mode={mode}
              setMode={setMode}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              availableModels={serverConfig.availableModels}
              hasApiKey={serverConfig.hasApiKey}
              question={question}
              setQuestion={setQuestion}
              onSubmitQuery={(q) => handleExecuteQuery(q)}
              onOpenExport={() => setIsExportModalOpen(true)}
              activeCitationId={activeCitationId}
              setActiveCitationId={setActiveCitationId}
              onRunPreset={handleRunPreset}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <NoteEditorModal
        isOpen={isNoteEditorOpen}
        onClose={() => setIsNoteEditorOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
        existingIds={notes.map((n) => n.id)}
      />

      <JsonCollectionModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onApply={(newNotes) => setNotes(newNotes)}
        currentNotes={notes}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sessionData={session}
        currentNotes={notes}
      />
    </div>
  );
}
