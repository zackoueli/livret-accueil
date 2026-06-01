"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { BookOpen, ArrowLeft, Mail, MessageCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const FAQ = [
  {
    q: "Comment créer mon premier livret ?",
    a: "Depuis votre dashboard, cliquez sur « Nouveau livret », donnez-lui un nom, puis remplissez les modules depuis l'éditeur. Votre livret est sauvegardé automatiquement toutes les 3 secondes.",
  },
  {
    q: "Comment partager mon livret avec mes voyageurs ?",
    a: "Une fois votre livret publié (plan Actif requis), cliquez sur l'icône de partage sur la carte du livret. Vous obtenez un lien direct et un QR code téléchargeable à imprimer.",
  },
  {
    q: "Comment activer la traduction automatique ?",
    a: "Dans l'éditeur, sélectionnez un module, changez d'onglet de langue (EN, ES, DE, IT), puis cliquez sur « Traduire depuis le français ». Le contenu est traduit automatiquement.",
  },
  {
    q: "Comment personnaliser la page d'accueil du livret ?",
    a: "Dans l'éditeur, allez dans l'onglet « Accueil » de la barre latérale. Vous pouvez uploader un fond photo ou vidéo, personnaliser les textes, les couleurs et ajouter votre logo.",
  },
  {
    q: "Mes voyageurs peuvent-ils faire leur check-in en ligne ?",
    a: "Oui ! Chaque livret dispose d'un bouton « Check-in » que vos voyageurs peuvent remplir à leur arrivée. Vous retrouvez tous les check-ins depuis votre dashboard.",
  },
  {
    q: "Comment annuler mon abonnement ?",
    a: "Depuis Paramètres → Gérer la facturation (Stripe), vous pouvez annuler votre abonnement à tout moment. Vous gardez l'accès jusqu'à la fin de la période payée.",
  },
  {
    q: "Puis-je utiliser Bunkly sur plusieurs logements ?",
    a: "Oui, le plan Actif permet de créer des livrets illimités. Vous pouvez aussi dupliquer un livret existant depuis le menu contextuel de chaque carte.",
  },
];

export function SupportPage() {
  const router = useRouter();
  const locale = useLocale();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/${locale}/dashboard`)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <a href={`/${locale}`} className="flex items-center gap-2 font-bold text-xl text-gray-900">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              Livret<span className="text-orange-500">.</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-sm text-gray-400 mt-0.5">Nous sommes là pour vous aider</p>
        </div>

        {/* Horaires */}
        <section className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Support disponible 9h – 19h, 7j/7</p>
            <p className="text-sm text-gray-500 mt-0.5">Réponse garantie sous 2h durant les horaires d'ouverture</p>
          </div>
        </section>

        {/* Canaux de contact */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="mailto:support@bunkly.co"
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Email</p>
              <p className="text-sm text-gray-400 mt-0.5">support@bunkly.co</p>
              <p className="text-xs text-blue-500 mt-1 font-medium group-hover:underline">Envoyer un email →</p>
            </div>
          </a>

          <a href="https://wa.me/33600000000" target="_blank" rel="noopener noreferrer"
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">WhatsApp</p>
              <p className="text-sm text-gray-400 mt-0.5">Réponse rapide garantie</p>
              <p className="text-xs text-green-500 mt-1 font-medium group-hover:underline">Ouvrir WhatsApp →</p>
            </div>
          </a>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Questions fréquentes</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3">
                  <span className="font-semibold text-gray-800 text-sm">{item.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed mt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
