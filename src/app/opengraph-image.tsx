import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Lider Network – Fortinet Yetkili Partner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#101415",
          position: "relative",
        }}
      >
        {/* Blue gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #0052ff, #0040cc)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            padding: "0 80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0052ff",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Fortinet Yetkili Partner
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            Lider Network
          </div>

          <div
            style={{
              fontSize: 26,
              color: "#8a9bb0",
              maxWidth: 700,
              lineHeight: 1.4,
            }}
          >
            Siber Güvenlik, Ağ Altyapısı ve Veri Depolama Çözümleri
          </div>

          <div
            style={{
              display: "flex",
              gap: 32,
              marginTop: 16,
            }}
          >
            {["500+ Proje", "7/24 Destek", "2006'dan Beri"].map((item) => (
              <div
                key={item}
                style={{
                  padding: "8px 24px",
                  background: "rgba(0,82,255,0.12)",
                  border: "1px solid rgba(0,82,255,0.3)",
                  borderRadius: 8,
                  color: "#6b9fff",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            color: "#4a5568",
            fontSize: 16,
          }}
        >
          www.lidernetwork.com.tr
        </div>
      </div>
    ),
    { ...size }
  );
}
