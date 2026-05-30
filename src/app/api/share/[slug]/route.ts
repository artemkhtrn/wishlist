import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const occasion = await prisma.occasion.findUnique({
    where: { shareSlug: slug },
    include: { user: true },
  });
  if (!occasion || !occasion.isPublic) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({
    slug,
    userName: occasion.user?.name ?? "Someone",
    occasionName: occasion.name,
  });
}
