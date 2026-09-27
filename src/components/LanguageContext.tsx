"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, t as translate } from "@/lib/i18n";

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  t: (key: Parameters<typeof translate>[1]) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem("ssb_lang") as Lang | null;
    const storedTheme = localStorage.getItem("ssb_theme") as "dark" | "light" | null;
    if (storedLang) setLangState(storedLang);
    if (storedTheme) setTheme(storedTheme);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("ssb_theme", theme);
  }, [theme, themeReady]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("ssb_lang", l);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <AppContext.Provider value={{ lang, setLang, theme, toggleTheme, t: (k) => translate(lang, k) }}>
      <div className={lang === "bn" ? "font-bn" : ""}>{children}</div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
