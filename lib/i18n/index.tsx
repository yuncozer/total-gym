"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { strings, type StringKey, type Lang } from "./strings";
import { useAuth } from "@/lib/useAuth";

export { strings, type StringKey, type Lang };

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const GUEST_KEY = "tg_lang";

function getStorageKey(userId?: string) {
  return userId ? `tg_lang_${userId}` : GUEST_KEY;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = getStorageKey(user?.id);

  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Lang | null;
    if (saved === "es" || saved === "en") {
      setLangState(saved);
    }
  }, [storageKey]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(storageKey, l);
  }, [storageKey]);

  const t = useCallback(
    (key: string) => (strings as Record<string, { es: string; en: string } | undefined>)[key]?.[lang] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
