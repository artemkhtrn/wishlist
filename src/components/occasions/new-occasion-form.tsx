"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Occasion } from "@/types";

const OCCASION_TYPES = [
  { value: "BIRTHDAY", label: "🎂 Birthday" },
  { value: "CHRISTMAS", label: "🎄 Christmas" },
  { value: "WEDDING", label: "💍 Wedding" },
  { value: "BABY_SHOWER", label: "🍼 Baby Shower" },
  { value: "ANNIVERSARY", label: "💐 Anniversary" },
  { value: "GRADUATION", label: "🎓 Graduation" },
  { value: "CUSTOM", label: "🎁 Custom" },
];

interface NewOccasionFormProps {
  onClose: () => void;
  onCreated?: (occasion: Occasion) => void;
}

export function NewOccasionForm({ onClose, onCreated }: NewOccasionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", type: "BIRTHDAY", date: "", isPublic: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/occasions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: form.date || null }),
      });
      if (!res.ok) throw new Error("Failed to create occasion");
      const occasion = await res.json();
      if (onCreated) {
        onCreated(occasion);
      } else {
        router.push(`/occasions/${occasion.id}`);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Occasion name</label>
        <input
          type="text"
          required
          placeholder="e.g. My 30th Birthday"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {OCCASION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date (optional)</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
          className="rounded accent-violet-600"
        />
        Make this list public (shareable via link)
      </label>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Creating…" : "Create occasion"}
        </Button>
      </div>
    </form>
  );
}
