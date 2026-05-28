"use client";

import { useRef, useState } from "react";
import { CheckCircle, Loader2, PenLine, RotateCcw } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Props {
  bookletId: string;
  accent: string;
  onClose: () => void;
}

export function CheckInForm({ bookletId, accent, onClose }: Props) {
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

  // ── Signature canvas ──
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
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
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
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
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ backgroundColor: accent + "20" }}>
          <CheckCircle className="w-10 h-10" style={{ color: accent }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-in validé !</h2>
        <p className="text-gray-400 text-sm mb-8">Votre arrivée a bien été enregistrée. Bienvenue !</p>
        <button onClick={onClose}
          className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm"
          style={{ backgroundColor: accent }}>
          Accéder au livret →
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-5 pt-10 pb-5 bg-white border-b border-gray-100">
        <button onClick={onClose} className="text-sm text-gray-400 mb-4 flex items-center gap-1">
          ← Annuler
        </button>
        <h2 className="text-xl font-bold text-gray-900">Check-in</h2>
        <p className="text-sm text-gray-400 mt-0.5">Enregistrez votre arrivée</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-4">

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nom complet *</label>
          <input type="text" value={form.guestName} onChange={(e) => set("guestName", e.target.value)}
            placeholder="Jean Dupont"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 placeholder-gray-300"
            style={{ ["--tw-ring-color" as string]: accent }} />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
          <input type="email" value={form.guestEmail} onChange={(e) => set("guestEmail", e.target.value)}
            placeholder="jean@exemple.fr"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 placeholder-gray-300" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Arrivée *</label>
            <input type="date" value={form.checkInDate} onChange={(e) => set("checkInDate", e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Départ</label>
            <input type="date" value={form.checkOutDate} onChange={(e) => set("checkOutDate", e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nombre de personnes</label>
          <input type="number" min="1" max="20" value={form.guestCount} onChange={(e) => set("guestCount", e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2" />
        </div>

        {/* Signature */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Signature *</label>
            {hasSignature && (
              <button onClick={clearSignature} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600">
                <RotateCcw className="w-3 h-3" /> Effacer
              </button>
            )}
          </div>
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden relative"
            style={{ borderColor: hasSignature ? accent + "60" : undefined }}>
            {!hasSignature && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-300 gap-1">
                <PenLine className="w-6 h-6" />
                <span className="text-xs">Signez ici</span>
              </div>
            )}
            <canvas ref={canvasRef} width={600} height={180}
              className="w-full touch-none"
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
          </div>
        </div>

        {/* Règlement */}
        <label className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer">
          <input type="checkbox" checked={form.acceptedRules}
            onChange={(e) => set("acceptedRules", e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-orange-500" />
          <span className="text-sm text-gray-600 leading-relaxed">
            J'ai lu et j'accepte le règlement intérieur du logement.
          </span>
        </label>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50 shadow-lg"
          style={{ backgroundColor: accent }}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Valider mon check-in →"}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Vos données sont transmises uniquement à l'hôte
        </p>
      </div>
    </div>
  );
}
