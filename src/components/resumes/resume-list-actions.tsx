"use client";

import { Copy, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";

type ResumeListActionsProps = {
  resumeId: string;
  title: string;
  targetJob: string;
};

export function ResumeListActions({
  resumeId,
  title,
  targetJob,
}: ResumeListActionsProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [busyAction, setBusyAction] = useState<"duplicate" | "delete" | null>(null);

  async function handleDuplicate() {
    setBusyAction("duplicate");

    try {
      const response = await fetch(`/api/v1/resumes/${resumeId}/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${title}-${t.duplicateSuffix}`,
          targetJob,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.duplicateFailed);
      }

      router.push(`/resumes/${data.id}`);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t.duplicateFailed);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t.confirmDelete(title))) {
      return;
    }

    setBusyAction("delete");

    try {
      const response = await fetch(`/api/v1/resumes/${resumeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.deleteFailed);
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t.deleteFailed);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={busyAction !== null}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-foreground transition hover:bg-panel-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Copy className="h-4 w-4" />
        {t.duplicate}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busyAction !== null}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {t.delete}
      </button>
    </div>
  );
}
