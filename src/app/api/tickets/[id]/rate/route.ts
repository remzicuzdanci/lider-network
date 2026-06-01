// SQL: ALTER TABLE tickets ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER;

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

const SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "please-set-ADMIN_SESSION_SECRET-in-env";

function generateRatingToken(ticketId: string, score: number): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${ticketId}:${score}`)
    .digest("hex");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketId } = await params;
  const { searchParams } = new URL(req.url);
  const scoreStr = searchParams.get("score");
  const token = searchParams.get("token");

  const score = parseInt(scoreStr || "0", 10);

  if (!scoreStr || !token || score < 1 || score > 5) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Hatalı İstek</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:60px;color:#dc2626">
  <h2>Geçersiz istek</h2><p>Bu değerlendirme bağlantısı geçersiz.</p>
</body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Verify HMAC token
  const expectedToken = generateRatingToken(ticketId, score);
  if (token !== expectedToken) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Geçersiz Token</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:60px;color:#dc2626">
  <h2>Geçersiz bağlantı</h2><p>Bu değerlendirme bağlantısı doğrulanamadı.</p>
</body></html>`,
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Update satisfaction_score
  const { error } = await supabase
    .from("tickets")
    .update({ satisfaction_score: score })
    .eq("id", ticketId);

  if (error) {
    console.error("Rating update error:", error);
    return new NextResponse(
      `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Hata</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:60px;color:#dc2626">
  <h2>Hata oluştu</h2><p>Değerlendirmeniz kaydedilemedi. Lütfen tekrar deneyin.</p>
</body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const stars = "⭐".repeat(score);
  const messages: Record<number, string> = {
    1: "Geri bildiriminiz için teşekkürler. Hizmet kalitemizi iyileştirmek için çalışıyoruz.",
    2: "Geri bildiriminiz için teşekkürler. Daha iyi hizmet sunmak için çalışmaya devam edeceğiz.",
    3: "Değerlendirmeniz için teşekkürler. Hizmet kalitemizi artırmaya devam edeceğiz.",
    4: "Memnuniyetiniz bizim için çok değerli. Daha iyi olmak için çalışmaya devam edeceğiz.",
    5: "Mükemmel değerlendirmeniz için çok teşekkür ederiz! Memnuniyetiniz bizim en büyük motivasyonumuz.",
  };

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Değerlendirme Alındı — Lider Network</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">
        <tr><td style="background:#0052ff;height:5px;border-radius:10px 10px 0 0"></td></tr>
        <tr>
          <td style="background:#ffffff;padding:40px 48px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;text-align:center">
            <div style="display:inline-block;background:#0052ff;border-radius:8px;padding:6px 14px;margin-bottom:24px">
              <span style="color:#ffffff;font-size:18px;font-weight:900;letter-spacing:-0.5px">LİDER</span>
              <span style="color:#b7c4ff;font-size:18px;font-weight:400;letter-spacing:-0.5px"> NETWORK</span>
            </div>
            <div style="font-size:48px;margin-bottom:16px">${stars}</div>
            <h2 style="color:#15803d;font-size:22px;margin:0 0 12px">Teşekkürler!</h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px">${messages[score] || messages[3]}</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 24px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#15803d;font-weight:700">Puanınız: ${score}/5 ${stars}</p>
            </div>
            <p style="color:#94a3b8;font-size:13px;margin:0">
              Sorularınız için: <a href="mailto:destek@lidernetwork.com.tr" style="color:#0052ff;text-decoration:none">destek@lidernetwork.com.tr</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:16px 36px;text-align:center">
            <p style="color:#94a3b8;font-size:12px;margin:0">&copy; ${new Date().getFullYear()} Lider Network Bilişim Hizmetleri</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
