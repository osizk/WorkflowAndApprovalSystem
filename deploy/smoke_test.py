"""Course Starter Kit smoke checks adapted for WorkflowAndApprovalSystem.

Required: health, a real database query, built HTML, anonymous API rejection.
Optional: cookie login, database-backed request list, logout, session rejection.
Uses only the Python standard library. Never prints credentials or response bodies.
"""
import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def check(base):
    url = urllib.parse.urlsplit(base)
    local = url.hostname in ('127.0.0.1', 'localhost')
    if (url.scheme != 'https' and not (url.scheme == 'http' and local)) or not url.netloc or url.username or url.password or url.path not in ('', '/') or url.query or url.fragment:
        raise RuntimeError('Use the service origin without credentials, a path or a query.')
    base = base.rstrip('/')
    login, password = os.getenv('SMOKE_LOGIN'), os.getenv('SMOKE_PASSWORD')
    if bool(login) != bool(password):
        raise RuntimeError('Set both SMOKE_LOGIN and SMOKE_PASSWORD, or neither.')
    cookies = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies), NoRedirect())

    def request(path, method='GET', data=None):
        headers = {'Origin': base}
        if data is not None:
            headers['Content-Type'] = 'application/json'
        req = urllib.request.Request(base + path, headers=headers, method=method,
                                     data=json.dumps(data).encode() if data is not None else None)
        try:
            with opener.open(req, timeout=30) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            with error:
                return error.code, error.read()

    def json_matches(body, key, value):
        result = json.loads(body)
        return isinstance(result, dict) and result.get(key) == value

    for path, status, predicate in (
        ('/api/health', 200, lambda body: json_matches(body, 'status', 'ok')),
        ('/api/ready', 200, lambda body: json_matches(body, 'db', 'connected')),
        ('/login', 200, lambda body: b'<html' in body.lower()),
        ('/api/session', 401, lambda body: json_matches(body, 'error', {'code': 'AUTH_REQUIRED', 'message': 'Sign in required'})),
    ):
        for attempt in range(5):
            try:
                code, body = request(path)
                if code != status or not predicate(body):
                    raise ValueError('Unexpected response')
                break
            except (urllib.error.URLError, TimeoutError, ValueError):
                if attempt == 4:
                    raise RuntimeError('Smoke check failed: ' + path) from None
                time.sleep(3)
        print('PASS ' + path)

    if not login:
        print('Optional signed-in check not configured; live journey evidence is still required.')
        return
    try:
        code, body = request('/api/session', 'POST', {'login': login, 'password': password})
        identity = json.loads(body)
        if code != 200 or not isinstance(identity, dict) or not identity.get('id') or identity.get('role') not in ('REQUESTER', 'REVIEWER'):
            raise ValueError('Login failed')
        code, body = request('/api/session')
        if code != 200 or json.loads(body) != identity:
            raise ValueError('Session identity failed')
        code, body = request('/api/requests')
        records = json.loads(body)
        if code != 200 or not isinstance(records, dict) or not isinstance(records.get('requests'), list):
            raise ValueError('Database-backed request list failed')
        print('PASS cookie login, identity and database-backed request list')
    except (urllib.error.URLError, TimeoutError, ValueError, AttributeError):
        raise RuntimeError('Signed-in smoke check failed') from None
    finally:
        if any(cookie.name == 'session' for cookie in cookies):
            try:
                code, _ = request('/api/session', 'DELETE')
                anonymous, _ = request('/api/session')
                if code != 204 or anonymous != 401:
                    raise ValueError('Logout failed')
                print('PASS logout and session rejection')
            except (urllib.error.URLError, TimeoutError, ValueError):
                raise RuntimeError('Smoke session cleanup failed') from None


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 deploy/smoke_test.py SERVICE_URL')
    try:
        check(sys.argv[1])
    except (RuntimeError, ValueError) as error:
        sys.exit(str(error))
