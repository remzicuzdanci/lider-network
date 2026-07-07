import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title    = searchParams.get("title")    ?? "Lider Network Blog";
  const category = searchParams.get("category") ?? "";
  const color    = searchParams.get("color")    ?? "#0052ff";

  const titleSize = title.length > 80 ? 32 : title.length > 50 ? 38 : 44;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #0f1f3d 60%, #0a1628 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Üst: Logo + Kategori */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "#0052ff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ color: "white", fontSize: "18px", fontWeight: 800 }}>L</div>
            </div>
            <div style={{ color: "#94a3b8", fontSize: "18px", fontWeight: 600 }}>
              Lider Network
            </div>
          </div>
          {category && (
            <div
              style={{
                background: color,
                color: "white",
                padding: "8px 20px",
                borderRadius: "24px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* Orta: Başlık */}
        <div
          style={{
            color: "white",
            fontSize: `${titleSize}px`,
            fontWeight: 700,
            lineHeight: 1.35,
            maxWidth: "960px",
          }}
        >
          {title}
        </div>

        {/* Alt: URL + Vurgu çizgisi */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#64748b", fontSize: "17px" }}>lidernetwork.com.tr</div>
          <div
            style={{
              background: color,
              width: "80px",
              height: "4px",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
