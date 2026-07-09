"use client";

import { FilePlus2, FolderClock, PencilLine } from "lucide-react";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/providers/i18n-provider";
import { ResumeListActions } from "@/components/resumes/resume-list-actions";
import type { ResumeListItem } from "@/types/resume";

type ResumesPageContentProps = {
  items: ResumeListItem[];
};

export function ResumesPageContent({ items }: ResumesPageContentProps) {
  const { t, formatDateTime, locale } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.1em] text-muted uppercase">
              {t.appName}
            </p>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">{t.workspaceTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {t.workspaceSubtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/resumes/new"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium !text-white transition hover:bg-slate-800"
            >
              <FilePlus2 className="h-4 w-4" />
              {t.newResume}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-line bg-white px-5 py-5">
            <p className="text-sm text-muted">{t.totalResumes}</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{items.length}</p>
          </div>
          <div className="rounded-lg border border-line bg-white px-5 py-5">
            <p className="text-sm text-muted">{t.lastUpdated}</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {items[0] ? formatDateTime(items[0].updatedAt) : t.noneYet}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white px-5 py-5">
            <p className="text-sm text-muted">{t.versionPolicyTitle}</p>
            <p className="mt-3 text-lg font-semibold text-foreground">{t.versionPolicyValue}</p>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white">
          <div className="border-b border-line px-6 py-5">
            <div className="flex items-center gap-3">
              <FolderClock className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">{t.myResumes}</h2>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
              <div className="rounded-full border border-line bg-panel-soft p-4">
                <PencilLine className="h-8 w-8 text-muted" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t.noResumes}</h3>
                <p className="mt-2 text-sm text-muted">{t.noResumesHint}</p>
              </div>
              <Link
                href="/resumes/new"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium !text-white transition hover:bg-slate-800"
              >
                <FilePlus2 className="h-4 w-4" />
                {t.firstResume}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-5 px-6 py-5 xl:grid-cols-[minmax(0,1.1fr)_200px_220px_230px]"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/resumes/${item.id}`}
                        className="text-lg font-semibold text-foreground transition hover:text-accent-soft"
                      >
                        {item.title}
                      </Link>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {item.templateType === "photo" ? t.withPhoto : t.noPhoto}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {t.targetJobLabel}: {item.targetJob}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted">{t.historyVersions}</p>
                    <p className="font-semibold text-foreground">
                      {locale === "en"
                        ? `${item.versionCount} version${item.versionCount > 1 ? "s" : ""}`
                        : `${item.versionCount} 个`}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted">{t.lastUpdated}</p>
                    <p className="font-semibold text-foreground">
                      {formatDateTime(item.updatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <Link
                      href={`/resumes/${item.id}`}
                      className="inline-flex h-9 items-center rounded-md border border-line px-3 text-sm text-foreground transition hover:bg-panel-soft"
                    >
                      {t.edit}
                    </Link>
                    <Link
                      href={`/resumes/${item.id}/print`}
                      target="_blank"
                      className="inline-flex h-9 items-center rounded-md border border-line px-3 text-sm text-foreground transition hover:bg-panel-soft"
                    >
                      {t.preview}
                    </Link>
                    <ResumeListActions
                      resumeId={item.id}
                      title={item.title}
                      targetJob={item.targetJob}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
