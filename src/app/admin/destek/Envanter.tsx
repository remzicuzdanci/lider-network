"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Server, ShieldAlert, Cpu, Search, ChevronDown, ChevronRight } from "lucide-react";

interface Company { id: string; name: string; }
interface Asset {
  id: string;
  company_id: string | null;
  company_name: string | null;
  type: string;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
  firmware: string | null;
  ip_address: string | null;
  location: string | null;
  purchase_date: string | null;
  warranty_end: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  firewall: "Firewall / FortiGate", switch: "Switch", ap: "Access Point", router: "Router",
  server: "Sunucu", nas: "NAS / Depolama", camera: "Kamera / NVR", phone: "IP Telefon / Santral",
  ups: "UPS / Güç", printer: "Yazıcı", pc: "PC / İstemci", other: "Diğer",
};
const TYPE_ICON: Record<string, string> = {
  firewall: "🛡️", switch: "🔀", ap: "📶", router: "📡", server: "🖥️", nas: "💾",
  camera: "📹", phone: "☎️", ups: "🔋", printer: "🖨️", pc: "💻", other: "📦",
};

function daysLeft(end: string | null): number | null {
  if (!end) return null;
  return Math.ceil((new Date(end + "T00:00:00").getTime() - Date.now()) / 86400000);
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}
function warrantyBadge(end: string | null): { label: string; color: string; bg: string } | null {
  const d = daysLeft(end);
  if (d === null) return null;
  if (d < 0) return { label: "Garanti bitti", color: "#dc2626", bg: "#fef2f2" };
  if (d <= 60) return { label: `Garanti ${d}g`, color: "#ea580c", bg: "#fff7ed" };
  return { label: "Garantili", color: "#15803d", bg: "#f0fdf4" };
}

const inpS: React.CSSProperties = {
  padding: "9px 12px", background: "#fff", border: "1.5px solid #e5e7ef",
  borderRadius: "9px", color: "#1a1d2e", fontSize: "13px", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const lblS: React.CSSProperties = { fontSize: "12px", fontWeight: 700, color: "#475569", margin: "0 0 5px", display: "block" };

export default function Envanter({ companies, isMobile }: { companies: Company[]; isMobile: boolean }) {
  const [list, setList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [modal, setModal] = useState<Partial<Asset> | null>(null);
  const [saving, setSaving] = useState(false);
  const [openCo, setOpenCo] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/assets");
      const d = await r.json();
      setList(d.assets || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let arr = list;
    if (typeF !== "all") arr = arr.filter(a => a.type === typeF);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(a => `${a.company_name || ""} ${a.model || ""} ${a.serial_no || ""} ${a.brand || ""} ${a.ip_address || ""} ${a.firmware || ""}`.toLowerCase().includes(q));
    }
    return arr;
  }, [list, typeF, search]);

  // Firmaya göre grupla
  const grouped = useMemo(() => {
    const m: Record<string, Asset[]> = {};
    for (const a of filtered) {
      const key = a.company_name || "Atanmamış";
      (m[key] = m[key] || []).push(a);
    }
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0], "tr"));
  }, [filtered]);

  const warrantyAlerts = useMemo(() =>
    list.filter(a => a.status === "active" && (() => { const d = daysLeft(a.warranty_end); return d !== null && d <= 60; })()).length
  , [list]);

  async function save() {
    if (!modal?.model && !modal?.type) { alert("Cihaz tipi ve model gerekli."); return; }
    setSaving(true);
    try {
      const method = modal.id ? "PATCH" : "POST";
      const r = await fetch("/api/admin/assets", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(modal) });
      if (!r.ok) { const e = await r.json(); alert("Hata: " + (e.error || "kaydedilemedi")); return; }
      setModal(null);
      await load();
    } finally { setSaving(false); }
  }
  async function remove(a: Asset) {
    if (!confirm(`"${a.model || a.type}" cihazı silinsin mi?`)) return;
    await fetch("/api/admin/assets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id }) });
    await load();
  }

  return (
    <div>
      {/* Özet */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: "14px", marginBottom: "18px" }}>
        <SumCard icon={<Server size={18} />} value={list.length} label="Toplam Cihaz" color="#0052ff" bg="#eff6ff" />
        <SumCard icon={<Cpu size={18} />} value={grouped.length} label="Müşteri" color="#7c3aed" bg="#f5f3ff" />
        <SumCard icon={<ShieldAlert size={18} />} value={warrantyAlerts} label="Garanti Uyarısı (60g)" color="#ea580c" bg="#fff7ed" />
      </div>

      {/* Üst bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "180px", maxWidth: "340px" }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Model, seri no, IP, firma ara..." style={{ ...inpS, paddingLeft: "34px" }} />
        </div>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ ...inpS, width: "auto", minWidth: "150px" }}>
          <option value="all">Tüm Tipler</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{TYPE_ICON[k]} {v}</option>)}
        </select>
        <button onClick={() => setModal({ type: "firewall", brand: "Fortinet", status: "active" })}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#0052ff", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
          <Plus size={15} /> Cihaz Ekle
        </button>
      </div>

      {/* Liste — firmaya göre gruplu */}
      {loading ? (
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Yükleniyor…</p>
      ) : grouped.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: "14px", border: "1px dashed #e5e7ef" }}>
          <p style={{ color: "#9ca3af", fontSize: "15px", margin: "0 0 14px" }}>Kayıtlı cihaz yok.</p>
          <button onClick={() => setModal({ type: "firewall", brand: "Fortinet", status: "active" })} style={{ padding: "10px 20px", background: "#0052ff", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>İlk Cihazı Ekle</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {grouped.map(([co, items]) => {
            const open = openCo[co] !== false; // varsayılan açık
            return (
              <div key={co} style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", overflow: "hidden" }}>
                <button onClick={() => setOpenCo(p => ({ ...p, [co]: !open }))} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", background: "#f8fafc", border: "none", borderBottom: open ? "1px solid #eef2f7" : "none", cursor: "pointer", textAlign: "left" }}>
                  {open ? <ChevronDown size={16} color="#6b7280" /> : <ChevronRight size={16} color="#6b7280" />}
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#1a1d2e", flex: 1 }}>{co}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", background: "#eef2f7", padding: "3px 10px", borderRadius: "20px" }}>{items.length} cihaz</span>
                </button>
                {open && (
                  <div style={{ display: "grid", gap: "0" }}>
                    {items.map(a => {
                      const wb = warrantyBadge(a.warranty_end);
                      return (
                        <div key={a.id} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", padding: "13px 18px", borderBottom: "1px solid #f5f7fa" }}>
                          <span style={{ fontSize: "22px", flexShrink: 0 }}>{TYPE_ICON[a.type] || "📦"}</span>
                          <div style={{ flex: 1, minWidth: "180px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1d2e" }}>{a.brand ? a.brand + " " : ""}{a.model || TYPE_LABEL[a.type]}</span>
                              {a.firmware && <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", padding: "1px 7px", borderRadius: "5px" }}>FW {a.firmware}</span>}
                              {wb && <span style={{ fontSize: "10.5px", fontWeight: 700, color: wb.color, background: wb.bg, padding: "1px 8px", borderRadius: "20px" }}>{wb.label}</span>}
                              {a.status !== "active" && <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#6b7280", background: "#f3f4f6", padding: "1px 8px", borderRadius: "20px" }}>Pasif</span>}
                            </div>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
                              {[a.serial_no && `SN: ${a.serial_no}`, a.ip_address && `IP: ${a.ip_address}`, a.location].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </div>
                          <span style={{ fontSize: "11.5px", color: "#9ca3af", minWidth: "90px" }}>Garanti: {fmtDate(a.warranty_end)}</span>
                          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            <button onClick={() => setModal(a)} title="Düzenle" style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #e5e7ef", background: "#fff", color: "#475569", cursor: "pointer" }}><Pencil size={13} /></button>
                            <button onClick={() => remove(a)} title="Sil" style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div onClick={() => !saving && setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "30px 16px", zIndex: 1000, overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "580px", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <h2 style={{ margin: "0 0 18px", fontSize: "17px", fontWeight: 800, color: "#1a1d2e" }}>{modal.id ? "Cihaz Düzenle" : "Yeni Cihaz"}</h2>
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Firma</label>
                  <select style={inpS} value={modal.company_id || ""} onChange={e => {
                    const co = companies.find(x => x.id === e.target.value);
                    setModal({ ...modal, company_id: e.target.value || null, company_name: co?.name || null });
                  }}>
                    <option value="">— Seçiniz —</option>
                    {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblS}>Cihaz Tipi</label>
                  <select style={inpS} value={modal.type || "firewall"} onChange={e => setModal({ ...modal, type: e.target.value })}>
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{TYPE_ICON[k]} {v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Marka</label>
                  <input style={inpS} value={modal.brand || ""} onChange={e => setModal({ ...modal, brand: e.target.value })} placeholder="Fortinet" />
                </div>
                <div>
                  <label style={lblS}>Model</label>
                  <input style={inpS} value={modal.model || ""} onChange={e => setModal({ ...modal, model: e.target.value })} placeholder="FortiGate 100F" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Seri No</label>
                  <input style={inpS} value={modal.serial_no || ""} onChange={e => setModal({ ...modal, serial_no: e.target.value })} placeholder="FG100F..." />
                </div>
                <div>
                  <label style={lblS}>Firmware / Sürüm</label>
                  <input style={inpS} value={modal.firmware || ""} onChange={e => setModal({ ...modal, firmware: e.target.value })} placeholder="FortiOS 7.4.3" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>IP Adresi</label>
                  <input style={inpS} value={modal.ip_address || ""} onChange={e => setModal({ ...modal, ip_address: e.target.value })} placeholder="192.168.1.1" />
                </div>
                <div>
                  <label style={lblS}>Konum / Lokasyon</label>
                  <input style={inpS} value={modal.location || ""} onChange={e => setModal({ ...modal, location: e.target.value })} placeholder="Merkez sistem odası" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lblS}>Alım Tarihi</label>
                  <input type="date" style={inpS} value={modal.purchase_date || ""} onChange={e => setModal({ ...modal, purchase_date: e.target.value })} />
                </div>
                <div>
                  <label style={lblS}>Garanti Bitiş</label>
                  <input type="date" style={inpS} value={modal.warranty_end || ""} onChange={e => setModal({ ...modal, warranty_end: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={lblS}>Not</label>
                <textarea style={{ ...inpS, minHeight: "60px", resize: "vertical" }} value={modal.notes || ""} onChange={e => setModal({ ...modal, notes: e.target.value })} />
              </div>
              {modal.id && (
                <div>
                  <label style={lblS}>Durum</label>
                  <select style={inpS} value={modal.status || "active"} onChange={e => setModal({ ...modal, status: e.target.value })}>
                    <option value="active">Aktif</option>
                    <option value="retired">Pasif / Hizmet dışı</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "22px", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} disabled={saving} style={{ padding: "10px 18px", background: "#fff", border: "1.5px solid #e5e7ef", borderRadius: "9px", color: "#6b7280", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>İptal</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 22px", background: "#0052ff", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? .6 : 1 }}>{saving ? "Kaydediliyor…" : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SumCard({ icon, value, label, color, bg }: { icon: React.ReactNode; value: string | number; label: string; color: string; bg: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7ef", borderRadius: "14px", padding: "16px 18px" }}>
      <div style={{ display: "inline-flex", padding: "7px", background: bg, color, borderRadius: "9px", marginBottom: "10px" }}>{icon}</div>
      <p style={{ fontSize: "28px", fontWeight: 900, color, margin: "0 0 2px", lineHeight: 1.1, fontFamily: "var(--font-family-headline)" }}>{value}</p>
      <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>{label}</p>
    </div>
  );
}
