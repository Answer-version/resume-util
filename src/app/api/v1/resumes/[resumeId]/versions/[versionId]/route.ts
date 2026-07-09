import { NextResponse } from "next/server";

import { mapHistoryItem } from "@/lib/resume-data";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    resumeId: string;
    versionId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { resumeId, versionId } = await params;

  const version = await prisma.resumeVersion.findFirst({
    where: {
      id: versionId,
      resumeId,
    },
  });

  if (!version) {
    return NextResponse.json({ error: "版本不存在" }, { status: 404 });
  }

  return NextResponse.json(mapHistoryItem(version));
}
