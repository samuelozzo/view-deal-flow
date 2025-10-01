import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "it" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    browseOffers: "Browse Offers",
    dashboard: "Dashboard",
    postOffer: "Post Offer",
    support: "Support",
    signIn: "Sign In",
    getStarted: "Get Started",
  },
  it: {
    browseOffers: "Sfoglia Offerte",
    dashboard: "Pannello",
    postOffer: "Pubblica Offerta",
    support: "Supporto",
    signIn: "Accedi",
    getStarted: "Inizia",
  },
  es: {
    browseOffers: "Ver Ofertas",
    dashboard: "Panel",
    postOffer: "Publicar Oferta",
    support: "Soporte",
    signIn: "Iniciar Sesión",
    getStarted: "Comenzar",
  },
};

const detectUserLanguage = (): Language => {
  const stored = localStorage.getItem("userLanguage");
  if (stored && (stored === "en" || stored === "it" || stored === "es")) {
    return stored as Language;
  }

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("it")) return "it";
  if (browserLang.startsWith("es")) return "es";
  return "en";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(detectUserLanguage);

  useEffect(() => {
    localStorage.setItem("userLanguage", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
