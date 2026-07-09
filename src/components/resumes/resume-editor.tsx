"use client";

import {
  Columns2,
  Eye,
  EyeOff,
  GripVertical,
  History,
  House,
  LayoutPanelTop,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useRef, useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/providers/i18n-provider";
import { HistoryPanel } from "@/components/resumes/history-panel";
import { ResumePreview } from "@/components/resumes/resume-preview";
import {
  createEmptyEducationItem,
  createEmptyExperienceItem,
  createEmptyProjectItem,
  createEmptySkillItem,
  reorderSectionConfigItems,
  updateSectionConfigItem,
} from "@/lib/resume-data";
import type {
  ResumeDetail,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeFormState,
  ResumeHistoryItem,
  ResumeProjectItem,
  ResumeSectionColumn,
  ResumeSectionKey,
  ResumeSkillItem,
  ResumeSnapshot,
} from "@/types/resume";

type ResumeEditorProps = {
  mode: "create" | "edit";
  initialForm: ResumeFormState;
  initialHistory: ResumeHistoryItem[];
  initialDetail?: ResumeDetail;
};

type Notice = {
  tone: "success" | "error";
  text: string;
} | null;

type FormErrors = Partial<
  Record<"title" | "name" | "gender" | "age" | "email" | "phone" | "targetJob", string>
>;

type SectionArrayKey = "education" | "experience" | "projects" | "skills";

function ErrorText({ text }: { text?: string }) {
  if (!text) {
    return null;
  }

  return <p className="text-sm text-red-600">{text}</p>;
}

function SectionCard({
  children,
  title,
  muted,
  toolbar,
}: {
  children: React.ReactNode;
  title: string;
  muted?: string;
  toolbar?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {muted ? <p className="mt-1 text-sm text-muted">{muted}</p> : null}
        </div>
        {toolbar}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ArrayItemCard({
  children,
  onRemove,
  removeLabel,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel-soft/60 px-4 py-4">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-foreground transition hover:bg-panel-soft"
        >
          <Trash2 className="h-4 w-4" />
          {removeLabel}
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ResumeEditor({
  mode,
  initialForm,
  initialHistory,
  initialDetail,
}: ResumeEditorProps) {
  const router = useRouter();
  const { t, formatDateTime } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<ResumeFormState>(initialForm);
  const [history, setHistory] = useState<ResumeHistoryItem[]>(initialHistory);
  const [detail, setDetail] = useState<ResumeDetail | undefined>(initialDetail);
  const [notice, setNotice] = useState<Notice>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [versionNote, setVersionNote] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [draggingSectionKey, setDraggingSectionKey] = useState<ResumeSectionKey | null>(null);
  const [dragOverSectionKey, setDragOverSectionKey] = useState<ResumeSectionKey | null>(null);

  const currentVersionLabel = useMemo(() => {
    if (!detail?.currentVersion) {
      return t.unsaved;
    }

    return `V${detail.currentVersion.versionNumber}`;
  }, [detail, t.unsaved]);

  const sectionConfigMap = useMemo(() => {
    return new Map(form.content.sectionConfig.map((item) => [item.key, item]));
  }, [form.content.sectionConfig]);

  const sectionTitleMap: Record<ResumeSectionKey, string> = {
    summary: t.summary,
    education: t.educationSection,
    experience: t.experienceSection,
    projects: t.projectSection,
    skills: t.skillSection,
  };

  function clearError(field: keyof FormErrors) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function updateContent<K extends keyof ResumeSnapshot>(key: K, value: ResumeSnapshot[K]) {
    setForm((current) => ({
      ...current,
      content: {
        ...current.content,
        [key]: value,
      },
    }));

    if (
      key === "name" ||
      key === "gender" ||
      key === "age" ||
      key === "email" ||
      key === "phone" ||
      key === "targetJob"
    ) {
      clearError(key);
    }
  }

  function handleTextChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;

    if (name === "title") {
      setForm((current) => ({
        ...current,
        title: value,
      }));
      clearError("title");
      return;
    }

    if (name === "age") {
      updateContent("age", Number(value || 0));
      return;
    }

    updateContent(name as keyof ResumeSnapshot, value as never);
  }

  function handleTextareaChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const { name, value } = event.target;
    updateContent(name as keyof ResumeSnapshot, value as never);
  }

  function handleTemplateChange(templateType: "photo" | "no_photo") {
    updateContent("templateType", templateType);
  }

  function updateArrayItem<T extends { id: string }>(
    key: SectionArrayKey,
    id: string,
    field: keyof T,
    value: string,
  ) {
    const items = form.content[key] as unknown as T[];
    const nextItems = items.map((item) => (item.id === id ? { ...item, [field]: value } : item));
    updateContent(key as keyof ResumeSnapshot, nextItems as never);
  }

  function addSectionItem(key: SectionArrayKey) {
    const factoryMap = {
      education: createEmptyEducationItem,
      experience: createEmptyExperienceItem,
      projects: createEmptyProjectItem,
      skills: createEmptySkillItem,
    };

    const nextItems = [...form.content[key], factoryMap[key]()];
    updateContent(key as keyof ResumeSnapshot, nextItems as never);
  }

  function removeSectionItem(key: SectionArrayKey, id: string) {
    const nextItems = form.content[key].filter((item) => item.id !== id);
    updateContent(key as keyof ResumeSnapshot, nextItems as never);
  }

  function handleSectionDragStart(key: ResumeSectionKey) {
    setDraggingSectionKey(key);
    setDragOverSectionKey(key);
  }

  function handleSectionDragEnter(key: ResumeSectionKey) {
    if (!draggingSectionKey || draggingSectionKey === key) {
      return;
    }

    setDragOverSectionKey(key);
  }

  function handleSectionDrop(key: ResumeSectionKey) {
    if (!draggingSectionKey) {
      return;
    }

    updateContent(
      "sectionConfig",
      reorderSectionConfigItems(form.content.sectionConfig, draggingSectionKey, key),
    );
    setDraggingSectionKey(null);
    setDragOverSectionKey(null);
  }

  function handleSectionDragEnd() {
    setDraggingSectionKey(null);
    setDragOverSectionKey(null);
  }

  function setSectionVisibility(key: ResumeSectionKey, visible: boolean) {
    updateContent(
      "sectionConfig",
      updateSectionConfigItem(form.content.sectionConfig, key, { visible }),
    );
  }

  function setSectionColumn(key: ResumeSectionKey, column: ResumeSectionColumn) {
    updateContent(
      "sectionConfig",
      updateSectionConfigItem(form.content.sectionConfig, key, { column }),
    );
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = t.validationTitle;
    }

    if (!form.content.name.trim()) {
      nextErrors.name = t.validationName;
    }

    if (!form.content.gender.trim()) {
      nextErrors.gender = t.validationGender;
    }

    if (!Number.isInteger(form.content.age) || form.content.age < 1 || form.content.age > 120) {
      nextErrors.age = t.validationAge;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.content.email.trim())) {
      nextErrors.email = t.validationEmail;
    }

    if (!/^1\d{10}$/.test(form.content.phone.trim())) {
      nextErrors.phone = t.validationPhone;
    }

    if (!form.content.targetJob.trim()) {
      nextErrors.targetJob = t.validationTargetJob;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function refreshHistory() {
    if (!detail?.id) {
      return;
    }

    const response = await fetch(`/api/v1/resumes/${detail.id}/versions`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (response.ok) {
      setHistory(data.data);
    }
  }

  async function refreshDetail() {
    if (!detail?.id) {
      return;
    }

    const response = await fetch(`/api/v1/resumes/${detail.id}`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || t.saveFailed);
    }

    setDetail(data);
    setForm({
      title: data.title,
      content: data.currentVersion.snapshotData,
    });
  }

  async function handleSave() {
    setNotice(null);

    if (!validateForm()) {
      setNotice({
        tone: "error",
        text: t.validationGeneric,
      });
      return;
    }

    setBusy(true);

    try {
      const payload = {
        title: form.title,
        targetJob: form.content.targetJob,
        templateType: form.content.templateType,
        content: form.content,
        note: versionNote.trim() || null,
      };

      const response = await fetch(
        mode === "create" ? "/api/v1/resumes" : `/api/v1/resumes/${detail?.id}/versions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.saveFailed);
      }

      if (mode === "create") {
        router.push(`/resumes/${data.id}`);
        return;
      }

      await Promise.all([refreshDetail(), refreshHistory()]);
      router.refresh();
      setVersionNote("");
      setNotice({
        tone: "success",
        text: t.saveSuccess,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : t.saveFailed,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(versionId: string, versionNumber: number) {
    if (!detail?.id) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `/api/v1/resumes/${detail.id}/versions/${versionId}/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: `${t.restoreNotePrefix} V${versionNumber}`,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.restoreFailed);
      }

      await Promise.all([refreshDetail(), refreshHistory()]);
      router.refresh();
      setNotice({
        tone: "success",
        text: t.restoreSuccess,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : t.restoreFailed,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate() {
    if (!detail?.id) {
      setNotice({
        tone: "error",
        text: t.saveBeforeDuplicate,
      });
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`/api/v1/resumes/${detail.id}/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${form.title}-${t.duplicateSuffix}`,
          targetJob: form.content.targetJob,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.duplicateFailed);
      }

      router.push(`/resumes/${data.id}`);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : t.duplicateFailed,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setBusy(true);

    try {
      const response = await fetch("/api/v1/photos", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.photoUploadFailed);
      }

      updateContent("photo", {
        photoId: data.id,
        url: data.url,
      });
      updateContent("templateType", "photo");
      setNotice({
        tone: "success",
        text: t.photoUploaded,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : t.photoUploadFailed,
      });
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removePhoto() {
    updateContent("photo", null);
  }

  function openPrintPage() {
    if (!detail?.id) {
      setNotice({
        tone: "error",
        text: t.saveBeforeExport,
      });
      return;
    }

    window.open(`/resumes/${detail.id}/print`, "_blank", "noopener,noreferrer");
  }

  const textInputClass =
    "h-11 w-full rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-accent-soft";
  const textareaClass =
    "w-full rounded-md border border-line bg-white px-3 py-3 text-sm outline-none transition focus:border-accent-soft";
  const inputErrorClass = "border-red-300 focus:border-red-500";

  function renderSummarySection() {
    const config = sectionConfigMap.get("summary");

    return (
      <SectionCard
        title={t.summary}
        muted={config?.visible ? t.sectionVisible : t.sectionHidden}
      >
        <textarea
          id="summary"
          name="summary"
          value={form.content.summary}
          onChange={handleTextareaChange}
          rows={5}
          className={textareaClass}
          placeholder={t.summaryPlaceholder}
        />
      </SectionCard>
    );
  }

  function renderEducationSection() {
    const config = sectionConfigMap.get("education");

    return (
      <SectionCard
        title={t.educationSection}
        muted={config?.visible ? t.sectionVisible : t.sectionHidden}
        toolbar={
          <button
            type="button"
            onClick={() => addSectionItem("education")}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft"
          >
            <Plus className="h-4 w-4" />
            {t.addEducation}
          </button>
        }
      >
        {form.content.education.map((item: ResumeEducationItem) => (
          <ArrayItemCard
            key={item.id}
            onRemove={() => removeSectionItem("education", item.id)}
            removeLabel={t.removeItem}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={item.school}
                onChange={(event) =>
                  updateArrayItem<ResumeEducationItem>("education", item.id, "school", event.target.value)
                }
                className={textInputClass}
                placeholder={t.schoolPlaceholder}
              />
              <input
                value={item.degree}
                onChange={(event) =>
                  updateArrayItem<ResumeEducationItem>("education", item.id, "degree", event.target.value)
                }
                className={textInputClass}
                placeholder={t.degreePlaceholder}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={item.major}
                onChange={(event) =>
                  updateArrayItem<ResumeEducationItem>("education", item.id, "major", event.target.value)
                }
                className={textInputClass}
                placeholder={t.majorPlaceholder}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  value={item.startDate}
                  onChange={(event) =>
                    updateArrayItem<ResumeEducationItem>("education", item.id, "startDate", event.target.value)
                  }
                  className={textInputClass}
                  placeholder={t.startDatePlaceholder}
                />
                <input
                  value={item.endDate}
                  onChange={(event) =>
                    updateArrayItem<ResumeEducationItem>("education", item.id, "endDate", event.target.value)
                  }
                  className={textInputClass}
                  placeholder={t.endDatePlaceholder}
                />
              </div>
            </div>
            <textarea
              value={item.description}
              onChange={(event) =>
                updateArrayItem<ResumeEducationItem>("education", item.id, "description", event.target.value)
              }
              rows={4}
              className={textareaClass}
              placeholder={t.educationDescriptionPlaceholder}
            />
          </ArrayItemCard>
        ))}
      </SectionCard>
    );
  }

  function renderExperienceSection() {
    const config = sectionConfigMap.get("experience");

    return (
      <SectionCard
        title={t.experienceSection}
        muted={config?.visible ? t.sectionVisible : t.sectionHidden}
        toolbar={
          <button
            type="button"
            onClick={() => addSectionItem("experience")}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft"
          >
            <Plus className="h-4 w-4" />
            {t.addExperience}
          </button>
        }
      >
        {form.content.experience.map((item: ResumeExperienceItem) => (
          <ArrayItemCard
            key={item.id}
            onRemove={() => removeSectionItem("experience", item.id)}
            removeLabel={t.removeItem}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={item.company}
                onChange={(event) =>
                  updateArrayItem<ResumeExperienceItem>("experience", item.id, "company", event.target.value)
                }
                className={textInputClass}
                placeholder={t.companyPlaceholder}
              />
              <input
                value={item.role}
                onChange={(event) =>
                  updateArrayItem<ResumeExperienceItem>("experience", item.id, "role", event.target.value)
                }
                className={textInputClass}
                placeholder={t.rolePlaceholder}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                value={item.startDate}
                onChange={(event) =>
                  updateArrayItem<ResumeExperienceItem>("experience", item.id, "startDate", event.target.value)
                }
                className={textInputClass}
                placeholder={t.startDatePlaceholder}
              />
              <input
                value={item.endDate}
                onChange={(event) =>
                  updateArrayItem<ResumeExperienceItem>("experience", item.id, "endDate", event.target.value)
                }
                className={textInputClass}
                placeholder={t.endDatePlaceholder}
              />
            </div>
            <textarea
              value={item.description}
              onChange={(event) =>
                updateArrayItem<ResumeExperienceItem>("experience", item.id, "description", event.target.value)
              }
              rows={5}
              className={textareaClass}
              placeholder={t.experienceDescriptionPlaceholder}
            />
          </ArrayItemCard>
        ))}
      </SectionCard>
    );
  }

  function renderProjectSection() {
    const config = sectionConfigMap.get("projects");

    return (
      <SectionCard
        title={t.projectSection}
        muted={config?.visible ? t.sectionVisible : t.sectionHidden}
        toolbar={
          <button
            type="button"
            onClick={() => addSectionItem("projects")}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft"
          >
            <Plus className="h-4 w-4" />
            {t.addProject}
          </button>
        }
      >
        {form.content.projects.map((item: ResumeProjectItem) => (
          <ArrayItemCard
            key={item.id}
            onRemove={() => removeSectionItem("projects", item.id)}
            removeLabel={t.removeItem}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={item.name}
                onChange={(event) =>
                  updateArrayItem<ResumeProjectItem>("projects", item.id, "name", event.target.value)
                }
                className={textInputClass}
                placeholder={t.projectNamePlaceholder}
              />
              <input
                value={item.role}
                onChange={(event) =>
                  updateArrayItem<ResumeProjectItem>("projects", item.id, "role", event.target.value)
                }
                className={textInputClass}
                placeholder={t.rolePlaceholder}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                value={item.startDate}
                onChange={(event) =>
                  updateArrayItem<ResumeProjectItem>("projects", item.id, "startDate", event.target.value)
                }
                className={textInputClass}
                placeholder={t.startDatePlaceholder}
              />
              <input
                value={item.endDate}
                onChange={(event) =>
                  updateArrayItem<ResumeProjectItem>("projects", item.id, "endDate", event.target.value)
                }
                className={textInputClass}
                placeholder={t.endDatePlaceholder}
              />
            </div>
            <textarea
              value={item.description}
              onChange={(event) =>
                updateArrayItem<ResumeProjectItem>("projects", item.id, "description", event.target.value)
              }
              rows={5}
              className={textareaClass}
              placeholder={t.projectDescriptionPlaceholder}
            />
            <textarea
              value={item.outcome}
              onChange={(event) =>
                updateArrayItem<ResumeProjectItem>("projects", item.id, "outcome", event.target.value)
              }
              rows={3}
              className={textareaClass}
              placeholder={t.outcomePlaceholder}
            />
          </ArrayItemCard>
        ))}
      </SectionCard>
    );
  }

  function renderSkillsSection() {
    const config = sectionConfigMap.get("skills");

    return (
      <SectionCard
        title={t.skillSection}
        muted={config?.visible ? t.sectionVisible : t.sectionHidden}
        toolbar={
          <button
            type="button"
            onClick={() => addSectionItem("skills")}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft"
          >
            <Plus className="h-4 w-4" />
            {t.addSkill}
          </button>
        }
      >
        {form.content.skills.map((item: ResumeSkillItem) => (
          <ArrayItemCard
            key={item.id}
            onRemove={() => removeSectionItem("skills", item.id)}
            removeLabel={t.removeItem}
          >
            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <input
                value={item.category}
                onChange={(event) =>
                  updateArrayItem<ResumeSkillItem>("skills", item.id, "category", event.target.value)
                }
                className={textInputClass}
                placeholder={t.skillCategoryPlaceholder}
              />
              <textarea
                value={item.details}
                onChange={(event) =>
                  updateArrayItem<ResumeSkillItem>("skills", item.id, "details", event.target.value)
                }
                rows={3}
                className={textareaClass}
                placeholder={t.skillDetailsPlaceholder}
              />
            </div>
          </ArrayItemCard>
        ))}
      </SectionCard>
    );
  }

  function renderConfiguredSection(key: ResumeSectionKey) {
    switch (key) {
      case "summary":
        return renderSummarySection();
      case "education":
        return renderEducationSection();
      case "experience":
        return renderExperienceSection();
      case "projects":
        return renderProjectSection();
      case "skills":
        return renderSkillsSection();
      default:
        return null;
    }
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="no-print border-b border-line bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/resumes" className="text-lg font-semibold text-foreground">
                {t.appName}
              </Link>
              <p className="mt-1 text-sm text-muted">{t.headerSubtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LanguageSwitcher />
              <Link
                href="/"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft"
              >
                <House className="h-4 w-4" />
                {t.backToHome}
              </Link>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                disabled={mode === "create"}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                <History className="h-4 w-4" />
                {t.historyPanelTitle}
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft"
              >
                {t.duplicateAs}
              </button>
              <button
                type="button"
                onClick={openPrintPage}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm text-foreground transition hover:bg-panel-soft"
              >
                <Printer className="h-4 w-4" />
                {t.exportPrint}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6 xl:grid xl:grid-cols-[560px_minmax(0,1fr)] xl:items-start">
          <section className="no-print space-y-6">
            <SectionCard
              title={mode === "create" ? t.newResume : currentVersionLabel}
              muted={detail?.updatedAt ? `${t.savedAt} ${formatDateTime(detail.updatedAt)}` : t.editorActionsHint}
            >
              {notice ? (
                <div
                  className={`rounded-md px-4 py-3 text-sm ${
                    notice.tone === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {notice.text}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="title">
                  {t.resumeTitle}
                </label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleTextChange}
                  className={`${textInputClass} ${errors.title ? inputErrorClass : ""}`}
                  placeholder={t.resumeTitlePlaceholder}
                />
                <ErrorText text={errors.title} />
              </div>
            </SectionCard>

            <SectionCard
              title={t.layoutSettingsTitle}
              muted={t.layoutSettingsHint}
            >
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateContent("layoutMode", "single")}
                  className={`inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm transition ${
                    form.content.layoutMode === "single"
                      ? "border-accent bg-accent !text-white"
                      : "border-line text-foreground hover:bg-panel-soft"
                  }`}
                >
                  <LayoutPanelTop className="h-4 w-4" />
                  {t.layoutSingle}
                </button>
                <button
                  type="button"
                  onClick={() => updateContent("layoutMode", "split")}
                  className={`inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm transition ${
                    form.content.layoutMode === "split"
                      ? "border-accent bg-accent !text-white"
                      : "border-line text-foreground hover:bg-panel-soft"
                  }`}
                >
                  <Columns2 className="h-4 w-4" />
                  {t.layoutSplit}
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title={t.sectionManagerTitle}
              muted={t.sectionManagerHint}
            >
              <div className="space-y-3">
                {form.content.sectionConfig.map((item) => (
                  <div key={item.key}>
                    {draggingSectionKey &&
                    dragOverSectionKey === item.key &&
                    draggingSectionKey !== item.key ? (
                      <div className="resume-drag-placeholder mb-3" />
                    ) : null}
                    <div
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", item.key);
                        handleSectionDragStart(item.key);
                      }}
                      onDragEnter={() => handleSectionDragEnter(item.key)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        handleSectionDragEnter(item.key);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleSectionDrop(item.key);
                      }}
                      onDragEnd={handleSectionDragEnd}
                      className={`rounded-lg border px-4 py-4 transition ${
                        dragOverSectionKey === item.key
                          ? "border-accent bg-slate-100"
                          : "border-line bg-panel-soft/50"
                      } ${
                        draggingSectionKey === item.key
                          ? "resume-dragging-item opacity-75"
                          : "hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="resume-drag-handle mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted">
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {sectionTitleMap[item.key]}
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                {item.visible ? t.sectionVisible : t.sectionHidden}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSectionVisibility(item.key, !item.visible)}
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-foreground transition hover:bg-panel-soft"
                            >
                              {item.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              {item.visible ? t.hideSection : t.showSection}
                            </button>
                          </div>
                        </div>

                        {form.content.layoutMode === "split" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSectionColumn(item.key, "main")}
                              className={`inline-flex h-9 items-center rounded-md border px-3 text-sm transition ${
                                item.column === "main"
                                  ? "border-accent bg-accent !text-white"
                                  : "border-line bg-white text-foreground hover:bg-panel-soft"
                              }`}
                            >
                              {t.mainColumn}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSectionColumn(item.key, "side")}
                              className={`inline-flex h-9 items-center rounded-md border px-3 text-sm transition ${
                                item.column === "side"
                                  ? "border-accent bg-accent !text-white"
                                  : "border-line bg-white text-foreground hover:bg-panel-soft"
                              }`}
                            >
                              {t.sideColumn}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title={t.basicInfo}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="name">
                    {t.name}
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.content.name}
                    onChange={handleTextChange}
                    className={`${textInputClass} ${errors.name ? inputErrorClass : ""}`}
                  />
                  <ErrorText text={errors.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="gender">
                    {t.gender}
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.content.gender}
                    onChange={handleTextChange}
                    className={`${textInputClass} ${errors.gender ? inputErrorClass : ""}`}
                  >
                    <option value="">{t.chooseGender}</option>
                    <option value="男">{t.male}</option>
                    <option value="女">{t.female}</option>
                    <option value="其他">{t.other}</option>
                  </select>
                  <ErrorText text={errors.gender} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="age">
                    {t.age}
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min={1}
                    max={120}
                    value={String(form.content.age || "")}
                    onChange={handleTextChange}
                    className={`${textInputClass} ${errors.age ? inputErrorClass : ""}`}
                  />
                  <ErrorText text={errors.age} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="targetJob">
                    {t.targetJobLabel}
                  </label>
                  <input
                    id="targetJob"
                    name="targetJob"
                    value={form.content.targetJob}
                    onChange={handleTextChange}
                    className={`${textInputClass} ${errors.targetJob ? inputErrorClass : ""}`}
                  />
                  <ErrorText text={errors.targetJob} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="email">
                    {t.email}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.content.email}
                    onChange={handleTextChange}
                    className={`${textInputClass} ${errors.email ? inputErrorClass : ""}`}
                  />
                  <ErrorText text={errors.email} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="phone">
                    {t.phone}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    value={form.content.phone}
                    onChange={handleTextChange}
                    className={`${textInputClass} ${errors.phone ? inputErrorClass : ""}`}
                  />
                  <ErrorText text={errors.phone} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="headline">
                  {t.headline}
                </label>
                <input
                  id="headline"
                  name="headline"
                  value={form.content.headline}
                  onChange={handleTextChange}
                  className={textInputClass}
                  placeholder={t.headlinePlaceholder}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.templateSelection}</p>
                  <div className="inline-flex rounded-md border border-line p-1">
                    <button
                      type="button"
                      onClick={() => handleTemplateChange("no_photo")}
                      className={`h-9 rounded-md px-4 text-sm transition ${
                        form.content.templateType === "no_photo"
                          ? "bg-accent !text-white"
                          : "text-foreground hover:bg-panel-soft"
                      }`}
                    >
                      {t.noPhoto}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTemplateChange("photo")}
                      className={`h-9 rounded-md px-4 text-sm transition ${
                        form.content.templateType === "photo"
                          ? "bg-accent !text-white"
                          : "text-foreground hover:bg-panel-soft"
                      }`}
                    >
                      {t.withPhoto}
                    </button>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-panel-soft px-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm text-foreground transition hover:bg-panel-soft"
                    >
                      <Upload className="h-4 w-4" />
                      {t.uploadPhoto}
                    </button>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm text-foreground transition hover:bg-panel-soft"
                    >
                      {t.removePhoto}
                    </button>
                    <span className="text-sm text-muted">{t.photoUploadHint}</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </SectionCard>

            {form.content.sectionConfig.map((item) => (
              <div key={item.key}>{renderConfiguredSection(item.key)}</div>
            ))}

            <SectionCard title={t.versionNote} muted={t.versionNoteHint}>
              <textarea
                id="versionNote"
                value={versionNote}
                onChange={(event) => setVersionNote(event.target.value)}
                rows={3}
                className={textareaClass}
                placeholder={t.versionNotePlaceholder}
              />
            </SectionCard>
          </section>

          <section className="print-shell">
            <ResumePreview
              title={form.title}
              snapshot={form.content}
              updatedAt={detail?.updatedAt ? formatDateTime(detail.updatedAt) : undefined}
            />
          </section>
        </main>

        <div className="no-print fixed bottom-5 right-5 z-50 hidden md:block">
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium !text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {t.saveResume}
          </button>
        </div>

        <div className="no-print sticky bottom-0 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-medium !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {t.saveResume}
          </button>
        </div>
      </div>

      <HistoryPanel
        open={historyOpen}
        versions={history}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestore}
        loading={busy}
      />
    </>
  );
}
