import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { parseSnapshot } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";
import { restoreVersionSchema } from "@/lib/validators";

type RouteProps = {
  params: Promise<{
    resumeId: string;
    versionId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { resumeId, versionId } = await params;
    const body = await request.json();
    const parsed = restoreVersionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "参数不合法",
        },
        { status: 400 },
      );
    }

    const [resume, versionToRestore] = await Promise.all([
      prisma.resume.findFirst({
        where: {
          id: resumeId,
          deletedAt: null,
        },
      }),
      prisma.resumeVersion.findFirst({
        where: {
          id: versionId,
          resumeId,
        },
      }),
    ]);

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    if (!versionToRestore) {
      return NextResponse.json({ error: "历史版本不存在" }, { status: 404 });
    }

    const snapshot = parseSnapshot(versionToRestore.snapshotData);

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

      const restoredVersion = await tx.resumeVersion.create({
        data: {
          resumeId,
          versionNumber,
          note:
            parsed.data.note ||
            `恢复自版本 V${versionToRestore.versionNumber}`,
          snapshotData: JSON.stringify(snapshot),
        },
      });

      await tx.resume.update({
        where: {
          id: resumeId,
        },
        data: {
          targetJob: snapshot.targetJob,
          templateType: snapshot.templateType,
          currentVersionId: restoredVersion.id,
        },
      });

      return {
        currentVersionId: restoredVersion.id,
        versionNumber,
      };
    });

    revalidatePath("/resumes");
    revalidatePath(`/resumes/${resumeId}`);
    revalidatePath(`/resumes/${resumeId}/print`);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "恢复版本失败",
      },
      { status: 500 },
    );
  }
}
