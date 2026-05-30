"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { GiftCard, CARD_COLORS } from "@/components/gifts/gift-card";
import { AddGiftModal } from "@/components/gifts/add-gift-modal";
import { NewOccasionForm } from "@/components/occasions/new-occasion-form";
import type { Occasion, Gift } from "@/types";

type OccasionFull = Occasion & { gifts: Gift[] };

interface DashboardClientProps {
  userId: string;
  userName: string;
  initialOccasions: OccasionFull[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Stable per-gift color: deterministic so colors don't shift on re-render
function giftColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_COLORS[h % CARD_COLORS.length];
}

export function DashboardClient({ userName, initialOccasions }: DashboardClientProps) {
  const [occasions, setOccasions] = useState<OccasionFull[]>(initialOccasions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addGiftOpen, setAddGiftOpen] = useState(false);
  const [newOccasionOpen, setNewOccasionOpen] = useState(false);
  const [editGift, setEditGift] = useState<Gift | null>(null);

  const allGifts = occasions.flatMap((o) => o.gifts);
  const filteredGifts = selectedId
    ? (occasions.find((o) => o.id === selectedId)?.gifts ?? [])
    : allGifts;

  const addGiftOccasionId =
    selectedId ?? (occasions.length === 1 ? occasions[0].id : "");

  const userInits = initials(userName);

  const onGiftSaved = (saved: Gift) => {
    setOccasions((prev) =>
      prev.map((o) => {
        if (o.id !== saved.occasionId) return o;
        const exists = o.gifts.some((g) => g.id === saved.id);
        return {
          ...o,
          gifts: exists
            ? o.gifts.map((g) => (g.id === saved.id ? saved : g))
            : [...o.gifts, saved],
        };
      })
    );
  };

  const onDelete = async (id: string, occasionId: string) => {
    if (!confirm("Delete this gift?")) return;
    const res = await fetch(`/api/gifts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOccasions((prev) =>
        prev.map((o) =>
          o.id !== occasionId ? o : { ...o, gifts: o.gifts.filter((g) => g.id !== id) }
        )
      );
    }
  };

  const onReserve = async (id: string, status: "RESERVED" | "AVAILABLE", occasionId: string, name?: string) => {
    const res = await fetch(`/api/gifts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(name && { reservedByName: name }) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOccasions((prev) =>
        prev.map((o) =>
          o.id !== occasionId
            ? o
            : { ...o, gifts: o.gifts.map((g) => (g.id === id ? updated : g)) }
        )
      );
    }
  };

  const onOccasionCreated = (newOccasion: Occasion) => {
    setOccasions((prev) => [{ ...newOccasion, gifts: [] }, ...prev]);
    setSelectedId(newOccasion.id);
    setNewOccasionOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7]">
      {/* ── Sidebar ── */}
      <aside className="w-[280px] bg-white border-r border-gray-100 flex flex-col px-5 py-6 shrink-0">
        {/* App name */}
        <div className="mb-8">
          <p className="text-[15px] font-bold text-gray-900 leading-none">Wishlist</p>
          <p className="text-xs text-gray-400 mt-1">shared gift lists</p>
        </div>

        {/* People label */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-3">
          People
        </p>

        {/* People list */}
        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto min-h-0">
          {/* Current user — selected */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#ede9fe]">
            <div className="w-8 h-8 rounded-full bg-[#c4b5fd] text-violet-800 text-xs font-bold flex items-center justify-center shrink-0 select-none">
              {userInits}
            </div>
            <span className="text-sm font-semibold text-violet-800 truncate">{userName}</span>
          </div>
        </div>

        {/* Add person */}
        <button className="mt-5 w-full border border-gray-200 rounded-xl py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors">
          + add person
        </button>
      </aside>

      {/* ── Main panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-7 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c4b5fd] text-violet-800 text-sm font-bold flex items-center justify-center shrink-0 select-none">
              {userInits}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-[15px] leading-snug">{userName}</p>
              <p className="text-xs text-gray-400">
                {allGifts.length} {allGifts.length === 1 ? "wish" : "wishes"} across{" "}
                {occasions.length} {occasions.length === 1 ? "occasion" : "occasions"}
              </p>
            </div>
          </div>

          <button
            onClick={() => { setEditGift(null); setAddGiftOpen(true); }}
            className="border border-gray-200 rounded-2xl px-5 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            + add wish
          </button>
        </header>

        {/* Occasion tabs */}
        <div className="bg-white border-b border-gray-100 px-7 flex items-end gap-0 shrink-0 overflow-x-auto">
          {([{ id: null as null, name: "All" }] as { id: string | null; name: string }[])
            .concat(occasions)
            .map((o) => (
              <button
                key={o.id ?? "all"}
                onClick={() => setSelectedId(o.id)}
                className={`px-4 py-3.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
                  selectedId === o.id
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {o.name}
              </button>
            ))}
          <button
            onClick={() => setNewOccasionOpen(true)}
            className="px-4 py-3.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap border-b-2 border-transparent"
          >
            + new occasion
          </button>
        </div>

        {/* Gift grid */}
        <main className="flex-1 overflow-y-auto p-7">
          {filteredGifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <span className="text-5xl">🎁</span>
              {occasions.length === 0 ? (
                <p className="text-gray-400 text-sm">Create an occasion first, then add wishes.</p>
              ) : (
                <>
                  <p className="text-gray-400 text-sm">No wishes yet</p>
                  <button
                    onClick={() => { setEditGift(null); setAddGiftOpen(true); }}
                    className="border border-gray-200 rounded-2xl px-5 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    + add wish
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredGifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  colorClass={giftColor(gift.id)}
                  isOwner={true}
                  onReserve={(id, status, name) => onReserve(id, status, gift.occasionId, name)}
                  onEdit={(g) => { setEditGift(g); setAddGiftOpen(true); }}
                  onDelete={(id) => onDelete(id, gift.occasionId)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      <AddGiftModal
        open={addGiftOpen}
        onClose={() => { setAddGiftOpen(false); setEditGift(null); }}
        occasionId={addGiftOccasionId}
        occasions={occasions.map((o) => ({ id: o.id, name: o.name }))}
        editGift={editGift}
        onSaved={onGiftSaved}
      />

      <Modal open={newOccasionOpen} onClose={() => setNewOccasionOpen(false)} title="New occasion">
        <NewOccasionForm onClose={() => setNewOccasionOpen(false)} onCreated={onOccasionCreated} />
      </Modal>
    </div>
  );
}
