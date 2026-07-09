"use client";

import type { ResumeSnapshot } from "@/types/resume";
import { useI18n } from "@/components/providers/i18n-provider";
import { translateGender } from "@/lib/i18n";

type ResumePreviewProps = {
  snapshot: ResumeSnapshot;
  title?: string;
  updatedAt?: string;
  printMode?: boolean;
};

function PreviewField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 border-b border-line py-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ResumePreview({
  snapshot,
  title,
  updatedAt,
  printMode = false,
}: ResumePreviewProps) {
  const { locale, t } = useI18n();
  const showPhoto = snapshot.templateType === "photo";

  return (
    <div
      className={`${
        printMode ? "shadow-none" : "shadow-sm"
      } mx-auto w-full max-w-[820px] rounded-lg border border-line bg-white`}
    >
      <div className="border-b border-line px-8 py-7">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            {title ? (
              <p className="text-xs font-medium tracking-[0.12em] text-muted uppercase">
                {title}
              </p>
            ) : null}
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-foreground">
                {snapshot.name || t.notFilledName}
              </h1>
              <p className="text-base text-muted">
                {snapshot.targetJob || t.notFilledJob}
              </p>
            </div>
          </div>
          {showPhoto ? (
            <div className="h-28 w-24 overflow-hidden rounded-md border border-line bg-panel-soft">
              {snapshot.photo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={snapshot.photo.url}
                  alt="简历照片"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted">
                  {t.photoPlaceholder}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 px-8 py-7 lg:grid-cols-[1.3fr_0.9fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{t.basicInfo}</h2>
            {updatedAt ? <p className="text-xs text-muted">{t.updatedTime} {updatedAt}</p> : null}
          </div>
          <dl>
            <PreviewField label={t.name} value={snapshot.name || "-"} />
            <PreviewField
              label={t.gender}
              value={snapshot.gender ? translateGender(locale, snapshot.gender) : "-"}
            />
            <PreviewField label={t.age} value={snapshot.age || "-"} />
            <PreviewField label={t.email} value={snapshot.email || "-"} />
            <PreviewField label={t.phone} value={snapshot.phone || "-"} />
            <PreviewField label={t.targetJobLabel} value={snapshot.targetJob || "-"} />
          </dl>
        </section>

        <section className="space-y-6">
          <div className="rounded-md border border-line bg-panel-soft px-5 py-5">
            <p className="text-xs font-medium tracking-[0.1em] text-muted uppercase">
              {t.templateStyle}
            </p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {showPhoto ? t.photoTemplateName : t.noPhotoTemplateName}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t.previewHint}
            </p>
          </div>

          <div className="rounded-md border border-line px-5 py-5">
            <h2 className="text-sm font-semibold text-foreground">{t.submissionTips}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li>{t.tip1}</li>
              <li>{t.tip2}</li>
              <li>{t.tip3}</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
