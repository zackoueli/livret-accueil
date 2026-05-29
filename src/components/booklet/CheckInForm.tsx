"use client";

import { useRef, useState } from "react";
import { CheckCircle, Loader2, PenLine, RotateCcw, ArrowLeft } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export type CheckInTheme = "light" | "dark" | "glass";

interface Props {
  bookletId: string;
  accent: string;
  onClose: () => void;
  theme?: CheckInTheme;
}

export function CheckInForm({ bookletId, accent, onClose, theme = "light" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestCount: "1",
    checkInDate: "",
    checkOutDate: "",
    acceptedRules: false,
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  // ── Thème ──────────────────────────────────────────────────────────────────
  const isDark = theme === "dark" || theme === "glass";

  const styles = {
    bg: theme === "glass"
      ? { backgroundColor: "rgba(10,15,25,0.92)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)" }
      : theme === "dark"
      ? { backgroundColor: "#0d1b2a" }
      : { backgroundColor: "#f9fafb" },

    header: theme === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.1)" }
      : theme === "dark"
      ? { backgroundColor: "#0d1b2a", borderBottom: "1px solid rgba(255,255,255,0.08)" }
      : { backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9" },

    title: isDark ? "#ffffff" : "#111827",
    subtitle: isDark ? "rgba(255,255,255,0.45)" : "#9ca3af",
    label: isDark ? "rgba(255,255,255,0.5)" : "#6b7280",

    input: theme === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff", borderRadius: 16 }
      : theme === "dark"
      ? { backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff", borderRadius: 16 }
      : { backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827", borderRadius: 16 },

    checkboxBg: theme === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }
      : theme === "dark"
      ? { backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }
      : { backgroundColor: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 16 },

    checkboxText: isDark ? "rgba(255,255,255,0.7)" : "#4b5563",

    signatureBg: theme === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.07)", border: `2px dashed ${hasSignature ? accent : "rgba(255,255,255,0.2)"}`, borderRadius: 16 }
      : theme === "dark"
      ? { backgroundColor: "rgba(255,255,255,0.05)", border: `2px dashed ${hasSignature ? accent : "rgba(255,255,255,0.15)"}`, borderRadius: 16 }
      : { backgroundColor: "#ffffff", border: `2px dashed ${hasSignature ? accent + "80" : "#e5e7eb"}`, borderRadius: 16 },

    signaturePen: isDark ? "rgba(255,255,255,0.25)" : "#d1d5db",
    signatureStroke: isDark ? "#ffffff" : "#1a1a1a",
    note: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af",
  };

  // ── Signature canvas ───────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = styles.signatureStroke;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!form.guestName.trim()) return toast.error("Nom requis");
    if (!form.checkInDate) return toast.error("Date d'arrivée requise");
    if (!hasSignature) return toast.error("Signature requise");
    if (!form.acceptedRules) return toast.error("Vous devez accepter le règlement");
    setLoading(true);
    try {
      const signature = canvasRef.current?.toDataURL() ?? "";
      await addDoc(collection(db, "checkins"), {
        bookletId,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestCount: parseInt(form.guestCount) || 1,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        signature,
        acceptedRules: true,
        createdAt: Date.now(),
      });
      setSubmitted(true);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCÈS ─────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-center" style={styles.bg}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ backgroundColor: accent + "25", border: `1.5px solid ${accent}40` }}>
          <CheckCircle className="w-10 h-10" style={{ color: accent }} />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: styles.title }}>Check-in validé !</h2>
        <p className="text-sm mb-8" style={{ color: styles.subtitle }}>
          Votre arrivée a bien été enregistrée. Bienvenue !
        </p>
        <button onClick={onClose}
          className="px-8 py-4 rounded-full font-bold text-white text-sm transition-all active:scale-95"
          style={{ backgroundColor: accent, boxShadow: `0 6px 24px ${accent}50` }}>
          Accéder au livret →
        </button>
      </div>
    );
  }

  // ── FORMULAIRE ─────────────────────────────────────────────────────────────
  const inputClass = "w-full px-4 py-3.5 text-sm focus:outline-none placeholder-shown:opacity-60";
  const placeholderColor = isDark ? "rgba(255,255,255,0.3)" : "#9ca3af";

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={styles.bg}>

      {/* Header */}
      <div className="shrink-0 px-5 pt-10 pb-5" style={styles.header}>
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-semibold mb-4 transition-opacity hover:opacity-70"
          style={{ color: accent }}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h2 className="text-xl font-black" style={{ color: styles.title }}>Check-in</h2>
        <p className="text-sm mt-0.5" style={{ color: styles.subtitle }}>Enregistrez votre arrivée</p>
      </div>

      {/* Champs */}
      <div className="flex-1 px-5 py-6 space-y-4">

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>
            Nom complet *
          </label>
          <input type="text" value={form.guestName} onChange={(e) => set("guestName", e.target.value)}
            placeholder="Jean Dupont" className={inputClass}
            style={{ ...styles.input, caretColor: accent }} />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>
            Email
          </label>
          <input type="email" value={form.guestEmail} onChange={(e) => set("guestEmail", e.target.value)}
            placeholder="jean@exemple.fr" className={inputClass}
            style={{ ...styles.input, caretColor: accent }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>
              Arrivée *
            </label>
            <input type="date" value={form.checkInDate} onChange={(e) => set("checkInDate", e.target.value)}
              className={inputClass} style={{ ...styles.input, colorScheme: isDark ? "dark" : "light" }} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>
              Départ
            </label>
            <input type="date" value={form.checkOutDate} onChange={(e) => set("checkOutDate", e.target.value)}
              className={inputClass} style={{ ...styles.input, colorScheme: isDark ? "dark" : "light" }} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>
            Nombre de voyageurs
          </label>
          <input type="number" min="1" max="20" value={form.guestCount}
            onChange={(e) => set("guestCount", e.target.value)}
            className={inputClass} style={{ ...styles.input, caretColor: accent }} />
        </div>

        {/* Signature */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: styles.label }}>
              Signature *
            </label>
            {hasSignature && (
              <button onClick={clearSignature}
                className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: styles.subtitle }}>
                <RotateCcw className="w-3 h-3" /> Effacer
              </button>
            )}
          </div>
          <div className="relative overflow-hidden" style={styles.signatureBg}>
            {!hasSignature && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1"
                style={{ color: styles.signaturePen }}>
                <PenLine className="w-5 h-5" />
                <span className="text-xs">Signez ici</span>
              </div>
            )}
            <canvas ref={canvasRef} width={600} height={160}
              className="w-full touch-none"
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
          </div>
        </div>

        {/* Règlement */}
        <label className="flex items-start gap-3 p-4 cursor-pointer" style={styles.checkboxBg}>
          <div onClick={() => set("acceptedRules", !form.acceptedRules)}
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors"
            style={{ backgroundColor: form.acceptedRules ? accent : "transparent", border: `2px solid ${form.acceptedRules ? accent : (isDark ? "rgba(255,255,255,0.25)" : "#d1d5db")}` }}>
            {form.acceptedRules && <CheckCircle className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm leading-relaxed" style={{ color: styles.checkboxText }}>
            J'ai lu et j'accepte le règlement intérieur du logement.
          </span>
        </label>

        {/* Bouton submit */}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-full font-bold text-white text-base transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: accent, boxShadow: `0 6px 24px ${accent}50` }}>
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            : "Valider mon check-in →"}
        </button>

        <p className="text-center text-xs pb-4" style={{ color: styles.note }}>
          Vos données sont transmises uniquement à l'hôte
        </p>
      </div>
    </div>
  );
}

// ── Version inline pour l'intégration dans les modules ────────────────────────

interface InlineProps {
  bookletId: string;
  accent: string;
  theme?: CheckInTheme;
}

export function CheckInFormInline({ bookletId, accent, theme = "light" }: InlineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestCount: "1",
    checkInDate: "",
    checkOutDate: "",
    acceptedRules: false,
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const isDark = theme === "dark" || theme === "glass";

  const styles = {
    title: isDark ? "#ffffff" : "#111827",
    subtitle: isDark ? "rgba(255,255,255,0.45)" : "#9ca3af",
    label: isDark ? "rgba(255,255,255,0.5)" : "#6b7280",
    input: theme === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff", borderRadius: 16 }
      : theme === "dark"
      ? { backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff", borderRadius: 16 }
      : { backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827", borderRadius: 16 },
    checkboxBg: theme === "dark" || theme === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }
      : { backgroundColor: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 16 },
    checkboxText: isDark ? "rgba(255,255,255,0.7)" : "#4b5563",
    signatureBg: theme === "dark" || theme === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.05)", border: `2px dashed ${hasSignature ? accent : "rgba(255,255,255,0.15)"}`, borderRadius: 16 }
      : { backgroundColor: "#ffffff", border: `2px dashed ${hasSignature ? accent + "80" : "#e5e7eb"}`, borderRadius: 16 },
    signaturePen: isDark ? "rgba(255,255,255,0.25)" : "#d1d5db",
    signatureStroke: isDark ? "#ffffff" : "#1a1a1a",
    note: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af",
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = styles.signatureStroke;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!form.guestName.trim()) return toast.error("Nom requis");
    if (!form.checkInDate) return toast.error("Date d'arrivée requise");
    if (!hasSignature) return toast.error("Signature requise");
    if (!form.acceptedRules) return toast.error("Vous devez accepter le règlement");
    setLoading(true);
    try {
      const signature = canvasRef.current?.toDataURL() ?? "";
      await addDoc(collection(db, "checkins"), {
        bookletId,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestCount: parseInt(form.guestCount) || 1,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        signature,
        acceptedRules: true,
        createdAt: Date.now(),
      });
      setSubmitted(true);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-4 mt-6 mb-10 flex flex-col items-center justify-center p-8 text-center rounded-3xl"
        style={{ backgroundColor: accent + "12", border: `1.5px solid ${accent}30` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: accent + "25" }}>
          <CheckCircle className="w-8 h-8" style={{ color: accent }} />
        </div>
        <h3 className="text-lg font-black mb-1" style={{ color: styles.title }}>Check-in validé !</h3>
        <p className="text-sm" style={{ color: styles.note }}>Votre arrivée a bien été enregistrée. Bienvenue !</p>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3.5 text-sm focus:outline-none placeholder-shown:opacity-60";

  return (
    <div className="px-4 mt-6 mb-10 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: styles.label }}>Enregistrement d'arrivée</p>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>Nom complet *</label>
        <input type="text" value={form.guestName} onChange={(e) => set("guestName", e.target.value)}
          placeholder="Jean Dupont" className={inputClass} style={{ ...styles.input, caretColor: accent }} />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>Email</label>
        <input type="email" value={form.guestEmail} onChange={(e) => set("guestEmail", e.target.value)}
          placeholder="jean@exemple.fr" className={inputClass} style={{ ...styles.input, caretColor: accent }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>Arrivée *</label>
          <input type="date" value={form.checkInDate} onChange={(e) => set("checkInDate", e.target.value)}
            className={inputClass} style={{ ...styles.input, colorScheme: isDark ? "dark" : "light" }} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>Départ</label>
          <input type="date" value={form.checkOutDate} onChange={(e) => set("checkOutDate", e.target.value)}
            className={inputClass} style={{ ...styles.input, colorScheme: isDark ? "dark" : "light" }} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: styles.label }}>Nombre de voyageurs</label>
        <input type="number" min="1" max="20" value={form.guestCount} onChange={(e) => set("guestCount", e.target.value)}
          className={inputClass} style={{ ...styles.input, caretColor: accent }} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: styles.label }}>Signature *</label>
          {hasSignature && (
            <button onClick={clearSignature} className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: styles.note }}>
              <RotateCcw className="w-3 h-3" /> Effacer
            </button>
          )}
        </div>
        <div className="relative overflow-hidden" style={styles.signatureBg}>
          {!hasSignature && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1" style={{ color: styles.signaturePen }}>
              <PenLine className="w-5 h-5" />
              <span className="text-xs">Signez ici</span>
            </div>
          )}
          <canvas ref={canvasRef} width={600} height={160} className="w-full touch-none"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
        </div>
      </div>

      <label className="flex items-start gap-3 p-4 cursor-pointer" style={styles.checkboxBg}>
        <div onClick={() => set("acceptedRules", !form.acceptedRules)}
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors"
          style={{ backgroundColor: form.acceptedRules ? accent : "transparent", border: `2px solid ${form.acceptedRules ? accent : (isDark ? "rgba(255,255,255,0.25)" : "#d1d5db")}` }}>
          {form.acceptedRules && <CheckCircle className="w-3 h-3 text-white" />}
        </div>
        <span className="text-sm leading-relaxed" style={{ color: styles.checkboxText }}>
          J'ai lu et j'accepte le règlement intérieur du logement.
        </span>
      </label>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-4 rounded-full font-bold text-white text-base transition-all active:scale-95 disabled:opacity-50"
        style={{ backgroundColor: accent, boxShadow: `0 6px 24px ${accent}50` }}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Valider mon check-in →"}
      </button>

      <p className="text-center text-xs pb-2" style={{ color: styles.note }}>
        Vos données sont transmises uniquement à l'hôte
      </p>
    </div>
  );
}
