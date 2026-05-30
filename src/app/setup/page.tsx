"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">🎁</span>
          <h1 className="mt-3 text-xl font-bold text-gray-900">Welcome to Wishlist</h1>
          <p className="mt-1 text-sm text-gray-500">What should we call you?</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={60}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 transition-colors"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up…" : "Get started"}
          </button>
        </form>
      </div>
    </div>
  );
}
