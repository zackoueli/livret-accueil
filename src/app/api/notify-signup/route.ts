import { NextRequest } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendWelcomeEmail } from "@/lib/emails";

export async function POST(request: NextRequest) {
  try {
    const { email, name, provider } = await request.json();
    if (!email) {
      return Response.json({ error: "Missing email" }, { status: 400 });
    }

    await Promise.all([
      sendTelegramMessage(
        `🆕 <b>Nouvelle inscription</b>\n${name ? `Nom : ${name}\n` : ""}Email : ${email}\nVia : ${provider || "email"}`
      ),
      sendWelcomeEmail({ to: email, name: name ?? "" }).catch((err) => {
        console.error("[notify-signup] sendWelcomeEmail", err);
      }),
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[notify-signup]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
