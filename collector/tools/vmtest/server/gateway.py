#!/usr/bin/env python3
"""
Gateway of the ISOLATED VM-test server (stdlib only, runs as a normal user, needs no sudo).

  :HTTP_PORT   plain HTTP  - the CRL (/pki/vmtest-ca.crl) and the whole app (what a 1.3.0 baseline Collector uses)
  :HTTPS_PORT  TLS with the TEST server certificate - the whole app (what a 1.4.x Collector uses)
  everything else is proxied to the test application (php artisan serve on 127.0.0.1, a separate database).

  The CRL state is switchable so the VM can exercise revocation / expiry / outage:
        valid | revoked-codesign | revoked-tls | expired | unreachable
  Control API (header X-Vmtest-Token, a throw-away secret of the TEST environment) - a FIXED list of actions, no generic command execution:
        GET  /__vmtest/status            POST /__vmtest/crl?state=...       GET /__vmtest/collectors
        POST /__vmtest/result?name=...  GET /__vmtest/results   (result ledger of the VM suite)
        GET  /__vmtest/baseline.msi      (fresh single-use enrolment token, stamped 1.3.0 installer for the test customer)
        POST /__vmtest/publish?version=x.y.z      POST /__vmtest/withdraw?version=x.y.z      POST /__vmtest/reset
"""
import argparse, hmac, http.client, json, os, shutil, ssl, subprocess, sys, tempfile, threading, time, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ap = argparse.ArgumentParser()
ap.add_argument('--home', required=True)                 # ~/vmtest
ap.add_argument('--pki', required=True)                  # folder with server.crt, server.key, crl/*.crl
ap.add_argument('--upstream-port', type=int, default=18001)
ap.add_argument('--http-port', type=int, default=18080)
ap.add_argument('--https-port', type=int, default=18443)
ap.add_argument('--php', default='php')
ap.add_argument('--public-http-url', required=True)      # what the baseline installer is stamped with, e.g. http://192.168.20.61:18080
A = ap.parse_args()

HOME = os.path.abspath(A.home); PKI = os.path.abspath(A.pki)
TOKEN = open(os.path.join(HOME, 'control.token')).read().strip()
STATE_FILE = os.path.join(HOME, 'crl-state')
CTL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ctl.php')
STATES = {'valid', 'revoked-codesign', 'revoked-tls', 'expired', 'unreachable'}
LOG = open(os.path.join(HOME, 'gateway.log'), 'a', buffering=1)
HOP = {'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade', 'host'}


def log(msg): LOG.write(time.strftime('%Y-%m-%d %H:%M:%S ') + msg + '\n')
def crl_state():
    try:
        s = open(STATE_FILE).read().strip()
        return s if s in STATES else 'valid'
    except OSError:
        return 'valid'
def run_ctl(*args, timeout=300):
    env = dict(os.environ, VMTEST_APP=os.path.join(HOME, 'app'), VMTEST_HOME=HOME, VMTEST_HTTP_URL=A.public_http_url)
    p = subprocess.run([A.php, CTL, *args], capture_output=True, text=True, timeout=timeout, env=env)
    return p.returncode, p.stdout, p.stderr


class H(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    server_version = 'vmtest-gateway'

    def log_message(self, fmt, *a): log('%s %s' % (self.client_address[0], fmt % a))

    def send_bytes(self, code, body, ctype='application/json'):
        self.send_response(code); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(body))); self.send_header('Connection', 'close'); self.end_headers()
        if self.command != 'HEAD': self.wfile.write(body)
        self.close_connection = True

    def authorised(self):
        return hmac.compare_digest(self.headers.get('X-Vmtest-Token', ''), TOKEN)

    def do_GET(self): self.route()
    def do_POST(self): self.route()
    def do_HEAD(self): self.route()
    def do_PUT(self): self.route()
    def do_DELETE(self): self.route()
    def do_PATCH(self): self.route()
    def do_OPTIONS(self): self.route()

    def route(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path == '/pki/vmtest-ca.crl': return self.crl()
        if u.path.startswith('/__vmtest/'): return self.control(u.path, q)
        return self.proxy()

    def crl(self):
        st = crl_state()
        if st == 'unreachable':
            log('CRL request: state=unreachable -> connection dropped')
            self.close_connection = True
            try: self.connection.shutdown(2)
            except OSError: pass
            return
        f = os.path.join(PKI, 'crl', st + '.crl')
        if not os.path.isfile(f): return self.send_bytes(503, b'crl missing', 'text/plain')
        self.send_bytes(200, open(f, 'rb').read(), 'application/pkix-crl'); log('CRL served: ' + st)

    def control(self, path, q):
        if not self.authorised(): return self.send_bytes(403, b'{"ok":false,"error":"token"}')
        a = path[len('/__vmtest/'):]
        try:
            if a == 'status' and self.command == 'GET':
                rc, o, e = run_ctl('status')
                d = json.loads(o[o.index('{'):]) if rc == 0 and '{' in o else {'ok': False, 'error': (e or o).strip()[:300]}
                d['crl_state'] = crl_state(); d['gateway_time_utc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                return self.send_bytes(200, json.dumps(d).encode())
            if a == 'crl' and self.command == 'POST':
                st = (q.get('state') or [''])[0]
                if st not in STATES: return self.send_bytes(400, b'{"ok":false,"error":"state"}')
                open(STATE_FILE, 'w').write(st); log('CRL state -> ' + st)
                return self.send_bytes(200, json.dumps({'ok': True, 'crl_state': st}).encode())
            if a == 'collectors' and self.command == 'GET':
                rc, o, e = run_ctl('collectors'); return self.send_bytes(200 if rc == 0 else 500, (o or json.dumps({'ok': False, 'error': e.strip()})).encode())
            if a in ('publish', 'withdraw') and self.command == 'POST':
                v = (q.get('version') or [''])[0]
                if not re.fullmatch(r'\d+\.\d+\.\d+', v): return self.send_bytes(400, b'{"ok":false,"error":"version"}')
                rc, o, e = run_ctl(a, v); log('%s %s rc=%d' % (a, v, rc))
                return self.send_bytes(200 if rc == 0 else 422, (o or json.dumps({'ok': False, 'error': e.strip()})).encode())
            if a == 'dlp-policy' and self.command == 'POST':
                pol = {'enabled': (q.get('enabled') or ['0'])[0] == '1', 'print': (q.get('print') or ['0'])[0] == '1', 'usb': (q.get('usb') or ['0'])[0] == '1',
                       'files': (q.get('files') or ['1'])[0] == '1', 'name': (q.get('name') or ['hash'])[0]}
                rc, o, e = run_ctl('dlp-policy', json.dumps(pol)); log('dlp-policy %s rc=%d' % (pol, rc))
                return self.send_bytes(200 if rc == 0 else 422, (o or json.dumps({'ok': False, 'error': e.strip()})).encode())
            if a == 'dlp-events' and self.command == 'GET':
                rc, o, e = run_ctl('dlp-events'); return self.send_bytes(200 if rc == 0 else 500, (o or json.dumps({'ok': False, 'error': e.strip()})).encode())
            if a == 'reset' and self.command == 'POST':
                rc, o, e = run_ctl('reset'); log('reset rc=%d' % rc)
                return self.send_bytes(200 if rc == 0 else 422, (o or json.dumps({'ok': False, 'error': e.strip()})).encode())
            if a == 'result' and self.command == 'POST':      # the VM's result ledger lives HERE so that a snapshot revert cannot erase it
                name = (q.get('name') or [''])[0]
                if not re.fullmatch(r'[A-Za-z0-9_.\-]{3,80}', name): return self.send_bytes(400, b'{"ok":false,"error":"name"}')
                n = int(self.headers.get('Content-Length') or 0)
                if n <= 0 or n > 262144: return self.send_bytes(413, b'{"ok":false,"error":"size"}')
                body = self.rfile.read(n); json.loads(body.decode('utf-8'))
                os.makedirs(os.path.join(HOME, 'results'), exist_ok=True)
                with open(os.path.join(HOME, 'results', name + '.json'), 'wb') as f: f.write(body)
                log('result stored: ' + name); return self.send_bytes(200, b'{"ok":true}')
            if a == 'results' and self.command == 'GET':
                rd = os.path.join(HOME, 'results'); out = []
                for fn in sorted(os.listdir(rd)) if os.path.isdir(rd) else []:
                    try:
                        d = json.load(open(os.path.join(rd, fn), encoding='utf-8'))
                        out.append({'name': fn[:-5], 'scenario': d.get('scenario'), 'passed': d.get('passed'), 'at': d.get('finished_utc'), 'stage': d.get('stage')})
                    except Exception: out.append({'name': fn[:-5], 'scenario': None, 'passed': None})
                return self.send_bytes(200, json.dumps({'ok': True, 'results': out}).encode())
            if a == 'baseline.msi' and self.command == 'GET':
                tmp = tempfile.mkdtemp(prefix='vmtest-base-'); out = os.path.join(tmp, 'baseline.msi')
                try:
                    rc, o, e = run_ctl('baseline', out)
                    if rc != 0 or not os.path.isfile(out): return self.send_bytes(500, (o or json.dumps({'ok': False, 'error': e.strip()})).encode())
                    size = os.path.getsize(out)
                    self.send_response(200); self.send_header('Content-Type', 'application/x-msi'); self.send_header('Content-Length', str(size)); self.send_header('Connection', 'close'); self.end_headers()
                    with open(out, 'rb') as f: shutil.copyfileobj(f, self.wfile, 262144)
                    log('baseline installer served (fresh token)'); self.close_connection = True
                finally:
                    shutil.rmtree(tmp, ignore_errors=True)
                return
            return self.send_bytes(404, b'{"ok":false,"error":"unknown action"}')
        except Exception as ex:  # never leak internals
            log('control error: %r' % ex); return self.send_bytes(500, b'{"ok":false,"error":"internal"}')

    def proxy(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
            body = self.rfile.read(n) if n else None
            hdr = {k: v for k, v in self.headers.items() if k.lower() not in HOP}
            hdr['X-Forwarded-For'] = self.client_address[0]; hdr['X-Forwarded-Proto'] = 'https' if isinstance(self.connection, ssl.SSLSocket) else 'http'
            hdr['Host'] = '127.0.0.1:%d' % A.upstream_port
            c = http.client.HTTPConnection('127.0.0.1', A.upstream_port, timeout=600)
            c.request(self.command, self.path, body=body, headers=hdr)
            r = c.getresponse()
            self.send_response(r.status)
            clen = None
            for k, v in r.getheaders():
                if k.lower() in HOP or k.lower() == 'content-length': continue
                self.send_header(k, v)
            clen = r.getheader('Content-Length')
            if clen is not None: self.send_header('Content-Length', clen)
            self.send_header('Connection', 'close'); self.end_headers()
            if self.command != 'HEAD':
                while True:
                    chunk = r.read(262144)
                    if not chunk: break
                    self.wfile.write(chunk)
            c.close(); self.close_connection = True
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True
        except Exception as ex:
            log('proxy error: %r' % ex)
            try: self.send_bytes(502, b'upstream unavailable', 'text/plain')
            except Exception: pass


class Srv(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 64


def main():
    http_s = Srv(('0.0.0.0', A.http_port), H)
    https_s = Srv(('0.0.0.0', A.https_port), H)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    ctx.load_cert_chain(os.path.join(PKI, 'server.crt'), os.path.join(PKI, 'server.key'))
    https_s.socket = ctx.wrap_socket(https_s.socket, server_side=True)
    log('gateway up: http %d, https %d, upstream %d, crl state %s' % (A.http_port, A.https_port, A.upstream_port, crl_state()))
    threading.Thread(target=http_s.serve_forever, daemon=True).start()
    https_s.serve_forever()


if __name__ == '__main__':
    main()
