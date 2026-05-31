"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, User } from "lucide-react";
import type { Gift } from "@/types";

export const CARD_COLORS = [
  "bg-[#ddd6f3]",   // soft violet
  "bg-[#c8ead8]",   // soft mint
  "bg-[#f5d7c3]",   // soft peach
  "bg-[#f5c8d4]",   // soft rose
  "bg-[#c3d9f5]",   // soft sky
  "bg-[#f5edc3]",   // soft amber
];

interface GiftCardProps {
  gift: Gift;
  colorClass?: string;
  isOwner: boolean;
  onReserve?: (id: string, status: "RESERVED" | "AVAILABLE", name?: string) => void;
  onEdit?: (gift: Gift) => void;
  onDelete?: (id: string) => void;
}

function domain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function GiftCard({
  gift,
  colorClass = CARD_COLORS[0],
  isOwner,
  onReserve,
  onEdit,
  onDelete,
}: GiftCardProps) {
  const [reserving, setReserving] = useState(false);
  const [reserverName, setReserverName] = useState("");
  const [showWho, setShowWho] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const price =
    gift.price != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: gift.currency }).format(
          gift.price
        )
      : null;
  const shopDomain = domain(gift.shopUrl);
  const isReserved = gift.status === "RESERVED";
  const isPurchased = gift.status === "PURCHASED";

  const confirmReserve = () => {
    onReserve?.(gift.id, "RESERVED", reserverName.trim() || undefined);
    setReserving(false);
    setReserverName("");
  };

  const cancelReserving = () => {
    setReserving(false);
    setReserverName("");
  };

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image / color block */}
      <div className={`relative aspect-[4/3] ${colorClass} flex items-center justify-center`}>
        {gift.imageUrl ? (
          <Image
            src={gift.imageUrl}
            alt={gift.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <Camera size={40} className="text-white/50" strokeWidth={1.5} />
        )}

        {/* Status badge */}
        {isReserved && (
          <span className="absolute top-3 right-3 text-xs font-medium bg-[#c8ead8] text-emerald-700 px-2.5 py-1 rounded-full">
            reserved
          </span>
        )}
        {isPurchased && (
          <span className="absolute top-3 right-3 text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            purchased
          </span>
        )}
        {gift.priority > 0 && !isReserved && !isPurchased && (
          <span className="absolute top-3 right-3 text-xs font-medium bg-[#f5edc3] text-amber-700 px-2.5 py-1 rounded-full">
            high
          </span>
        )}

        {/* Owner edit/delete — top-left on hover */}
        {isOwner && (onEdit || onDelete) && (
          <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(gift)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white font-medium shadow-sm"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(gift.id)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-red-500 hover:bg-white font-medium shadow-sm"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="px-4 pt-3.5 pb-4">
        <h3 className="font-semibold text-gray-900 text-[15px] leading-snug mb-1 line-clamp-2">
          {gift.title}
        </h3>
        {price && (
          <p className="text-[#5b6af5] font-semibold text-sm mb-0.5">{price}</p>
        )}
        {shopDomain && (
          <p className="text-xs text-gray-400 mb-1">{shopDomain}</p>
        )}
        {gift.notes && (
          <div>
            <p className={`text-xs text-gray-500 ${showNotes ? "" : "line-clamp-2"}`}>
              {gift.notes}
            </p>
            {gift.notes.length > 80 && (
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
              >
                {showNotes ? "show less" : "show more"}
              </button>
            )}
          </div>
        )}

        {/* Reserved-by reveal */}
        {isReserved && gift.reservedByName && (
          <div className="mt-1.5">
            {showWho ? (
              <button
                onClick={() => setShowWho(false)}
                className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"
              >
                <User size={11} />
                {gift.reservedByName}
              </button>
            ) : (
              <button
                onClick={() => setShowWho(true)}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <User size={11} />
                who reserved?
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3.5">
          {reserving ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={reserverName}
                onChange={(e) => setReserverName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmReserve();
                  if (e.key === "Escape") cancelReserving();
                }}
                autoFocus
                maxLength={60}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-violet-400 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={confirmReserve}
                  className="flex-1 text-xs font-semibold py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                >
                  Reserve
                </button>
                <button
                  onClick={cancelReserving}
                  className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {isReserved ? (
                <button
                  onClick={() => onReserve?.(gift.id, "AVAILABLE")}
                  className="group/res flex-1 text-[13px] font-medium py-2 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <span className="group-hover/res:hidden">reserved</span>
                  <span className="hidden group-hover/res:inline">cancel</span>
                </button>
              ) : (
                <button
                  onClick={() => onReserve && setReserving(true)}
                  disabled={!onReserve}
                  className="flex-1 text-[13px] font-medium py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-default"
                >
                  reserve
                </button>
              )}

              {gift.shopUrl ? (
                <a
                  href={gift.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-[13px] font-medium py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-center"
                >
                  shop →
                </a>
              ) : (
                <div className="flex-1 text-[13px] py-2 rounded-xl border border-gray-100 bg-gray-50 text-gray-300 text-center cursor-default">
                  shop →
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
