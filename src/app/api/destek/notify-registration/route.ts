import { NextRequest, NextResponse } from "next/server";
import {
  sendNewRegistrationEmail,
  sendRegistrationReceivedEmail,
} from "@/lib/ticket-mail";

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, company, phone, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    await Promise.all([
      sendNewRegistrationEmail({ userId, fullName, company, phone, email }).catch(console.error),
      sendRegistrationReceivedEmail({ fullName, email }).catch(console.error),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-registration error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
