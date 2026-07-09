import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { normalizeSnapshot, parseSnapshot } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";
import { duplicateResumeSchema } from "@/lib/validators";

type RouteProps = {
  params: Promise<{
    resumeId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { resumeId } = await params;
    const body = await request.json();
    const parsed = duplicateResumeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "参数不合法",
        },
        { status: 400 },
      );
    }

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

    const baseSnapshot = parseSnapshot(currentVersion.snapshotData);
    const snapshot = normalizeSnapshot(baseSnapshot, {
      targetJob: parsed.data.targetJob,
      templateType: baseSnapshot.templateType,
    });

    const result = await prisma.$transaction(async (tx) => {
      const newResume = await tx.resume.create({
        data: {
          title: parsed.data.title,
          targetJob: parsed.data.targetJob,
          templateType: snapshot.templateType,
        },
      });

      const version = await tx.resumeVersion.create({
        data: {
          resumeId: newResume.id,
          versionNumber: 1,
          snapshotData: JSON.stringify(snapshot),
          note: `复制自 ${resume.title}`,
        },
      });

      await tx.resume.update({
        where: {
          id: newResume.id,
        },
        data: {
          currentVersionId: version.id,
        },
      });

      return {
        id: newResume.id,
      };
    });

    revalidatePath("/resumes");

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "复制简历失败",
      },
      { status: 500 },
    );
  }
}
