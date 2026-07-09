"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/providers/i18n-provider";
import { PrintToolbar } from "@/components/resumes/print-toolbar";
import { ResumePreview } from "@/components/resumes/resume-preview";
import type { ResumeDetail } from "@/types/resume";

type PrintPageContentProps = {
  detail: ResumeDetail;
  resumeId: string;
};

export function PrintPageContent({ detail, resumeId }: PrintPageContentProps) {
  const { t, formatDateTime } = useI18n();

  return (
    <div className="print-shell min-h-screen bg-background px-6 py-6">
      <div className="no-print mx-auto mb-6 flex w-full max-w-[820px] flex-col gap-4 rounded-lg border border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{detail.title}</p>
          <p className="mt-1 text-sm text-muted">
            {t.currentVersion} {detail.currentVersion.versionNumber} · {t.savedOn}{" "}
            {formatDateTime(detail.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageSwitcher />
          <PrintToolbar resumeId={resumeId} />
        </div>
      </div>

      <ResumePreview
        title={detail.title}
        snapshot={detail.currentVersion.snapshotData}
        updatedAt={formatDateTime(detail.updatedAt)}
        printMode
      />
    </div>
  );
}
