import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmail } from "@/lib/mail";

const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  company: z
    .string()
    .min(2, "Company must be at least 2 characters")
    .max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional().or(z.literal("")),
  message: z
    .string()
    .min(20, "Message must be at least 20 characters")
    .max(2000),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP credentials not configured. Email not sent.");
      // Return success in dev without SMTP
      if (process.env.NODE_ENV === "development") {
        console.log("Contact form data (dev mode):", data);
        return NextResponse.json(
          { success: true, message: "Dev mode: Email logged to console" },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    await sendContactEmail(data);

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Contact form error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
