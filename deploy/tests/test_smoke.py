import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).parents[1] / 'smoke_test.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeTests(unittest.TestCase):
    def setUp(self):
        self.mode = ''
        self.signed_in = False
        self.logout_count = 0
        self.request_count = 0
        state = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def send(self, status, payload=None, cookie=None):
                self.send_response(status)
                self.send_header('Content-Type', 'application/json')
                if cookie:
                    self.send_header('Set-Cookie', cookie)
                self.end_headers()
                if payload is not None:
                    self.wfile.write(payload if isinstance(payload, bytes) else json.dumps(payload).encode())

            def do_GET(self):
                state.request_count += 1
                if self.path == '/api/health':
                    return self.send(200, {'status': 'ok'})
                if self.path == '/api/ready':
                    return self.send(503 if state.mode == 'db-down' else 200,
                                     {'db': 'unavailable' if state.mode == 'db-down' else 'connected'})
                if self.path == '/login':
                    return self.send(200, b'<html><body>Sign in</body></html>')
                if self.path == '/api/session':
                    if state.signed_in or state.mode == 'public-session':
                        return self.send(200, {'id': 'fixture-user', 'role': 'REQUESTER'})
                    return self.send(401, {'error': {'code': 'AUTH_REQUIRED', 'message': 'Sign in required'}})
                if self.path == '/api/requests':
                    return self.send(500 if state.mode == 'request-error' else 200, {'requests': []})
                return self.send(404)

            def do_POST(self):
                state.request_count += 1
                self.rfile.read(int(self.headers.get('Content-Length', '0')))
                if self.headers.get('Origin') != state.base:
                    return self.send(403)
                state.signed_in = True
                return self.send(200, {'id': 'fixture-user', 'role': 'REQUESTER'}, 'session=fixture; HttpOnly; Path=/')

            def do_DELETE(self):
                state.logout_count += 1
                state.signed_in = False
                return self.send(204, cookie='session=; Max-Age=0; Path=/')

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.base = 'http://127.0.0.1:' + str(self.server.server_port)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start()
        self.addCleanup(self.env.stop)
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)

    def run_check(self):
        with contextlib.redirect_stdout(io.StringIO()) as output, patch.object(smoke.time, 'sleep'):
            smoke.check(self.base)
        return output.getvalue()

    def test_public_checks_prove_database_and_access_restriction(self):
        output = self.run_check()
        self.assertIn('PASS /api/ready', output)
        self.assertIn('PASS /api/session', output)
        self.assertFalse(self.signed_in)

    def test_unavailable_database_fails(self):
        self.mode = 'db-down'
        with self.assertRaisesRegex(RuntimeError, '/api/ready'):
            self.run_check()

    def test_anonymous_session_must_be_rejected(self):
        self.mode = 'public-session'
        with self.assertRaisesRegex(RuntimeError, '/api/session'):
            self.run_check()

    def test_cookie_session_is_logged_out(self):
        os.environ.update(SMOKE_LOGIN='requester1', SMOKE_PASSWORD='fixture-password')
        output = self.run_check()
        self.assertEqual(self.logout_count, 1)
        self.assertFalse(self.signed_in)
        self.assertIn('PASS logout', output)
        self.assertNotIn('fixture-password', output)

    def test_failed_signed_in_check_still_logs_out(self):
        self.mode = 'request-error'
        os.environ.update(SMOKE_LOGIN='requester1', SMOKE_PASSWORD='fixture-password')
        with self.assertRaisesRegex(RuntimeError, 'Signed-in smoke check failed'):
            self.run_check()
        self.assertEqual(self.logout_count, 1)
        self.assertFalse(self.signed_in)

    def test_partial_credentials_fail_before_http(self):
        os.environ['SMOKE_LOGIN'] = 'requester1'
        with self.assertRaisesRegex(RuntimeError, 'Set both'):
            self.run_check()
        self.assertEqual(self.request_count, 0)

    def test_credential_bearing_url_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'service origin'):
            smoke.check('https://private:password@example.com')
        self.assertEqual(self.request_count, 0)


if __name__ == '__main__':
    unittest.main()
