# 1MS25IS019 - Assignment 1

PaperTrail: a research-paper assistant with few-shot prompting, document
retrieval, cited answers, and JSON/text export.

## AI Studio project and deliverables

[Open the AI Studio project](https://aistudio.google.com/apps/a86d88c2-5d59-4bc6-862d-be6e6cc22273).
The project uses React and Node. This repository includes its prompt,
configuration and live exports, plus a separate local implementation using
Python, HTML and JavaScript.

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
