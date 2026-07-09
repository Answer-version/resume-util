"use client";

import { Languages } from "lucide-react";

import { localeOptions } from "@/lib/i18n";
import { useI18n } from "@/components/providers/i18n-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex items-center rounded-md border border-line bg-white p-1">
      <span className="inline-flex h-8 w-8 items-center justify-center text-muted">
        <Languages className="h-4 w-4" />
      </span>
      {localeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLocale(option.value)}
          className={`h-8 rounded-md px-3 text-sm transition ${
            locale === option.value
              ? "bg-accent text-white"
              : "text-foreground hover:bg-panel-soft"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
