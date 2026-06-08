"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { Booklet } from "@/types";

interface Message {
  role: "user" | "assistant";
  text: string;
}

function buildContext(booklet: Booklet): string {
  const lines: string[] = [`Logement : ${booklet.propertyName || booklet.title}`];
  if (booklet.address) lines.push(`Adresse : ${booklet.address}`);

  const labels: Record<string, string> = {
    arrival: "Arrivée & Départ",
    accommodation: "Le logement",
    rules: "Règles du séjour",
    kitchen: "Cuisine & Ménage",
    neighborhood: "Quartier & Activités",
    safety: "Sécurité & Urgences",
    contact: "Contact & Services",
    checkout: "Départ",
    baby: "Bébé & Enfants",
    pets: "Animaux",
    pool: "Piscine & Extérieur",
    coworking: "Télétravail",
    transport: "Transport & Parking",
    accessibility: "Accessibilité",
    experiences: "Expériences locales",
    eco: "Éco-responsable",
    practical: "Infos pratiques",
  };

  for (const mod of booklet.modules) {
    if (!mod.enabled) continue;
    const label = labels[mod.type] ?? mod.type;
    const entries = Object.entries(mod.content)
      .filter(([, v]) => v && !v.startsWith("[{")) // skip JSON arrays
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n");
    if (entries) lines.push(`\n[${label}]\n${entries}`);
  }

  return lines.join("\n").slice(0, 6000);
}

export function ChatbotWidget({ booklet }: { booklet: Booklet }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: `Bonjour ! 👋 Je suis l'assistant de ${booklet.propertyName || booklet.title}. Posez-moi vos questions sur le logement.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = booklet.accentColor || "#f97316";

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: buildContext(booklet) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer ?? "Désolé, je n'ai pas pu répondre." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Une erreur est survenue. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat dialog */}
      {open && (
        <div
          style={{ zIndex: 200 }}
          className="fixed bottom-[88px] right-4 w-[340px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: accent }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">Assistant</p>
                <p className="text-[11px] text-white/70">{booklet.propertyName || booklet.title}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[320px] min-h-[180px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] text-sm px-3 py-2 rounded-2xl leading-relaxed ${
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { background: accent } : {}}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Posez votre question..."
              className="flex-1 text-sm bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 placeholder:text-gray-400"
              style={{ "--tw-ring-color": accent } as React.CSSProperties}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
              style={{ background: accent }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: accent, zIndex: 200, bottom: "calc(72px + env(safe-area-inset-bottom))" }}
        className="fixed right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform active:scale-95"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
