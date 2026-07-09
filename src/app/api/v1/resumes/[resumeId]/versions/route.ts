import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { mapHistoryItem, normalizeSnapshot } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";
import { saveVersionSchema } from "@/lib/validators";

type RouteProps = {
  params: Promise<{
    resumeId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { resumeId } = await params;

  const versions = await prisma.resumeVersion.findMany({
    where: {
      resumeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    data: versions.map(mapHistoryItem),
  });
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { resumeId } = await params;
    const body = await request.json();
    const parsed = saveVersionSchema.safeParse(body);

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

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    const snapshot = normalizeSnapshot(parsed.data.content, {
      targetJob: parsed.data.targetJob,
      templateType: parsed.data.templateType,
    });

    const result = await prisma.$transaction(async (tx) => {
      const latestVersion = await tx.resumeVersion.aggregate({
        where: {
          resumeId,
        },
        _max: {
          versionNumber: true,
        },
      });

      const versionNumber = (latestVersion._max.versionNumber || 0) + 1;

      const version = await tx.resumeVersion.create({
        data: {
          resumeId,
          versionNumber,
          note: parsed.data.note || null,
          snapshotData: JSON.stringify(snapshot),
        },
      });

      await tx.resume.update({
        where: {
          id: resumeId,
        },
        data: {
          title: parsed.data.title,
          targetJob: parsed.data.targetJob,
          templateType: parsed.data.templateType,
          currentVersionId: version.id,
        },
      });

      return {
        resumeId,
        currentVersionId: version.id,
        versionNumber,
        updatedAt: version.createdAt.toISOString(),
      };
    });

    revalidatePath("/resumes");
    revalidatePath(`/resumes/${resumeId}`);
    revalidatePath(`/resumes/${resumeId}/print`);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "保存版本失败",
      },
      { status: 500 },
    );
  }
}
