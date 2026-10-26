"use client";

import { createContext } from "react";
import { SupportedLang } from "@/types";

// Langue d'ouverture du livret, choisie côté serveur (voir pickBookletLang)
export const InitialLangCtx = createContext<SupportedLang | null>(null);
