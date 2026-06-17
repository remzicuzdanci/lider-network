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

        const issuer = cert.issuer
          ? Object.entries(cert.issuer).map(([k, v]) => `${k}=${v}`).join(", ")
          : "—";

        const subject = cert.subject?.CN || Object.entries(cert.subject || {}).map(([k, v]) => `${k}=${v}`).join(", ");

        resolve(NextResponse.json({
          host,
          valid,
          daysLeft,
          validFrom: validFrom.toISOString(),
          validTo:   validTo.toISOString(),
          subject,
          issuer,
          sans,
          protocol: socket.getProtocol() || "TLS",
          selfSigned: cert.issuer?.CN === cert.subject?.CN,
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
