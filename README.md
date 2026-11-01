# 1MS25IS019 - Assignment 1

PaperTrail: a research-paper assistant with few-shot prompting, document
retrieval, cited answers, and JSON/text export.

## AI Studio project and deliverables

[Open the AI Studio project](https://aistudio.google.com/apps/a86d88c2-5d59-4bc6-862d-be6e6cc22273).
The original AI Studio React/Node implementation is included in
[`aistudio-source/`](aistudio-source/), with the original server modules, React
components, data, types, configuration and Bun lockfile. These 25 source files
were copied directly from the saved AI Studio project without rewriting their
code. `aistudio-source-manifest.json` records their hashes and validation.

This repository also includes the prompts, configuration and live exports, plus
a separate dependency-free Python/HTML/JavaScript implementation at the root.

### Run the original AI Studio app

```bash
cd aistudio-source
npm install
npm run dev
```

Open http://localhost:3000. Offline mode requires no key. For live Gemini mode,
set `GEMINI_API_KEY` in your environment; `.env.example` contains placeholders
only. Select `gemini-3.1-flash-lite`, the model verified in the live run. Do not
commit real keys. Build the original frontend with `npm run build`.

On 2026-11-01 the exported original project passed its production build and
local HTTP checks for retrieval, no matches and invalid input. The earlier
live AI Studio results are preserved in the JSON/text reports below.

- `ai_studio_build_prompt.txt`: app-building prompt.
- `research_agent_prompt.txt`: system prompt and two few-shot examples.
- `research_agent_config.json`: portable project configuration.
- `ai_studio_live_report.json` and `.txt`: actual live app exports.
- `sample_papers.json`: five fictional teaching notes.
- `agent_core.py`: search tool and bounded Gemini tool loop.

## Run the local app

Requires Python 3.10 or newer, with no extra packages:

```bash
python server.py
```

Open http://127.0.0.1:8765. Offline mode returns matching passages without
calling a model. For live mode, set `GOOGLE_API_KEY` or `GEMINI_API_KEY` in your
server environment before starting. The default model is
`gemini-3.1-flash-lite`; override it with `GEMINI_MODEL` if needed. Live mode
sends the question and retrieved notes to Gemini. Keep keys out of source files.

The app accepts 1-30 notes as a JSON object with stable source IDs. It retrieves
by whole-token overlap, returns evidence cards and a tool-action trace, and
exports reports as JSON or text. The live loop validates tool names and arguments,
forces a search before answering, and stops after at most eight steps.

## Verification

```bash
python -m unittest test_agents -v
```

All 11 tests passed. The AI Studio app passed offline retrieval, a deliberate
no-match question and a live Gemini request on 2026-10-30. The live export records
`gemini-3.1-flash-lite`, one retrieved document and a two-step trace. Initial
requests to `gemini-3.8-flash` returned HTTP 503; the fallback succeeded.

Samples are fictional teaching notes, not published papers. Citation-ID checks
do not prove semantic support for every claim; inspect the source passages.
Model access and quota vary by account. AI Studio project access follows the
owner's sharing settings.

## References

The tool-loop exercise follows the course [agent-loop starter](https://github.com/aditi-govindu/gemini-recipe-agent/blob/main/agent_loop_demo.ipynb).
See the [Gemini API](https://ai.google.dev/api/generate-content),
[function-calling guide](https://ai.google.dev/gemini-api/docs/function-calling)
and [model catalog](https://ai.google.dev/gemini-api/docs/models).
