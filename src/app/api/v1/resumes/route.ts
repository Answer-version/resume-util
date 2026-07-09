import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { mapResumeListItem, normalizeSnapshot } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";
import { createResumeSchema } from "@/lib/validators";

export async function GET() {
  const resumes = await prisma.resume.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      _count: {
        select: {
          versions: true,
        },
      },
    },
  });

  return NextResponse.json({
    data: resumes.map(mapResumeListItem),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createResumeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "参数不合法",
        },
        { status: 400 },
      );
    }

    const snapshot = normalizeSnapshot(parsed.data.content, {
      targetJob: parsed.data.targetJob,
      templateType: parsed.data.templateType,
    });

    const result = await prisma.$transaction(async (tx) => {
      const resume = await tx.resume.create({
        data: {
          title: parsed.data.title,
          targetJob: parsed.data.targetJob,
          templateType: parsed.data.templateType,
        },
      });

      const version = await tx.resumeVersion.create({
        data: {
          resumeId: resume.id,
          versionNumber: 1,
          note: parsed.data.note || null,
          snapshotData: JSON.stringify(snapshot),
        },
      });

      await tx.resume.update({
        where: {
          id: resume.id,
        },
        data: {
          currentVersionId: version.id,
        },
      });

      return {
        id: resume.id,
        currentVersionId: version.id,
      };
    });

    revalidatePath("/resumes");

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "创建简历失败",
      },
      { status: 500 },
    );
  }
}
