'use strict';
const el = id => document.getElementById(id);
let documents = {}, result = null, busy = false;
function renderPapers() {
  el('count').textContent = `${Object.keys(documents).length} sources`;
  el('papers').replaceChildren();
  Object.entries(documents).forEach(([id, text]) => {
    const card = document.createElement('div'); card.className = 'paper';
    const title = document.createElement('strong'); title.textContent = id.replaceAll('_', ' ');
    const preview = document.createElement('p'); preview.textContent = text.slice(0, 130) + (text.length > 130 ? '…' : '');
    card.append(title, preview); el('papers').append(card);
  });
  el('documents').value = JSON.stringify(documents, null, 2);
  result = null; el('result').hidden = true;
}
function parseCollection() {
  const data = JSON.parse(el('documents').value);
  if (!data || Array.isArray(data) || typeof data !== 'object' || Object.keys(data).length < 1 || Object.keys(data).length > 30) throw new Error('Use a JSON object with 1-30 documents.');
  for (const [id, text] of Object.entries(data)) {
    if (!/^[A-Za-z0-9_-]{1,60}$/.test(id) || typeof text !== 'string' || !text.trim() || text.length > 16000) throw new Error('Use valid source IDs and nonempty text of up to 16000 characters.');
  }
  return data;
}
async function loadSamples() {
  try { const response = await fetch('/documents'); if (!response.ok) throw new Error('Cannot load sample documents.'); documents = await response.json(); renderPapers(); el('collection-status').textContent = ''; }
  catch (error) { el('collection-status').textContent = error.message; }
}
el('apply').onclick = () => {try { documents = parseCollection(); renderPapers(); el('collection-status').textContent = 'Collection applied.'; } catch (error) {el('collection-status').textContent = error.message;} };
el('reset').onclick = loadSamples;
document.querySelectorAll('[data-question]').forEach(button => button.onclick = () => {el('question').value = button.dataset.question; el('question').focus();});
el('ask').onclick = async () => {
  if (busy) return;
  result = null; el('result').hidden = true;
  try {
    const collection = parseCollection();
    if (!el('question').value.trim()) throw new Error('Enter a research question.');
    busy = true; el('ask').disabled = true; el('status').textContent = 'Searching the collection…';
    const response = await fetch('/ask', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question: el('question').value, documents: collection, mode: el('mode').value})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    documents = collection; renderPapers();
    result = {...data, question: el('question').value, created_at: new Date().toISOString()};
    el('result-mode').textContent = `${data.mode} / ${data.status}`;
    el('answer').textContent = data.answer;
    el('evidence').replaceChildren();
    data.sources.forEach(source => {
      const card = document.createElement('div'); card.className = 'evidence';
      const title = document.createElement('strong'); title.textContent = `[${source.source}]`;
      const text = document.createElement('p'); text.textContent = source.text;
      card.append(title, text); el('evidence').append(card);
    });
    el('trace').replaceChildren(); data.trace.forEach(action => {const li = document.createElement('li'); li.textContent = `${action.step}. ${action.action}(${JSON.stringify(action.query)}) → ${action.error || action.sources.join(', ') || 'No matches'}`; el('trace').append(li);});
    el('result').hidden = false; el('status').textContent = data.status === 'complete' ? 'Research note ready.' : 'Step limit reached. Try a narrower question.';
  } catch (error) {el('status').textContent = error.message;}
  finally {busy = false; el('ask').disabled = false;}
};
function download(extension) {
  if (!result) return;
  const content = extension === 'json' ? JSON.stringify(result, null, 2) : `PaperTrail research note\nMode: ${result.mode}\nQuestion: ${result.question}\n\n${result.answer}\n\nSources\n${result.sources.map(s => `[${s.source}] ${s.text}`).join('\n\n')}\n`;
  const url = URL.createObjectURL(new Blob([content], {type: extension === 'json' ? 'application/json' : 'text/plain'}));
  const link = document.createElement('a'); link.href = url; link.download = `papertrail-note.${extension}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
el('export-json').onclick = () => download('json'); el('export-text').onclick = () => download('txt');
loadSamples();
