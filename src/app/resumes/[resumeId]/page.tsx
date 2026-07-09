import { notFound } from "next/navigation";

import { ResumeEditor } from "@/components/resumes/resume-editor";
import { mapHistoryItem, mapResumeDetail } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";

type ResumeDetailPageProps = {
  params: Promise<{
    resumeId: string;
  }>;
};

export default async function ResumeDetailPage({
  params,
}: ResumeDetailPageProps) {
  const { resumeId } = await params;

  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      deletedAt: null,
    },
  });

  if (!resume?.currentVersionId) {
    notFound();
  }

  const [currentVersion, versions] = await Promise.all([
    prisma.resumeVersion.findUnique({
      where: {
        id: resume.currentVersionId,
      },
    }),
    prisma.resumeVersion.findMany({
      where: {
        resumeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  if (!currentVersion) {
    notFound();
  }

  const detail = mapResumeDetail({
    id: resume.id,
    title: resume.title,
    targetJob: resume.targetJob,
    templateType: resume.templateType,
    currentVersionId: resume.currentVersionId,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
    currentVersion,
  });

  return (
    <ResumeEditor
      mode="edit"
      initialForm={{
        title: detail.title,
        content: detail.currentVersion.snapshotData,
      }}
      initialHistory={versions.map(mapHistoryItem)}
      initialDetail={detail}
    />
  );
}
