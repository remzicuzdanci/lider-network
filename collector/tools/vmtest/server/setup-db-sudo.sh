#!/usr/bin/env bash
# Run ONCE as:  sudo bash setup-db-sudo.sh          (needs the MySQL root socket; creates ONLY a new database + a new user)
# Creates database lider_vmtest and a user lider_vmtest@127.0.0.1 with a random password that is written (mode 600) to ~/vmtest/db.env of the invoking user.
# The password is never printed. It touches nothing that exists: the live database 'envanter' is not referenced.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run with sudo"; exit 1; }
U="${SUDO_USER:?run through sudo from your own account}"; H="$(getent passwd "$U" | cut -d: -f6)"; D="$H/vmtest"
mkdir -p "$D"; chown "$U":"$U" "$D"
if [ -f "$D/db.env" ]; then echo "$D/db.env already exists - nothing to do"; exit 0; fi
PW="$(head -c 24 /dev/urandom | base64 | tr -d '/+=\n')"
mysql <<SQL
CREATE DATABASE IF NOT EXISTS lider_vmtest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'lider_vmtest'@'127.0.0.1' IDENTIFIED BY '$PW';
GRANT ALL PRIVILEGES ON lider_vmtest.* TO 'lider_vmtest'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
umask 077; printf 'DB_DATABASE=lider_vmtest\nDB_USERNAME=lider_vmtest\nDB_PASSWORD=%s\n' "$PW" > "$D/db.env"; chown "$U":"$U" "$D/db.env"
echo "created database lider_vmtest and user lider_vmtest; credentials are in $D/db.env"
