"""Run from any directory: python server.py"""
import json
import os
from pathlib import Path
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from agent_core import GeminiClient, run_agent


class Handler(BaseHTTPRequestHandler):
    def respond(self, status, data, content_type='application/json; charset=utf-8'):
        body = json.dumps(data).encode() if content_type.startswith('application/json') else data
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        files = {'/': ('index.html', 'text/html; charset=utf-8'),
                 '/app.js': ('app.js', 'text/javascript; charset=utf-8'),
                 '/style.css': ('style.css', 'text/css; charset=utf-8'),
                 '/documents': ('sample_papers.json', 'application/json; charset=utf-8')}
        if self.path == '/health':
            return self.respond(200, {'ok': True, 'live_available': bool(os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY'))})
        if self.path not in files:
            return self.respond(404, {'error': 'Not found.'})
        filename, mime = files[self.path]
        # JSON is read as data, while static files are served as bytes.
        if self.path == '/documents':
            return self.respond(200, json.loads((ROOT / filename).read_text(encoding='utf-8')))
        self.respond(200, (ROOT / filename).read_bytes(), mime)

    def do_POST(self):
        if self.path != '/ask':
            return self.respond(404, {'error': 'Not found.'})
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            return self.respond(403, {'error': 'Cross-origin requests are not allowed.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 600000:
                raise ValueError('Request must contain JSON smaller than 600 KB.')
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError('Request must be a JSON object.')
            mode = payload.get('mode', 'offline-demo')
            if mode not in ('offline-demo', 'live-gemini'):
                raise ValueError('Unknown mode.')
            client = GeminiClient() if mode == 'live-gemini' else None
            result = run_agent(payload.get('question'), payload.get('documents'), client)
            self.respond(200, result)
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self.respond(400, {'error': str(error)})
        except RuntimeError as error:
            self.respond(502, {'error': str(error)})
        except Exception:
            self.respond(500, {'error': 'Unexpected server error.'})


if __name__ == '__main__':
    print('PaperTrail: http://127.0.0.1:8765 - press Ctrl+C to stop.')
    ThreadingHTTPServer(('127.0.0.1', 8765), Handler).serve_forever()
