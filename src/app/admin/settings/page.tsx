"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DIFFICULTY_JA } from "@/lib/types";
import type { Difficulty, Tolerance } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [tolerances, setTolerances] = useState<Tolerance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTolerances();
  }, []);

  async function fetchTolerances() {
    try {
      const res = await fetch("/api/admin/tolerances");
      const data = await res.json();
      setTolerances(data);
    } catch {
      alert("設定の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function updateAmount(id: string, value: number) {
    setTolerances((prev) =>
      prev.map((t) => (t.id === id ? { ...t, tolerance_amount: value } : t)),
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tolerances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          tolerances.map((t) => ({ id: t.id, tolerance_amount: t.tolerance_amount })),
        ),
      });
      if (res.ok) {
        alert("保存しました");
      } else {
        alert("保存に失敗しました");
      }
    } catch {
      alert("通信エラー");
    } finally {
      setSaving(false);
    }
  }

  // 難易度ごとにグループ化
  const grouped = tolerances.reduce<Record<string, Tolerance[]>>((acc, t) => {
    (acc[t.difficulty] ??= []).push(t);
    return acc;
  }, {});

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">許容範囲設定</h1>
          <button
            onClick={() => router.push("/admin")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            戻る
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          数値入力モードで、正解との差額がこの範囲内なら正解とみなします。
        </p>

        {(["normal", "hard"] as Difficulty[]).map((diff) => (
          <div key={diff} className="mb-8">
            <h2 className="text-lg font-bold mb-3">{DIFFICULTY_JA[diff]}</h2>
            <div className="bg-white rounded-xl border divide-y">
              {(grouped[diff] ?? []).map((t) => (
                <div key={t.id} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-40">
                    {t.price_min.toLocaleString()}円 〜 {t.price_max.toLocaleString()}円
                  </span>
                  <span className="text-sm text-gray-400">±</span>
                  <input
                    type="number"
                    value={t.tolerance_amount}
                    onChange={(e) => updateAmount(t.id, parseInt(e.target.value, 10) || 0)}
                    className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="100"
                  />
                  <span className="text-sm text-gray-400">円</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </main>
  );
}
