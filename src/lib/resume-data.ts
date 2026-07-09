import type {
  ResumeDetail,
  ResumeHistoryItem,
  ResumeListItem,
  ResumeSnapshot,
  TemplateType,
} from "@/types/resume";
import { resumeSnapshotSchema } from "@/lib/validators";

export function getEmptySnapshot(): ResumeSnapshot {
  return {
    name: "",
    gender: "",
    age: 24,
    email: "",
    phone: "",
    targetJob: "",
    templateType: "no_photo",
    photo: null,
  };
}

export function normalizeSnapshot(
  snapshot: ResumeSnapshot,
  overrides?: Partial<Pick<ResumeSnapshot, "targetJob" | "templateType">>,
): ResumeSnapshot {
  const merged = {
    ...snapshot,
    ...overrides,
  };

  return resumeSnapshotSchema.parse({
    ...merged,
    photo: merged.photo?.url ? merged.photo : null,
  });
}

export function parseSnapshot(value: string): ResumeSnapshot {
  return resumeSnapshotSchema.parse(JSON.parse(value));
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
