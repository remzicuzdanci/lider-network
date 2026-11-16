#!/usr/bin/env bash
# ISOLATED VM-test server: a SEPARATE copy of the application, a SEPARATE database, its own package store and gateway ports.
# Runs as an ordinary user (no sudo). It never reads or writes /var/www/envanter except a READ-ONLY copy of vendor/, and never touches the live database.
#   vmtest-server.sh install <public-ip> | start | stop | status | uninstall
# Prerequisites in $VMTEST_HOME (default ~/vmtest): app/ (code under test), pki/ (public part of the TEST PKI: server.crt server.key test-root-ca.pem test-update-signing-cert.pem crl/*.crl),
#   db.env (DB_DATABASE/DB_USERNAME/DB_PASSWORD of the TEST database - created by setup-db-sudo.sh), packages/<ver>/ (TEST-signed MSIs + signatures), baseline/ (1.3.0 template + manifest).
set -euo pipefail
HOME_DIR="${VMTEST_HOME:-$HOME/vmtest}"
APP="$HOME_DIR/app"; HTTP_PORT="${VMTEST_HTTP_PORT:-18080}"; HTTPS_PORT="${VMTEST_HTTPS_PORT:-18443}"; UP_PORT="${VMTEST_UPSTREAM_PORT:-18001}"
here="$(cd "$(dirname "$0")" && pwd)"
die() { echo "ERROR: $*" >&2; exit 1; }
pidf() { echo "$HOME_DIR/run/$1.pid"; }
alive() { [ -f "$(pidf "$1")" ] && kill -0 "$(cat "$(pidf "$1")")" 2>/dev/null; }

cmd_install() {
  local ip="${1:-}"; [ -n "$ip" ] || die "usage: install <server-ip-the-VM-uses>"
  [ -f "$APP/artisan" ] || die "the application copy is missing: $APP (upload it first)"
  [ -f "$HOME_DIR/db.env" ] || die "$HOME_DIR/db.env is missing - run setup-db-sudo.sh once (it creates the TEST database)"
  for f in server.crt server.key test-root-ca.pem test-update-signing-cert.pem crl/valid.crl; do [ -f "$HOME_DIR/pki/$f" ] || die "pki/$f missing in $HOME_DIR"; done
  mkdir -p "$HOME_DIR"/{run,packages,baseline} "$APP/storage/app/msi" "$APP/storage/framework"/{cache/data,sessions,views} "$APP/storage/logs" "$APP/bootstrap/cache"
  [ -d "$APP/vendor" ] || { echo "copying vendor/ (read-only source: the live vendor folder)"; cp -a /var/www/envanter/vendor "$APP/vendor"; }
  [ -f "$HOME_DIR/control.token" ] || { head -c 24 /dev/urandom | base64 | tr -d '/+=\n' > "$HOME_DIR/control.token"; chmod 600 "$HOME_DIR/control.token"; }
  [ -f "$HOME_DIR/crl-state" ] || echo valid > "$HOME_DIR/crl-state"
  # shellcheck disable=SC1091
  set -a; . "$HOME_DIR/db.env"; set +a
  case "$DB_DATABASE" in *vmtest*|*_test) ;; *) die "database name '$DB_DATABASE' must contain 'vmtest' or end in '_test'";; esac
  [ "$DB_DATABASE" != "envanter" ] || die "refusing the live database"
  local sha; sha=$(openssl x509 -in "$HOME_DIR/pki/test-update-signing-cert.pem" -noout -fingerprint -sha1 | cut -d= -f2 | tr -d ':')
  local key; key=$(grep -h '^APP_KEY=' "$APP/.env" 2>/dev/null | head -1 | cut -d= -f2- || true)
  [ -n "$key" ] || key=$(cd "$APP" && php artisan key:generate --show) || die "could not generate APP_KEY"
  umask 077
  cat > "$APP/.env" <<ENV
APP_NAME="LIDER VMTEST"
APP_ENV=local
APP_KEY=$key
APP_DEBUG=false
APP_URL=http://$ip:$HTTP_PORT
LOG_CHANNEL=single
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=$DB_DATABASE
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
MAIL_MAILER=log
COLLECTOR_REQUIRE_HTTPS=false
COLLECTOR_PUBLIC_URL=http://$ip:$HTTP_PORT
COLLECTOR_UPDATE_SIGNER_SHA1=$sha
COLLECTOR_UPDATE_SIGNER_CN="LIDER VMTEST Code Signing (NOT PRODUCTION)"
ENV
  chmod 600 "$APP/.env"; umask 022
  # the TEST copy pins the TEST certificates (its own deploy/pki, never the production ones)
  mkdir -p "$APP/deploy/pki"; cp "$HOME_DIR/pki/test-root-ca.pem" "$APP/deploy/pki/lider-root-ca.pem"; cp "$HOME_DIR/pki/test-update-signing-cert.pem" "$APP/deploy/pki/update-signing-cert.pem"
  # baseline template (unstamped 1.3.0) for the stamping code path
  if ls "$HOME_DIR"/baseline/LiderITONECollector-*.msi >/dev/null 2>&1; then cp -f "$HOME_DIR"/baseline/LiderITONECollector-* "$APP/storage/app/msi/"; fi
  mkdir -p "$APP/storage/framework"/{cache/data,sessions,views} "$APP/storage/logs" "$APP/bootstrap/cache"
  (cd "$APP" && php artisan config:clear >/dev/null && php artisan migrate --force 2>&1 | tail -3)
  VMTEST_APP="$APP" VMTEST_HOME="$HOME_DIR" php "$here/ctl.php" seed
  echo "installed. database=$DB_DATABASE  http=:$HTTP_PORT https=:$HTTPS_PORT  (start with: vmtest-server.sh start $ip)"
}

cmd_start() {
  local ip="${1:-}"; [ -n "$ip" ] || die "usage: start <server-ip>"
  [ -f "$APP/.env" ] || die "run install first"
  alive app || { (cd "$APP" && PHP_CLI_SERVER_WORKERS=6 setsid nohup php artisan serve --host=127.0.0.1 --port="$UP_PORT" >"$HOME_DIR/run/app.log" 2>&1 </dev/null & echo $! >"$(pidf app)"); }
  alive gateway || { setsid nohup python3 "$here/gateway.py" --home "$HOME_DIR" --pki "$HOME_DIR/pki" --upstream-port "$UP_PORT" --http-port "$HTTP_PORT" --https-port "$HTTPS_PORT" --public-http-url "http://$ip:$HTTP_PORT" >"$HOME_DIR/run/gateway.out" 2>&1 </dev/null & echo $! >"$(pidf gateway)"; }
  sleep 2; cmd_status
}
cmd_stop() { for n in gateway app; do if alive $n; then pkill -P "$(cat "$(pidf $n)")" 2>/dev/null || true; kill "$(cat "$(pidf $n)")" 2>/dev/null || true; fi; rm -f "$(pidf $n)"; done; echo stopped; }
cmd_status() { for n in app gateway; do alive $n && echo "$n: running (pid $(cat "$(pidf $n)"))" || echo "$n: not running"; done; echo "crl state: $(cat "$HOME_DIR/crl-state" 2>/dev/null || echo valid)"; }
cmd_uninstall() { cmd_stop; [ "${1:-}" = "--yes" ] || die "this deletes $HOME_DIR (the TEST app and packages, NOT the database); add --yes"; rm -rf "$HOME_DIR"; echo removed; }
case "${1:-}" in install) shift; cmd_install "$@";; start) shift; cmd_start "$@";; stop) cmd_stop;; status) cmd_status;; uninstall) shift; cmd_uninstall "$@";; *) die "usage: $0 install <ip> | start <ip> | stop | status | uninstall --yes";; esac
