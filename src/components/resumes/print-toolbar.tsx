"use client";

import { Printer } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";

type PrintToolbarProps = {
  resumeId: string;
};

export function PrintToolbar({ resumeId }: PrintToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium !text-white transition hover:bg-slate-800"
      >
        <Printer className="h-4 w-4" />
        {t.printOrSavePdf}
      </button>
      <Link
        href={`/resumes/${resumeId}`}
        className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft"
      >
        {t.backToEdit}
      </Link>
    </div>
  );
}
