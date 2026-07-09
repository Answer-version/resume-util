import type {
  ResumeDetail,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHistoryItem,
  ResumeListItem,
  ResumeProjectItem,
  ResumeSectionConfigItem,
  ResumeSectionKey,
  ResumeSkillItem,
  ResumeSnapshot,
  TemplateType,
} from "@/types/resume";
import { normalizeRichTextInput } from "@/lib/rich-text";
import { resumeSnapshotSchema } from "@/lib/validators";

const defaultSectionOrder: ResumeSectionKey[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
];

function createSectionId() {
  return globalThis.crypto?.randomUUID?.() ?? `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultSectionConfig(): ResumeSectionConfigItem[] {
  return [
    { key: "summary", visible: true, column: "main" },
    { key: "experience", visible: true, column: "main" },
    { key: "projects", visible: true, column: "main" },
    { key: "education", visible: true, column: "side" },
    { key: "skills", visible: true, column: "side" },
  ];
}

export function createEmptyEducationItem(): ResumeEducationItem {
  return {
    id: createSectionId(),
    school: "",
    degree: "",
    major: "",
    startDate: "",
    endDate: "",
    description: "",
  };
}

export function createEmptyExperienceItem(): ResumeExperienceItem {
  return {
    id: createSectionId(),
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    description: "",
  };
}

export function createEmptyProjectItem(): ResumeProjectItem {
  return {
    id: createSectionId(),
    name: "",
    role: "",
    startDate: "",
    endDate: "",
    description: "",
    outcome: "",
  };
}

export function createEmptySkillItem(): ResumeSkillItem {
  return {
    id: createSectionId(),
    category: "",
    details: "",
  };
}

export function getEmptySnapshot(): ResumeSnapshot {
  return {
    name: "",
    gender: "",
    age: 24,
    email: "",
    phone: "",
    targetJob: "",
    headline: "",
    summary: "",
    education: [createEmptyEducationItem()],
    experience: [createEmptyExperienceItem()],
    projects: [createEmptyProjectItem()],
    skills: [createEmptySkillItem()],
    sectionConfig: createDefaultSectionConfig(),
    layoutMode: "split",
    templateType: "no_photo",
    photo: null,
  };
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasAnyValue(values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

function sanitizeEducationItems(value: unknown): ResumeEducationItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw = item as Partial<ResumeEducationItem> | null;
      const nextItem: ResumeEducationItem = {
        id: getStringValue(raw?.id) || createSectionId(),
        school: getStringValue(raw?.school),
        degree: getStringValue(raw?.degree),
        major: getStringValue(raw?.major),
        startDate: getStringValue(raw?.startDate),
        endDate: getStringValue(raw?.endDate),
        description: normalizeRichTextInput(raw?.description),
      };

      return hasAnyValue([
        nextItem.school,
        nextItem.degree,
        nextItem.major,
        nextItem.startDate,
        nextItem.endDate,
        nextItem.description,
      ])
        ? nextItem
        : null;
    })
    .filter((item): item is ResumeEducationItem => item !== null);
}

function sanitizeExperienceItems(value: unknown): ResumeExperienceItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw = item as Partial<ResumeExperienceItem> | null;
      const nextItem: ResumeExperienceItem = {
        id: getStringValue(raw?.id) || createSectionId(),
        company: getStringValue(raw?.company),
        role: getStringValue(raw?.role),
        startDate: getStringValue(raw?.startDate),
        endDate: getStringValue(raw?.endDate),
        description: normalizeRichTextInput(raw?.description),
      };

      return hasAnyValue([
        nextItem.company,
        nextItem.role,
        nextItem.startDate,
        nextItem.endDate,
        nextItem.description,
      ])
        ? nextItem
        : null;
    })
    .filter((item): item is ResumeExperienceItem => item !== null);
}

function sanitizeProjectItems(value: unknown): ResumeProjectItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw = item as Partial<ResumeProjectItem> | null;
      const nextItem: ResumeProjectItem = {
        id: getStringValue(raw?.id) || createSectionId(),
        name: getStringValue(raw?.name),
        role: getStringValue(raw?.role),
        startDate: getStringValue(raw?.startDate),
        endDate: getStringValue(raw?.endDate),
        description: normalizeRichTextInput(raw?.description),
        outcome: normalizeRichTextInput(raw?.outcome),
      };

      return hasAnyValue([
        nextItem.name,
        nextItem.role,
        nextItem.startDate,
        nextItem.endDate,
        nextItem.description,
        nextItem.outcome,
      ])
        ? nextItem
        : null;
    })
    .filter((item): item is ResumeProjectItem => item !== null);
}

function sanitizeSkillItems(value: unknown): ResumeSkillItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw = item as Partial<ResumeSkillItem> | null;
      const nextItem: ResumeSkillItem = {
        id: getStringValue(raw?.id) || createSectionId(),
        category: getStringValue(raw?.category),
        details: normalizeRichTextInput(raw?.details),
      };

      return hasAnyValue([nextItem.category, nextItem.details]) ? nextItem : null;
    })
    .filter((item): item is ResumeSkillItem => item !== null);
}

function sanitizeSectionConfig(value: unknown): ResumeSectionConfigItem[] {
  const defaults = createDefaultSectionConfig();

  if (!Array.isArray(value)) {
    return defaults;
  }

  const incomingMap = new Map<ResumeSectionKey, ResumeSectionConfigItem>();
  const orderedKeys: ResumeSectionKey[] = [];

  value.forEach((item) => {
    const raw = item as Partial<ResumeSectionConfigItem> | null;
    if (
      raw?.key === "summary" ||
      raw?.key === "education" ||
      raw?.key === "experience" ||
      raw?.key === "projects" ||
      raw?.key === "skills"
    ) {
      if (!orderedKeys.includes(raw.key)) {
        orderedKeys.push(raw.key);
      }

      incomingMap.set(raw.key, {
        key: raw.key,
        visible: typeof raw.visible === "boolean" ? raw.visible : true,
        column: raw.column === "side" ? "side" : "main",
      });
    }
  });

  defaultSectionOrder.forEach((key) => {
    if (!orderedKeys.includes(key)) {
      orderedKeys.push(key);
    }
  });

  return orderedKeys.map(
    (key) => incomingMap.get(key) ?? defaults.find((item) => item.key === key)!,
  );
}

export function sanitizeSnapshotInput(value: unknown): ResumeSnapshot {
  const raw = (value ?? {}) as Partial<ResumeSnapshot>;
  const rawPhoto = raw.photo as ResumeSnapshot["photo"];
  const photo =
    rawPhoto && (getStringValue(rawPhoto.photoId) || getStringValue(rawPhoto.url))
      ? {
          photoId: getStringValue(rawPhoto.photoId) || null,
          url: getStringValue(rawPhoto.url) || null,
        }
      : null;

  return {
    name: getStringValue(raw.name),
    gender: getStringValue(raw.gender),
    age: typeof raw.age === "number" ? raw.age : Number(raw.age ?? 0),
    email: getStringValue(raw.email),
    phone: getStringValue(raw.phone),
    targetJob: getStringValue(raw.targetJob),
    headline: getStringValue(raw.headline),
    summary: normalizeRichTextInput(raw.summary),
    education: sanitizeEducationItems(raw.education),
    experience: sanitizeExperienceItems(raw.experience),
    projects: sanitizeProjectItems(raw.projects),
    skills: sanitizeSkillItems(raw.skills),
    sectionConfig: sanitizeSectionConfig(raw.sectionConfig),
    layoutMode: raw.layoutMode === "single" ? "single" : "split",
    templateType: raw.templateType === "photo" ? "photo" : "no_photo",
    photo,
  };
}

export function normalizeSnapshot(
  snapshot: ResumeSnapshot,
  overrides?: Partial<Pick<ResumeSnapshot, "targetJob" | "templateType" | "layoutMode" | "sectionConfig">>,
): ResumeSnapshot {
  const merged = sanitizeSnapshotInput({
    ...snapshot,
    ...overrides,
  });

  return resumeSnapshotSchema.parse({
    ...merged,
    photo: merged.photo?.url ? merged.photo : null,
  });
}

export function parseSnapshot(value: string): ResumeSnapshot {
  return normalizeSnapshot(JSON.parse(value) as ResumeSnapshot);
}

export function moveSectionConfigItem(
  config: ResumeSectionConfigItem[],
  key: ResumeSectionKey,
  direction: "up" | "down",
) {
  const index = config.findIndex((item) => item.key === key);
  if (index === -1) {
    return config;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= config.length) {
    return config;
  }

  const next = [...config];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

export function reorderSectionConfigItems(
  config: ResumeSectionConfigItem[],
  activeKey: ResumeSectionKey,
  overKey: ResumeSectionKey,
) {
  if (activeKey === overKey) {
    return config;
  }

  const activeIndex = config.findIndex((item) => item.key === activeKey);
  const overIndex = config.findIndex((item) => item.key === overKey);

  if (activeIndex === -1 || overIndex === -1) {
    return config;
  }

  const next = [...config];
  const [activeItem] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, activeItem);
  return next;
}

export function updateSectionConfigItem(
  config: ResumeSectionConfigItem[],
  key: ResumeSectionKey,
  updates: Partial<ResumeSectionConfigItem>,
) {
  return config.map((item) => (item.key === key ? { ...item, ...updates } : item));
}

export function templateLabel(templateType: TemplateType): string {
  return templateType === "photo" ? "带照片" : "无照片";
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function mapResumeListItem(item: {
  id: string;
  title: string;
  targetJob: string;
  templateType: TemplateType;
  updatedAt: Date;
  createdAt: Date;
  _count: {
    versions: number;
  };
}): ResumeListItem {
  return {
    id: item.id,
    title: item.title,
    targetJob: item.targetJob,
    templateType: item.templateType,
    updatedAt: item.updatedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    versionCount: item._count.versions,
  };
}

export function mapResumeDetail(item: {
  id: string;
  title: string;
  targetJob: string;
  templateType: TemplateType;
  currentVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentVersion: {
    id: string;
    versionNumber: number;
    createdAt: Date;
    snapshotData: string;
  };
}): ResumeDetail {
  return {
    id: item.id,
    title: item.title,
    targetJob: item.targetJob,
    templateType: item.templateType,
    currentVersionId: item.currentVersionId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    currentVersion: {
      id: item.currentVersion.id,
      versionNumber: item.currentVersion.versionNumber,
      createdAt: item.currentVersion.createdAt.toISOString(),
      snapshotData: parseSnapshot(item.currentVersion.snapshotData),
    },
  };
}

export function mapHistoryItem(item: {
  id: string;
  versionNumber: number;
  note: string | null;
  createdAt: Date;
  snapshotData: string;
}): ResumeHistoryItem {
  return {
    id: item.id,
    versionNumber: item.versionNumber,
    note: item.note,
    createdAt: item.createdAt.toISOString(),
    snapshotData: parseSnapshot(item.snapshotData),
  };
}
