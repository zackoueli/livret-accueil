"use client";

import { useEffect, useRef, useState } from "react";
import { X, Copy, Check, ExternalLink, Download } from "lucide-react";
import QRCode from "qrcode";
import { Booklet } from "@/types";
import toast from "react-hot-toast";

export function ShareModal({ booklet, onClose }: { booklet: Booklet; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/b/${booklet.slug}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      });
    }
  }, [url]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qrcode-${booklet.slug}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Partager le livret</h2>
            <p className="text-sm text-gray-400 mt-0.5 truncate max-w-[220px]">{booklet.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-6 pb-6">
          <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 shadow-sm mb-4">
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>
          <p className="text-xs text-gray-400 text-center mb-5">
            Scannez ce QR code ou partagez le lien direct
          </p>

          {/* URL bar */}
          <div className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-3">
            <span className="text-xs text-gray-500 truncate flex-1 font-mono">{url}</span>
            <button onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              {copied
                ? <Check className="w-4 h-4 text-green-500" />
                : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-sm py-3 rounded-2xl transition-colors">
              <Download className="w-4 h-4" />
              QR Code
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-2xl transition-colors text-white"
              style={{ backgroundColor: booklet.accentColor }}>
              <ExternalLink className="w-4 h-4" />
              Ouvrir
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
