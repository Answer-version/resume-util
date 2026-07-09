import { z } from "zod";

export const templateTypeSchema = z.enum(["photo", "no_photo"]);
export const layoutModeSchema = z.enum(["single", "split"]);
export const sectionKeySchema = z.enum([
  "summary",
  "education",
  "experience",
  "projects",
  "skills",
]);
export const sectionColumnSchema = z.enum(["main", "side"]);

const photoSchema = z
  .object({
    photoId: z.string().nullable(),
    url: z.string().nullable(),
  })
  .nullable();

const sectionConfigItemSchema = z.object({
  key: sectionKeySchema,
  visible: z.boolean(),
  column: sectionColumnSchema,
});

const educationItemSchema = z.object({
  id: z.string().trim().min(1),
  school: z.string().trim().max(120, "学校名称过长"),
  degree: z.string().trim().max(50, "学历字段过长"),
  major: z.string().trim().max(120, "专业名称过长"),
  startDate: z.string().trim().max(40, "开始时间过长"),
  endDate: z.string().trim().max(40, "结束时间过长"),
  description: z.string().trim().max(12000, "教育经历描述过长"),
});

const experienceItemSchema = z.object({
  id: z.string().trim().min(1),
  company: z.string().trim().max(120, "公司名称过长"),
  role: z.string().trim().max(120, "岗位名称过长"),
  startDate: z.string().trim().max(40, "开始时间过长"),
  endDate: z.string().trim().max(40, "结束时间过长"),
  description: z.string().trim().max(12000, "工作经历描述过长"),
});

const projectItemSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().max(120, "项目名称过长"),
  role: z.string().trim().max(120, "项目角色过长"),
  startDate: z.string().trim().max(40, "开始时间过长"),
  endDate: z.string().trim().max(40, "结束时间过长"),
  description: z.string().trim().max(12000, "项目描述过长"),
  outcome: z.string().trim().max(8000, "项目成果描述过长"),
});

const skillItemSchema = z.object({
  id: z.string().trim().min(1),
  category: z.string().trim().max(80, "技能分类过长"),
  details: z.string().trim().max(8000, "技能描述过长"),
});

export const resumeSnapshotSchema = z.object({
  name: z.string().trim().min(1, "请输入姓名").max(50, "姓名过长"),
  gender: z.string().trim().min(1, "请选择性别").max(20, "性别字段过长"),
  age: z.coerce.number().int().min(1, "年龄需大于 0").max(120, "年龄不合理"),
  email: z.email("邮箱格式不正确"),
  phone: z
    .string()
    .trim()
    .regex(/^1\d{10}$/, "请输入 11 位手机号"),
  targetJob: z.string().trim().min(1, "请输入求职岗位").max(120, "求职岗位过长"),
  headline: z.string().trim().max(120, "求职标题过长"),
  summary: z.string().trim().max(12000, "个人优势描述过长"),
  education: z.array(educationItemSchema).max(10, "教育经历不能超过 10 条"),
  experience: z.array(experienceItemSchema).max(10, "工作经历不能超过 10 条"),
  projects: z.array(projectItemSchema).max(10, "项目经历不能超过 10 条"),
  skills: z.array(skillItemSchema).max(12, "技能条目不能超过 12 条"),
  sectionConfig: z.array(sectionConfigItemSchema).max(5, "板块配置异常"),
  layoutMode: layoutModeSchema,
  templateType: templateTypeSchema,
  photo: photoSchema,
});

export const createResumeSchema = z.object({
  title: z.string().trim().min(1, "请输入简历名称").max(120, "简历名称过长"),
  targetJob: z.string().trim().min(1, "请输入求职岗位").max(120, "求职岗位过长"),
  templateType: templateTypeSchema,
  note: z.string().trim().max(200, "版本备注过长").optional().nullable(),
  content: resumeSnapshotSchema,
});

export const saveVersionSchema = createResumeSchema;

export const duplicateResumeSchema = z.object({
  title: z.string().trim().min(1, "请输入新简历名称").max(120, "简历名称过长"),
  targetJob: z.string().trim().min(1, "请输入求职岗位").max(120, "求职岗位过长"),
});

export const restoreVersionSchema = z.object({
  note: z.string().trim().max(200, "版本备注过长").optional().nullable(),
});
