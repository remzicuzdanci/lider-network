#!/usr/bin/env bash
# Run ONCE:  sudo bash ~/vmtest/server/setup-db-sudo.sh        (needs the MySQL root socket)
# Creates ONLY: database lider_vmtest and user lider_vmtest@127.0.0.1 (privileges on lider_vmtest.* only, nothing else).
# It never drops, truncates, renames or alters any existing database, table, or any other user. The password is random, written (mode 600) to ~/vmtest/db.env, never printed.
# An existing db.env that points to ANOTHER database (e.g. the shared envanter_test) is KEPT as db.env.previous-<db> - nothing is deleted.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run with sudo"; exit 1; }
U="${SUDO_USER:?run through sudo from your own account}"; H="$(getent passwd "$U" | cut -d: -f6)"; D="$H/vmtest"
[ -d "$D" ] || { echo "$D does not exist"; exit 1; }
if [ -f "$D/db.env" ]; then
  cur="$(grep -E '^DB_DATABASE=' "$D/db.env" | cut -d= -f2-)"
  if [ "$cur" = "lider_vmtest" ]; then echo "db.env already points to lider_vmtest - nothing to do"; exit 0; fi
  mv "$D/db.env" "$D/db.env.previous-${cur:-unknown}"; echo "kept the old configuration as db.env.previous-${cur:-unknown}"
fi
PW="$(head -c 24 /dev/urandom | base64 | tr -d '/+=\n')"
mysql <<SQL
CREATE DATABASE IF NOT EXISTS lider_vmtest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'lider_vmtest'@'127.0.0.1' IDENTIFIED BY '$PW';
ALTER USER 'lider_vmtest'@'127.0.0.1' IDENTIFIED BY '$PW';
GRANT ALL PRIVILEGES ON lider_vmtest.* TO 'lider_vmtest'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
umask 077; printf 'DB_DATABASE=lider_vmtest\nDB_USERNAME=lider_vmtest\nDB_PASSWORD=%s\n' "$PW" > "$D/db.env"; chown "$U":"$U" "$D/db.env"
echo "created database lider_vmtest and user lider_vmtest; configuration written to $D/db.env"
