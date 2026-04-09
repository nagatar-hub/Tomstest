"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA } from "@/lib/types";
import type { Franchise } from "@/lib/types";

type Mode = "empty" | "random";

export default function NewCommonTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [franchise, setFranchise] = useState<Franchise | "mixed">("mixed");
  const [mode, setMode] = useState<Mode>("random");
  const [count, setCount] = useState(10);
  const [questionType, setQuestionType] = useState<"choice" | "numeric">("choice");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user")!);

      // 1. テスト作成
      const res = await fetch("/api/admin/common-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          franchise: franchise === "mixed" ? null : franchise,
          created_by: user.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      const testId = data.id;

      // 2. ランダムモードなら問題を自動追加
      if (mode === "random") {
        const addRes = await fetch(`/api/admin/common-tests/${testId}/random`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            count,
            franchise: franchise === "mixed" ? null : franchise,
            question_type: questionType,
          }),
        });
        if (!addRes.ok) {
          const err = await addRes.json();
          setError(err.error || "ランダム追加に失敗しました");
          return;
        }
      }

      router.push(`/admin/common-tests/${testId}`);
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">共通テスト新規作成</h1>
          <button onClick={() => router.push("/admin/common-tests")}
            className="text-sm text-gray-600 hover:text-gray-800">戻る</button>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">テスト名</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 4月度 ポケモン相場テスト"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">商材</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setFranchise("mixed")}
                className={`py-2 px-3 rounded-lg border-2 text-sm font-medium ${
                  franchise === "mixed"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}>全商材混合</button>
              {FRANCHISES.map((f) => (
                <button key={f} onClick={() => setFranchise(f)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium ${
                    franchise === f
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}>{FRANCHISE_JA[f]}</button>
              ))}
            </div>
          </div>

          {/* 作成モード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">問題の追加方法</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMode("random")}
                className={`py-3 px-3 rounded-lg border-2 text-sm font-medium ${
                  mode === "random"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}>
                ランダム生成
                <p className="text-xs font-normal mt-0.5 opacity-70">あとから編集可</p>
              </button>
              <button onClick={() => setMode("empty")}
                className={`py-3 px-3 rounded-lg border-2 text-sm font-medium ${
                  mode === "empty"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}>
                0から作る
                <p className="text-xs font-normal mt-0.5 opacity-70">手動で選択</p>
              </button>
            </div>
          </div>

          {/* ランダム設定 */}
          {mode === "random" && (
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 whitespace-nowrap">出題数</label>
                <div className="flex gap-1">
                  {[10, 15, 20, 30].map((n) => (
                    <button key={n} onClick={() => setCount(n)}
                      className={`px-3 py-1.5 rounded text-sm ${
                        count === n
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}>{n}問</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 whitespace-nowrap">問題形式</label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" checked={questionType === "choice"} onChange={() => setQuestionType("choice")} />
                  4択
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" checked={questionType === "numeric"} onChange={() => setQuestionType("numeric")} />
                  筆記
                </label>
              </div>
              <p className="text-xs text-gray-400">作成後に問題の入れ替え・形式変更ができます</p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={handleCreate} disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "作成中..." : mode === "random" ? `ランダム${count}問で作成` : "作成して問題を追加"}
          </button>
        </div>
      </div>
    </main>
  );
}
