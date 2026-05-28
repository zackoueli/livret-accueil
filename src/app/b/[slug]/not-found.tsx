import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-9 h-9 text-orange-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Livret introuvable</h1>
        <p className="text-gray-400 text-sm mb-6">Ce livret n'existe pas ou n'est plus disponible.</p>
        <Link href="/" className="text-sm font-semibold text-orange-500 hover:text-orange-600">
          Créer mon propre livret →
        </Link>
      </div>
    </div>
  );
}
