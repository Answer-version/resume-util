import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png"]);
const maxFileSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择图片文件" }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "仅支持 JPG 或 PNG 图片" }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
    }

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    let fileUrl: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`resume-photos/${fileName}`, buffer, {
        access: "public",
        contentType: file.type,
      });
      fileUrl = blob.url;
    } else {
      const uploadDir = join(process.cwd(), "public", "uploads", "resume-photos");
      const localPath = join(uploadDir, fileName);
      fileUrl = `/uploads/resume-photos/${fileName}`;
      await mkdir(uploadDir, { recursive: true });
      await writeFile(localPath, buffer);
    }

    const photo = await prisma.resumePhoto.create({
      data: {
        fileName: file.name,
        fileUrl,
        mimeType: file.type,
        fileSize: file.size,
      },
    });

    return NextResponse.json({
      id: photo.id,
      url: photo.fileUrl,
      fileName: photo.fileName,
      mimeType: photo.mimeType,
      fileSize: photo.fileSize,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "上传照片失败",
      },
      { status: 500 },
    );
  }
}
