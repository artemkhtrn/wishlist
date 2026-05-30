import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await getAuth();

  const gift = await prisma.gift.findUnique({
    where: { id },
    include: { occasion: true },
  });

  if (!gift) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, price, currency, shopUrl, imageUrl, notes, priority, status, reservedByName } = body;

  const isOwner = gift.occasion.userId === userId;
  const isStatusOnly = Object.keys(body).every((k) => k === "status" || k === "reservedByName");

  if (!isOwner && !isStatusOnly) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.gift.update({
    where: { id },
    data: {
      ...(isOwner && {
        ...(title !== undefined && { title }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(currency !== undefined && { currency }),
        ...(shopUrl !== undefined && { shopUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(notes !== undefined && { notes }),
        ...(priority !== undefined && { priority }),
      }),
      ...(status !== undefined && {
        status,
        reservedBy: status === "RESERVED" ? userId : status === "AVAILABLE" ? null : undefined,
        reservedByName: status === "RESERVED" ? (reservedByName ?? null) : status === "AVAILABLE" ? null : undefined,
      }),
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

  const gift = await prisma.gift.findUnique({
    where: { id },
    include: { occasion: true },
  });

  if (!gift) return Response.json({ error: "Not found" }, { status: 404 });
  if (gift.occasion.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.gift.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
