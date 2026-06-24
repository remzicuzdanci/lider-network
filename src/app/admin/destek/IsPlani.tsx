"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus, X, Calendar, Flag, Building2, User,
  MoreHorizontal, Edit2, Trash2, Clock, ChevronLeft,
  ChevronRight, CheckCircle2, Circle, Columns,
  FolderKanban, CalendarDays, TrendingUp, AlertTriangle, Receipt,
  BarChart3, FileSpreadsheet, FileText, Download, PackageCheck,
} from "lucide-react";
import TeslimTutanagi from "./TeslimTutanagi";
import { showToast } from "@/lib/admin-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface WorkTask {
  id: string; title: string; description?: string;
  category: string; priority: string;
  status: "todo" | "in_progress" | "done";
  assigned_to?: string; company_id?: string;
  due_date?: string; created_by: string;
  created_at: string; updated_at?: string;
  billed?: boolean; billed_date?: string;
  products?: string; amount?: number;
  recurrence?: string;
  companies?: { name: string };
}

interface Project {
  id: string; name: string; description?: string;
  company_id?: string; phase: string; status: string;
  start_date?: string; end_date?: string;
  assigned_to?: string; notes?: string;
  created_by: string; created_at: string; updated_at?: string;
  billed?: boolean; billed_date?: string;
  companies?: { name: string };
}

interface Company { id: string; name: string; }

interface ServiceForm {
  id: string; task_id?: string; project_id?: string; company_id?: string;
  customer_name?: string; customer_phone?: string; customer_email?: string;
  customer_address?: string;
  service_description?: string; items_delivered?: string; notes?: string;
  signed_by?: string; signed_at?: string; sent_to_email?: string;
  form_type?: "service" | "delivery";
  status: "draft" | "sent" | "confirmed";
  created_at: string; updated_at?: string;
}

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */
// Removed - now passed as prop

const PHASES = [
  { id:"teklif",    label:"Teklif",    color:"#64748b", bg:"#f1f5f9" },
  { id:"sozlesme",  label:"Sözleşme",  color:"#7c3aed", bg:"#faf5ff" },
  { id:"kurulum",   label:"Kurulum",   color:"#d97706", bg:"#fffbeb" },
  { id:"test",      label:"Test",      color:"#0284c7", bg:"#f0f9ff" },
  { id:"teslim",    label:"Teslim",    color:"#059669", bg:"#ecfdf5" },
  { id:"garanti",   label:"Garanti",   color:"#dc2626", bg:"#fef2f2" },
];
const phaseMap = Object.fromEntries(PHASES.map(p => [p.id, p]));

const PROJ_STATUS = [
  { id:"active",    label:"Devam Ediyor", color:"#059669", bg:"#ecfdf5" },
  { id:"paused",    label:"Beklemede",    color:"#d97706", bg:"#fffbeb" },
  { id:"completed", label:"Tamamlandı",   color:"#0052ff", bg:"#eff6ff" },
  { id:"cancelled", label:"İptal",        color:"#dc2626", bg:"#fef2f2" },
];
const psMap = Object.fromEntries(PROJ_STATUS.map(p => [p.id, p]));

const TASK_CATS = [
  { value:"ziyaret",  label:"Müşteri Ziyareti", emoji:"🏢" },
  { value:"kurulum",  label:"Kurulum",           emoji:"🔧" },
  { value:"toplanti", label:"Toplantı",           emoji:"📞" },
  { value:"teklif",   label:"Teklif",             emoji:"📄" },
  { value:"destek",   label:"Teknik Destek",      emoji:"🛠️" },
  { value:"teslim",   label:"Ürün Teslimatı",    emoji:"📦" },
  { value:"rapor",    label:"Rapor",              emoji:"📊" },
  { value:"ic_gorev", label:"İç Görev",           emoji:"📋" },
  { value:"general",  label:"Diğer",              emoji:"⚡" },
];
const catMap = Object.fromEntries(TASK_CATS.map(c => [c.value, c]));

const PRIS = [
  { value:"urgent", label:"ACİL",   color:"#dc2626", bg:"#fef2f2" },
  { value:"high",   label:"Yüksek", color:"#ea580c", bg:"#fff7ed" },
  { value:"medium", label:"Orta",   color:"#d97706", bg:"#fffbeb" },
  { value:"low",    label:"Düşük",  color:"#64748b", bg:"#f1f5f9" },
];
const priMap = Object.fromEntries(PRIS.map(p => [p.value, p]));

const KAN_COLS = [
  { id:"todo"       as const, label:"Yapılacak",    color:"#475569", bg:"#f8fafc", border:"#e2e8f0" },
  { id:"in_progress"as const, label:"Devam Ediyor", color:"#7c3aed", bg:"#faf5ff", border:"#ddd6fe" },
  { id:"done"       as const, label:"Tamamlandı",   color:"#15803d", bg:"#f0fdf4", border:"#bbf7d0" },
];

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function useWindowSize() {
  const [size, setSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1200 });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

const inpS: React.CSSProperties = { padding:"9px 12px", background:"#fff", border:"1.5px solid #e5e7ef", borderRadius:"8px", color:"#1a1d2e", fontSize:"13px", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" };
const lblS: React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:700, color:"#374151", marginBottom:"5px", letterSpacing:".3px", textTransform:"uppercase" };

function todayStr() { return new Date().toISOString().slice(0,10); }

function dueBadge(due?: string, done?: boolean) {
  if (!due || done) return null;
  const diff = Math.ceil((new Date(due).getTime() - new Date(todayStr()).getTime()) / 86400000);
  if (diff < 0) return { label:`${Math.abs(diff)}g gecikti`, color:"#dc2626", bg:"#fef2f2" };
  if (diff === 0) return { label:"Bugün", color:"#ea580c", bg:"#fff7ed" };
  if (diff <= 2) return { label:`${diff}g kaldı`, color:"#d97706", bg:"#fffbeb" };
  return { label:new Date(due).toLocaleDateString("tr-TR",{day:"numeric",month:"short"}), color:"#9ca3af", bg:"#f1f5f9" };
}

function dateAdd(d: string, n: number) {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0,10);
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"});
}

/* ══════════════════════════════════════════════════════════════
   TASK MODAL
══════════════════════════════════════════════════════════════ */
function TaskModal({ task, defaultDate, companies, staff, onSave, onOpenServiceForm, onClose }: {
  task: Partial<WorkTask>|null; defaultDate?: string;
  companies: Company[]; staff: string[]; onSave: (t: Partial<WorkTask>) => Promise<unknown>; onOpenServiceForm?: (taskId: string) => void; onClose: () => void;
}) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [form, setForm] = useState<Partial<WorkTask>>(task ?? { category:"general", priority:"medium", status:"todo", due_date: defaultDate });
  const [saving, setSaving] = useState(false);
  function set<K extends keyof WorkTask>(k: K, v: WorkTask[K]) { setForm(f => ({...f,[k]:v})); }
  const inp = {...inpS, padding: isMobile?"14px":"9px 12px", fontSize: isMobile?"16px":"13px"};
  const lbl = {...lblS, fontSize: isMobile?"13px":"11px", marginBottom: isMobile?"8px":"5px"};

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"0":"20px" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff",borderRadius:isMobile?"0":"18px",padding:isMobile?"20px":"28px",width:"100%",maxWidth:isMobile?"100%":"480px",maxHeight:isMobile?"100vh":"auto",overflowY:isMobile?"auto":"visible",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
          <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#1a1d2e" }}>{form.id?"Görevi Düzenle":"Yeni Görev"}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af" }}><X size={18}/></button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); if(!form.title?.trim()) return; setSaving(true); try { await onSave(form); onClose(); } catch(err){ showToast("Kaydedilemedi: "+(err instanceof Error?err.message:"Bilinmeyen hata"), "error"); } finally { setSaving(false); } }}
          style={{ display:"flex",flexDirection:"column",gap:isMobile?"15px":"13px" }}>
          <div><label style={lbl}>Başlık *</label>
            <input type="text" value={form.title??""} required placeholder="Görevi kısaca açıklayın..." style={inp} onChange={e=>set("title",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div><label style={lbl}>Açıklama</label>
            <textarea value={form.description??""} rows={isMobile?3:2} style={{...inp,resize:"vertical"as const}} placeholder="Detay..." onChange={e=>set("description",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?"12px":"11px" }}>
            <div><label style={lbl}>Kategori</label>
              <select value={form.category??"general"} style={inp} onChange={e=>set("category",e.target.value)}>
                {TASK_CATS.map(c=><option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Öncelik</label>
              <select value={form.priority??"medium"} style={inp} onChange={e=>set("priority",e.target.value)}>
                {PRIS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?"12px":"11px" }}>
            <div><label style={lbl}>Atanan Kişi</label>
              <select value={form.assigned_to??""} style={inp} onChange={e=>set("assigned_to",e.target.value)}>
                <option value="">— Seçin —</option>
                {staff.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Bitiş Tarihi</label>
              <input type="date" value={form.due_date??""} style={inp} onChange={e=>set("due_date",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?"12px":"11px" }}>
            <div><label style={lbl}>Müşteri</label>
              <select value={form.company_id??""} style={inp} onChange={e=>set("company_id",e.target.value)}>
                <option value="">— Seçin —</option>
                {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Durum</label>
              <select value={form.status??"todo"} style={inp} onChange={e=>set("status",e.target.value as WorkTask["status"])}>
                {KAN_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>🔁 Tekrar</label>
            <select value={form.recurrence??"none"} style={inp} onChange={e=>set("recurrence",e.target.value)}>
              <option value="none">Tekrarlanmaz (tek seferlik)</option>
              <option value="daily">Her gün</option>
              <option value="weekly">Her hafta</option>
              <option value="monthly">Her ay</option>
              <option value="yearly">Her yıl</option>
            </select>
            {form.recurrence && form.recurrence!=="none" && <p style={{ margin:"4px 0 0",fontSize:"11px",color:"#9ca3af" }}>Görev tamamlandığında bir sonraki tarih otomatik oluşturulur.</p>}
          </div>
          {/* Teslimat kategorisinde adres ve ürün alanları */}
          {form.category === "teslim" && (
            <div style={{ background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:"8px",padding:isMobile?"14px":"12px 14px" }}>
              <div style={{ fontSize:isMobile?"13px":"11px",fontWeight:800,color:"#92400e",marginBottom:"10px" }}>📦 Teslimat Detayları</div>
              <div style={{ display:"flex",flexDirection:"column",gap:isMobile?"12px":"10px" }}>
                <div><label style={{...lbl,color:"#92400e"}}>Teslim Adresi</label>
                  <textarea value={(form as any).delivery_address??""} rows={2} placeholder="Teslimat adresi..." style={{...inp,resize:"vertical" as const}} onChange={e=>setForm(f=>({...f,delivery_address:e.target.value}))} onFocus={e=>(e.target.style.borderColor="#f59e0b")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
                </div>
                <div><label style={{...lbl,color:"#92400e"}}>Teslim Edilecek Ürünler</label>
                  <textarea value={form.products??""} rows={isMobile?3:3} placeholder="Örn:&#10;FortiGate 100F x1 (SN: FGT...)&#10;FortiSwitch 124F x2&#10;Kablo seti x1" style={{...inp,resize:"vertical" as const}} onChange={e=>set("products",e.target.value)} onFocus={e=>(e.target.style.borderColor="#f59e0b")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 160px",gap:"11px" }}>
                  <div><label style={{...lbl,color:"#92400e"}}>Teslim Alan Kişi</label>
                    <input type="text" value={(form as any).signed_by??""} placeholder="Ad Soyad..." style={inp} onChange={e=>setForm(f=>({...f,signed_by:e.target.value}))} onFocus={e=>(e.target.style.borderColor="#f59e0b")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
                  </div>
                  <div><label style={{...lbl,color:"#92400e"}}>Tutar (₺)</label>
                    <input type="number" min="0" step="0.01" value={form.amount??""} placeholder="0,00" style={inp} onChange={e=>set("amount",e.target.value===""?(undefined as any):Number(e.target.value))} onFocus={e=>(e.target.style.borderColor="#f59e0b")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={{ display:"flex",flexDirection:"column",gap:isMobile?"12px":"10px",padding:isMobile?"14px":"12px 14px",background:"#f8fafc",borderRadius:"8px",border:"1.5px solid #e5e7ef" }}>
            <div style={{ display:"flex",alignItems:"center",gap:isMobile?"10px":"8px" }}>
              <input type="checkbox" checked={form.billed??false} onChange={e=>{set("billed",e.target.checked);if(e.target.checked){if(!form.billed_date)set("billed_date",new Date().toISOString());}else set("billed_date",null as any);}} style={{ cursor:"pointer",width:isMobile?20:16,height:isMobile?20:16 }} id="billedCheckbox" />
              <label htmlFor="billedCheckbox" style={{ cursor:"pointer",fontSize:isMobile?"13px":"12px",fontWeight:700,color:"#374151",margin:0 }}>🧾 Bu görev faturalanacak (faturaya eklenecek)</label>
            </div>
            {form.billed && form.category !== "teslim" && (
              <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 160px",gap:isMobile?"12px":"11px" }}>
                <div><label style={lbl}>Ürünler / Hizmetler</label>
                  <textarea value={form.products??""} rows={isMobile?3:2} placeholder="Örn:&#10;ViewSonic 32&quot; 2K Monitör x1&#10;HDMI Kablo x2" style={{...inp,resize:"vertical"as const}} onChange={e=>set("products",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
                </div>
                <div><label style={lbl}>Tutar (₺)</label>
                  <input type="number" min="0" step="0.01" value={form.amount??""} placeholder="0,00" style={inp} onChange={e=>set("amount",e.target.value===""?(undefined as any):Number(e.target.value))} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
                </div>
              </div>
            )}
          </div>
          {form.id && (form.status==="done" || form.category==="teslim") && (
            <button type="button" onClick={()=>onOpenServiceForm?.(form.id!)}
              style={{ width:"100%",padding:isMobile?"14px":"10px",background:form.category==="teslim"?"linear-gradient(135deg,#d97706,#f59e0b)":"linear-gradient(135deg,#059669,#10b981)",border:"none",borderRadius:"8px",color:"#fff",fontSize:isMobile?"13px":"12px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",minHeight:isMobile?"44px":"auto" }}>
              {form.category==="teslim" ? "📦 Teslimat Formu Oluştur" : "📋 Servis Formu Oluştur"}
            </button>
          )}
          <div style={{ display:"flex",gap:isMobile?"8px":"10px",justifyContent:"flex-end",marginTop:"4px",flexWrap:isMobile?"wrap":"nowrap" }}>
            <button type="button" onClick={onClose} style={{ flex:isMobile?1:0,padding:isMobile?"12px 18px":"9px 18px",border:"1.5px solid #e5e7ef",borderRadius:"9px",background:"#fff",color:"#374151",fontSize:isMobile?"13px":"13px",fontWeight:600,cursor:"pointer",minHeight:isMobile?"44px":"auto" }}>İptal</button>
            <button type="submit" disabled={saving} style={{ flex:isMobile?1:0,padding:isMobile?"12px 22px":"9px 22px",border:"none",borderRadius:"9px",background:saving?"#d1d5db":"linear-gradient(135deg,#0038c7,#0052ff)",color:"#fff",fontSize:isMobile?"13px":"13px",fontWeight:700,cursor:saving?"not-allowed":"pointer",boxShadow:"0 4px 12px rgba(0,82,255,.28)",minHeight:isMobile?"44px":"auto" }}>
              {saving?"Kaydediliyor...":form.id?"Güncelle":"Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROJECT MODAL
══════════════════════════════════════════════════════════════ */
function ProjectModal({ project, companies, staff, onSave, onClose }: {
  project: Partial<Project>|null; companies: Company[]; staff: string[];
  onSave: (p: Partial<Project>) => Promise<void>; onClose: () => void;
}) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [form, setForm] = useState<Partial<Project>>(project ?? { phase:"teklif", status:"active" });
  const [saving, setSaving] = useState(false);
  function set<K extends keyof Project>(k: K, v: Project[K]) { setForm(f=>({...f,[k]:v})); }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"0":"20px" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff",borderRadius:isMobile?"0":"18px",padding:isMobile?"20px":"28px",width:"100%",maxWidth:isMobile?"100%":"520px",maxHeight:isMobile?"100vh":"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
          <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#1a1d2e" }}>{form.id?"Projeyi Düzenle":"Yeni Proje"}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af" }}><X size={18}/></button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); if(!form.name?.trim()) return; setSaving(true); await onSave(form); setSaving(false); }}
          style={{ display:"flex",flexDirection:"column",gap:"13px" }}>
          <div><label style={lblS}>Proje Adı *</label>
            <input type="text" value={form.name??""} required placeholder="Proje adı..." style={inpS} onChange={e=>set("name",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div><label style={lblS}>Açıklama</label>
            <textarea value={form.description??""} rows={2} style={{...inpS,resize:"vertical"as const}} placeholder="Proje hakkında kısa bilgi..." onChange={e=>set("description",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?"12px":"11px" }}>
            <div><label style={lblS}>Müşteri</label>
              <select value={form.company_id??""} style={inpS} onChange={e=>set("company_id",e.target.value)}>
                <option value="">— Seçin —</option>
                {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={lblS}>Sorumlu</label>
              <select value={form.assigned_to??""} style={inpS} onChange={e=>set("assigned_to",e.target.value)}>
                <option value="">— Seçin —</option>
                {staff.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?"12px":"11px" }}>
            <div><label style={lblS}>Başlangıç</label>
              <input type="date" value={form.start_date??""} style={inpS} onChange={e=>set("start_date",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
            <div><label style={lblS}>Bitiş</label>
              <input type="date" value={form.end_date??""} style={inpS} onChange={e=>set("end_date",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?"12px":"11px" }}>
            <div><label style={lblS}>Aşama</label>
              <select value={form.phase??"teklif"} style={inpS} onChange={e=>set("phase",e.target.value)}>
                {PHASES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div><label style={lblS}>Durum</label>
              <select value={form.status??"active"} style={inpS} onChange={e=>set("status",e.target.value)}>
                {PROJ_STATUS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lblS}>Notlar</label>
            <textarea value={form.notes??""} rows={2} style={{...inpS,resize:"vertical"as const}} placeholder="Özel notlar, hatırlatmalar..." onChange={e=>set("notes",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"11px 12px",background:"#f8fafc",borderRadius:"8px",border:"1.5px solid #e5e7ef" }}>
            <input type="checkbox" checked={form.billed??false} onChange={e=>{set("billed",e.target.checked);if(e.target.checked)set("billed_date",new Date().toISOString());else set("billed_date",null as any);}} style={{ cursor:"pointer",width:16,height:16 }} id="projBilledCheckbox" />
            <label htmlFor="projBilledCheckbox" style={{ cursor:"pointer",fontSize:"12px",fontWeight:600,color:"#374151",margin:0 }}>✓ Bu proje faturalandı</label>
          </div>
          <div style={{ display:"flex",gap:"10px",justifyContent:"flex-end",marginTop:"4px" }}>
            <button type="button" onClick={onClose} style={{ padding:"9px 18px",border:"1.5px solid #e5e7ef",borderRadius:"9px",background:"#fff",color:"#374151",fontSize:"13px",fontWeight:600,cursor:"pointer" }}>İptal</button>
            <button type="submit" disabled={saving} style={{ padding:"9px 22px",border:"none",borderRadius:"9px",background:saving?"#d1d5db":"linear-gradient(135deg,#0038c7,#0052ff)",color:"#fff",fontSize:"13px",fontWeight:700,cursor:saving?"not-allowed":"pointer",boxShadow:"0 4px 12px rgba(0,82,255,.28)" }}>
              {saving?"Kaydediliyor...":form.id?"Güncelle":"Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SERVICE FORM MODAL
══════════════════════════════════════════════════════════════ */
function ServiceFormModal({ form, task, project, companies, onSave, onSend, onClose }: {
  form: Partial<ServiceForm>|null; task?: WorkTask; project?: Project; companies: Company[];
  onSave: (f: Partial<ServiceForm>) => Promise<unknown>; onSend: (f: Partial<ServiceForm>) => Promise<void>; onClose: () => void;
}) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isDelivery = task?.category === "teslim";
  const accentColor = isDelivery ? "#f59e0b" : "#0052ff";

  const [f, setF] = useState<Partial<ServiceForm>>(form ?? {
    status:      "draft",
    task_id:     task?.id,
    project_id:  project?.id,
    company_id:  task?.company_id || project?.company_id,
    form_type:   isDelivery ? "delivery" : "service",
    // pre-fill from task if available
    items_delivered: task?.products || "",
    customer_address: (task as any)?.delivery_address || "",
    signed_by: (task as any)?.signed_by || "",
    signed_at: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  function set<K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) { setF(x=>({...x,[k]:v})); }

  const focusStyle = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => (e.target.style.borderColor = accentColor);
  const blurStyle  = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => (e.target.style.borderColor = "#e5e7ef");

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"0":"20px" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff",borderRadius:isMobile?"0":"18px",width:"100%",maxWidth:isMobile?"100%":"560px",maxHeight:isMobile?"100vh":"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>

        {/* Header */}
        <div style={{ padding:isMobile?"16px 20px":"18px 26px",borderBottom:"1px solid #f0f2f8",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            <div style={{ width:34,height:34,borderRadius:"8px",background:isDelivery?"#fffbeb":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px" }}>
              {isDelivery?"📦":"📋"}
            </div>
            <div>
              <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#1a1d2e" }}>
                {isDelivery ? "Ürün Teslimat Formu" : "Servis / Hizmet Formu"}
              </h3>
              {task && <p style={{ margin:0,fontSize:"11px",color:"#9ca3af" }}>{task.title}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af",padding:"4px" }}><X size={18}/></button>
        </div>

        <form onSubmit={async e=>{ e.preventDefault(); setSaving(true); try { await onSave(f); onClose(); } catch(err){ showToast("Kaydedilemedi: "+(err instanceof Error?err.message:"Hata"), "error"); } finally { setSaving(false); } }}
          style={{ padding:isMobile?"16px 20px":"20px 26px",display:"flex",flexDirection:"column",gap:"14px" }}>

          {/* Müşteri Bilgileri */}
          <div style={{ fontSize:"10px",fontWeight:800,color:accentColor,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"-6px" }}>
            Müşteri Bilgileri
          </div>
          <div><label style={lblS}>Müşteri Adı *</label>
            <input type="text" value={f.customer_name??""} required placeholder="Ad Soyad..." style={inpS} onChange={e=>set("customer_name",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>Telefon</label>
              <input type="tel" value={f.customer_phone??""} placeholder="0555 123 45 67" style={inpS} onChange={e=>set("customer_phone",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div><label style={lblS}>E-posta *</label>
              <input type="email" value={f.customer_email??""} required placeholder="musteri@email.com" style={inpS} onChange={e=>set("customer_email",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
          <div><label style={lblS}>{isDelivery ? "Teslimat Adresi" : "Müşteri Adresi"}</label>
            <textarea value={f.customer_address??""} placeholder="Mahalle, cadde, no, ilçe/il..." rows={2} style={{...inpS,resize:"vertical"as const}} onChange={e=>set("customer_address",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          {/* Hizmet / Teslimat */}
          <div style={{ fontSize:"10px",fontWeight:800,color:accentColor,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"-6px",marginTop:"2px" }}>
            {isDelivery ? "Teslimat Detayları" : "Hizmet Detayları"}
          </div>
          <div><label style={lblS}>{isDelivery ? "Ürün / Hizmet Açıklaması *" : "Yapılan Hizmet *"}</label>
            <textarea value={f.service_description??""} required placeholder={isDelivery?"Teslim edilen ürün veya hizmetin açıklaması...":"Yapılan çalışma, servis, bakım vb..."} rows={3} style={{...inpS,resize:"vertical"as const}} onChange={e=>set("service_description",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
          </div>
          <div><label style={lblS}>{isDelivery ? "Teslim Edilen Kalemler" : "Teslim Edilen Ürünler / Belgeler"}</label>
            <textarea value={f.items_delivered??""} placeholder={isDelivery?"Her satıra bir kalem:\nFortiGate 100F x1 (SN: FGT...)\nFortiSwitch 124F x2":"Verilen belgeler, teslim edilen ekipmanlar..."} rows={3} style={{...inpS,resize:"vertical"as const}} onChange={e=>set("items_delivered",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          {/* İmza & Tarih */}
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>{isDelivery ? "Teslim Alan Kişi" : "İmzalayan / Yetkili"}</label>
              <input type="text" value={f.signed_by??""} placeholder="Ad Soyad..." style={inpS} onChange={e=>set("signed_by",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div><label style={lblS}>Tarih</label>
              <input type="date" value={f.signed_at??""} style={inpS} onChange={e=>set("signed_at",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
          <div><label style={lblS}>Notlar</label>
            <textarea value={f.notes??""} placeholder="Ek notlar, özel istekler, uyarılar..." rows={2} style={{...inpS,resize:"vertical"as const}} onChange={e=>set("notes",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
          </div>
          {/* Gönderme e-postası — müşteri e-postasından otomatik dolar */}
          <div style={{ background:"#f8fafc",border:"1.5px solid #e5e7ef",borderRadius:"8px",padding:"12px 14px" }}>
            <label style={{...lblS,marginBottom:"8px"}}>Gönderilecek E-posta</label>
            <input type="email" value={f.sent_to_email ?? f.customer_email ?? ""} placeholder="musteri@email.com" style={inpS} onChange={e=>set("sent_to_email",e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            <p style={{ margin:"6px 0 0",fontSize:"11px",color:"#9ca3af" }}>Boş bırakılırsa yukarıdaki müşteri e-postasına gönderilir.</p>
          </div>

          {/* Butonlar */}
          <div style={{ display:"flex",gap:"10px",paddingTop:"4px",flexWrap:isMobile?"wrap":"nowrap" }}>
            <button type="button" onClick={onClose} style={{ padding:"10px 16px",border:"1.5px solid #e5e7ef",borderRadius:"9px",background:"#fff",color:"#374151",fontSize:"13px",fontWeight:600,cursor:"pointer" }}>İptal</button>
            <button type="submit" disabled={saving||sending} style={{ padding:"10px 16px",border:"1.5px solid #cbd5e1",borderRadius:"9px",background:"#f8fafc",color:"#334155",fontSize:"13px",fontWeight:700,cursor:(saving||sending)?"not-allowed":"pointer" }}>
              {saving?"Kaydediliyor...":"Taslak Kaydet"}
            </button>
            <button type="button" disabled={saving||sending}
              onClick={async()=>{
                if(!f.customer_name?.trim()){showToast("Müşteri adı gerekli","warning");return;}
                if(!f.service_description?.trim()){showToast(isDelivery?"Ürün açıklaması gerekli":"Hizmet açıklaması gerekli","warning");return;}
                const email = f.sent_to_email?.trim() || f.customer_email?.trim();
                if(!email){showToast("E-posta adresi gerekli","warning");return;}
                setSending(true);
                try { await onSend({...f, sent_to_email: email}); onClose(); }
                catch(err){ showToast("Gönderilemedi: "+(err instanceof Error?err.message:"Hata"), "error"); }
                finally { setSending(false); }
              }}
              style={{ flex:1,padding:"10px 20px",border:"none",borderRadius:"9px",fontWeight:700,fontSize:"13px",cursor:(saving||sending)?"not-allowed":"pointer",
                background:(saving||sending)?"#d1d5db":isDelivery?"linear-gradient(135deg,#d97706,#f59e0b)":"linear-gradient(135deg,#059669,#10b981)",
                color:"#fff",
                boxShadow:(saving||sending)?"none":isDelivery?"0 4px 12px rgba(245,158,11,.3)":"0 4px 12px rgba(16,185,129,.28)" }}>
              {sending?"Gönderiliyor...":isDelivery?"📦 Formu Gönder":"✓ Kaydet & Gönder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: PROJELER
══════════════════════════════════════════════════════════════ */
function ProjelerTab({ companies, staff }: { companies: Company[]; staff: string[] }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Project>|null|false>(false);
  const [filterStatus, setFS] = useState("");
  const [menuId, setMenuId] = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/projects");
    if (r.ok) setProjects(await r.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(form: Partial<Project>) {
    if (form.id) {
      const r = await fetch("/api/admin/projects", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      if (r.ok) { const u = await r.json(); setProjects(p=>p.map(x=>x.id===u.id?u:x)); }
    } else {
      const r = await fetch("/api/admin/projects", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      if (r.ok) { const c = await r.json(); setProjects(p=>[c,...p]); }
    }
    setModal(false);
  }

  async function del(id: string) {
    if (!confirm("Projeyi silmek istiyor musunuz?")) return;
    await fetch("/api/admin/projects", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) });
    setProjects(p=>p.filter(x=>x.id!==id));
  }

  const filtered = projects.filter(p=>!filterStatus||p.status===filterStatus);

  const PhaseBar = ({ phase }: { phase: string }) => (
    <div style={{ display:"flex",gap:"3px",marginTop:"10px" }}>
      {PHASES.map((ph,i) => {
        const phIdx = PHASES.findIndex(x=>x.id===phase);
        const done  = i < phIdx;
        const active= i === phIdx;
        return (
          <div key={ph.id} style={{ flex:1,height:"5px",borderRadius:"3px",
            background: done ? "#0052ff" : active ? ph.color : "#e5e7ef",
            opacity: done ? 1 : active ? 1 : 0.4,
          }} title={ph.label} />
        );
      })}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px" }}>
        <div style={{ display:"flex",gap:"8px",flexWrap:"wrap" }}>
          {[{id:"",label:"Tümü"},...PROJ_STATUS].map(s=>(
            <button key={s.id} onClick={()=>setFS(s.id)}
              style={{ padding:"5px 13px",borderRadius:"8px",border:`1.5px solid ${filterStatus===s.id?"#0052ff":"#e5e7ef"}`,background:filterStatus===s.id?"#eff6ff":"transparent",color:filterStatus===s.id?"#0052ff":"#64748b",fontSize:"12px",fontWeight:filterStatus===s.id?700:400,cursor:"pointer" }}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={()=>setModal({})} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"9px 16px",background:"linear-gradient(135deg,#0038c7,#0052ff)",color:"#fff",border:"none",borderRadius:"10px",fontSize:"13px",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(0,82,255,.3)" }}>
          <Plus size={14}/> Yeni Proje
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:"center",padding:"60px",color:"#9ca3af" }}>Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center",padding:"60px",color:"#cbd5e1" }}>
          <FolderKanban size={40} style={{ opacity:.3,marginBottom:"12px" }} />
          <p style={{ margin:0,fontSize:"14px" }}>Henüz proje yok</p>
        </div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"14px" }}>
          {filtered.map(proj => {
            const ps  = psMap[proj.status] ?? psMap["active"];
            const ph  = phaseMap[proj.phase] ?? PHASES[0];
            const daysLeft = proj.end_date ? Math.ceil((new Date(proj.end_date).getTime()-Date.now())/86400000) : null;
            return (
              <div key={proj.id} style={{ background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"14px",padding:"18px",boxShadow:"0 2px 8px rgba(0,0,0,.04)",transition:"box-shadow .15s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 6px 20px rgba(0,0,0,.09)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 2px 8px rgba(0,0,0,.04)"}>

                {/* Top */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px" }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:"0 0 4px",fontSize:"14px",fontWeight:800,color:"#1a1d2e",lineHeight:1.3 }}>{proj.name}</p>
                    {proj.companies?.name && (
                      <div style={{ display:"flex",alignItems:"center",gap:"4px" }}>
                        <Building2 size={11} color="#94a3b8"/>
                        <span style={{ fontSize:"12px",color:"#64748b" }}>{proj.companies.name}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ position:"relative",flexShrink:0 }}>
                    <button onClick={()=>setMenuId(menuId===proj.id?null:proj.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af",padding:"2px 5px" }}><MoreHorizontal size={15}/></button>
                    {menuId===proj.id && (
                      <div style={{ position:"absolute",right:0,top:"100%",zIndex:50,background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,.12)",minWidth:140,padding:"6px" }}
                        onMouseLeave={()=>setMenuId(null)}>
                        <button onClick={()=>{setModal(proj);setMenuId(null);}} style={{ display:"flex",alignItems:"center",gap:"6px",width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:"7px",background:"none",border:"none",fontSize:"12px",color:"#374151",cursor:"pointer" }}><Edit2 size={12}/>Düzenle</button>
                        <button onClick={()=>{del(proj.id);setMenuId(null);}} style={{ display:"flex",alignItems:"center",gap:"6px",width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:"7px",background:"none",border:"none",fontSize:"12px",color:"#dc2626",cursor:"pointer" }}><Trash2 size={12}/>Sil</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {proj.description && <p style={{ margin:"0 0 10px",fontSize:"12px",color:"#64748b",lineHeight:1.5 }}>{proj.description.slice(0,100)}{proj.description.length>100?"…":""}</p>}

                {/* Phase bar */}
                <div style={{ marginBottom:"10px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"4px" }}>
                    <span style={{ fontSize:"11px",fontWeight:700,color:ph.color,background:ph.bg,padding:"2px 7px",borderRadius:"5px" }}>{ph.label}</span>
                    <span style={{ fontSize:"11px",fontWeight:600,color:ps.color,background:ps.bg,padding:"2px 7px",borderRadius:"5px" }}>{ps.label}</span>
                  </div>
                  <PhaseBar phase={proj.phase} />
                </div>

                {/* Footer */}
                <div style={{ display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",paddingTop:"8px",borderTop:"1px solid #f1f5f9" }}>
                  {proj.assigned_to && (
                    <div style={{ display:"flex",alignItems:"center",gap:"4px" }}>
                      <div style={{ width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#0038c7,#0052ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:800,color:"#fff" }}>
                        {proj.assigned_to.split(" ").map(w=>w[0]).slice(0,2).join("")}
                      </div>
                      <span style={{ fontSize:"11.5px",color:"#64748b" }}>{proj.assigned_to.split(" ")[0]}</span>
                    </div>
                  )}
                  <div style={{ flex:1 }}/>
                  {proj.end_date && (
                    <span style={{ fontSize:"11px",display:"flex",alignItems:"center",gap:"3px",
                      color: daysLeft!==null&&daysLeft<0?"#dc2626":daysLeft!==null&&daysLeft<=7?"#d97706":"#64748b",
                      fontWeight: daysLeft!==null&&daysLeft<=7?700:400,
                    }}>
                      <Calendar size={11}/> {fmtDate(proj.end_date)}
                      {daysLeft!==null&&daysLeft<0&&<span style={{ marginLeft:3,fontWeight:800 }}>({Math.abs(daysLeft)}g gecikti)</span>}
                      {daysLeft!==null&&daysLeft>=0&&daysLeft<=7&&<span style={{ marginLeft:3,fontWeight:800 }}>({daysLeft}g kaldı)</span>}
                    </span>
                  )}
                </div>

                {proj.notes && (
                  <div style={{ marginTop:"10px",padding:"8px 10px",background:"#fffbeb",borderRadius:"8px",border:"1px solid #fde68a" }}>
                    <p style={{ margin:0,fontSize:"11.5px",color:"#92400e",lineHeight:1.5 }}>📝 {proj.notes.slice(0,120)}{proj.notes.length>120?"…":""}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal!==false && <ProjectModal project={modal} companies={companies} staff={staff} onSave={save} onClose={()=>setModal(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: GÜNLÜK GÖREVLER
══════════════════════════════════════════════════════════════ */
function GunlukTab({ tasks, onTaskSave, onTaskDelete, companies, staff, currentUserName = "", onOpenServiceForm }: {
  tasks: WorkTask[]; companies: Company[]; staff: string[]; currentUserName?: string;
  onTaskSave: (t: Partial<WorkTask>) => Promise<void>;
  onTaskDelete: (id: string) => Promise<void>;
  onOpenServiceForm?: (taskId: string) => void;
}) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width < 1024;

  const [date, setDate] = useState(todayStr());
  const [modal, setModal] = useState<Partial<WorkTask>|null|false>(false);
  const [filterPerson, setFP] = useState("");

  const dayTasks = tasks.filter(t => t.due_date===date && (!filterPerson || t.assigned_to===filterPerson));
  const grouped: Record<string, WorkTask[]> = {};
  dayTasks.forEach(t => {
    const k = t.assigned_to || "Atanmamış";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(t);
  });

  async function toggleDone(task: WorkTask) {
    const newStatus: WorkTask["status"] = task.status==="done" ? "todo" : "done";
    await onTaskSave({ ...task, status: newStatus });
  }

  const isToday = date === todayStr();

  return (
    <div>
      {/* Date nav */}
      <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px",flexWrap:"wrap" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"8px",background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"10px",padding:"6px 12px" }}>
          <button onClick={()=>setDate(dateAdd(date,-1))} style={{ background:"none",border:"none",cursor:"pointer",color:"#64748b",padding:"2px",display:"flex" }}><ChevronLeft size={16}/></button>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{ border:"none",outline:"none",fontSize:"14px",fontWeight:700,color:"#1a1d2e",fontFamily:"inherit",cursor:"pointer",background:"transparent" }} />
          <button onClick={()=>setDate(dateAdd(date,1))} style={{ background:"none",border:"none",cursor:"pointer",color:"#64748b",padding:"2px",display:"flex" }}><ChevronRight size={16}/></button>
        </div>
        {!isToday && <button onClick={()=>setDate(todayStr())} style={{ padding:"6px 12px",background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:"8px",color:"#1d4ed8",fontSize:"12px",fontWeight:700,cursor:"pointer" }}>Bugüne Dön</button>}
        <select value={filterPerson} onChange={e=>setFP(e.target.value)}
          style={{ padding:"7px 12px",border:"1.5px solid #e5e7ef",borderRadius:"8px",fontSize:"12px",color:filterPerson?"#0052ff":"#64748b",background:"#fff",cursor:"pointer",outline:"none" }}>
          <option value="">Tüm Personel</option>
          {staff.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ flex:1 }}/>
        <button onClick={()=>setModal({due_date:date,status:"todo"})}
          style={{ display:"flex",alignItems:"center",gap:"6px",padding:"8px 15px",background:"linear-gradient(135deg,#0038c7,#0052ff)",color:"#fff",border:"none",borderRadius:"9px",fontSize:"13px",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(0,82,255,.3)" }}>
          <Plus size={14}/> Görev Ekle
        </button>
      </div>

      {/* Stats strip */}
      <div style={{
        display:"flex",
        gap:isMobile?"10px":"12px",
        marginBottom:isMobile?"18px":"20px",
        flexWrap:"wrap"
      }}>
        {[
          { label:"Toplam",      value:dayTasks.length,                            color:"#0052ff" },
          { label:"Tamamlandı",  value:dayTasks.filter(t=>t.status==="done").length, color:"#15803d" },
          { label:"Bekliyor",    value:dayTasks.filter(t=>t.status!=="done").length, color:"#d97706" },
        ].map(s=>(
          <div key={s.label} style={{
            display:"flex",
            alignItems:"center",
            gap:isMobile?"8px":"6px",
            padding:isMobile?"10px 16px":"7px 14px",
            background:"#fff",
            border:"1.5px solid #e5e7ef",
            borderRadius:"9px",
            flex:isMobile?"1 0 calc(50% - 5px)":"none",
            justifyContent:"center"
          }}>
            <span style={{ fontSize:isMobile?"20px":"18px",fontWeight:900,color:s.color }}>{s.value}</span>
            <span style={{ fontSize:isMobile?"12px":"11px",color:"#9ca3af" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Task list */}
      {dayTasks.length === 0 ? (
        <div style={{ textAlign:"center",padding:"60px",color:"#cbd5e1" }}>
          <CalendarDays size={40} style={{ opacity:.3,marginBottom:"12px" }}/>
          <p style={{ margin:0,fontSize:"14px" }}>Bu tarihte görev yok</p>
          <button onClick={()=>setModal({due_date:date,status:"todo"})}
            style={{ marginTop:"14px",padding:"9px 20px",background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:"9px",color:"#0052ff",fontSize:"13px",fontWeight:700,cursor:"pointer" }}>
            + Görev Ekle
          </button>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:"16px" }}>
          {Object.entries(grouped).map(([person, pts]) => (
            <div key={person}>
              {/* Person header */}
              <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px" }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:person==="Atanmamış"?"#f1f5f9":"linear-gradient(135deg,#0038c7,#0052ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:800,color:person==="Atanmamış"?"#94a3b8":"#fff" }}>
                  {person==="Atanmamış"?"?":person.split(" ").map(w=>w[0]).slice(0,2).join("")}
                </div>
                <span style={{ fontSize:"13px",fontWeight:700,color:"#374151" }}>{person}</span>
                <span style={{ fontSize:"11px",color:"#94a3b8" }}>({pts.length} görev)</span>
                <div style={{ flex:1,height:1,background:"#f1f5f9" }}/>
              </div>

              {/* Tasks */}
              <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                {pts.map(task => {
                  const done  = task.status==="done";
                  const cat   = catMap[task.category]??catMap["general"];
                  const pri   = priMap[task.priority]??priMap["medium"];
                  const mine  = !!currentUserName && task.assigned_to===currentUserName;
                  return (
                    <div key={task.id} style={{ display:"flex",alignItems:"flex-start",gap:"10px",background:mine?"#eff6ff":"#fff",border:`1.5px solid ${mine?"#93c5fd":done?"#bbf7d0":"#e5e7ef"}`,borderLeft:mine?"4px solid #0052ff":undefined,borderRadius:"11px",padding:"12px 14px",transition:"all .15s",opacity:done?.7:1 }}>
                      <button onClick={()=>toggleDone(task)} style={{ background:"none",border:"none",cursor:"pointer",color:done?"#22c55e":"#cbd5e1",flexShrink:0,marginTop:"1px",padding:0 }}>
                        {done ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
                      </button>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px" }}>
                          <span style={{ fontSize:"13px" }}>{cat.emoji}</span>
                          <span style={{ fontSize:"13.5px",fontWeight:700,color:"#1a1d2e",textDecoration:done?"line-through":"none" }}>{task.title}</span>
                          {task.recurrence && task.recurrence!=="none" && <span title="Tekrarlayan görev" style={{ fontSize:"10px",fontWeight:800,padding:"1px 6px",borderRadius:"5px",background:"#eef2ff",color:"#4338ca" }}>🔁 {({daily:"Günlük",weekly:"Haftalık",monthly:"Aylık",yearly:"Yıllık"} as Record<string,string>)[task.recurrence]}</span>}
                        </div>
                        {task.description && <p style={{ margin:"0 0 6px",fontSize:"12px",color:"#64748b",lineHeight:1.5 }}>{task.description}</p>}
                        <div style={{ display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap" }}>
                          <span style={{ fontSize:"10.5px",fontWeight:700,padding:"2px 7px",borderRadius:"5px",background:pri.bg,color:pri.color }}>{pri.label}</span>
                          {task.companies?.name && <span style={{ fontSize:"11px",color:"#64748b",display:"flex",alignItems:"center",gap:"3px" }}><Building2 size={10}/>{task.companies.name}</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex",gap:"6px",flexShrink:0 }}>
                        <button onClick={()=>setModal(task)} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af",padding:"3px" }}><Edit2 size={13}/></button>
                        <button onClick={()=>onTaskDelete(task.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#fca5a5",padding:"3px" }}><Trash2 size={13}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal!==false && <TaskModal task={modal} defaultDate={date} companies={companies} staff={staff} onSave={onTaskSave} onOpenServiceForm={onOpenServiceForm} onClose={()=>setModal(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: KANBAN
══════════════════════════════════════════════════════════════ */
const DONE_PAGE_SIZE = 10;

function KanbanTab({ tasks, onTaskSave, onTaskDelete, companies, staff, currentUserName = "", onOpenServiceForm }: {
  tasks: WorkTask[]; companies: Company[]; staff: string[]; currentUserName?: string;
  onTaskSave: (t: Partial<WorkTask>) => Promise<void>;
  onTaskDelete: (id: string) => Promise<void>;
  onOpenServiceForm?: (taskId: string) => void;
}) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width < 1024;

  const [modal, setModal] = useState<Partial<WorkTask>|null|false>(false);
  const [filterPri, setFP] = useState("");
  const [menuId, setMenuId] = useState<string|null>(null);
  const [doneLimit, setDoneLimit] = useState(DONE_PAGE_SIZE);

  const filtered = tasks.filter(t=>!filterPri||t.priority===filterPri);
  const byCol = (s: WorkTask["status"]) => filtered.filter(t=>t.status===s);

  return (
    <div>
      <div style={{ display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center" }}>
        <select value={filterPri} onChange={e=>setFP(e.target.value)}
          style={{ padding:"7px 12px",border:"1.5px solid #e5e7ef",borderRadius:"8px",fontSize:"12px",color:filterPri?"#0052ff":"#64748b",background:"#fff",cursor:"pointer",outline:"none" }}>
          <option value="">Tüm Öncelikler</option>
          {PRIS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {filterPri&&<button onClick={()=>setFP("")} style={{ padding:"6px 10px",border:"1.5px solid #fca5a5",borderRadius:"8px",fontSize:"12px",color:"#dc2626",background:"#fef2f2",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px" }}><X size={11}/>Temizle</button>}
        <div style={{ flex:1 }}/>
        <button onClick={()=>setModal({})} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"8px 15px",background:"linear-gradient(135deg,#0038c7,#0052ff)",color:"#fff",border:"none",borderRadius:"9px",fontSize:"13px",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(0,82,255,.3)" }}>
          <Plus size={14}/> Görev Ekle
        </button>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr",
        gap: isMobile ? "12px" : "14px",
        alignItems:"start",
        overflowX: isMobile ? "hidden" : "visible"
      }}>
        {KAN_COLS.map(col=>{
          const allColTasks = byCol(col.id);
          const isDone = col.id === "done";
          // Tamamlandı kolonunu son eklenenlerden itibaren sınırla
          const colTasks = isDone
            ? [...allColTasks].sort((a,b)=>new Date(b.updated_at||b.created_at).getTime()-new Date(a.updated_at||a.created_at).getTime()).slice(0, doneLimit)
            : allColTasks;
          return (
            <div key={col.id} style={{ background:col.bg,border:`1.5px solid ${col.border}`,borderRadius:"14px",padding:"14px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:"7px" }}>
                  <div style={{ width:9,height:9,borderRadius:"50%",background:col.color }}/>
                  <span style={{ fontSize:"13px",fontWeight:800,color:col.color }}>{col.label}</span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:"7px" }}>
                  <span style={{ fontSize:"11px",fontWeight:700,color:col.color,background:col.border,padding:"2px 8px",borderRadius:"10px" }}>{allColTasks.length}</span>
                  <button onClick={()=>setModal({status:col.id})} style={{ background:"none",border:`1px dashed ${col.border}`,borderRadius:"6px",cursor:"pointer",color:col.color,padding:"2px 6px",display:"flex",alignItems:"center" }}><Plus size={12}/></button>
                </div>
              </div>

              {colTasks.length===0 ? (
                <div style={{ textAlign:"center",padding:"28px 12px",color:"#cbd5e1",fontSize:"12px" }}>Görev yok</div>
              ) : colTasks.map(task=>{
                const cat = catMap[task.category]??catMap["general"];
                const pri = priMap[task.priority]??priMap["medium"];
                const due = dueBadge(task.due_date,task.status==="done");
                const mine = !!currentUserName && task.assigned_to===currentUserName;
                return (
                  <div key={task.id} style={{ background:mine?"#eff6ff":"#fff",border:`1.5px solid ${mine?"#93c5fd":"#e5e7ef"}`,borderLeft:mine?"4px solid #0052ff":"1.5px solid #e5e7ef",borderRadius:"11px",padding:"13px",marginBottom:"9px",boxShadow:"0 1px 4px rgba(0,0,0,.04)",transition:"box-shadow .15s" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 4px 12px rgba(0,0,0,.09)"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 1px 4px rgba(0,0,0,.04)"}>

                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"7px" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:"5px" }}>
                        <span style={{ fontSize:"14px" }}>{cat.emoji}</span>
                        <span style={{ fontSize:"11px",fontWeight:600,color:"#64748b" }}>{cat.label}</span>
                      </div>
                      <div style={{ position:"relative" }}>
                        <button onClick={()=>setMenuId(menuId===task.id?null:task.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af",padding:"1px 3px" }}><MoreHorizontal size={14}/></button>
                        {menuId===task.id && (
                          <div style={{ position:"absolute",right:0,top:"100%",zIndex:50,background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,.12)",minWidth:150,padding:"5px" }}
                            onMouseLeave={()=>setMenuId(null)}>
                            {KAN_COLS.filter(c=>c.id!==task.status).map(c=>(
                              <button key={c.id} onClick={async()=>{setMenuId(null);try{await onTaskSave({id:task.id,status:c.id});}catch(err){showToast("Durum değiştirilemedi: "+(err instanceof Error?err.message:"Hata"),"error");}}}
                                style={{ display:"block",width:"100%",textAlign:"left",padding:"6px 10px",borderRadius:"7px",background:"none",border:"none",fontSize:"12px",color:c.color,cursor:"pointer",fontWeight:600 }}>
                                → {c.label}
                              </button>
                            ))}
                            <div style={{ height:1,background:"#f1f5f9",margin:"3px 0" }}/>
                            <button onClick={()=>{setModal(task);setMenuId(null);}} style={{ display:"flex",alignItems:"center",gap:"5px",width:"100%",textAlign:"left",padding:"6px 10px",borderRadius:"7px",background:"none",border:"none",fontSize:"12px",color:"#374151",cursor:"pointer" }}><Edit2 size={11}/>Düzenle</button>
                            <button onClick={()=>{onTaskDelete(task.id);setMenuId(null);}} style={{ display:"flex",alignItems:"center",gap:"5px",width:"100%",textAlign:"left",padding:"6px 10px",borderRadius:"7px",background:"none",border:"none",fontSize:"12px",color:"#dc2626",cursor:"pointer" }}><Trash2 size={11}/>Sil</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p style={{ margin:"0 0 8px",fontSize:"13px",fontWeight:700,color:"#1a1d2e",lineHeight:1.4,textDecoration:task.status==="done"?"line-through":"none",opacity:task.status==="done"?.6:1 }}>{task.recurrence && task.recurrence!=="none" && <span title="Tekrarlayan görev" style={{ marginRight:"5px" }}>🔁</span>}{task.title}</p>
                    {task.companies?.name && <div style={{ display:"flex",alignItems:"center",gap:"3px",marginBottom:"7px" }}><Building2 size={10} color="#94a3b8"/><span style={{ fontSize:"11px",color:"#64748b" }}>{task.companies.name}</span></div>}

                    <div style={{ display:"flex",flexWrap:"wrap",alignItems:"center",gap:"5px" }}>
                      <span style={{ fontSize:"10px",fontWeight:700,padding:"2px 6px",borderRadius:"4px",background:pri.bg,color:pri.color }}>{pri.label}</span>
                      {due&&<span style={{ fontSize:"10px",fontWeight:600,padding:"2px 6px",borderRadius:"4px",background:due.bg,color:due.color,display:"flex",alignItems:"center",gap:"2px" }}><Clock size={9}/>{due.label}</span>}
                      <div style={{ flex:1 }}/>
                      {task.assigned_to&&<div style={{ width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#0038c7,#0052ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",fontWeight:800,color:"#fff" }}>{task.assigned_to.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>}
                    </div>
                  </div>
                );
              })}

              {/* Tamamlandı kolonunda sayfalama */}
              {isDone && allColTasks.length > DONE_PAGE_SIZE && (
                <div style={{ marginTop:"10px",display:"flex",gap:"6px",justifyContent:"center" }}>
                  {doneLimit < allColTasks.length && (
                    <button onClick={()=>setDoneLimit(d=>d+DONE_PAGE_SIZE)}
                      style={{ flex:1,padding:"7px 10px",borderRadius:"8px",border:`1px solid ${col.border}`,background:"#fff",color:col.color,fontSize:"12px",fontWeight:700,cursor:"pointer" }}>
                      + {Math.min(DONE_PAGE_SIZE, allColTasks.length-doneLimit)} daha göster
                    </button>
                  )}
                  {doneLimit > DONE_PAGE_SIZE && (
                    <button onClick={()=>setDoneLimit(DONE_PAGE_SIZE)}
                      style={{ padding:"7px 10px",borderRadius:"8px",border:`1px solid ${col.border}`,background:"#fff",color:"#94a3b8",fontSize:"12px",fontWeight:600,cursor:"pointer" }}>
                      Gizle
                    </button>
                  )}
                </div>
              )}
              {isDone && allColTasks.length > DONE_PAGE_SIZE && (
                <p style={{ margin:"8px 0 0",textAlign:"center",fontSize:"11px",color:"#9ca3af" }}>
                  {Math.min(doneLimit,allColTasks.length)}/{allColTasks.length} görev
                </p>
              )}
            </div>
          );
        })}
      </div>

      {modal!==false && <TaskModal task={modal} companies={companies} staff={staff} onSave={onTaskSave} onOpenServiceForm={onOpenServiceForm} onClose={()=>setModal(false)} />}
    </div>
  );
}

function FaturandiTab({
  tasks, projects, companies, staff, onTaskSave, onProjectSave
}: {
  tasks: WorkTask[]; projects: Project[]; companies: Company[]; staff: string[];
  onTaskSave: (task: Partial<WorkTask>) => Promise<unknown>; onProjectSave: (project: Project) => void;
}) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [monthOffset, setMonthOffset] = useState(0);
  const [editTask, setEditTask] = useState<WorkTask|false>(false);
  const now = new Date();
  const month = now.getMonth() - monthOffset;
  const year = now.getFullYear() + (monthOffset > 11 ? -1 : monthOffset < -11 ? 1 : 0);
  const monthStart = new Date(year, month, 1).toISOString().slice(0, 10);
  const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const billedTasks = tasks.filter(t => t.billed && t.billed_date && t.billed_date.slice(0, 10) >= monthStart && t.billed_date.slice(0, 10) <= monthEnd);
  const billedProjects = projects.filter(p => p.billed && p.billed_date && p.billed_date.slice(0, 10) >= monthStart && p.billed_date.slice(0, 10) <= monthEnd);

  const fmtTL = (n?: number) => (n || n === 0) ? `${Number(n).toLocaleString("tr-TR",{minimumFractionDigits:0,maximumFractionDigits:2})} ₺` : "—";
  const grandTotal = billedTasks.reduce((s,t)=>s+(Number(t.amount)||0),0);

  const grouped: Record<string, { tasks: WorkTask[]; projects: Project[] }> = {};
  billedTasks.forEach(t => {
    const cid = t.company_id || "unknown";
    if (!grouped[cid]) grouped[cid] = { tasks: [], projects: [] };
    grouped[cid].tasks.push(t);
  });
  billedProjects.forEach(p => {
    const cid = p.company_id || "unknown";
    if (!grouped[cid]) grouped[cid] = { tasks: [], projects: [] };
    grouped[cid].projects.push(p);
  });

  const monthLabel = new Date(year, month).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div>
      <div style={{ display:"flex",gap:"10px",alignItems:"center",marginBottom:"16px",flexWrap:"wrap" }}>
        <button onClick={()=>setMonthOffset(monthOffset+1)} style={{ background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"8px",padding:"7px 12px",cursor:"pointer",fontSize:"13px",color:"#64748b",fontWeight:600 }}>← Geçen Ay</button>
        <span style={{ fontSize:"14px",fontWeight:700,color:"#1a1d2e",minWidth:140 }}>{monthLabel}</span>
        <button onClick={()=>setMonthOffset(monthOffset-1)} disabled={monthOffset===0} style={{ background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"8px",padding:"7px 12px",cursor:"pointer",fontSize:"13px",color:"#64748b",fontWeight:600,opacity:monthOffset===0?.5:1 }}>Gelecek Ay →</button>
      </div>

      {/* Toplam faturalanacak tutar */}
      {billedTasks.length > 0 && (
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,#0038c7,#0052ff)",borderRadius:"12px",padding:isMobile?"16px":"16px 22px",marginBottom:"18px",color:"#fff" }}>
          <div>
            <p style={{ margin:0,fontSize:"12px",opacity:.85 }}>Bu ay faturalanacak ({billedTasks.length} görev)</p>
            <p style={{ margin:"3px 0 0",fontSize:isMobile?"22px":"26px",fontWeight:900,lineHeight:1 }}>{fmtTL(grandTotal)}</p>
          </div>
          <Receipt size={isMobile?30:38} style={{ opacity:.6 }}/>
        </div>
      )}

      {Object.entries(grouped).map(([cid, { tasks: cTasks, projects: cProjects }]) => {
        const company = companies.find(c => c.id === cid);
        const cTotal = cTasks.reduce((s,t)=>s+(Number(t.amount)||0),0);
        return (
          <div key={cid} style={{ background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"11px",padding:"16px",marginBottom:"16px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",gap:"8px" }}>
              <h4 style={{ margin:0,fontSize:"14px",fontWeight:700,color:"#1a1d2e",display:"flex",alignItems:"center",gap:"7px" }}><Building2 size={16} color="#0052ff"/>{company?.name||"Bilinmeyen"}</h4>
              {cTotal>0 && <span style={{ fontSize:"13px",fontWeight:800,color:"#0052ff",whiteSpace:"nowrap" }}>{fmtTL(cTotal)}</span>}
            </div>

            {cTasks.length > 0 && (
              <div style={{ marginBottom:"12px" }}>
                <p style={{ margin:"0 0 8px",fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase" }}>Görevler ({cTasks.length})</p>
                {cTasks.map(t=>(
                  <div key={t.id} onClick={()=>setEditTask(t)} style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 12px",background:"#f8fafc",border:"1px solid #eef2f7",borderRadius:"8px",marginBottom:"6px",fontSize:"12px",cursor:"pointer",gap:"10px" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#eff6ff"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#f8fafc"}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700,color:"#1a1d2e",fontSize:"13px" }}>{t.title}</span>
                        <span style={{ fontSize:"11px",color:"#94a3b8" }}>{new Date(t.billed_date!).toLocaleDateString("tr-TR")}</span>
                      </div>
                      {t.products && <div style={{ marginTop:"4px",fontSize:"12px",color:"#475569",whiteSpace:"pre-line",lineHeight:1.5 }}>{t.products}</div>}
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px" }}>
                      <span style={{ fontWeight:800,color:"#0052ff",fontSize:"13px",whiteSpace:"nowrap" }}>{fmtTL(t.amount)}</span>
                      <div style={{ display:"flex",gap:"5px" }}>
                        <button onClick={e=>{e.stopPropagation();setEditTask(t);}} style={{ background:"#eff6ff",color:"#0052ff",border:"none",borderRadius:"5px",padding:"3px 8px",fontSize:"11px",fontWeight:600,cursor:"pointer" }}>Düzenle</button>
                        <button onClick={e=>{e.stopPropagation();onTaskSave({id:t.id,billed:false,billed_date:null as any});}} style={{ background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:"5px",padding:"3px 8px",fontSize:"11px",fontWeight:600,cursor:"pointer" }}>Geri Al</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cProjects.length > 0 && (
              <div>
                <p style={{ margin:"0 0 8px",fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase" }}>Projeler ({cProjects.length})</p>
                {cProjects.map(p=>(
                  <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"#f0fdf4",borderRadius:"7px",marginBottom:"5px",fontSize:"12px" }}>
                    <div>
                      <span style={{ fontWeight:600,color:"#1a1d2e" }}>{p.name}</span>
                      <span style={{ fontSize:"11px",color:"#94a3b8",marginLeft:"8px" }}>{new Date(p.billed_date!).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <button onClick={()=>onProjectSave({...p,billed:false})} style={{ background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:"5px",padding:"3px 8px",fontSize:"11px",fontWeight:600,cursor:"pointer" }}>Geri Al</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(grouped).length === 0 && (
        <div style={{ textAlign:"center",padding:"40px 20px",color:"#94a3b8" }}>
          <p style={{ fontSize:"13px" }}>Bu ayda faturalanacak işlem yok.</p>
        </div>
      )}

      {editTask!==false && <TaskModal task={editTask} companies={companies} staff={staff} onSave={onTaskSave} onClose={()=>setEditTask(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   TAB: RAPORLAR (yalnızca super_admin)
══════════════════════════════════════════════════════════════ */
type Period = "today" | "week" | "month" | "all" | "custom";

// jsPDF standart fontu Türkçe ş/ğ/ı/İ karakterlerini gösteremediği için
// PDF çıktısında okunabilir ASCII karşılıklarına çeviriyoruz.
function trAscii(s: string): string {
  return (s ?? "")
    .replace(/ş/g,"s").replace(/Ş/g,"S")
    .replace(/ğ/g,"g").replace(/Ğ/g,"G")
    .replace(/ı/g,"i").replace(/İ/g,"I")
    .replace(/ç/g,"c").replace(/Ç/g,"C")
    .replace(/ö/g,"o").replace(/Ö/g,"O")
    .replace(/ü/g,"u").replace(/Ü/g,"U");
}

function RaporlarTab({ tasks, companies, staff }: { tasks: WorkTask[]; companies: Company[]; staff: string[] }) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [period, setPeriod] = useState<Period>("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [fStaff, setFStaff] = useState("");      // "" = tüm personel
  const [fCompany, setFCompany] = useState("");  // "" = tüm müşteri ("none" = atanmamış)

  const companyName = useCallback(
    (id?: string) => companies.find(c => c.id === id)?.name || "Atanmamış",
    [companies]
  );
  const fmtTL = (n?: number) => (n || n === 0) ? `${Number(n).toLocaleString("tr-TR",{minimumFractionDigits:0,maximumFractionDigits:2})} ₺` : "—";
  const statusLabel = (s: string) => KAN_COLS.find(k => k.id === s)?.label ?? s;

  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const end = new Date(now); end.setHours(23,59,59,999);
    if (period === "custom" && cStart) {
      const s = new Date(cStart); s.setHours(0,0,0,0);
      const e = cEnd ? new Date(cEnd) : new Date(now); e.setHours(23,59,59,999);
      const fmt = (d: string) => d ? new Date(d).toLocaleDateString("tr-TR") : "bugün";
      return { startDate:s, endDate:e, periodLabel:`${fmt(cStart)} – ${fmt(cEnd)}` };
    }
    if (period === "today") { const s = new Date(now); s.setHours(0,0,0,0); return { startDate:s, endDate:end, periodLabel:"Bugün" }; }
    if (period === "week")  { const s = new Date(now); s.setDate(now.getDate()-7); s.setHours(0,0,0,0); return { startDate:s, endDate:end, periodLabel:"Son 7 Gün" }; }
    if (period === "month") { const s = new Date(now); s.setDate(now.getDate()-30); s.setHours(0,0,0,0); return { startDate:s, endDate:end, periodLabel:"Son 30 Gün" }; }
    return { startDate: new Date(0), endDate:end, periodLabel:"Tüm Zamanlar" };
  }, [period, cStart, cEnd]);

  const filtered = useMemo(
    () => tasks.filter(t => {
      const d = new Date(t.created_at);
      if (d < startDate || d > endDate) return false;
      if (fStaff && t.assigned_to !== fStaff) return false;
      if (fCompany) { const cid = t.company_id || "none"; if (cid !== fCompany) return false; }
      return true;
    }),
    [tasks, startDate, endDate, fStaff, fCompany]
  );

  // ── Personel performansı (tutar dahil) ──
  const perf = useMemo(() => {
    const map = new Map<string, { name:string; total:number; done:number; prog:number; todo:number; billed:number; amount:number }>();
    filtered.forEach(t => {
      const name = t.assigned_to || "Atanmamış";
      const r = map.get(name) || { name, total:0, done:0, prog:0, todo:0, billed:0, amount:0 };
      r.total++;
      if (t.status === "done") r.done++; else if (t.status === "in_progress") r.prog++; else r.todo++;
      if (t.billed) { r.billed++; r.amount += Number(t.amount) || 0; }
      map.set(name, r);
    });
    return [...map.values()].map(r => ({ ...r, rate: r.total ? Math.round(r.done/r.total*100) : 0 })).sort((a,b) => b.total - a.total);
  }, [filtered]);

  // ── Müşteri bazlı rapor (tutar dahil) ──
  const byCompany = useMemo(() => {
    const map = new Map<string, { name:string; total:number; done:number; prog:number; todo:number; billed:number; amount:number }>();
    filtered.forEach(t => {
      const key = t.company_id || "none";
      const name = t.company_id ? companyName(t.company_id) : "Müşteri Atanmamış";
      const row = map.get(key) || { name, total:0, done:0, prog:0, todo:0, billed:0, amount:0 };
      row.total++;
      if (t.status === "done") row.done++;
      else if (t.status === "in_progress") row.prog++;
      else row.todo++;
      if (t.billed) { row.billed++; row.amount += Number(t.amount) || 0; }
      map.set(key, row);
    });
    return [...map.values()].sort((a,b) => b.total - a.total);
  }, [filtered, companyName]);

  // ── Detay liste (hangi işler) ──
  const detail = useMemo(
    () => [...filtered].sort((a,b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [filtered]
  );

  const totals = useMemo(() => ({
    total:  filtered.length,
    done:   filtered.filter(t => t.status === "done").length,
    prog:   filtered.filter(t => t.status === "in_progress").length,
    todo:   filtered.filter(t => t.status === "todo").length,
    billed: filtered.filter(t => t.billed).length,
    amount: filtered.reduce((s,t) => s + (t.billed ? (Number(t.amount)||0) : 0), 0),
  }), [filtered]);

  const dateTag = new Date().toLocaleDateString("tr-TR").replace(/\./g,"-");

  // ── Excel çıktısı (3 sayfa) ──
  function exportExcel() {
    const wb = XLSX.utils.book_new();

    const perfSheet = XLSX.utils.aoa_to_sheet([
      [`Personel Performans Raporu — ${periodLabel}`],
      [],
      ["Personel","Toplam Görev","Tamamlanan","Devam Eden","Bekleyen","Faturalanan","Tutar (₺)","Tamamlama %"],
      ...perf.map(p => [p.name, p.total, p.done, p.prog, p.todo, p.billed, p.amount, `%${p.rate}`]),
      [],
      ["TOPLAM", totals.total, totals.done, totals.prog, totals.todo, totals.billed, totals.amount, ""],
    ]);
    perfSheet["!cols"] = [{wch:22},{wch:13},{wch:12},{wch:12},{wch:11},{wch:13},{wch:14},{wch:13}];
    XLSX.utils.book_append_sheet(wb, perfSheet, "Performans");

    const compSheet = XLSX.utils.aoa_to_sheet([
      [`Müşteri Bazlı Rapor — ${periodLabel}`],
      [],
      ["Müşteri","Toplam Görev","Tamamlanan","Devam Eden","Bekleyen","Faturalanan","Tutar (₺)"],
      ...byCompany.map(c => [c.name, c.total, c.done, c.prog, c.todo, c.billed, c.amount]),
    ]);
    compSheet["!cols"] = [{wch:28},{wch:13},{wch:12},{wch:12},{wch:11},{wch:13},{wch:14}];
    XLSX.utils.book_append_sheet(wb, compSheet, "Müşteri Bazlı");

    const detSheet = XLSX.utils.aoa_to_sheet([
      [`Görev Detayı — ${periodLabel}`],
      [],
      ["Görev","Personel","Müşteri","Kategori","Durum","Bitiş Tarihi","Faturalanacak","Tutar (₺)","Ürünler"],
      ...detail.map(t => [
        t.title,
        t.assigned_to || "—",
        t.company_id ? companyName(t.company_id) : "—",
        catMap[t.category]?.label ?? t.category,
        statusLabel(t.status),
        t.due_date ? new Date(t.due_date).toLocaleDateString("tr-TR") : "—",
        t.billed ? "Evet" : "Hayır",
        t.billed ? (Number(t.amount)||0) : "",
        t.products || "",
      ]),
    ]);
    detSheet["!cols"] = [{wch:32},{wch:16},{wch:22},{wch:16},{wch:13},{wch:13},{wch:13},{wch:13},{wch:30}];
    XLSX.utils.book_append_sheet(wb, detSheet, "Görev Detayı");

    XLSX.writeFile(wb, `Lider-Network-Rapor-${periodLabel.replace(/[ /]/g,"_")}-${dateTag}.xlsx`);
  }

  // ── PDF çıktısı (özet + 3 tablo) ──
  function exportPDF() {
    const doc = new jsPDF();
    const tl = (n: number) => `${Number(n).toLocaleString("tr-TR")} TL`;
    const lastY = () => (doc as unknown as { lastAutoTable:{ finalY:number } }).lastAutoTable.finalY;

    doc.setFontSize(17); doc.setTextColor(0,82,255);
    doc.text("LIDER NETWORK", 14, 18);
    doc.setFontSize(11); doc.setTextColor(60);
    doc.text(trAscii(`Is Plani Raporu — ${periodLabel}`), 14, 26);
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text(`Olusturma: ${new Date().toLocaleDateString("tr-TR")}${fStaff?` | Personel: ${trAscii(fStaff)}`:""}${fCompany?` | Musteri: ${trAscii(fCompany==="none"?"Atanmamis":companyName(fCompany))}`:""}`, 14, 32);

    // Özet satırı
    doc.setFontSize(9); doc.setTextColor(40);
    doc.text(trAscii(`Toplam: ${totals.total}   Biten: ${totals.done}   Devam: ${totals.prog}   Bekleyen: ${totals.todo}   Faturalanacak: ${totals.billed}   Tutar: ${tl(totals.amount)}`), 14, 39);

    autoTable(doc, {
      startY: 44,
      head: [["Personel","Toplam","Biten","Devam","Bekleyen","Fatura","Tutar","%"]],
      body: [
        ...perf.map(p => [trAscii(p.name), p.total, p.done, p.prog, p.todo, p.billed, tl(p.amount), `%${p.rate}`]),
        [{ content:"TOPLAM", styles:{ fontStyle:"bold" } }, totals.total, totals.done, totals.prog, totals.todo, totals.billed, tl(totals.amount), ""],
      ],
      headStyles: { fillColor: [0,82,255] },
      styles: { fontSize: 8 },
      didParseCell: (d) => { if (d.row.index === perf.length && d.section === "body") d.cell.styles.fontStyle = "bold"; },
    });

    doc.setFontSize(11); doc.setTextColor(30);
    doc.text(trAscii("Musteri Bazli Rapor"), 14, lastY() + 9);
    autoTable(doc, {
      startY: lastY() + 12,
      head: [["Musteri","Toplam","Biten","Devam","Bekleyen","Fatura","Tutar"]],
      body: byCompany.map(c => [trAscii(c.name), c.total, c.done, c.prog, c.todo, c.billed, tl(c.amount)]),
      headStyles: { fillColor: [16,185,129] },
      styles: { fontSize: 8 },
    });

    doc.setFontSize(11); doc.setTextColor(30);
    doc.text(trAscii("Gorev Detayi"), 14, lastY() + 9);
    autoTable(doc, {
      startY: lastY() + 12,
      head: [["Gorev","Personel","Musteri","Durum","Bitis","Tutar"]],
      body: detail.map(t => [
        trAscii(t.title),
        trAscii(t.assigned_to || "—"),
        trAscii(t.company_id ? companyName(t.company_id) : "—"),
        trAscii(statusLabel(t.status)),
        t.due_date ? new Date(t.due_date).toLocaleDateString("tr-TR") : "—",
        t.billed ? tl(Number(t.amount)||0) : "—",
      ]),
      headStyles: { fillColor: [100,116,139] },
      styles: { fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 55 } },
    });

    doc.save(`Lider-Network-Rapor-${trAscii(periodLabel).replace(/[ /]/g,"_")}-${dateTag}.pdf`);
  }

  const card  = { background:"#fff", border:"1px solid #e5e7ef", borderRadius:"13px", padding:isMobile?"16px":"20px", marginBottom:"18px" } as const;
  const th     = { padding:"10px 12px", fontSize:"11px", fontWeight:700, color:"#64748b", textTransform:"uppercase" as const, textAlign:"left" as const, borderBottom:"2px solid #e5e7ef", whiteSpace:"nowrap" as const };
  const thN    = { ...th, textAlign:"center" as const };
  const td     = { padding:"11px 12px", fontSize:"13px", color:"#1a1d2e", borderBottom:"1px solid #f1f5f9" };
  const tdN    = { ...td, textAlign:"center" as const, fontWeight:600 };

  const PERIODS: { id:Period; label:string }[] = [
    { id:"today", label:"Bugün" },
    { id:"week",  label:"Son 7 Gün" },
    { id:"month", label:"Son 30 Gün" },
    { id:"all",   label:"Tümü" },
    { id:"custom", label:"Özel Tarih" },
  ];
  const sel = { padding:isMobile?"11px 10px":"8px 11px", borderRadius:"8px", border:"1.5px solid #e5e7ef", fontSize:"13px", color:"#1a1d2e", background:"#fff", cursor:"pointer", outline:"none" } as const;

  return (
    <div>
      {/* Üst bar: dönem seçimi + dışa aktarma */}
      <div style={{ display:"flex",flexDirection:isMobile?"column":"row",gap:"12px",justifyContent:"space-between",alignItems:isMobile?"stretch":"center",marginBottom:"18px" }}>
        <div style={{ display:"flex",gap:"6px",background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"11px",padding:"4px",overflowX:"auto" }}>
          {PERIODS.map(p=>(
            <button key={p.id} onClick={()=>setPeriod(p.id)}
              style={{ padding:isMobile?"10px 12px":"7px 14px",borderRadius:"8px",border:"none",whiteSpace:"nowrap",
                background:period===p.id?"linear-gradient(135deg,#0038c7,#0052ff)":"transparent",
                color:period===p.id?"#fff":"#64748b",fontSize:"13px",fontWeight:period===p.id?700:500,cursor:"pointer" }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",gap:"8px" }}>
          <button onClick={exportExcel}
            style={{ flex:isMobile?1:0,display:"flex",alignItems:"center",justifyContent:"center",gap:"7px",padding:isMobile?"11px 14px":"9px 16px",borderRadius:"9px",border:"none",background:"linear-gradient(135deg,#15803d,#22c55e)",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(34,197,94,.25)" }}>
            <FileSpreadsheet size={15}/> Excel
          </button>
          <button onClick={exportPDF}
            style={{ flex:isMobile?1:0,display:"flex",alignItems:"center",justifyContent:"center",gap:"7px",padding:isMobile?"11px 14px":"9px 16px",borderRadius:"9px",border:"none",background:"linear-gradient(135deg,#b91c1c,#ef4444)",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(239,68,68,.25)" }}>
            <FileText size={15}/> PDF
          </button>
        </div>
      </div>

      {/* Filtreler: özel tarih + personel + müşteri */}
      <div style={{ display:"flex",flexWrap:"wrap",gap:"10px",alignItems:"center",marginBottom:"18px",background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"11px",padding:isMobile?"12px":"12px 14px" }}>
        {period==="custom" && (
          <>
            <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
              <span style={{ fontSize:"12px",color:"#64748b",fontWeight:600 }}>Başlangıç</span>
              <input type="date" value={cStart} onChange={e=>setCStart(e.target.value)} style={sel} />
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
              <span style={{ fontSize:"12px",color:"#64748b",fontWeight:600 }}>Bitiş</span>
              <input type="date" value={cEnd} onChange={e=>setCEnd(e.target.value)} style={sel} />
            </div>
          </>
        )}
        <select value={fStaff} onChange={e=>setFStaff(e.target.value)} style={sel}>
          <option value="">👤 Tüm Personel</option>
          {staff.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fCompany} onChange={e=>setFCompany(e.target.value)} style={sel}>
          <option value="">🏢 Tüm Müşteriler</option>
          {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="none">Müşteri Atanmamış</option>
        </select>
        {(fStaff||fCompany||period==="custom") && (
          <button onClick={()=>{setFStaff("");setFCompany("");setCStart("");setCEnd("");setPeriod("month");}}
            style={{ padding:isMobile?"11px 12px":"8px 12px",borderRadius:"8px",border:"1.5px solid #fecaca",background:"#fef2f2",color:"#dc2626",fontSize:"12px",fontWeight:700,cursor:"pointer" }}>Temizle</button>
        )}
      </div>

      {/* Özet kutuları */}
      <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(6,1fr)",gap:"12px",marginBottom:"18px" }}>
        {[
          { label:"Toplam Görev", value:totals.total,  color:"#0052ff" },
          { label:"Tamamlanan",   value:totals.done,   color:"#15803d" },
          { label:"Devam Eden",   value:totals.prog,   color:"#7c3aed" },
          { label:"Bekleyen",     value:totals.todo,   color:"#d97706" },
          { label:"Faturalanacak", value:totals.billed, color:"#0891b2" },
          { label:"Toplam Tutar", value:fmtTL(totals.amount), color:"#dc2626", small:true },
        ].map(s=>(
          <div key={s.label} style={{ background:"#fff",border:"1px solid #e5e7ef",borderTop:`3px solid ${s.color}`,borderRadius:"12px",padding:isMobile?"14px":"16px" }}>
            <p style={{ fontSize:s.small?(isMobile?"15px":"17px"):(isMobile?"24px":"26px"),fontWeight:900,color:s.color,margin:"0 0 4px",lineHeight:1.1 }}>{s.value}</p>
            <p style={{ fontSize:"11.5px",color:"#9ca3af",margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Personel performans tablosu */}
      <div style={card}>
        <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px" }}>
          <TrendingUp size={16} color="#0052ff"/>
          <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#1a1d2e" }}>Personel Performansı <span style={{ fontSize:"12px",fontWeight:600,color:"#94a3b8" }}>({periodLabel})</span></h3>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",minWidth:"560px" }}>
            <thead><tr>
              <th style={th}>Personel</th>
              <th style={thN}>Toplam</th>
              <th style={thN}>Biten</th>
              <th style={thN}>Devam</th>
              <th style={thN}>Bekleyen</th>
              <th style={thN}>Fatura</th>
              <th style={{...thN,textAlign:"right"}}>Tutar</th>
              <th style={thN}>Tamamlama</th>
            </tr></thead>
            <tbody>
              {perf.map(p=>(
                <tr key={p.name}>
                  <td style={{ ...td,fontWeight:700 }}>{p.name}</td>
                  <td style={tdN}>{p.total}</td>
                  <td style={{ ...tdN,color:"#15803d" }}>{p.done}</td>
                  <td style={{ ...tdN,color:"#7c3aed" }}>{p.prog}</td>
                  <td style={{ ...tdN,color:"#d97706" }}>{p.todo}</td>
                  <td style={{ ...tdN,color:"#0891b2" }}>{p.billed}</td>
                  <td style={{ ...td,textAlign:"right",fontWeight:700,color:"#dc2626",whiteSpace:"nowrap" }}>{p.amount?fmtTL(p.amount):"—"}</td>
                  <td style={tdN}>
                    <div style={{ display:"flex",alignItems:"center",gap:"7px",justifyContent:"center" }}>
                      <div style={{ width:"54px",height:"7px",background:"#eef2f7",borderRadius:"4px",overflow:"hidden" }}>
                        <div style={{ width:`${p.rate}%`,height:"100%",background:p.rate>=70?"#22c55e":p.rate>=40?"#f59e0b":"#ef4444" }}/>
                      </div>
                      <span style={{ fontSize:"12px",fontWeight:700 }}>%{p.rate}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {perf.length===0 && <tr><td colSpan={8} style={{ ...td,textAlign:"center",color:"#94a3b8",padding:"24px" }}>Bu dönemde görev yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Müşteri bazlı rapor tablosu */}
      <div style={card}>
        <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px" }}>
          <Building2 size={16} color="#15803d"/>
          <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#1a1d2e" }}>Müşteri Bazlı Rapor <span style={{ fontSize:"12px",fontWeight:600,color:"#94a3b8" }}>({periodLabel})</span></h3>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",minWidth:"520px" }}>
            <thead><tr>
              <th style={th}>Müşteri</th>
              <th style={thN}>Toplam</th>
              <th style={thN}>Biten</th>
              <th style={thN}>Devam</th>
              <th style={thN}>Bekleyen</th>
              <th style={thN}>Fatura</th>
              <th style={{...thN,textAlign:"right"}}>Tutar</th>
            </tr></thead>
            <tbody>
              {byCompany.map(c=>(
                <tr key={c.name}>
                  <td style={{ ...td,fontWeight:700 }}>{c.name}</td>
                  <td style={tdN}>{c.total}</td>
                  <td style={{ ...tdN,color:"#15803d" }}>{c.done}</td>
                  <td style={{ ...tdN,color:"#7c3aed" }}>{c.prog}</td>
                  <td style={{ ...tdN,color:"#d97706" }}>{c.todo}</td>
                  <td style={{ ...tdN,color:"#0891b2" }}>{c.billed}</td>
                  <td style={{ ...td,textAlign:"right",fontWeight:700,color:"#dc2626",whiteSpace:"nowrap" }}>{c.amount?fmtTL(c.amount):"—"}</td>
                </tr>
              ))}
              {byCompany.length===0 && <tr><td colSpan={7} style={{ ...td,textAlign:"center",color:"#94a3b8",padding:"24px" }}>Bu dönemde görev yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Görev detay listesi (hangi işler) */}
      <div style={card}>
        <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px" }}>
          <CalendarDays size={16} color="#7c3aed"/>
          <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#1a1d2e" }}>Görev Detayı <span style={{ fontSize:"12px",fontWeight:600,color:"#94a3b8" }}>({detail.length} görev · {periodLabel})</span></h3>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",minWidth:"720px" }}>
            <thead><tr>
              <th style={th}>Görev</th>
              <th style={th}>Personel</th>
              <th style={th}>Müşteri</th>
              <th style={th}>Kategori</th>
              <th style={thN}>Durum</th>
              <th style={thN}>Bitiş</th>
              <th style={{...thN,textAlign:"right"}}>Tutar</th>
            </tr></thead>
            <tbody>
              {detail.map(t=>{
                const kc = KAN_COLS.find(k=>k.id===t.status);
                return (
                  <tr key={t.id}>
                    <td style={{ ...td,fontWeight:600,maxWidth:240 }}>{t.title}</td>
                    <td style={td}>{t.assigned_to||"—"}</td>
                    <td style={td}>{t.company_id?companyName(t.company_id):"—"}</td>
                    <td style={{ ...td,color:"#64748b" }}>{catMap[t.category]?.label??t.category}</td>
                    <td style={tdN}>
                      <span style={{ fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"6px",background:kc?.bg||"#f1f5f9",color:kc?.color||"#64748b",whiteSpace:"nowrap" }}>{statusLabel(t.status)}</span>
                    </td>
                    <td style={{ ...tdN,fontWeight:500,color:"#64748b",whiteSpace:"nowrap" }}>{t.due_date?new Date(t.due_date).toLocaleDateString("tr-TR"):"—"}</td>
                    <td style={{ ...td,textAlign:"right",fontWeight:700,color:"#dc2626",whiteSpace:"nowrap" }}>{t.billed?fmtTL(t.amount):"—"}</td>
                  </tr>
                );
              })}
              {detail.length===0 && <tr><td colSpan={7} style={{ ...td,textAlign:"center",color:"#94a3b8",padding:"24px" }}>Bu filtrede görev yok</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type InnerTab = "projeler" | "gunluk" | "kanban" | "faturalandı" | "teslimat" | "raporlar";

type DeliveryInit = { customer_name: string; company_id: string | null; items: { name: string; qty: number; unit: string }[] };

export default function IsPlani({ companies, staff = [], currentUserName = "", currentUserRole = "staff", openDelivery, onDeliveryOpened }: { companies: Company[]; staff?: string[]; currentUserName?: string; currentUserRole?: string; openDelivery?: DeliveryInit | null; onDeliveryOpened?: () => void }) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width < 1024;

  const [innerTab, setInnerTab] = useState<InnerTab>("gunluk");
  const [tasks, setTasks]       = useState<WorkTask[]>([]);
  const [tasksLoaded, setTL]    = useState(false);
  // Tekliflerden otomatik doldurma
  const [pendingDelivery, setPendingDelivery] = useState<DeliveryInit | null>(null);
  useEffect(() => {
    if (openDelivery) {
      setPendingDelivery(openDelivery);
      setInnerTab("teslimat");
      onDeliveryOpened?.();
    }
  }, [openDelivery, onDeliveryOpened]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoaded, setPL] = useState(false);
  const [serviceForms, setServiceForms] = useState<ServiceForm[]>([]);
  const [formsLoaded, setFL] = useState(false);
  const [serviceFormModal, setServiceFormModal] = useState<Partial<ServiceForm>|false>(false);

  /* ── Task CRUD (shared across tabs) ──────────────────────── */
  const loadTasks = useCallback(async () => {
    const r = await fetch("/api/admin/tasks");
    if (r.ok) { setTasks(await r.json()); setTL(true); }
  }, []);

  const loadProjects = useCallback(async () => {
    const r = await fetch("/api/admin/projects");
    if (r.ok) { setProjects(await r.json()); setPL(true); }
  }, []);

  const loadServiceForms = useCallback(async () => {
    const r = await fetch("/api/admin/service-forms");
    if (r.ok) { setServiceForms(await r.json()); setFL(true); }
  }, []);

  useEffect(() => { loadTasks(); loadProjects(); loadServiceForms(); }, [loadTasks, loadProjects, loadServiceForms]);

  async function saveTask(form: Partial<WorkTask>) {
    if (form.id) {
      const r = await fetch("/api/admin/tasks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||"Görev güncellenemedi");}
      const u=await r.json();setTasks(p=>p.map(t=>t.id===u.id?{...t,...u}:t));
    } else {
      const r = await fetch("/api/admin/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||"Görev oluşturulamadı");}
      const c=await r.json();setTasks(p=>[c,...p]);
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Bu görevi silmek istiyor musunuz?")) return;
    await fetch("/api/admin/tasks",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setTasks(p=>p.filter(t=>t.id!==id));
  }

  /* ── Project CRUD ────────────────────────────────────────── */
  async function saveProject(form: Partial<Project>) {
    if (form.id) {
      const r = await fetch("/api/admin/projects",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (r.ok){const u=await r.json();setProjects(p=>p.map(pr=>pr.id===u.id?{...pr,...u}:pr));}
    } else {
      const r = await fetch("/api/admin/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (r.ok){const c=await r.json();setProjects(p=>[c,...p]);}
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Bu projeyi silmek istiyor musunuz?")) return;
    await fetch("/api/admin/projects",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setProjects(p=>p.filter(pr=>pr.id!==id));
  }

  /* ── Service Form CRUD ───────────────────────────────────── */
  async function saveServiceForm(form: Partial<ServiceForm>): Promise<ServiceForm> {
    if (form.id) {
      const r = await fetch("/api/admin/service-forms",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||"Form kaydedilemedi");}
      const u=await r.json();setServiceForms(p=>p.map(sf=>sf.id===u.id?{...sf,...u}:sf));return u;
    } else {
      const r = await fetch("/api/admin/service-forms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||"Form oluşturulamadı");}
      const c=await r.json();setServiceForms(p=>[c,...p]);return c;
    }
  }

  async function sendServiceForm(form: Partial<ServiceForm>) {
    // 1) Save first to get an id and persist latest data
    const saved = await saveServiceForm(form);
    // 2) Trigger email send via API
    const r = await fetch("/api/admin/service-forms/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ id: saved.id })});
    if (!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||"E-posta gönderilemedi");}
    const updated = await r.json();
    setServiceForms(p=>p.map(sf=>sf.id===updated.id?{...sf,...updated}:sf));
  }

  async function deleteServiceForm(id: string) {
    if (!confirm("Bu formu silmek istiyor musunuz?")) return;
    await fetch("/api/admin/service-forms",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setServiceForms(p=>p.filter(sf=>sf.id!==id));
  }

  /* ── Stats ───────────────────────────────────────────────── */
  const today      = todayStr();
  const todayTasks = tasks.filter(t=>t.due_date===today);
  const overdue    = tasks.filter(t=>t.status!=="done"&&t.due_date&&t.due_date<today);
  const inProgress = tasks.filter(t=>t.status==="in_progress");
  const doneToday  = tasks.filter(t=>t.status==="done"&&t.updated_at?.slice(0,10)===today);

  const isSuperAdmin = currentUserRole === "super_admin";
  const INNER_TABS: { id: InnerTab; label: string; icon: React.ReactNode }[] = [
    { id:"gunluk",   label:"Günlük Görevler", icon:<CalendarDays size={14}/> },
    { id:"kanban",   label:"Kanban Board",    icon:<Columns size={14}/> },
    { id:"projeler", label:"Projeler",        icon:<FolderKanban size={14}/> },
    { id:"faturalandı", label:"Faturalanacak",  icon:<Receipt size={14}/> },
    { id:"teslimat", label:"Teslim Tutanağı", icon:<PackageCheck size={14}/> },
    ...(isSuperAdmin ? [{ id:"raporlar" as InnerTab, label:"Raporlar", icon:<BarChart3 size={14}/> }] : []),
  ];

  return (
    <div style={{ padding:isMobile?"16px 16px":"28px 32px",background:"#f8fafc",minHeight:"100%",fontFamily:"inherit" }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ marginBottom:"22px" }}>
        <h2 style={{ margin:"0 0 3px",fontSize:"20px",fontWeight:800,color:"#1a1d2e" }}>İş Planı</h2>
        <p style={{ margin:0,fontSize:"13px",color:"#64748b" }}>Projeler, görevler ve günlük iş takibi</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────── */}
      <div style={{
        display:"grid",
        gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,1fr)":"repeat(4,1fr)",
        gap:isMobile?"14px":"12px",
        marginBottom:isMobile?"18px":"22px"
      }}>
        {[
          { label:"Devam Eden Görev",     value:inProgress.length,  color:"#7c3aed", border:"#7c3aed", icon:<TrendingUp size={isMobile?16:14} color="#7c3aed"/> },
          { label:"Bugün Yapılacak",      value:todayTasks.filter(t=>t.status!=="done").length, color:"#0052ff", border:"#0052ff", icon:<CalendarDays size={isMobile?16:14} color="#0052ff"/> },
          { label:"Gecikmiş",             value:overdue.length,      color:"#dc2626", border:"#dc2626", icon:<AlertTriangle size={isMobile?16:14} color="#dc2626"/> },
          { label:"Bugün Tamamlandı",     value:doneToday.length,    color:"#15803d", border:"#15803d", icon:<CheckCircle2 size={isMobile?16:14} color="#15803d"/> },
        ].map(s=>(
          <div key={s.label} onClick={()=>setInnerTab("gunluk")}
            style={{
              background:"#fff",
              border:`1px solid #e5e7ef`,
              borderRadius:"13px",
              padding:isMobile?"18px 16px":"16px 18px",
              borderTop:`3px solid ${s.border}`,
              cursor:"pointer",
              transition:"box-shadow .15s",
              minHeight:isMobile?"100px":"auto"
            }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(0,0,0,.08)"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="none"}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isMobile?"12px":"8px" }}>
              <p style={{ fontSize:isMobile?"32px":"28px",fontWeight:900,color:s.color,margin:0,lineHeight:1 }}>{s.value}</p>
              <div style={{ padding:isMobile?"8px":"6px",background:`${s.color}12`,borderRadius:"8px" }}>{s.icon}</div>
            </div>
            <p style={{ fontSize:isMobile?"12.5px":"11.5px",color:"#9ca3af",margin:0,lineHeight:1.4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Inner tabs ───────────────────────────────────────── */}
      <div style={{
        display:"flex",
        gap:isMobile?"6px":"4px",
        background:"#fff",
        border:"1.5px solid #e5e7ef",
        borderRadius:"12px",
        padding:isMobile?"8px":"4px",
        marginBottom:isMobile?"18px":"20px",
        width:isMobile?"100%":"fit-content",
        overflowX:isMobile?"auto":"visible",
        overflowY:"hidden",
        WebkitOverflowScrolling:"touch"
      }}>
        {INNER_TABS.map(t=>(
          <button key={t.id} onClick={()=>setInnerTab(t.id)}
            style={{
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              gap:isMobile?"6px":"6px",
              padding:isMobile?"10px 14px":"7px 16px",
              borderRadius:"9px",
              border:"none",
              background:innerTab===t.id?"linear-gradient(135deg,#0038c7,#0052ff)":"transparent",
              color:innerTab===t.id?"#fff":"#64748b",
              fontSize:isMobile?"12px":"13px",
              fontWeight:innerTab===t.id?700:500,
              cursor:"pointer",
              transition:"all .15s",
              whiteSpace:"nowrap",
              minHeight:isMobile?"44px":"auto"
            }}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────── */}
      {innerTab==="projeler" && <ProjelerTab companies={companies} staff={staff} />}
      {innerTab==="gunluk" && tasksLoaded && <GunlukTab tasks={tasks} companies={companies} staff={staff} currentUserName={currentUserName} onTaskSave={saveTask} onTaskDelete={deleteTask} onOpenServiceForm={(taskId)=>setServiceFormModal({task_id:taskId,status:"draft"})} />}
      {innerTab==="kanban" && tasksLoaded && <KanbanTab tasks={tasks} companies={companies} staff={staff} currentUserName={currentUserName} onTaskSave={saveTask} onTaskDelete={deleteTask} onOpenServiceForm={(taskId)=>setServiceFormModal({task_id:taskId,status:"draft"})} />}
      {innerTab==="faturalandı" && tasksLoaded && projectsLoaded && <FaturandiTab tasks={tasks} projects={projects} companies={companies} staff={staff} onTaskSave={saveTask} onProjectSave={saveProject} />}
      {innerTab==="teslimat" && <TeslimTutanagi companies={companies} currentUserName={currentUserName} staff={staff} isMobile={isMobile} initialNote={pendingDelivery ?? undefined} onInitialNoteConsumed={() => setPendingDelivery(null)} />}
      {innerTab==="raporlar" && isSuperAdmin && tasksLoaded && <RaporlarTab tasks={tasks} companies={companies} staff={staff} />}

      {serviceFormModal!==false && <ServiceFormModal form={serviceFormModal} companies={companies} onSave={saveServiceForm} onSend={sendServiceForm} onClose={()=>setServiceFormModal(false)} />}
    </div>
  );
}
