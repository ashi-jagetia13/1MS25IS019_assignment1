/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { validateNotesCollection } from './src/data/defaultNotes.ts';
import { runGeminiBoundedLoop } from './server/geminiLoop.ts';
import { runOfflineExtractiveDemo } from './server/offlineExtractive.ts';
import { rankNotesByWholeTokenOverlap } from './server/tokenOverlap.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// 1. Config Endpoint (Safe, no secrets exposed)
app.get('/api/config', (_req, res) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  res.json({
    hasApiKey,
    defaultModel: 'gemini-3.8-flash',
    availableModels: [
      'gemini-3.8-flash',
      'gemini-4-argon',
      'gemini-3.1-flash-lite',
    ],
    maxNotes: 30,
    maxSteps: 8,
  });
});

// 2. Direct Search Endpoint (For quick verification & testing)
app.post('/api/search', (req, res) => {
  try {
    const { query, notes, limit } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required and must be a string.' });
    }
    const validation = validateNotesCollection(notes);
    if (!validation.valid || !validation.cleanNotes) {
      return res.status(400).json({ error: validation.error });
    }

    const results = rankNotesByWholeTokenOverlap(validation.cleanNotes, query, limit || 5);
    res.json({
      query,
      results,
      count: results.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search execution failed.' });
  }
});

// 3. Query Assistant Loop Endpoint
app.post('/api/query', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { question, notes, mode = 'offline_extractive', model = 'gemini-3.8-flash' } = req.body || {};

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question must be a non-empty string.' });
    }

    const validation = validateNotesCollection(notes);
    if (!validation.valid || !validation.cleanNotes) {
      return res.status(400).json({ error: validation.error || 'Invalid notes collection.' });
    }

    const cleanNotes = validation.cleanNotes;
    const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

    // Deterministic offline extractive mode (finishes immediately, no external calls)
    if (mode === 'offline_extractive' || !hasApiKey) {
      try {
        const result = runOfflineExtractiveDemo(question.trim(), cleanNotes);
        return res.status(200).json(result);
      } catch (offlineErr: any) {
        console.error('Offline extraction error:', offlineErr);
        return res.status(500).json({ error: `Offline extraction failed: ${offlineErr.message || 'Unknown error'}` });
      }
    }

    // Live Gemini mode with bounded function calling loop
    try {
      const result = await runGeminiBoundedLoop(question.trim(), cleanNotes, model);
      return res.status(200).json(result);
    } catch (apiErr: any) {
      console.error('Live Gemini loop error:', apiErr);
      return res.status(502).json({
        error: `Gemini loop failed: ${apiErr.message || 'API error'}. You can switch to Offline Extractive Mode to test without API calls.`,
      });
    }
  } catch (err: any) {
    console.error('Server error on /api/query:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Vite or Static Production Serve
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`PaperTrail server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
