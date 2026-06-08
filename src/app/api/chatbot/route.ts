import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json();
    if (!question || typeof question !== "string" || question.trim().length < 2) {
      return NextResponse.json({ error: "Question invalide" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant virtuel d'un logement de location courte durée. Réponds aux questions des voyageurs de façon concise et amicale, en te basant UNIQUEMENT sur les informations du livret ci-dessous. Si l'information n'est pas dans le livret, dis-le poliment et suggère de contacter l'hôte.

Réponds toujours dans la même langue que la question du voyageur.

--- CONTENU DU LIVRET ---
${context}
--- FIN DU LIVRET ---`,
        },
        { role: "user", content: question },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim() ?? "Je n'ai pas pu trouver la réponse.";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[chatbot]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
