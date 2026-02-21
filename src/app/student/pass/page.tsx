"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { generateQRToken, Store } from "../../lib/store";
import QRDisplay from "../../components/QRDisplay";
import StatusBadge from "../../components/StatusBadge";
import type { MealType } from "../../lib/types";
import HackathonSelector from "../../components/HackathonSelector";

const MEALS: { type: MealType; label: string; window: string; emoji: string }[] = [
  { type: "Breakfast", label: "Breakfast", window: "7:00 AM – 9:00 AM", emoji: "🍳" },
  { type: "Lunch", label: "Lunch", window: "12:30 PM – 2:00 PM", emoji: "🍱" },
  { type: "Dinner", label: "Dinner", window: "7:30 PM – 9:00 PM", emoji: "🍛" },
];

type MealControlStatus = "closed" | "open" | "done";

export default function StudentPassPage() {
  const { user } = useAuth();
  const [hackId, setHackId] = useState("campushack-2026");
  const [mealControl, setMealControl] = useState<Record<MealType, MealControlStatus>>({
    Breakfast: "closed",
    Lunch: "closed",
    Dinner: "closed",
  });

  // Poll meal control state every 5 seconds so student sees real-time updates when organizer opens a meal
  useEffect(() => {
    const refresh = () => {
      const ctrl = Store.getMealControl(hackId);
      setMealControl(ctrl);
    };
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [hackId]);

  const gateToken = user ? generateQRToken("GATE", user.id, 0, hackId) : "";

  const mealToken = (type: MealType) =>
    user ? generateQRToken(`MEAL${type.toUpperCase()}`, user.id, 0, hackId) : "";

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center text-slate-500">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-medium">Sign in to view your QR passes.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My QR passes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gate QR refreshes every 30 seconds · Meal QRs are released by the organizer in order: Breakfast → Lunch → Dinner
        </p>
      </header>

      {/* Hackathon selector */}
      <div className="mb-5">
        <HackathonSelector selected={hackId} onSelect={(id) => setHackId(id)} compact />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ── Gate pass ── */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Gate entry pass</p>
              <h2 className="mt-1 text-lg font-semibold">{user.name}</h2>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <StatusBadge label="Verified ✓" tone="emerald" dot />
          </div>
          <div className="flex justify-center">
            <QRDisplay
              token={gateToken}
              label="Gate Entry"
              refreshSeconds={30}
              size={180}
              generateToken={() => generateQRToken("GATE", user.id, 0, hackId)}
            />
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Unique per-student · Dynamic refresh · Prevents duplicate entry
          </p>
        </div>

        {/* ── Meal passes ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-800">Meal passes</h2>
            <p className="text-[11px] text-slate-500">Released by organizer · Auto-refreshes every 5s</p>
          </div>

          {MEALS.map((meal, i) => {
            const status: MealControlStatus = mealControl[meal.type];

            return (
              <div
                key={meal.type}
                className={`rounded-2xl p-4 shadow-sm ring-1 transition-all duration-300 ${status === "open"
                  ? "bg-white ring-emerald-300 shadow-emerald-50"
                  : status === "done"
                    ? "bg-slate-50 ring-slate-200 opacity-60"
                    : "bg-slate-50 ring-slate-100 opacity-50"
                  }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl transition-all ${status === "closed" ? "grayscale opacity-50" : ""}`}>
                      {meal.emoji}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{meal.label}</h3>
                      <p className="text-[11px] text-slate-500">{meal.window}</p>
                    </div>
                  </div>
                  <StatusBadge
                    label={status === "open" ? "🟢 Active" : status === "done" ? "✓ Redeemed" : "⏳ Not yet open"}
                    tone={status === "open" ? "emerald" : status === "done" ? "default" : "default"}
                    dot
                  />
                </div>

                {/* QR — only shown when organizer has opened this meal */}
                {status === "open" && (
                  <div className="mt-4 flex justify-center">
                    <QRDisplay
                      token={mealToken(meal.type)}
                      label={meal.label}
                      refreshSeconds={30}
                      size={150}
                      generateToken={() => mealToken(meal.type)}
                    />
                  </div>
                )}

                {status === "done" && (
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    ✓ Meal window closed — QR no longer valid
                  </p>
                )}

                {status === "closed" && (
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Waiting for organizer to open this meal window…
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
        <h3 className="font-semibold text-slate-700 mb-1">How meal QRs work</h3>
        <ol className="space-y-0.5 list-decimal list-inside">
          <li>Organizer opens the Breakfast window from their dashboard → all students see a live Breakfast QR</li>
          <li>Scanner scans your QR at the food counter — it becomes invalid immediately after</li>
          <li>Organizer closes Breakfast and opens Lunch→ only the Lunch QR appears (Breakfast locked)</li>
          <li>Same for Dinner — sequentially controlled, no gaming or replays possible</li>
        </ol>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        🖨️ Save / print passes
      </button>
    </div>
  );
}
