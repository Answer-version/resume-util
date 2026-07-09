import { notFound } from "next/navigation";

import { PrintPageContent } from "@/components/resumes/print-page-content";
import { mapResumeDetail } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";

type ResumePrintPageProps = {
  params: Promise<{
    resumeId: string;
  }>;
};

export default async function ResumePrintPage({ params }: ResumePrintPageProps) {
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

  const currentVersion = await prisma.resumeVersion.findUnique({
    where: {
      id: resume.currentVersionId,
    },
  });

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

  return <PrintPageContent detail={detail} resumeId={resumeId} />;
}
