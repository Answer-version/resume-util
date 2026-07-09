import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { mapResumeDetail } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    resumeId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { resumeId } = await params;

  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      deletedAt: null,
    },
  });

  if (!resume?.currentVersionId) {
    return NextResponse.json({ error: "简历不存在" }, { status: 404 });
  }

  const currentVersion = await prisma.resumeVersion.findUnique({
    where: {
      id: resume.currentVersionId,
    },
  });

  if (!currentVersion) {
    return NextResponse.json({ error: "当前版本不存在" }, { status: 404 });
  }

  return NextResponse.json(
    mapResumeDetail({
      id: resume.id,
      title: resume.title,
      targetJob: resume.targetJob,
      templateType: resume.templateType,
      currentVersionId: resume.currentVersionId,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
      currentVersion,
    }),
  );
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const { resumeId } = await params;

  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      deletedAt: null,
    },
  });

  if (!resume) {
    return NextResponse.json({ error: "简历不存在" }, { status: 404 });
  }

  await prisma.resume.update({
    where: {
      id: resumeId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  revalidatePath("/resumes");

  return NextResponse.json({
    success: true,
  });
}
