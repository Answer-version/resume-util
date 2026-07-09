import { ResumesPageContent } from "@/components/resumes/resumes-page-content";
import { mapResumeListItem } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";

export default async function ResumesPage() {
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

  const items = resumes.map(mapResumeListItem);

  return <ResumesPageContent items={items} />;
}
