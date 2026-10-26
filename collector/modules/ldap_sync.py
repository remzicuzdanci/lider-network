"""
AD/LDAP sync module.
Requires: ldap3
"""
import logging
from datetime import datetime, timezone
from typing import Optional

try:
    from ldap3 import Server, Connection, ALL, NTLM, SUBTREE, Tls
    from ldap3.core.exceptions import LDAPException
    HAS_LDAP3 = True
except ImportError:
    HAS_LDAP3 = False

log = logging.getLogger(__name__)

# Windows FILETIME epoch offset (100-nanosecond intervals since 1601-01-01)
_EPOCH_DIFF = 116444736000000000


def _filetime_to_iso(ft: int) -> Optional[str]:
    if not ft or ft == 0 or ft == 9223372036854775807:
        return None
    try:
        ts = (ft - _EPOCH_DIFF) / 10_000_000
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
    except Exception:
        return None


def _ad_date_to_iso(val) -> Optional[str]:
    """Convert ldap3 datetime or FILETIME int to ISO string."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, int):
        return _filetime_to_iso(val)
    return str(val)


def _uac_enabled(uac: Optional[int]) -> bool:
    if uac is None:
        return True
    return not bool(uac & 2)  # ADS_UF_ACCOUNTDISABLE


def _uac_locked(uac: Optional[int]) -> bool:
    if uac is None:
        return False
    return bool(uac & 16)  # ADS_UF_LOCKOUT


def _uac_pwd_never_expires(uac: Optional[int]) -> bool:
    if uac is None:
        return False
    return bool(uac & 65536)  # ADS_UF_DONT_EXPIRE_PASSWD


def _guid_to_str(raw) -> Optional[str]:
    """Convert raw GUID bytes to string."""
    if raw is None:
        return None
    try:
        from ldap3.utils.guid import formatGuid
        return formatGuid(raw)
    except Exception:
        return None


class LdapSyncModule:

    USER_ATTRS = [
        'sAMAccountName', 'userPrincipalName', 'displayName', 'mail',
        'department', 'title', 'company', 'manager', 'telephoneNumber', 'mobile',
        'distinguishedName', 'userAccountControl', 'lockoutTime',
        'pwdLastSet', 'lastLogonTimestamp', 'whenCreated', 'whenChanged',
        'objectGUID',
    ]

    COMPUTER_ATTRS = [
        'cn', 'distinguishedName', 'dNSHostName', 'operatingSystem',
        'operatingSystemVersion', 'operatingSystemServicePack', 'description',
        'userAccountControl', 'lastLogonTimestamp', 'whenCreated', 'whenChanged',
        'objectGUID',
    ]

    def __init__(self, server_config: dict):
        self.cfg = server_config

    def _connect(self) -> Connection:
        tls = None
        if self.cfg.get('use_tls') or self.cfg.get('use_ssl'):
            import ssl
            tls = Tls(validate=ssl.CERT_NONE)

        ldap_server = Server(
            self.cfg['host'],
            port=int(self.cfg.get('port', 389)),
            use_ssl=bool(self.cfg.get('use_ssl', False)),
            tls=tls,
            get_info=ALL,
        )
        conn = Connection(
            ldap_server,
            user=self.cfg.get('bind_dn'),
            password=self.cfg.get('bind_password'),
            auto_bind=True,
        )
        if self.cfg.get('use_tls') and not self.cfg.get('use_ssl'):
            conn.start_tls()
        return conn

    def collect_users(self) -> list[dict]:
        if not HAS_LDAP3:
            log.warning('ldap3 not installed; skipping AD user sync')
            return []

        conn = self._connect()
        search_base = self.cfg.get('user_ou') or self.cfg['base_dn']
        search_filter = self.cfg.get('user_filter') or '(&(objectClass=user)(objectCategory=person))'

        conn.search(
            search_base=search_base,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=self.USER_ATTRS,
        )

        users = []
        for entry in conn.entries:
            a = entry.entry_attributes_as_dict
            uac = a.get('userAccountControl', [None])[0]
            users.append({
                'sam_account_name'   : str(a.get('sAMAccountName', [''])[0] or ''),
                'upn'                : str(a.get('userPrincipalName', [''])[0] or '') or None,
                'display_name'       : str(a.get('displayName', [''])[0] or '') or None,
                'email'              : str(a.get('mail', [''])[0] or '') or None,
                'department'         : str(a.get('department', [''])[0] or '') or None,
                'title'              : str(a.get('title', [''])[0] or '') or None,
                'company'            : str(a.get('company', [''])[0] or '') or None,
                'manager_cn'         : str(a.get('manager', [''])[0] or '') or None,
                'phone'              : str(a.get('telephoneNumber', [''])[0] or '') or None,
                'mobile'             : str(a.get('mobile', [''])[0] or '') or None,
                'distinguished_name' : str(entry.entry_dn),
                'is_enabled'         : _uac_enabled(uac),
                'is_locked'          : _uac_locked(uac),
                'password_never_expires': _uac_pwd_never_expires(uac),
                'last_logon_at'      : _ad_date_to_iso(a.get('lastLogonTimestamp', [None])[0]),
                'password_last_set_at': _ad_date_to_iso(a.get('pwdLastSet', [None])[0]),
                'ad_created_at'      : _ad_date_to_iso(a.get('whenCreated', [None])[0]),
                'ad_updated_at'      : _ad_date_to_iso(a.get('whenChanged', [None])[0]),
                'object_guid'        : _guid_to_str(a.get('objectGUID', [None])[0]),
            })

        conn.unbind()
        log.info('AD users collected: %d', len(users))
        return users

    def collect_computers(self) -> list[dict]:
        if not HAS_LDAP3:
            log.warning('ldap3 not installed; skipping AD computer sync')
            return []

        conn = self._connect()
        search_base = self.cfg.get('computer_ou') or self.cfg['base_dn']
        search_filter = self.cfg.get('computer_filter') or '(objectClass=computer)'

        conn.search(
            search_base=search_base,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=self.COMPUTER_ATTRS,
        )

        computers = []
        for entry in conn.entries:
            a = entry.entry_attributes_as_dict
            uac = a.get('userAccountControl', [None])[0]
            computers.append({
                'hostname'           : str(a.get('cn', [''])[0] or '').upper(),
                'distinguished_name' : str(entry.entry_dn),
                'dns_hostname'       : str(a.get('dNSHostName', [''])[0] or '') or None,
                'os'                 : str(a.get('operatingSystem', [''])[0] or '') or None,
                'os_version'         : str(a.get('operatingSystemVersion', [''])[0] or '') or None,
                'os_service_pack'    : str(a.get('operatingSystemServicePack', [''])[0] or '') or None,
                'description'        : str(a.get('description', [''])[0] or '') or None,
                'is_enabled'         : _uac_enabled(uac),
                'last_logon_at'      : _ad_date_to_iso(a.get('lastLogonTimestamp', [None])[0]),
                'ad_created_at'      : _ad_date_to_iso(a.get('whenCreated', [None])[0]),
                'ad_updated_at'      : _ad_date_to_iso(a.get('whenChanged', [None])[0]),
                'object_guid'        : _guid_to_str(a.get('objectGUID', [None])[0]),
            })

        conn.unbind()
        log.info('AD computers collected: %d', len(computers))
        return computers
