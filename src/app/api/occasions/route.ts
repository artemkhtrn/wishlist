import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET() {
  const { userId } = await getAuth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const occasions = await prisma.occasion.findMany({
    where: { userId },
    include: { _count: { select: { gifts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(occasions);
}

export async function POST(req: NextRequest) {
  const { userId } = await getAuth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, date, isPublic } = body;

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  const occasion = await prisma.occasion.create({
    data: {
      name,
      type: type ?? "CUSTOM",
      date: date ? new Date(date) : null,
      isPublic: isPublic ?? true,
      userId,
    },
  });

  return Response.json(occasion, { status: 201 });
}
