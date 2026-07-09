export type TemplateType = "photo" | "no_photo";
export type ResumeLayoutMode = "single" | "split";
export type ResumeSectionKey = "summary" | "education" | "experience" | "projects" | "skills";
export type ResumeSectionColumn = "main" | "side";

export type ResumeSectionConfigItem = {
  key: ResumeSectionKey;
  visible: boolean;
  column: ResumeSectionColumn;
};

export type ResumePhotoData = {
  photoId: string | null;
  url: string | null;
} | null;

export type ResumeEducationItem = {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ResumeExperienceItem = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ResumeProjectItem = {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  outcome: string;
};

export type ResumeSkillItem = {
  id: string;
  category: string;
  details: string;
};

export type ResumeSnapshot = {
  name: string;
  gender: string;
  age: number;
  email: string;
  phone: string;
  targetJob: string;
  headline: string;
  summary: string;
  education: ResumeEducationItem[];
  experience: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  skills: ResumeSkillItem[];
  sectionConfig: ResumeSectionConfigItem[];
  layoutMode: ResumeLayoutMode;
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
