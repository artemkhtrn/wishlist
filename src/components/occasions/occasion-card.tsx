"use client";

import Link from "next/link";
import { Gift, Calendar, Lock } from "lucide-react";
import type { OccasionWithGifts } from "@/types";

const OCCASION_EMOJI: Record<string, string> = {
  BIRTHDAY: "🎂",
  CHRISTMAS: "🎄",
  WEDDING: "💍",
  BABY_SHOWER: "🍼",
  ANNIVERSARY: "💐",
  GRADUATION: "🎓",
  CUSTOM: "🎁",
};

interface OccasionCardProps {
  occasion: OccasionWithGifts;
}

export function OccasionCard({ occasion }: OccasionCardProps) {
  const emoji = OCCASION_EMOJI[occasion.type] ?? "🎁";
  const date = occasion.date ? new Date(occasion.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <Link
      href={`/occasions/${occasion.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-violet-200 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{emoji}</span>
        {!occasion.isPublic && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Lock size={12} /> Private
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors mb-1">
        {occasion.name}
      </h3>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Gift size={13} /> {occasion._count.gifts} {occasion._count.gifts === 1 ? "gift" : "gifts"}
        </span>
        {date && (
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {date}
          </span>
        )}
      </div>
    </Link>
  );
}
