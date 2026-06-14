import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await initDb();

    const { path } = await req.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    await sql`
      INSERT INTO visits (path, created_at)
      VALUES (${path}, NOW())
    `;

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (botToken && chatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔥 New visit: ${path}`,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/track error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}
