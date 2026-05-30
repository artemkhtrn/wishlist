import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { Occasion, Gift } from "@/types";

type OccasionFull = Occasion & { gifts: Gift[] };

export default async function DashboardPage() {
  const { userId } = await getAuth();
  if (!userId) redirect("/setup");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.name) redirect("/setup");

  const occasions = await prisma.occasion.findMany({
    where: { userId },
    include: { gifts: true },
    orderBy: { createdAt: "desc" },
  }) as OccasionFull[];

  return (
    <DashboardClient
      userId={userId}
      userName={user.name}
      initialOccasions={occasions}
    />
  );
}
