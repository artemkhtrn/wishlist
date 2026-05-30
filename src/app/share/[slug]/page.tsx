import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { OccasionGiftsClient } from "@/components/occasions/occasion-gifts-client";

const OCCASION_EMOJI: Record<string, string> = {
  BIRTHDAY: "🎂", CHRISTMAS: "🎄", WEDDING: "💍",
  BABY_SHOWER: "🍼", ANNIVERSARY: "💐", GRADUATION: "🎓", CUSTOM: "🎁",
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { userId } = await getAuth();

  const occasion = await prisma.occasion.findUnique({
    where: { shareSlug: slug },
    include: { gifts: true, user: true },
  });

  if (!occasion || !occasion.isPublic) notFound();

  const isOwner = occasion.userId === userId;
  const emoji = OCCASION_EMOJI[occasion.type] ?? "🎁";
  const date = occasion.date
    ? new Date(occasion.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-bold text-violet-600 tracking-tight">Wishlist</span>
        <Link href="/dashboard" className="text-sm text-violet-600 hover:text-violet-800 font-medium">
          {isOwner ? "My wishlist" : "Create your own →"}
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <span className="text-4xl mb-2 block">{emoji}</span>
          <h1 className="text-2xl font-bold text-gray-900">{occasion.name}</h1>
          {occasion.user?.name && (
            <p className="text-sm text-gray-500 mt-1">by {occasion.user.name}</p>
          )}
          {date && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Calendar size={13} /> {date}
            </p>
          )}
        </div>

        <OccasionGiftsClient
          occasionId={occasion.id}
          initialGifts={occasion.gifts as Parameters<typeof OccasionGiftsClient>[0]["initialGifts"]}
          isOwner={isOwner}
        />
      </main>
    </div>
  );
}
