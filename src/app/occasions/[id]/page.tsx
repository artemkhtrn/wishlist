import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { OccasionGiftsClient } from "@/components/occasions/occasion-gifts-client";
import { ShareButton } from "@/components/occasions/share-button";

const OCCASION_EMOJI: Record<string, string> = {
  BIRTHDAY: "🎂", CHRISTMAS: "🎄", WEDDING: "💍",
  BABY_SHOWER: "🍼", ANNIVERSARY: "💐", GRADUATION: "🎓", CUSTOM: "🎁",
};

export default async function OccasionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await getAuth();

  const occasion = await prisma.occasion.findUnique({
    where: { id },
    include: { gifts: true, user: true },
  });

  if (!occasion) notFound();
  if (!occasion.isPublic && occasion.userId !== userId) notFound();

  const isOwner = occasion.userId === userId;
  const emoji = OCCASION_EMOJI[occasion.type] ?? "🎁";
  const date = occasion.date
    ? new Date(occasion.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-4xl mb-2 block">{emoji}</span>
              <h1 className="text-2xl font-bold text-gray-900">{occasion.name}</h1>
              {!isOwner && occasion.user?.name && (
                <p className="text-sm text-gray-500 mt-1">by {occasion.user.name}</p>
              )}
              {date && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <Calendar size={13} /> {date}
                </p>
              )}
            </div>
            {occasion.isPublic && (
              <ShareButton slug={occasion.shareSlug} />
            )}
          </div>
        </div>

        <OccasionGiftsClient
          occasionId={id}
          initialGifts={occasion.gifts as Parameters<typeof OccasionGiftsClient>[0]["initialGifts"]}
          isOwner={isOwner}
        />
      </main>
    </div>
  );
}
