"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { GiftCard, CARD_COLORS } from "@/components/gifts/gift-card";
import { AddGiftModal } from "@/components/gifts/add-gift-modal";
import { Button } from "@/components/ui/button";
import type { Gift } from "@/types";

interface OccasionGiftsClientProps {
  occasionId: string;
  initialGifts: Gift[];
  isOwner: boolean;
}

export function OccasionGiftsClient({
  occasionId,
  initialGifts,
  isOwner,
}: OccasionGiftsClientProps) {
  const [gifts, setGifts] = useState<Gift[]>(initialGifts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGift, setEditGift] = useState<Gift | null>(null);

  const openAdd = () => { setEditGift(null); setModalOpen(true); };
  const openEdit = (gift: Gift) => { setEditGift(gift); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditGift(null); };

  const onSaved = (saved: Gift) => {
    setGifts((prev) => {
      const idx = prev.findIndex((g) => g.id === saved.id);
      if (idx >= 0) return prev.map((g) => (g.id === saved.id ? saved : g));
      return [...prev, saved];
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this gift?")) return;
    const res = await fetch(`/api/gifts/${id}`, { method: "DELETE" });
    if (res.ok) setGifts((prev) => prev.filter((g) => g.id !== id));
  };

  const onReserve = async (id: string, status: "RESERVED" | "AVAILABLE", name?: string) => {
    const res = await fetch(`/api/gifts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(name && { reservedByName: name }) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setGifts((prev) => prev.map((g) => (g.id === id ? updated : g)));
    }
  };

  return (
    <div>
      {isOwner && (
        <div className="flex justify-end mb-4">
          <Button onClick={openAdd} size="sm">
            <Plus size={15} /> Add gift
          </Button>
        </div>
      )}

      {gifts.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">🛍️</span>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No gifts yet</h2>
          {isOwner && (
            <p className="text-sm text-gray-400">Add your first gift to the list!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gifts.map((gift, i) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              colorClass={CARD_COLORS[i % CARD_COLORS.length]}
              isOwner={isOwner}
              onEdit={isOwner ? openEdit : undefined}
              onDelete={isOwner ? onDelete : undefined}
              onReserve={!isOwner ? onReserve : undefined}
            />
          ))}
        </div>
      )}

      <AddGiftModal
        open={modalOpen}
        onClose={closeModal}
        occasionId={occasionId}
        editGift={editGift}
        onSaved={onSaved}
      />
    </div>
  );
}
