import { PDFDocument, rgb, PDFFont, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

/* ── Sunucu tarafı teklif PDF'i (pdf-lib + DejaVu Türkçe font) ──────────
   Maile ek olarak gönderilir. Fontlar ve logo dosya sisteminden okunur. */

let _reg: Buffer | null = null, _bold: Buffer | null = null, _logo: Buffer | null = null;
async function fonts() {
  if (!_reg) _reg = fs.readFileSync(path.join(process.cwd(), "public/fonts/DejaVuSans.ttf"));
  if (!_bold) _bold = fs.readFileSync(path.join(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf"));
  return { reg: _reg, bold: _bold };
}
async function logo() {
  if (!_logo) {
    try { _logo = fs.readFileSync(path.join(process.cwd(), "public/logo.png")); } catch { _logo = null; }
  }
  return _logo;
}

export interface QuotePdfItem { description: string; quantity: number; unit_price: number; discount: number; kdv_rate: number; unit?: string }
export interface QuotePdfData {
  quote_no: string;
  customer_name?: string | null;
  customer_address?: string | null;
  tax_office?: string | null;
  tax_no?: string | null;
  contact_name?: string | null;
  quote_date?: string | null;
  valid_until?: string | null;
  currency: string;
  prepared_by?: string | null;
  description?: string | null;
  items: QuotePdfItem[];
  totals: { subtotal: number; discount_total: number; net_total: number; kdv_total: number; grand_total: number };
  approvalUrl?: string | null;
}

const SYM: Record<string, string> = { TL: "₺", TRY: "₺", USD: "$", EUR: "€" };
const BLUE = rgb(0, 0.322, 1);
const DARK = rgb(0.059, 0.09, 0.165);
const ORANGE = rgb(1, 0.369, 0.027);
const SLATE = rgb(0.29, 0.34, 0.41);
const LIGHT = rgb(0.96, 0.97, 0.99);
const GRIDLINE = rgb(0.9, 0.92, 0.95);

function money(n: number, cur: string) {
  return `${SYM[cur] || cur + " "}${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dt(s?: string | null) { return s ? new Date(s).toLocaleDateString("tr-TR") : "—"; }

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = (text || "").split(/\s+/);
  const lines: string[] = []; let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (font.widthOfTextAtSize(t, size) > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function buildQuotePdf(data: QuotePdfData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const { reg, bold } = await fonts();
  const fReg = await doc.embedFont(reg, { subset: true });
  const fBold = await doc.embedFont(bold, { subset: true });
  let logoImg = null;
  try { logoImg = await doc.embedPng(await logo()); } catch { /* logo opsiyonel */ }

  const page = doc.addPage([595.28, 841.89]);
  const W = 595.28, H = 841.89, M = 40;
  const cur = data.currency || "TL";

  const text = (p: PDFPage, s: string, x: number, yTop: number, opt: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; } = {}) => {
    const size = opt.size || 10;
    p.drawText(s ?? "", { x, y: H - yTop - size, size, font: opt.font || fReg, color: opt.color || DARK });
  };
  const rightText = (p: PDFPage, s: string, xRight: number, yTop: number, opt: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; } = {}) => {
    const size = opt.size || 10; const f = opt.font || fReg;
    const w = f.widthOfTextAtSize(s ?? "", size);
    text(p, s, xRight - w, yTop, opt);
  };

  // ── Üst bant ──
  page.drawRectangle({ x: 0, y: H - 104, width: W, height: 104, color: BLUE });
  page.drawRectangle({ x: 0, y: H - 109, width: W, height: 5, color: ORANGE });
  if (logoImg) {
    const lh = 46, lw = (logoImg.width / logoImg.height) * lh;
    page.drawRectangle({ x: M, y: H - 84, width: lw + 22, height: 62, color: rgb(1, 1, 1), opacity: 1 });
    page.drawImage(logoImg, { x: M + 11, y: H - 76, width: lw, height: lh });
  }
  rightText(page, "FİYAT TEKLİFİ", W - M, 30, { size: 22, font: fBold, color: rgb(1, 1, 1) });
  rightText(page, data.quote_no, W - M, 62, { size: 12, font: fBold, color: rgb(0.85, 0.9, 1) });

  let y = 132;

  // ── Müşteri + teklif bilgi kutuları ──
  const colW = (W - M * 2 - 14) / 2;
  const boxH = 86;
  // Müşteri
  page.drawRectangle({ x: M, y: H - y - boxH, width: colW, height: boxH, color: LIGHT, borderColor: GRIDLINE, borderWidth: 1 });
  page.drawRectangle({ x: M, y: H - y - boxH, width: 3, height: boxH, color: BLUE });
  text(page, "MÜŞTERİ", M + 12, y + 10, { size: 8, font: fBold, color: SLATE });
  text(page, data.customer_name || "—", M + 12, y + 24, { size: 12, font: fBold });
  let cy = y + 40;
  for (const ln of wrap(data.customer_address || "", fReg, 8.5, colW - 24).slice(0, 2)) { text(page, ln, M + 12, cy, { size: 8.5, color: SLATE }); cy += 11; }
  if (data.tax_office || data.tax_no) text(page, `VD: ${data.tax_office || "—"}  VN: ${data.tax_no || "—"}`, M + 12, cy, { size: 8.5, color: SLATE });
  // Teklif bilgi
  const bx = M + colW + 14;
  page.drawRectangle({ x: bx, y: H - y - boxH, width: colW, height: boxH, color: LIGHT, borderColor: GRIDLINE, borderWidth: 1 });
  const info: [string, string][] = [
    ["Tarih", dt(data.quote_date)],
    ["Geçerlilik", dt(data.valid_until)],
    ["Para Birimi", cur],
    ...(data.prepared_by ? [["Teklifi Veren", data.prepared_by]] as [string, string][] : []),
  ];
  let iy = y + 12;
  for (const [k, v] of info) { text(page, k, bx + 12, iy, { size: 9.5, color: SLATE }); rightText(page, v, bx + colW - 12, iy, { size: 9.5, font: fBold }); iy += 17; }

  y += boxH + 18;
  text(page, "Hazırlamış olduğumuz fiyat teklifimizi değerlendirmenize sunarız.", M, y, { size: 9.5, color: BLUE });
  y += 18;

  // ── Kalemler tablosu ──
  const cols = { no: M + 8, desc: M + 8, qty: W - M - 250, price: W - M - 185, disc: W - M - 110, kdv: W - M - 70, net: W - M - 8 };
  page.drawRectangle({ x: M, y: H - y - 20, width: W - M * 2, height: 20, color: DARK });
  text(page, "AÇIKLAMA", cols.desc, y + 6, { size: 8, font: fBold, color: rgb(1, 1, 1) });
  rightText(page, "MİKTAR", cols.qty + 40, y + 6, { size: 8, font: fBold, color: rgb(1, 1, 1) });
  rightText(page, "FİYAT", cols.price + 40, y + 6, { size: 8, font: fBold, color: rgb(1, 1, 1) });
  rightText(page, "İSK", cols.disc + 22, y + 6, { size: 8, font: fBold, color: rgb(1, 1, 1) });
  rightText(page, "KDV", cols.kdv + 22, y + 6, { size: 8, font: fBold, color: rgb(1, 1, 1) });
  rightText(page, "TUTAR", cols.net, y + 6, { size: 8, font: fBold, color: rgb(1, 1, 1) });
  y += 20;

  data.items.forEach((it, i) => {
    const gross = (+it.quantity || 0) * (+it.unit_price || 0);
    const net = gross - gross * (+it.discount || 0) / 100;
    const descLines = wrap(`${i + 1}. ${it.description || ""}`, fReg, 9, cols.qty - cols.desc - 14);
    const rowH = Math.max(20, descLines.length * 12 + 8);
    if (i % 2) page.drawRectangle({ x: M, y: H - y - rowH, width: W - M * 2, height: rowH, color: rgb(0.96, 0.97, 1) });
    let dy = y + 7;
    for (const ln of descLines) { text(page, ln, cols.desc, dy, { size: 9, color: rgb(0.12, 0.16, 0.22) }); dy += 12; }
    const mid = y + 7;
    rightText(page, `${it.quantity} ${it.unit || ""}`.trim(), cols.qty + 40, mid, { size: 9, color: SLATE });
    rightText(page, money(it.unit_price, cur), cols.price + 40, mid, { size: 9, color: SLATE });
    rightText(page, `%${it.discount || 0}`, cols.disc + 22, mid, { size: 9, color: SLATE });
    rightText(page, `%${it.kdv_rate || 0}`, cols.kdv + 22, mid, { size: 9, color: SLATE });
    rightText(page, money(net, cur), cols.net, mid, { size: 9.5, font: fBold });
    y += rowH;
    page.drawLine({ start: { x: M, y: H - y }, end: { x: W - M, y: H - y }, thickness: 0.5, color: GRIDLINE });
  });

  // ── Toplamlar ──
  y += 14;
  const tBoxW = 230, tx = W - M - tBoxW;
  const rows: [string, string, boolean][] = [
    ["Brüt Toplam", money(data.totals.subtotal, cur), false],
    ...(data.totals.discount_total ? [["İndirim", "- " + money(data.totals.discount_total, cur), false]] as [string, string, boolean][] : []),
    ["Net Toplam", money(data.totals.net_total, cur), false],
    ["KDV", money(data.totals.kdv_total, cur), false],
    ["GENEL TOPLAM", money(data.totals.grand_total, cur), true],
  ];
  const tH = rows.length * 18 + 12;
  page.drawRectangle({ x: tx, y: H - y - tH, width: tBoxW, height: tH, color: rgb(0.933, 0.957, 1), borderColor: rgb(0.81, 0.88, 1), borderWidth: 1 });
  let ty = y + 10;
  rows.forEach(([k, v, grand]) => {
    if (grand) { page.drawLine({ start: { x: tx + 10, y: H - ty + 2 }, end: { x: tx + tBoxW - 10, y: H - ty + 2 }, thickness: 1.2, color: BLUE }); ty += 4; }
    text(page, k, tx + 14, ty, { size: grand ? 12 : 9.5, font: grand ? fBold : fReg, color: grand ? BLUE : SLATE });
    rightText(page, v, tx + tBoxW - 14, ty, { size: grand ? 13 : 9.5, font: grand ? fBold : fReg, color: grand ? BLUE : DARK });
    ty += grand ? 20 : 18;
  });
  y += tH + 16;

  // ── Açıklama notu ──
  if (data.description) {
    const lines = wrap(data.description, fReg, 9, W - M * 2 - 24);
    const nH = lines.length * 12 + 16;
    page.drawRectangle({ x: M, y: H - y - nH, width: W - M * 2, height: nH, color: LIGHT, borderColor: GRIDLINE, borderWidth: 1 });
    let ny = y + 9;
    for (const ln of lines) { text(page, ln, M + 12, ny, { size: 9, color: SLATE }); ny += 12; }
    y += nH + 14;
  }

  // ── İmza alanları + QR ──
  y += 8;
  const sigY = y + 50;
  // QR
  if (data.approvalUrl) {
    try {
      const qrPng = await QRCode.toBuffer(data.approvalUrl, { margin: 1, width: 240, color: { dark: "#0f172a", light: "#ffffff" } });
      const qr = await doc.embedPng(qrPng);
      page.drawImage(qr, { x: M, y: H - sigY - 36, width: 78, height: 78 });
      text(page, "Telefonla okutup", M + 88, sigY - 8, { size: 8.5, font: fBold, color: SLATE });
      text(page, "teklifi onaylayın", M + 88, sigY + 3, { size: 8.5, font: fBold, color: SLATE });
    } catch { /* QR opsiyonel */ }
  }
  // İmza çizgileri (sağ tarafta)
  const s1x = W - M - 360, s2x = W - M - 170, sw = 160;
  page.drawLine({ start: { x: s1x, y: H - sigY }, end: { x: s1x + sw, y: H - sigY }, thickness: 1, color: SLATE });
  page.drawLine({ start: { x: s2x, y: H - sigY }, end: { x: s2x + sw, y: H - sigY }, thickness: 1, color: SLATE });
  text(page, "Teklifi Veren", s1x, sigY + 6, { size: 9, font: fBold });
  text(page, data.prepared_by || "Lider Network", s1x, sigY + 18, { size: 8.5, color: SLATE });
  text(page, "Müşteri Onayı", s2x, sigY + 6, { size: 9, font: fBold });
  text(page, data.customer_name || "—", s2x, sigY + 18, { size: 8.5, color: SLATE });

  // ── Footer ──
  page.drawRectangle({ x: 0, y: 0, width: W, height: 40, color: DARK });
  const foot = "LİDER NETWORK   ·   +90 312 232 02 88   ·   info@lidernetwork.com.tr   ·   www.lidernetwork.com.tr";
  const fw = fReg.widthOfTextAtSize(foot, 9);
  page.drawText(foot, { x: (W - fw) / 2, y: 16, size: 9, font: fReg, color: rgb(0.8, 0.84, 0.9) });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
