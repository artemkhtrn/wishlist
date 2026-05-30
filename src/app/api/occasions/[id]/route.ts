import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await getAuth();

  const occasion = await prisma.occasion.findUnique({
    where: { id },
    include: { gifts: true, user: true },
  });

  if (!occasion) return Response.json({ error: "Not found" }, { status: 404 });
  if (!occasion.isPublic && occasion.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(occasion);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await getAuth();

  const occasion = await prisma.occasion.findUnique({ where: { id } });
  if (!occasion) return Response.json({ error: "Not found" }, { status: 404 });
  if (occasion.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, type, date, isPublic } = body;

  const updated = await prisma.occasion.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(date !== undefined && { date: date ? new Date(date) : null }),
      ...(isPublic !== undefined && { isPublic }),
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await getAuth();

  const occasion = await prisma.occasion.findUnique({ where: { id } });
  if (!occasion) return Response.json({ error: "Not found" }, { status: 404 });
  if (occasion.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.occasion.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
