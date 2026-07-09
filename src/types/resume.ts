export type TemplateType = "photo" | "no_photo";

export type ResumePhotoData = {
  photoId: string | null;
  url: string | null;
} | null;

export type ResumeSnapshot = {
  name: string;
  gender: string;
  age: number;
  email: string;
  phone: string;
  targetJob: string;
  templateType: TemplateType;
  photo: ResumePhotoData;
};

export type ResumeFormState = {
  title: string;
  content: ResumeSnapshot;
};

export type ResumeHistoryItem = {
  id: string;
  versionNumber: number;
  note: string | null;
  createdAt: string;
  snapshotData: ResumeSnapshot;
};

export type ResumeDetail = {
  id: string;
  title: string;
  targetJob: string;
  templateType: TemplateType;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  currentVersion: {
    id: string;
    versionNumber: number;
    createdAt: string;
    snapshotData: ResumeSnapshot;
  };
};

export type ResumeListItem = {
  id: string;
  title: string;
  targetJob: string;
  templateType: TemplateType;
  updatedAt: string;
  createdAt: string;
  versionCount: number;
};
