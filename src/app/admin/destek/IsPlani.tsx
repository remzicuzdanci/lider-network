"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, X, Calendar, Flag, Building2, User,
  MoreHorizontal, Edit2, Trash2, Clock, ChevronLeft,
  ChevronRight, CheckCircle2, Circle, Columns,
  FolderKanban, CalendarDays, TrendingUp, AlertTriangle, Receipt,
} from "lucide-react";

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
  service_description?: string; items_delivered?: string; notes?: string;
  signed_by?: string; signed_at?: string; sent_to_email?: string;
  status: "draft" | "sent" | "confirmed";
  created_at: string; updated_at?: string;
}

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */
const STAFF = ["Remzi Cuzdancı","Ahmet Yılmaz","Mehmet Kaya","Fatma Demir","Ali Öztürk","Ayşe Çelik"];

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
function TaskModal({ task, defaultDate, companies, onSave, onOpenServiceForm, onClose }: {
  task: Partial<WorkTask>|null; defaultDate?: string;
  companies: Company[]; onSave: (t: Partial<WorkTask>) => Promise<void>; onOpenServiceForm?: (taskId: string) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<WorkTask>>(task ?? { category:"general", priority:"medium", status:"todo", due_date: defaultDate });
  const [saving, setSaving] = useState(false);
  function set<K extends keyof WorkTask>(k: K, v: WorkTask[K]) { setForm(f => ({...f,[k]:v})); }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff",borderRadius:"18px",padding:"28px",width:"100%",maxWidth:"480px",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
          <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#1a1d2e" }}>{form.id?"Görevi Düzenle":"Yeni Görev"}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af" }}><X size={18}/></button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); if(!form.title?.trim()) return; setSaving(true); await onSave(form); setSaving(false); }}
          style={{ display:"flex",flexDirection:"column",gap:"13px" }}>
          <div><label style={lblS}>Başlık *</label>
            <input type="text" value={form.title??""} required placeholder="Görevi kısaca açıklayın..." style={inpS} onChange={e=>set("title",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div><label style={lblS}>Açıklama</label>
            <textarea value={form.description??""} rows={2} style={{...inpS,resize:"vertical"as const}} placeholder="Detay..." onChange={e=>set("description",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>Kategori</label>
              <select value={form.category??"general"} style={inpS} onChange={e=>set("category",e.target.value)}>
                {TASK_CATS.map(c=><option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <div><label style={lblS}>Öncelik</label>
              <select value={form.priority??"medium"} style={inpS} onChange={e=>set("priority",e.target.value)}>
                {PRIS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>Atanan Kişi</label>
              <select value={form.assigned_to??""} style={inpS} onChange={e=>set("assigned_to",e.target.value)}>
                <option value="">— Seçin —</option>
                {STAFF.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={lblS}>Bitiş Tarihi</label>
              <input type="date" value={form.due_date??""} style={inpS} onChange={e=>set("due_date",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>Müşteri</label>
              <select value={form.company_id??""} style={inpS} onChange={e=>set("company_id",e.target.value)}>
                <option value="">— Seçin —</option>
                {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={lblS}>Durum</label>
              <select value={form.status??"todo"} style={inpS} onChange={e=>set("status",e.target.value as WorkTask["status"])}>
                {KAN_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"11px 12px",background:"#f8fafc",borderRadius:"8px",border:"1.5px solid #e5e7ef" }}>
            <input type="checkbox" checked={form.billed??false} onChange={e=>{set("billed",e.target.checked);if(e.target.checked)set("billed_date",new Date().toISOString());else set("billed_date",null as any);}} style={{ cursor:"pointer",width:16,height:16 }} id="billedCheckbox" />
            <label htmlFor="billedCheckbox" style={{ cursor:"pointer",fontSize:"12px",fontWeight:600,color:"#374151",margin:0 }}>✓ Bu görev faturalandı</label>
          </div>
          {form.status==="done" && form.id && (
            <button type="button" onClick={()=>onOpenServiceForm?.(form.id!)} style={{ width:"100%",padding:"10px",background:"linear-gradient(135deg,#059669,#10b981)",border:"none",borderRadius:"8px",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px" }}>
              📋 Servis Formu Oluştur
            </button>
          )}
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
   PROJECT MODAL
══════════════════════════════════════════════════════════════ */
function ProjectModal({ project, companies, onSave, onClose }: {
  project: Partial<Project>|null; companies: Company[];
  onSave: (p: Partial<Project>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Project>>(project ?? { phase:"teklif", status:"active" });
  const [saving, setSaving] = useState(false);
  function set<K extends keyof Project>(k: K, v: Project[K]) { setForm(f=>({...f,[k]:v})); }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff",borderRadius:"18px",padding:"28px",width:"100%",maxWidth:"520px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
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
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>Müşteri</label>
              <select value={form.company_id??""} style={inpS} onChange={e=>set("company_id",e.target.value)}>
                <option value="">— Seçin —</option>
                {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={lblS}>Sorumlu</label>
              <select value={form.assigned_to??""} style={inpS} onChange={e=>set("assigned_to",e.target.value)}>
                <option value="">— Seçin —</option>
                {STAFF.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>Başlangıç</label>
              <input type="date" value={form.start_date??""} style={inpS} onChange={e=>set("start_date",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
            <div><label style={lblS}>Bitiş</label>
              <input type="date" value={form.end_date??""} style={inpS} onChange={e=>set("end_date",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px" }}>
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
function ServiceFormModal({ form, task, project, companies, onSave, onClose }: {
  form: Partial<ServiceForm>|null; task?: WorkTask; project?: Project; companies: Company[];
  onSave: (f: Partial<ServiceForm>) => Promise<void>; onClose: () => void;
}) {
  const [f, setF] = useState<Partial<ServiceForm>>(form ?? { status:"draft", task_id: task?.id, project_id: project?.id, company_id: task?.company_id||project?.company_id });
  const [saving, setSaving] = useState(false);
  function set<K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) { setF(x=>({...x,[k]:v})); }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff",borderRadius:"18px",padding:"28px",width:"100%",maxWidth:"550px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
          <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#1a1d2e" }}>📋 Servis Formu</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af" }}><X size={18}/></button>
        </div>
        <form onSubmit={async e=>{ e.preventDefault(); setSaving(true); await onSave(f); setSaving(false); }}
          style={{ display:"flex",flexDirection:"column",gap:"13px" }}>
          <div><label style={lblS}>Müşteri Adı *</label>
            <input type="text" value={f.customer_name??""} required placeholder="Müşteri adı..." style={inpS} onChange={e=>set("customer_name",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>Telefon</label>
              <input type="tel" value={f.customer_phone??""} placeholder="0555 123 45 67" style={inpS} onChange={e=>set("customer_phone",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
            <div><label style={lblS}>E-posta</label>
              <input type="email" value={f.customer_email??""} placeholder="musteri@email.com" style={inpS} onChange={e=>set("customer_email",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
          </div>
          <div><label style={lblS}>Hizmet/Ürün Açıklaması *</label>
            <textarea value={f.service_description??""} required placeholder="Yapılan çalışma, servis, ürün vb..." rows={2} style={{...inpS,resize:"vertical"as const}} onChange={e=>set("service_description",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div><label style={lblS}>Teslim Edilen Ürünler/Açıklamalar</label>
            <textarea value={f.items_delivered??""} placeholder="Teslim edilen ürünler ve detayları..." rows={2} style={{...inpS,resize:"vertical"as const}} onChange={e=>set("items_delivered",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px" }}>
            <div><label style={lblS}>İmzalayan Kişi</label>
              <input type="text" value={f.signed_by??""} placeholder="Sorumlu kişinin adı" style={inpS} onChange={e=>set("signed_by",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
            <div><label style={lblS}>Tarih</label>
              <input type="date" value={f.signed_at??""} style={inpS} onChange={e=>set("signed_at",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
            </div>
          </div>
          <div><label style={lblS}>Notlar</label>
            <textarea value={f.notes??""} placeholder="Ek notlar, özel istekler..." rows={2} style={{...inpS,resize:"vertical"as const}} onChange={e=>set("notes",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div><label style={lblS}>Gönderme E-postası</label>
            <input type="email" value={f.sent_to_email??""} placeholder="Form kimin e-postasına gönderilecek?" style={inpS} onChange={e=>set("sent_to_email",e.target.value)} onFocus={e=>(e.target.style.borderColor="#0052ff")} onBlur={e=>(e.target.style.borderColor="#e5e7ef")} />
          </div>
          <div style={{ display:"flex",gap:"10px",justifyContent:"flex-end",marginTop:"4px" }}>
            <button type="button" onClick={onClose} style={{ padding:"9px 18px",border:"1.5px solid #e5e7ef",borderRadius:"9px",background:"#fff",color:"#374151",fontSize:"13px",fontWeight:600,cursor:"pointer" }}>İptal</button>
            <button type="submit" disabled={saving} style={{ padding:"9px 22px",border:"none",borderRadius:"9px",background:saving?"#d1d5db":"linear-gradient(135deg,#059669,#10b981)",color:"#fff",fontSize:"13px",fontWeight:700,cursor:saving?"not-allowed":"pointer",boxShadow:"0 4px 12px rgba(16,185,129,.28)" }}>
              {saving?"Kaydediliyor...":"✓ Formu Kaydet & Gönder"}
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
function ProjelerTab({ companies }: { companies: Company[] }) {
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

      {modal!==false && <ProjectModal project={modal} companies={companies} onSave={save} onClose={()=>setModal(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: GÜNLÜK GÖREVLER
══════════════════════════════════════════════════════════════ */
function GunlukTab({ tasks, onTaskSave, onTaskDelete, companies, onOpenServiceForm }: {
  tasks: WorkTask[]; companies: Company[];
  onTaskSave: (t: Partial<WorkTask>) => Promise<void>;
  onTaskDelete: (id: string) => Promise<void>;
  onOpenServiceForm?: (taskId: string) => void;
}) {
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
          {STAFF.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ flex:1 }}/>
        <button onClick={()=>setModal({due_date:date,status:"todo"})}
          style={{ display:"flex",alignItems:"center",gap:"6px",padding:"8px 15px",background:"linear-gradient(135deg,#0038c7,#0052ff)",color:"#fff",border:"none",borderRadius:"9px",fontSize:"13px",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(0,82,255,.3)" }}>
          <Plus size={14}/> Görev Ekle
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display:"flex",gap:"12px",marginBottom:"20px",flexWrap:"wrap" }}>
        {[
          { label:"Toplam",      value:dayTasks.length,                            color:"#0052ff" },
          { label:"Tamamlandı",  value:dayTasks.filter(t=>t.status==="done").length, color:"#15803d" },
          { label:"Bekliyor",    value:dayTasks.filter(t=>t.status!=="done").length, color:"#d97706" },
        ].map(s=>(
          <div key={s.label} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"7px 14px",background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"9px" }}>
            <span style={{ fontSize:"18px",fontWeight:900,color:s.color }}>{s.value}</span>
            <span style={{ fontSize:"11px",color:"#9ca3af" }}>{s.label}</span>
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
                  return (
                    <div key={task.id} style={{ display:"flex",alignItems:"flex-start",gap:"10px",background:"#fff",border:`1.5px solid ${done?"#bbf7d0":"#e5e7ef"}`,borderRadius:"11px",padding:"12px 14px",transition:"all .15s",opacity:done?.7:1 }}>
                      <button onClick={()=>toggleDone(task)} style={{ background:"none",border:"none",cursor:"pointer",color:done?"#22c55e":"#cbd5e1",flexShrink:0,marginTop:"1px",padding:0 }}>
                        {done ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
                      </button>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px" }}>
                          <span style={{ fontSize:"13px" }}>{cat.emoji}</span>
                          <span style={{ fontSize:"13.5px",fontWeight:700,color:"#1a1d2e",textDecoration:done?"line-through":"none" }}>{task.title}</span>
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

      {modal!==false && <TaskModal task={modal} defaultDate={date} companies={companies} onSave={onTaskSave} onOpenServiceForm={onOpenServiceForm} onClose={()=>setModal(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: KANBAN
══════════════════════════════════════════════════════════════ */
function KanbanTab({ tasks, onTaskSave, onTaskDelete, companies, onOpenServiceForm }: {
  tasks: WorkTask[]; companies: Company[];
  onTaskSave: (t: Partial<WorkTask>) => Promise<void>;
  onTaskDelete: (id: string) => Promise<void>;
  onOpenServiceForm?: (taskId: string) => void;
}) {
  const [modal, setModal] = useState<Partial<WorkTask>|null|false>(false);
  const [filterPri, setFP] = useState("");
  const [menuId, setMenuId] = useState<string|null>(null);

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

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"14px",alignItems:"start" }}>
        {KAN_COLS.map(col=>{
          const colTasks = byCol(col.id);
          return (
            <div key={col.id} style={{ background:col.bg,border:`1.5px solid ${col.border}`,borderRadius:"14px",padding:"14px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:"7px" }}>
                  <div style={{ width:9,height:9,borderRadius:"50%",background:col.color }}/>
                  <span style={{ fontSize:"13px",fontWeight:800,color:col.color }}>{col.label}</span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:"7px" }}>
                  <span style={{ fontSize:"11px",fontWeight:700,color:col.color,background:col.border,padding:"2px 8px",borderRadius:"10px" }}>{colTasks.length}</span>
                  <button onClick={()=>setModal({status:col.id})} style={{ background:"none",border:`1px dashed ${col.border}`,borderRadius:"6px",cursor:"pointer",color:col.color,padding:"2px 6px",display:"flex",alignItems:"center" }}><Plus size={12}/></button>
                </div>
              </div>

              {colTasks.length===0 ? (
                <div style={{ textAlign:"center",padding:"28px 12px",color:"#cbd5e1",fontSize:"12px" }}>Görev yok</div>
              ) : colTasks.map(task=>{
                const cat = catMap[task.category]??catMap["general"];
                const pri = priMap[task.priority]??priMap["medium"];
                const due = dueBadge(task.due_date,task.status==="done");
                return (
                  <div key={task.id} style={{ background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"11px",padding:"13px",marginBottom:"9px",boxShadow:"0 1px 4px rgba(0,0,0,.04)",transition:"box-shadow .15s" }}
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
                              <button key={c.id} onClick={()=>{onTaskSave({...task,status:c.id});setMenuId(null);}}
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

                    <p style={{ margin:"0 0 8px",fontSize:"13px",fontWeight:700,color:"#1a1d2e",lineHeight:1.4,textDecoration:task.status==="done"?"line-through":"none",opacity:task.status==="done"?.6:1 }}>{task.title}</p>
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
            </div>
          );
        })}
      </div>

      {modal!==false && <TaskModal task={modal} companies={companies} onSave={onTaskSave} onOpenServiceForm={onOpenServiceForm} onClose={()=>setModal(false)} />}
    </div>
  );
}

function FaturandiTab({
  tasks, projects, companies, onTaskSave, onProjectSave
}: {
  tasks: WorkTask[]; projects: Project[]; companies: Company[];
  onTaskSave: (task: WorkTask) => void; onProjectSave: (project: Project) => void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();
  const month = now.getMonth() - monthOffset;
  const year = now.getFullYear() + (monthOffset > 11 ? -1 : monthOffset < -11 ? 1 : 0);
  const monthStart = new Date(year, month, 1).toISOString().slice(0, 10);
  const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const billedTasks = tasks.filter(t => t.billed && t.billed_date && t.billed_date.slice(0, 10) >= monthStart && t.billed_date.slice(0, 10) <= monthEnd);
  const billedProjects = projects.filter(p => p.billed && p.billed_date && p.billed_date.slice(0, 10) >= monthStart && p.billed_date.slice(0, 10) <= monthEnd);

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
      <div style={{ display:"flex",gap:"10px",alignItems:"center",marginBottom:"22px" }}>
        <button onClick={()=>setMonthOffset(monthOffset+1)} style={{ background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"8px",padding:"7px 12px",cursor:"pointer",fontSize:"13px",color:"#64748b",fontWeight:600 }}>← Geçen Ay</button>
        <span style={{ fontSize:"14px",fontWeight:700,color:"#1a1d2e",minWidth:180 }}>{monthLabel}</span>
        <button onClick={()=>setMonthOffset(monthOffset-1)} disabled={monthOffset===0} style={{ background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"8px",padding:"7px 12px",cursor:"pointer",fontSize:"13px",color:"#64748b",fontWeight:600,opacity:monthOffset===0?.5:1 }}>Gelecek Ay →</button>
      </div>

      {Object.entries(grouped).map(([cid, { tasks: cTasks, projects: cProjects }]) => {
        const company = companies.find(c => c.id === cid);
        return (
          <div key={cid} style={{ background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"11px",padding:"16px",marginBottom:"16px" }}>
            <h4 style={{ margin:"0 0 12px",fontSize:"14px",fontWeight:700,color:"#1a1d2e",display:"flex",alignItems:"center",gap:"7px" }}><Building2 size={16} color="#0052ff"/>{company?.name||"Bilinmeyen"}</h4>

            {cTasks.length > 0 && (
              <div style={{ marginBottom:"12px" }}>
                <p style={{ margin:"0 0 8px",fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase" }}>Görevler ({cTasks.length})</p>
                {cTasks.map(t=>(
                  <div key={t.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"#f8fafc",borderRadius:"7px",marginBottom:"5px",fontSize:"12px" }}>
                    <div>
                      <span style={{ fontWeight:600,color:"#1a1d2e" }}>{t.title}</span>
                      <span style={{ fontSize:"11px",color:"#94a3b8",marginLeft:"8px" }}>{new Date(t.billed_date!).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <button onClick={()=>onTaskSave({...t,billed:false})} style={{ background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:"5px",padding:"3px 8px",fontSize:"11px",fontWeight:600,cursor:"pointer" }}>Geri Al</button>
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
          <p style={{ fontSize:"13px" }}>Bu ayda faturalandı işlem yok.</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
type InnerTab = "projeler" | "gunluk" | "kanban" | "faturalandı";

export default function IsPlani({ companies }: { companies: Company[] }) {
  const [innerTab, setInnerTab] = useState<InnerTab>("projeler");
  const [tasks, setTasks]       = useState<WorkTask[]>([]);
  const [tasksLoaded, setTL]    = useState(false);
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
      if (r.ok){const u=await r.json();setTasks(p=>p.map(t=>t.id===u.id?{...t,...u}:t));}
    } else {
      const r = await fetch("/api/admin/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (r.ok){const c=await r.json();setTasks(p=>[c,...p]);}
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
  async function saveServiceForm(form: Partial<ServiceForm>) {
    if (form.id) {
      const r = await fetch("/api/admin/service-forms",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (r.ok){const u=await r.json();setServiceForms(p=>p.map(sf=>sf.id===u.id?{...sf,...u}:sf));}
    } else {
      const r = await fetch("/api/admin/service-forms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if (r.ok){const c=await r.json();setServiceForms(p=>[c,...p]);}
    }
    setServiceFormModal(false);
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

  const INNER_TABS: { id: InnerTab; label: string; icon: React.ReactNode }[] = [
    { id:"projeler", label:"Projeler",        icon:<FolderKanban size={14}/> },
    { id:"gunluk",   label:"Günlük Görevler", icon:<CalendarDays size={14}/> },
    { id:"kanban",   label:"Kanban Board",    icon:<Columns size={14}/> },
    { id:"faturalandı", label:"Faturalandı",  icon:<Receipt size={14}/> },
  ];

  return (
    <div style={{ padding:"28px 32px",background:"#f8fafc",minHeight:"100%",fontFamily:"inherit" }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ marginBottom:"22px" }}>
        <h2 style={{ margin:"0 0 3px",fontSize:"20px",fontWeight:800,color:"#1a1d2e" }}>İş Planı</h2>
        <p style={{ margin:0,fontSize:"13px",color:"#64748b" }}>Projeler, görevler ve günlük iş takibi</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"22px" }}>
        {[
          { label:"Devam Eden Görev",     value:inProgress.length,  color:"#7c3aed", border:"#7c3aed", icon:<TrendingUp size={14} color="#7c3aed"/> },
          { label:"Bugün Yapılacak",      value:todayTasks.filter(t=>t.status!=="done").length, color:"#0052ff", border:"#0052ff", icon:<CalendarDays size={14} color="#0052ff"/> },
          { label:"Gecikmiş",             value:overdue.length,      color:"#dc2626", border:"#dc2626", icon:<AlertTriangle size={14} color="#dc2626"/> },
          { label:"Bugün Tamamlandı",     value:doneToday.length,    color:"#15803d", border:"#15803d", icon:<CheckCircle2 size={14} color="#15803d"/> },
        ].map(s=>(
          <div key={s.label} onClick={()=>setInnerTab("gunluk")}
            style={{ background:"#fff",border:`1px solid #e5e7ef`,borderRadius:"13px",padding:"16px 18px",borderTop:`3px solid ${s.border}`,cursor:"pointer",transition:"box-shadow .15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(0,0,0,.08)"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="none"}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px" }}>
              <p style={{ fontSize:"28px",fontWeight:900,color:s.color,margin:0,lineHeight:1 }}>{s.value}</p>
              <div style={{ padding:"6px",background:`${s.color}12`,borderRadius:"8px" }}>{s.icon}</div>
            </div>
            <p style={{ fontSize:"11.5px",color:"#9ca3af",margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Inner tabs ───────────────────────────────────────── */}
      <div style={{ display:"flex",gap:"4px",background:"#fff",border:"1.5px solid #e5e7ef",borderRadius:"12px",padding:"4px",marginBottom:"20px",width:"fit-content" }}>
        {INNER_TABS.map(t=>(
          <button key={t.id} onClick={()=>setInnerTab(t.id)}
            style={{ display:"flex",alignItems:"center",gap:"6px",padding:"7px 16px",borderRadius:"9px",border:"none",background:innerTab===t.id?"linear-gradient(135deg,#0038c7,#0052ff)":"transparent",color:innerTab===t.id?"#fff":"#64748b",fontSize:"13px",fontWeight:innerTab===t.id?700:500,cursor:"pointer",transition:"all .15s" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────── */}
      {innerTab==="projeler" && <ProjelerTab companies={companies} />}
      {innerTab==="gunluk" && tasksLoaded && <GunlukTab tasks={tasks} companies={companies} onTaskSave={saveTask} onTaskDelete={deleteTask} onOpenServiceForm={(taskId)=>setServiceFormModal({task_id:taskId,status:"draft"})} />}
      {innerTab==="kanban" && tasksLoaded && <KanbanTab tasks={tasks} companies={companies} onTaskSave={saveTask} onTaskDelete={deleteTask} onOpenServiceForm={(taskId)=>setServiceFormModal({task_id:taskId,status:"draft"})} />}
      {innerTab==="faturalandı" && tasksLoaded && projectsLoaded && <FaturandiTab tasks={tasks} projects={projects} companies={companies} onTaskSave={saveTask} onProjectSave={saveProject} />}

      {serviceFormModal!==false && <ServiceFormModal form={serviceFormModal} companies={companies} onSave={saveServiceForm} onClose={()=>setServiceFormModal(false)} />}
    </div>
  );
}
