import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { userId } = await getAuth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { occasionId, title, price, currency, shopUrl, imageUrl, notes, priority } = body;

  if (!occasionId || !title) {
    return Response.json({ error: "occasionId and title are required" }, { status: 400 });
  }

  const occasion = await prisma.occasion.findUnique({ where: { id: occasionId } });
  if (!occasion) return Response.json({ error: "Occasion not found" }, { status: 404 });
  if (occasion.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const gift = await prisma.gift.create({
    data: {
      occasionId,
      title,
      price: price ? parseFloat(price) : null,
      currency: currency ?? "USD",
      shopUrl: shopUrl ?? null,
      imageUrl: imageUrl ?? null,
      notes: notes ?? null,
      priority: priority ?? 0,
    },
  });

  return Response.json(gift, { status: 201 });
}
