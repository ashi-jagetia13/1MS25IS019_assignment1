import copy
import importlib.util
import json
from pathlib import Path
import sys
import threading
import unittest
import urllib.request
import urllib.error
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from agent_core import run_agent, search_documents, GeminiClient
DOCS = json.loads((ROOT/'sample_papers.json').read_text())


class FakeModel:
    def __init__(self, turns):
        self.turns = copy.deepcopy(turns)
        self.requests = []

    def generate(self, contents, require_search=False):
        self.requests.append((contents, require_search))
        return self.turns.pop(0)


def call(query, name='search_documents', signature=None):
    part = {'functionCall': {'name': name, 'args': {'query': query}, 'id':'call-1'}}
    if signature:
        part['thoughtSignature'] = signature
    return part


class AgentTests(unittest.TestCase):
    def test_retrieval_whole_tokens_and_no_match(self):
        self.assertEqual(search_documents('hybrid reranker', DOCS)[0]['source'], 'hybrid_retrieval')
        self.assertEqual(search_documents('hyb', DOCS), [])
        self.assertEqual(search_documents('the and', DOCS), [])

    def test_offline_mode_is_explicit(self):
        result = run_agent('How many ghosts eat carrots everyday?', DOCS)
        self.assertEqual(result['mode'], 'offline-demo')
        self.assertEqual(result['sources'], [])

    def test_multiple_calls_and_signature_preserved(self):
        turn = {'role':'model', 'parts':[call('keyword', signature='opaque-value'), call('dense')]}
        turn['parts'][1]['functionCall']['id'] = 'call-2'
        client = FakeModel([turn, {'role':'model','parts':[{'text':'Different retrieval approaches [keyword_retrieval] [dense_retrieval].'}]}])
        result = run_agent('Compare methods', DOCS, client)
        self.assertEqual(result['status'], 'complete')
        self.assertEqual(len(result['trace']), 2)
        self.assertTrue(client.requests[0][1])
        self.assertFalse(client.requests[1][1])
        self.assertEqual(client.requests[1][0][1], turn)
        self.assertEqual(len(client.requests[1][0][2]['parts']), 2)
        self.assertEqual(client.requests[1][0][2]['parts'][1]['functionResponse']['id'], 'call-2')

    def test_unknown_tool_is_not_executed(self):
        client = FakeModel([{'role':'model','parts':[call('secret',name='read_files')]},
                            {'role':'model','parts':[{'text':'Unable to answer from the supplied documents.'}]}])
        result = run_agent('Question', DOCS, client)
        self.assertIn('Unknown tool', result['trace'][0]['error'])

    def test_unknown_citation_rejected(self):
        client = FakeModel([{'role':'model','parts':[call('keyword')]},
                            {'role':'model','parts':[{'text':'A fabricated result [invented_paper].'}]}])
        with self.assertRaisesRegex(RuntimeError,'did not retrieve'):
            run_agent('Question', DOCS, client)

    def test_answer_without_search_rejected(self):
        with self.assertRaisesRegex(RuntimeError,'without the required search'):
            run_agent('Question', DOCS, FakeModel([{'role':'model','parts':[{'text':'Unsupported.'}]}]))

    def test_maximum_steps(self):
        result = run_agent('Question', DOCS, FakeModel([{'role':'model','parts':[call('keyword')]}]), max_steps=1)
        self.assertEqual(result['status'],'step-limit')

    def test_transport_request_and_retry(self):
        body = {'candidates':[{'content':{'role':'model','parts':[call('keyword')]}}]}
        import io
        with patch('urllib.request.urlopen', side_effect=[urllib.error.HTTPError('url',429,'quota',{},None),io.BytesIO(json.dumps(body).encode())]) as request, patch('time.sleep'):
            result = GeminiClient(api_key='fake-test-key').generate([{'role':'user','parts':[{'text':'hello'}]}],True)
        self.assertEqual(result['role'],'model')
        self.assertEqual(request.call_count,2)
        sent = request.call_args[0][0]
        self.assertNotIn('fake-test-key',sent.full_url)
        self.assertEqual(json.loads(sent.data)['toolConfig']['functionCallingConfig']['mode'],'ANY')


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('papertrail_server', ROOT/'server.py')
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        module.Handler.log_message = lambda *args: None
        cls.server = module.ThreadingHTTPServer(('127.0.0.1',0),module.Handler)
        cls.url = 'http://127.0.0.1:' + str(cls.server.server_port)
        cls.thread = threading.Thread(target=cls.server.serve_forever,daemon=True); cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join()

    def test_static_files_and_health(self):
        for path in ['/', '/app.js','/style.css','/documents','/health']:
            with urllib.request.urlopen(self.url+path) as response:
                self.assertEqual(response.status,200); self.assertTrue(response.read())
        with self.assertRaises(urllib.error.HTTPError) as error:
            urllib.request.urlopen(self.url+'/../agent_core.py')
        self.assertEqual(error.exception.code,404)

    def test_offline_http_request(self):
        request = urllib.request.Request(self.url+'/ask',data=json.dumps({'question':'hybrid reranker','documents':DOCS,'mode':'offline-demo'}).encode(),headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(request) as response:
            data=json.load(response)
        self.assertEqual(data['sources'][0]['source'],'hybrid_retrieval')
        self.assertEqual(data['mode'],'offline-demo')

    def test_invalid_input_and_cross_origin(self):
        for payload, origin, status in [({'question':'','documents':DOCS},None,400), ({'question':'keyword','documents':DOCS},'https://example.com',403)]:
            request=urllib.request.Request(self.url+'/ask',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json',**({'Origin':origin} if origin else {})})
            with self.assertRaises(urllib.error.HTTPError) as error: urllib.request.urlopen(request)
            self.assertEqual(error.exception.code,status)


if __name__ == '__main__':
    unittest.main(verbosity=2)
