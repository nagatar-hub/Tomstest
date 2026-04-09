"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA, DIFFICULTIES, DIFFICULTY_JA } from "@/lib/types";
import type { Franchise, Difficulty } from "@/lib/types";

export default function ExamStartPage() {
  const router = useRouter();
  const [franchise, setFranchise] = useState<Franchise>("Pokemon");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    setError("");
    setLoading(true);

    try {
      const userStr = sessionStorage.getItem("user");
      if (!userStr) {
        router.push("/");
        return;
      }
      const user = JSON.parse(userStr);

      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          franchise,
          difficulty,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // 出題データをsessionStorageに保存してクイズ画面へ
      sessionStorage.setItem("exam", JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty", difficulty);
      router.push("/exam/play");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold text-center mb-8">テスト開始</h1>

        <div className="space-y-6">
          {/* フランチャイズ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商材を選択
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FRANCHISES.map((f) => (
                <button
                  key={f}
                  onClick={() => setFranchise(f)}
                  className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    franchise === f
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {FRANCHISE_JA[f]}
                </button>
              ))}
            </div>
          </div>

          {/* 難易度選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              難易度を選択
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    difficulty === d
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {DIFFICULTY_JA[d]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {difficulty === "easy" && "4択から選ぶモードです"}
              {difficulty === "normal" && "価格を直接入力します（許容範囲あり）"}
              {difficulty === "hard" && "価格を直接入力します（許容範囲が狭い）"}
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "準備中..." : "スタート"}
          </button>

          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            ログアウト
          </button>
        </div>
      </div>
    </main>
  );
}
