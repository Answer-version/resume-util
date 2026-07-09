"use client";

import { History, Printer, Save, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useRef, useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/providers/i18n-provider";
import { HistoryPanel } from "@/components/resumes/history-panel";
import { ResumePreview } from "@/components/resumes/resume-preview";
import type { ResumeDetail, ResumeFormState, ResumeHistoryItem } from "@/types/resume";

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

function ErrorText({ text }: { text?: string }) {
  if (!text) {
    return null;
  }

  return <p className="text-sm text-red-600">{text}</p>;
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

  const currentVersionLabel = useMemo(() => {
    if (!detail?.currentVersion) {
      return t.unsaved;
    }

    return `V${detail.currentVersion.versionNumber}`;
  }, [detail, t.unsaved]);

  function clearError(field: keyof FormErrors) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function updateField<K extends keyof ResumeFormState["content"]>(
    key: K,
    value: ResumeFormState["content"][K],
  ) {
    setForm((current) => ({
      ...current,
      content: {
        ...current.content,
        [key]: value,
      },
    }));

    if (key === "name" || key === "gender" || key === "age" || key === "email" || key === "phone" || key === "targetJob") {
      clearError(key);
    }
  }

  function handleTextChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
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
      updateField("age", Number(value || 0));
      return;
    }

    updateField(name as keyof ResumeFormState["content"], value);
  }

  function handleTemplateChange(templateType: "photo" | "no_photo") {
    updateField("templateType", templateType);
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

      updateField("photo", {
        photoId: data.id,
        url: data.url,
      });
      updateField("templateType", "photo");
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
    updateField("photo", null);
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
    "h-11 w-full rounded-md border border-line px-3 text-sm outline-none transition focus:border-accent-soft";
  const inputErrorClass = "border-red-300 focus:border-red-500";

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
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {mode === "create" ? t.createResumeCta : t.saveVersion}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6 xl:grid xl:grid-cols-[420px_minmax(0,1fr)] xl:items-start">
          <section className="no-print rounded-lg border border-line bg-white">
            <div className="border-b border-line px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.1em] text-muted uppercase">
                    {mode === "create" ? t.newResume : currentVersionLabel}
                  </p>
                  <h1 className="mt-2 text-xl font-semibold text-foreground">
                    {form.title || t.resumeTitle}
                  </h1>
                </div>
                {detail?.updatedAt ? (
                  <p className="text-sm text-muted">
                    {t.savedAt} {formatDateTime(detail.updatedAt)}
                  </p>
                ) : null}
              </div>
            </div>

            {notice ? (
              <div
                className={`mx-6 mt-6 rounded-md px-4 py-3 text-sm ${
                  notice.tone === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {notice.text}
              </div>
            ) : null}

            <div className="space-y-6 px-6 py-6">
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="versionNote">
                  {t.versionNote}
                </label>
                <textarea
                  id="versionNote"
                  value={versionNote}
                  onChange={(event) => setVersionNote(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-line px-3 py-3 text-sm outline-none transition focus:border-accent-soft"
                  placeholder={t.versionNotePlaceholder}
                />
                <p className="text-sm text-muted">{t.versionNoteHint}</p>
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
            </div>
          </section>

          <section className="print-shell">
            <ResumePreview
              title={form.title}
              snapshot={form.content}
              updatedAt={detail?.updatedAt ? formatDateTime(detail.updatedAt) : undefined}
            />
          </section>
        </main>
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
