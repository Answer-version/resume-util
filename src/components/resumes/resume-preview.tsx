"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { translateGender } from "@/lib/i18n";
import { isRichTextEmpty, normalizeRichTextInput } from "@/lib/rich-text";
import type {
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeProjectItem,
  ResumeSectionConfigItem,
  ResumeSectionKey,
  ResumeSkillItem,
  ResumeSnapshot,
} from "@/types/resume";

type ResumePreviewProps = {
  snapshot: ResumeSnapshot;
  printMode?: boolean;
};

function isFilled(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function compactLine(parts: Array<string | number | null | undefined>) {
  return parts.filter((part) => String(part ?? "").trim()).join(" · ");
}

function PreviewSection({
  title,
  children,
  emptyHint,
}: {
  title: string;
  children?: React.ReactNode;
  emptyHint?: string;
}) {
  return (
    <section>
      <div className="mb-4 border-b border-line pb-2">
        <h2 className="text-sm font-semibold tracking-[0.08em] text-foreground uppercase">
          {title}
        </h2>
      </div>
      {emptyHint ? <p className="text-sm leading-6 text-muted">{emptyHint}</p> : children}
    </section>
  );
}

function RichTextBlock({ value, className = "" }: { value: string; className?: string }) {
  return (
    <div
      className={`resume-richtext ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: normalizeRichTextInput(value) }}
    />
  );
}

function Timeline({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
}) {
  const text = compactLine([startDate, endDate]);
  if (!text) {
    return null;
  }

  return <p className="text-sm text-muted">{text}</p>;
}

function hasEducation(items: ResumeEducationItem[]) {
  return items.some((item) =>
    [item.school, item.degree, item.major, item.startDate, item.endDate].some(isFilled) ||
      !isRichTextEmpty(item.description),
  );
}

function hasExperience(items: ResumeExperienceItem[]) {
  return items.some((item) =>
    [item.company, item.role, item.startDate, item.endDate].some(isFilled) ||
      !isRichTextEmpty(item.description),
  );
}

function hasProjects(items: ResumeProjectItem[]) {
  return items.some((item) =>
    [item.name, item.role, item.startDate, item.endDate].some(isFilled) ||
      !isRichTextEmpty(item.description) ||
      !isRichTextEmpty(item.outcome),
  );
}

function hasSkills(items: ResumeSkillItem[]) {
  return items.some((item) => isFilled(item.category) || !isRichTextEmpty(item.details));
}

export function ResumePreview({
  snapshot,
  printMode = false,
}: ResumePreviewProps) {
  const { locale, t } = useI18n();
  const showPhoto = snapshot.templateType === "photo";
  const compactInfo = [
    snapshot.gender ? translateGender(locale, snapshot.gender) : "",
    snapshot.age ? `${snapshot.age}` : "",
    snapshot.phone,
    snapshot.email,
  ]
    .filter(Boolean)
    .join(" · ");

  const sectionTitleMap: Record<ResumeSectionKey, string> = {
    summary: t.summary,
    education: t.educationSection,
    experience: t.experienceSection,
    projects: t.projectSection,
    skills: t.skillSection,
  };

  function renderSummary(config: ResumeSectionConfigItem) {
    return (
      <PreviewSection
        title={sectionTitleMap[config.key]}
        emptyHint={isRichTextEmpty(snapshot.summary) ? t.emptySectionHint : undefined}
      >
        <RichTextBlock value={snapshot.summary} className="text-sm leading-7 text-foreground/90" />
      </PreviewSection>
    );
  }

  function renderEducation(config: ResumeSectionConfigItem) {
    const visibleItems = snapshot.education.filter((item) =>
      [item.school, item.degree, item.major, item.startDate, item.endDate].some(isFilled) ||
        !isRichTextEmpty(item.description),
    );

    return (
      <PreviewSection
        title={sectionTitleMap[config.key]}
        emptyHint={!hasEducation(snapshot.education) ? t.emptySectionHint : undefined}
      >
        <div className="space-y-5">
          {visibleItems.map((item) => (
            <article key={item.id} className="space-y-2">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {item.school || t.school}
                </h3>
                <p className="text-sm text-foreground/80">
                  {compactLine([item.degree, item.major])}
                </p>
              </div>
              <Timeline startDate={item.startDate} endDate={item.endDate} />
              {item.description ? (
                <RichTextBlock
                  value={item.description}
                  className="text-sm leading-7 text-foreground/90"
                />
              ) : null}
            </article>
          ))}
        </div>
      </PreviewSection>
    );
  }

  function renderExperience(config: ResumeSectionConfigItem) {
    const visibleItems = snapshot.experience.filter((item) =>
      [item.company, item.role, item.startDate, item.endDate].some(isFilled) ||
        !isRichTextEmpty(item.description),
    );

    return (
      <PreviewSection
        title={sectionTitleMap[config.key]}
        emptyHint={!hasExperience(snapshot.experience) ? t.emptySectionHint : undefined}
      >
        <div className="space-y-6">
          {visibleItems.map((item) => (
            <article key={item.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {item.role || t.role}
                  </h3>
                  <p className="text-sm text-foreground/80">{item.company}</p>
                </div>
                <Timeline startDate={item.startDate} endDate={item.endDate} />
              </div>
              {item.description ? (
                <RichTextBlock
                  value={item.description}
                  className="text-sm leading-7 text-foreground/90"
                />
              ) : null}
            </article>
          ))}
        </div>
      </PreviewSection>
    );
  }

  function renderProjects(config: ResumeSectionConfigItem) {
    const visibleItems = snapshot.projects.filter((item) =>
      [item.name, item.role, item.startDate, item.endDate].some(isFilled) ||
        !isRichTextEmpty(item.description) ||
        !isRichTextEmpty(item.outcome),
    );

    return (
      <PreviewSection
        title={sectionTitleMap[config.key]}
        emptyHint={!hasProjects(snapshot.projects) ? t.emptySectionHint : undefined}
      >
        <div className="space-y-6">
          {visibleItems.map((item) => (
            <article key={item.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {item.name || t.projectName}
                  </h3>
                  {item.role ? (
                    <p className="text-sm text-foreground/80">{item.role}</p>
                  ) : null}
                </div>
                <Timeline startDate={item.startDate} endDate={item.endDate} />
              </div>
              {item.description ? (
                <RichTextBlock
                  value={item.description}
                  className="text-sm leading-7 text-foreground/90"
                />
              ) : null}
              {item.outcome ? (
                <div className="rounded-md bg-panel-soft px-3 py-3">
                  <RichTextBlock
                    value={item.outcome}
                    className="text-sm leading-6 text-foreground/90"
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </PreviewSection>
    );
  }

  function renderSkills(config: ResumeSectionConfigItem) {
    const visibleItems = snapshot.skills.filter((item) =>
      isFilled(item.category) || !isRichTextEmpty(item.details),
    );

    return (
      <PreviewSection
        title={sectionTitleMap[config.key]}
        emptyHint={!hasSkills(snapshot.skills) ? t.emptySectionHint : undefined}
      >
        <div className="space-y-4">
          {visibleItems.map((item) => (
            <article key={item.id} className="rounded-md bg-panel-soft px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                {item.category || t.skillCategory}
              </h3>
              <RichTextBlock
                value={item.details}
                className="mt-2 text-sm leading-6 text-foreground/90"
              />
            </article>
          ))}
        </div>
      </PreviewSection>
    );
  }

  function renderSection(config: ResumeSectionConfigItem) {
    if (!config.visible) {
      return null;
    }

    switch (config.key) {
      case "summary":
        return renderSummary(config);
      case "education":
        return renderEducation(config);
      case "experience":
        return renderExperience(config);
      case "projects":
        return renderProjects(config);
      case "skills":
        return renderSkills(config);
      default:
        return null;
    }
  }

  const visibleSections = snapshot.sectionConfig.filter((item) => item.visible);
  const mainSections = visibleSections.filter((item) => item.column === "main");
  const sideSections = visibleSections.filter((item) => item.column === "side");

  return (
    <div
      className={`${
        printMode ? "shadow-none" : "shadow-sm"
      } mx-auto w-full max-w-[860px] rounded-lg border border-line bg-white`}
    >
      <div className="border-b border-line px-8 py-7">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <h1 className="text-3xl font-semibold text-foreground">
                {snapshot.name || t.notFilledName}
              </h1>
              <p className="text-base text-muted">
                {snapshot.targetJob || t.notFilledJob}
              </p>
            </div>
            {snapshot.headline ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/85">
                {snapshot.headline}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
              {compactInfo ? <span>{compactInfo}</span> : null}
            </div>
          </div>
          {showPhoto ? (
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-panel-soft">
              {snapshot.photo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={snapshot.photo.url}
                  alt={t.photoPlaceholder}
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

      {snapshot.layoutMode === "single" ? (
        <div className="space-y-8 px-8 py-7">
          {visibleSections.map((config) => (
            <div key={config.key}>{renderSection(config)}</div>
          ))}
        </div>
      ) : (
        <div className="grid gap-8 px-8 py-7 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-8">
            {mainSections.map((config) => (
              <div key={config.key}>{renderSection(config)}</div>
            ))}
          </div>
          <div className="space-y-8">
            {sideSections.map((config) => (
              <div key={config.key}>{renderSection(config)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
