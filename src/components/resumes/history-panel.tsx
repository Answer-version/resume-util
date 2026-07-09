"use client";

import { Clock3, RotateCcw } from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import type { ResumeHistoryItem } from "@/types/resume";

type HistoryPanelProps = {
  open: boolean;
  versions: ResumeHistoryItem[];
  onClose: () => void;
  onRestore: (versionId: string, versionNumber: number) => void;
  loading: boolean;
};

export function HistoryPanel({
  open,
  versions,
  onClose,
  onRestore,
  loading,
}: HistoryPanelProps) {
  const { formatDateTime, t } = useI18n();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]">
      <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-foreground">{t.historyPanelTitle}</p>
            <p className="mt-1 text-sm text-muted">{t.historyPanelSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3 py-2 text-sm text-foreground transition hover:bg-panel-soft"
          >
            {t.close}
          </button>
        </div>

        <div className="h-[calc(100%-89px)] overflow-y-auto px-6 py-6">
          {versions.length === 0 ? (
            <div className="rounded-md border border-dashed border-line bg-panel-soft px-5 py-8 text-sm text-muted">
              {t.noHistory}
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <section
                  key={version.id}
                  className="rounded-md border border-line bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">
                        V{version.versionNumber}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{formatDateTime(version.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestore(version.id, version.versionNumber)}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-foreground transition hover:bg-panel-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t.restore}
                    </button>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">{t.position}</dt>
                      <dd className="font-medium text-foreground">
                        {version.snapshotData.targetJob}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">{t.template}</dt>
                      <dd className="font-medium text-foreground">
                        {version.snapshotData.templateType === "photo" ? t.withPhoto : t.noPhoto}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">{t.note}</dt>
                      <dd className="max-w-[220px] text-right text-foreground">
                        {version.note || t.none}
                      </dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
