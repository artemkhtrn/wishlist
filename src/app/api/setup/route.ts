import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingId = cookieStore.get("wl_uid")?.value;
  const userId = existingId ?? crypto.randomUUID();

  const user = await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, name: name.trim() },
    update: { name: name.trim() },
  });

  cookieStore.set("wl_uid", userId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 10,
  });

  return Response.json(user, { status: 201 });
}
