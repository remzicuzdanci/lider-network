import { NextRequest, NextResponse } from "next/server";
import * as tls from "tls";

export const runtime = "nodejs";
export const maxDuration = 15;

const CORS = { "Access-Control-Allow-Origin": "*" };

function parseHost(raw: string): { host: string; port: number } {
  raw = raw.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  const [h, p] = raw.split(":");
  return { host: h, port: p ? parseInt(p) : 443 };
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("host") || "";
  if (!raw) return NextResponse.json({ error: "Host gerekli" }, { status: 400, headers: CORS });

  const { host, port } = parseHost(raw);
  if (!host) return NextResponse.json({ error: "Geçersiz host" }, { status: 400, headers: CORS });

  return new Promise<Response>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(NextResponse.json({ error: "Zaman aşımı — bağlantı kurulamadı" }, { status: 504, headers: CORS }));
    }, 12000);

    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
      clearTimeout(timeout);
      try {
        const cert = socket.getPeerCertificate(true);
        socket.destroy();

        if (!cert || !cert.subject) {
          resolve(NextResponse.json({ error: "Sertifika alınamadı" }, { status: 502, headers: CORS }));
          return;
        }

        const now = Date.now();
        const validFrom = new Date(cert.valid_from);
        const validTo   = new Date(cert.valid_to);
        const daysLeft  = Math.floor((validTo.getTime() - now) / 86400000);
        const valid     = now >= validFrom.getTime() && now <= validTo.getTime();

        const sans: string[] = [];
        if (cert.subjectaltname) {
          cert.subjectaltname.split(", ").forEach((s) => {
            if (s.startsWith("DNS:")) sans.push(s.slice(4));
          });
        }

        const issuerObj = cert.issuer || {};
        const subjectObj = cert.subject || {};

        const issuerName = (issuerObj as Record<string, string>).O
          || (issuerObj as Record<string, string>).CN
          || Object.entries(issuerObj).map(([k, v]) => `${k}=${v}`).join(", ")
          || "—";

        const subject = (subjectObj as Record<string, string>).CN
          || Object.entries(subjectObj).map(([k, v]) => `${k}=${v}`).join(", ");

        // EV: subject.businessCategory or subject.serialNumber+O present
        // OV: subject.O present but not EV
        // DV: only CN
        const subRec = subjectObj as Record<string, string>;
        let certType: "DV" | "OV" | "EV" = "DV";
        if (subRec.businessCategory || (subRec.serialNumber && subRec.O)) {
          certType = "EV";
        } else if (subRec.O) {
          certType = "OV";
        }

        const isWildcard = subject.startsWith("*.");

        resolve(NextResponse.json({
          host,
          valid,
          daysLeft,
          validFrom: validFrom.toISOString(),
          validTo:   validTo.toISOString(),
          subject,
          issuer: issuerName,
          issuerFull: Object.entries(issuerObj).map(([k, v]) => `${k}=${v}`).join(", "),
          sans,
          protocol: socket.getProtocol() || "TLS",
          selfSigned: (issuerObj as Record<string, string>).CN === (subjectObj as Record<string, string>).CN,
          certType,
          isWildcard,
          fingerprint: ((cert as unknown) as Record<string, unknown>).fingerprint256 as string || ((cert as unknown) as Record<string, unknown>).fingerprint as string || null,
          keyBits: ((cert as unknown) as Record<string, unknown>).bits as number || null,
          serialNumber: ((cert as unknown) as Record<string, unknown>).serialNumber as string || null,
        }, { headers: { ...CORS, "Cache-Control": "no-store" } }));
      } catch {
        socket.destroy();
        resolve(NextResponse.json({ error: "Sertifika ayrıştırılamadı" }, { status: 502, headers: CORS }));
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(NextResponse.json({ error: `Bağlantı hatası: ${err.message}` }, { status: 502, headers: CORS }));
    });
  });
}
