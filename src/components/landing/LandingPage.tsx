"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  BookOpen, Wifi, Languages, QrCode, Palette, Zap, Smartphone,
  Check, ArrowRight, Star, Menu, X, BarChart2, Copy,
  ChevronRight, MapPin, Globe, Play, Users, Shield, Clock,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function LandingPage() {
  const locale = useLocale();
  const t = useTranslations("landing");
  const tm = useTranslations("modules");
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-lg text-white">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            Bunkly<span className="text-orange-500">.</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">{t("nav.features")}</a>
            <a href="#demo" className="hover:text-white transition-colors">{t("nav.demo")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("nav.pricing")}</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="dark" />
            <Link href={`/${locale}/auth`} className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2">
              {t("nav.login")}
            </Link>
            <Link href={`/${locale}/auth`} className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/30">
              {t("nav.signup")}
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <LanguageSwitcher variant="dark" />
            <button className="p-2 text-white/70" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 px-5 py-4 flex flex-col gap-3">
            <a href="#features" className="text-sm text-white/70 py-2" onClick={() => setMenuOpen(false)}>{t("nav.features")}</a>
            <a href="#demo" className="text-sm text-white/70 py-2" onClick={() => setMenuOpen(false)}>{t("nav.demo")}</a>
            <a href="#pricing" className="text-sm text-white/70 py-2" onClick={() => setMenuOpen(false)}>{t("nav.pricing")}</a>
            <Link href={`/${locale}/auth`} className="bg-orange-500 text-white text-sm font-bold px-5 py-3.5 rounded-xl text-center mt-2">
              {t("nav.signupMobile")}
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 px-5">
        {/* Background photo */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1600&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-black/60 to-black/20" />
        </div>

        {/* Badge */}
        <div className="relative max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
            {t("hero.badge")}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] mb-6 tracking-tight max-w-3xl">
            {t.rich("hero.title", {
              accent: (chunks) => <span className="text-orange-400">{chunks}</span>,
            })}
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-xl mb-10 leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href={`/${locale}/auth`}
              className="flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-0.5 w-full sm:w-auto justify-center">
              {t("hero.cta")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo"
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors">
              <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:border-white/60 transition-colors">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              {t("hero.watchDemo")}
            </a>
          </div>

          <div className="flex items-center gap-6 mt-8 text-xs text-white/40 font-medium">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-400" /> {t("hero.noCard")}</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-400" /> {t("hero.ready5")}</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-400" /> {t("hero.cancelAnytime")}</span>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section className="bg-white/5 border-y border-white/10 py-6 px-5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-white/50 font-medium">
          {[t("social.gites"), t("social.airbnb"), t("social.guesthouses"), t("social.campings"), t("social.vans")].map((item) => (
            <span key={item} className="text-sm">{item}</span>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">{t("how.kicker")}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-2xl">{t("how.title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                icon: Users,
                title: t("how.step1Title"),
                desc: t("how.step1Desc"),
                img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80",
              },
              {
                n: "02",
                icon: BookOpen,
                title: t("how.step2Title"),
                desc: t("how.step2Desc"),
                img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
              },
              {
                n: "03",
                icon: QrCode,
                title: t("how.step3Title"),
                desc: t("how.step3Desc"),
                img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
              },
            ].map((step, i) => (
              <div key={step.n} className="relative group">
                <div className="bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-3xl overflow-hidden transition-all duration-300">
                  <div className="relative h-40 overflow-hidden">
                    <img src={step.img} alt={step.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-4 left-4 text-4xl font-black text-white/20">{step.n}</span>
                  </div>
                  <div className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-4">
                      <step.icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-20 -right-3 z-10 w-6 h-6 rounded-full bg-orange-500 items-center justify-center">
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href={`/${locale}/auth`}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-orange-500/30">
              {t("how.cta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">{t("features.kicker")}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t("features.title")}</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">{t("features.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: t("features.f1Title"), desc: t("features.f1Desc"), color: "orange" },
              { icon: Languages, title: t("features.f2Title"), desc: t("features.f2Desc"), color: "blue" },
              { icon: QrCode, title: t("features.f3Title"), desc: t("features.f3Desc"), color: "purple" },
              { icon: Zap, title: t("features.f4Title"), desc: t("features.f4Desc"), color: "yellow" },
              { icon: BarChart2, title: t("features.f5Title"), desc: t("features.f5Desc"), color: "green" },
              { icon: Copy, title: t("features.f6Title"), desc: t("features.f6Desc"), color: "pink" },
              { icon: Palette, title: t("features.f7Title"), desc: t("features.f7Desc"), color: "orange" },
              { icon: MapPin, title: t("features.f8Title"), desc: t("features.f8Desc"), color: "blue" },
              { icon: Smartphone, title: t("features.f9Title"), desc: t("features.f9Desc"), color: "purple" },
            ].map(({ icon: Icon, title, desc, color }) => {
              const colors: Record<string, string> = {
                orange: "bg-orange-500/15 text-orange-400 border-orange-500/20",
                blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
                purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
                yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
                green: "bg-green-500/15 text-green-400 border-green-500/20",
                pink: "bg-pink-500/15 text-pink-400 border-pink-500/20",
              };
              return (
                <div key={title} className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PHONE MOCKUP ── */}
      <section className="py-24 px-5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-4">{t("phone.kicker")}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              {t("phone.title")}
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              {t("phone.desc")}
            </p>
            <ul className="space-y-3 mb-10">
              {[t("phone.li1"), t("phone.li2"), t("phone.li3"), t("phone.li4")].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/60">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-orange-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link href={`/${locale}/auth`}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-7 py-3.5 rounded-2xl transition-all hover:shadow-xl hover:shadow-orange-500/30">
              {t("phone.cta")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="relative w-[260px]">
              {/* Phone frame */}
              <div className="relative bg-[#1a1a1a] rounded-[40px] border-4 border-[#333] shadow-2xl overflow-hidden" style={{ height: "520px" }}>
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-2xl z-20" />

                {/* Splash screen simulation */}
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white/50 text-[9px] uppercase tracking-widest font-semibold mb-1">Bunkly</p>
                    <p className="text-white font-bold text-lg leading-tight mb-1">Villa Les Lavandes</p>
                    <p className="text-white/50 text-[10px] mb-5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> Maussane-les-Alpilles
                    </p>
                    <div className="bg-white rounded-xl py-2.5 text-center">
                      <span className="text-[11px] font-bold" style={{ color: "#f97316" }}>{t("phone.mockupOpen")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second phone — home screen */}
              <div className="absolute -right-14 top-16 w-[220px] bg-[#1a1a1a] rounded-[36px] border-4 border-[#333] shadow-2xl overflow-hidden opacity-80" style={{ height: "440px" }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1a1a1a] rounded-b-xl z-20" />
                <div className="absolute inset-0 bg-gray-900">
                  {/* Header */}
                  <div className="px-4 pt-7 pb-4" style={{ backgroundColor: "#f97316" }}>
                    <p className="text-white font-bold text-sm">Villa Les Lavandes</p>
                    <p className="text-white/60 text-[9px] mt-0.5">{t("phone.mockupSections")}</p>
                  </div>
                  {/* Grid */}
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {[
                      { e: "👋", l: tm("welcome") },
                      { e: "📋", l: tm("practical") },
                      { e: "🗝️", l: tm("checkin") },
                      { e: "📜", l: tm("rules") },
                      { e: "🏠", l: tm("guide") },
                      { e: "📞", l: tm("contacts") },
                    ].map((m) => (
                      <div key={m.l} className="bg-white/10 rounded-xl p-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mb-2"
                          style={{ backgroundColor: "rgba(249,115,22,0.2)" }}>
                          {m.e}
                        </div>
                        <p className="text-white text-[9px] font-semibold">{m.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO DEMO ── */}
      <section id="demo" className="py-24 px-5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">{t("demo.kicker")}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t("demo.title")}</h2>
            <p className="text-white/50 text-lg">{t("demo.subtitle")}</p>
          </div>

          <div ref={videoRef} className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ aspectRatio: "16/9" }}>
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">{t("testimonials.kicker")}</p>
            <h2 className="text-4xl font-bold text-white">{t("testimonials.title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: t("testimonials.t1Name"),
                role: t("testimonials.t1Role"),
                text: t("testimonials.t1Text"),
                stars: 5,
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
              },
              {
                name: t("testimonials.t2Name"),
                role: t("testimonials.t2Role"),
                text: t("testimonials.t2Text"),
                stars: 5,
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
              },
              {
                name: t("testimonials.t3Name"),
                role: t("testimonials.t3Role"),
                text: t("testimonials.t3Text"),
                stars: 5,
                img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
              },
            ].map((tst) => (
              <div key={tst.name} className="bg-white/5 border border-white/10 rounded-3xl p-7">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: tst.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6">"{tst.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={tst.img} alt={tst.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-white font-semibold text-sm">{tst.name}</p>
                    <p className="text-white/40 text-xs">{tst.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-5 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">{t("pricing.kicker")}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t("pricing.title")}</h2>
            <p className="text-white/50 mb-8">{t("pricing.subtitle")}</p>

            <div className="inline-flex items-center bg-white/10 rounded-2xl p-1.5 gap-1">
              {(["monthly", "yearly"] as const).map((b) => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    billing === b
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}>
                  {b === "monthly" ? t("pricing.monthly") : t("pricing.yearly")}
                  {b === "yearly" && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">−36%</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Free */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <p className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">{t("pricing.freeName")}</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-5xl font-black text-white">0€</span>
                <span className="text-white/40 mb-2 text-sm">{t("pricing.freeForever")}</span>
              </div>
              <p className="text-sm text-white/40 mb-7">{t("pricing.freeDesc")}</p>
              <ul className="space-y-3.5 mb-8">
                {[
                  t("pricing.freePerk1"),
                  t("pricing.freePerk2"),
                  t("pricing.freePerk3"),
                ].map((perk) => (
                  <li key={perk} className="flex items-center gap-3 text-sm text-white/60">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white/50" />
                    </div>
                    {perk}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/auth`}
                className="block text-center border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold py-3.5 rounded-2xl transition-colors">
                {t("pricing.freeCta")}
              </Link>
            </div>

            {/* Actif */}
            <div className="relative rounded-3xl p-8 overflow-hidden" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white/80 uppercase tracking-wider">{t("pricing.actifName")}</p>
                  <span className="text-xs bg-white/20 text-white font-bold px-3 py-1 rounded-full">{t("pricing.popular")}</span>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-white">
                    {billing === "monthly" ? "9€" : "69€"}
                  </span>
                  <span className="text-white/60 mb-2 text-sm">
                    {billing === "monthly" ? t("pricing.perMonth") : t("pricing.perYear")}
                  </span>
                </div>
                {billing === "yearly" && (
                  <p className="text-xs text-white/60 mb-2">{t("pricing.yearlyNote")}</p>
                )}
                <p className="text-sm text-white/70 mb-7">{t("pricing.actifDesc")}</p>
                <ul className="space-y-3.5 mb-8">
                  {[
                    t("pricing.actifPerk1"),
                    t("pricing.actifPerk2"),
                    t("pricing.actifPerk3"),
                    t("pricing.actifPerk4"),
                    t("pricing.actifPerk5"),
                    t("pricing.actifPerk6"),
                    t("pricing.actifPerk7"),
                  ].map((perk) => (
                    <li key={perk} className="flex items-center gap-3 text-sm text-white">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link href={`/${locale}/auth`}
                  className="block text-center bg-white hover:bg-orange-50 text-orange-600 font-black py-4 rounded-2xl transition-colors shadow-lg">
                  {t("pricing.actifCta")}
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-white/30 text-sm mt-6 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            {t("pricing.secured")}
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative py-32 px-5 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/75" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            {t("cta.title")}
          </h2>
          <p className="text-white/60 text-xl mb-10">
            {t("cta.subtitle")}
          </p>
          <Link href={`/${locale}/auth`}
            className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-400 text-white font-black text-lg px-10 py-5 rounded-2xl transition-all hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-1">
            {t("cta.button")}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/30 text-sm mt-5 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-400" /> {t("cta.noCard")}</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-400" /> {t("cta.fiveMin")}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-400" /> {t("cta.cancel")}</span>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-10 px-5 bg-black/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            Bunkly
          </div>
          <p>© {new Date().getFullYear()} Bunkly — {t("footer.rights")}</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white/70 transition-colors">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-white/70 transition-colors">{t("footer.terms")}</a>
            <a href="#" className="hover:text-white/70 transition-colors">{t("footer.contact")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
