import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const size = parseInt(searchParams.get("size") ?? "512", 10);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #0a1628 0%, #0052ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size * 0.18,
        }}
      >
        {/* L harfi — Lider Network marka rengi */}
        <div
          style={{
            color: "white",
            fontSize: size * 0.55,
            fontWeight: 800,
            fontFamily: "sans-serif",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          L
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
