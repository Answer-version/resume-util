"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  formatDateTimeForLocale,
  getDictionary,
  localeCookieName,
  type Locale,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof getDictionary>;
  formatDateTime: (value: string | Date) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: ReactNode;
  initialLocale: Locale;
};

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return initialLocale;
    }

    const stored = window.localStorage.getItem(localeCookieName) as Locale | null;
    return stored || initialLocale;
  });

  useEffect(() => {
    window.localStorage.setItem(localeCookieName, locale);
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      t: getDictionary(locale),
      formatDateTime: (value) => formatDateTimeForLocale(locale, value),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
