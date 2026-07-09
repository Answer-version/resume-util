import { z } from "zod";

export const templateTypeSchema = z.enum(["photo", "no_photo"]);

const photoSchema = z
  .object({
    photoId: z.string().nullable(),
    url: z.string().nullable(),
  })
  .nullable();

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
