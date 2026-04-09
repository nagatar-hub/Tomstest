"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA, DIFFICULTIES, DIFFICULTY_JA } from "@/lib/types";
import type { Franchise, Difficulty } from "@/lib/types";

interface CommonTestItem {
  id: string;
  title: string;
  franchise: Franchise | null;
  common_test_question: { count: number }[];
}

type Mode = "normal" | "endless";

export default function ExamStartPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"random" | "common">("random");
  const [franchise, setFranchise] = useState<Franchise | "all">("Pokemon");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<Mode>("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [commonTests, setCommonTests] = useState<CommonTestItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  useEffect(() => {
    fetch("/api/exam/common-tests")
      .then((r) => r.json())
      .then((data) => setCommonTests(Array.isArray(data) ? data : []))
      .finally(() => setLoadingTests(false));
  }, []);

  async function handleRandomStart() {
    setError("");
    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user")!);
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, franchise, difficulty, mode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      sessionStorage.setItem("exam", JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty", difficulty);
      router.push("/exam/play");
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommonStart(testId: string) {
    setError("");
    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user")!);
      const res = await fetch("/api/exam/common/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, common_test_id: testId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      sessionStorage.setItem("exam", JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty", "common");
      router.push("/exam/play");
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">テスト開始</h1>
          <button onClick={() => router.push("/exam/history")}
            className="text-sm text-blue-600 hover:underline">成績履歴</button>
        </div>

        {/* タブ */}
        <div className="flex gap-1 bg-gray-200 rounded-lg p-1 mb-6">
          <button onClick={() => setTab("random")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "random" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
            }`}>通常テスト</button>
          <button onClick={() => setTab("common")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "common" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
            }`}>
            共通テスト
            {commonTests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{commonTests.length}</span>
            )}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* 通常テスト */}
        {tab === "random" && (
          <div className="space-y-5">
            {/* モード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">モード</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode("normal")}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium ${
                    mode === "normal"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}>
                  10問テスト
                </button>
                <button onClick={() => setMode("endless")}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium ${
                    mode === "endless"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}>
                  エンドレス
                  <p className="text-xs font-normal opacity-70">全問+タイマー</p>
                </button>
              </div>
            </div>

            {/* 商材 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">商材を選択</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setFranchise("all")}
                  className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    franchise === "all"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}>全商材混合</button>
                {FRANCHISES.map((f) => (
                  <button key={f} onClick={() => setFranchise(f)}
                    className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      franchise === f
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}>{FRANCHISE_JA[f]}</button>
                ))}
              </div>
            </div>

            {/* 難易度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">難易度を選択</label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      difficulty === d
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}>{DIFFICULTY_JA[d]}</button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {difficulty === "easy" && "4択から選ぶモードです"}
                {difficulty === "normal" && "価格を直接入力します（許容範囲あり）"}
                {difficulty === "hard" && "価格を直接入力します（許容範囲が狭い）"}
              </p>
            </div>

            <button onClick={handleRandomStart} disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "準備中..." : mode === "endless" ? "エンドレス スタート" : "スタート"}
            </button>
          </div>
        )}

        {/* 共通テスト */}
        {tab === "common" && (
          <div className="space-y-3">
            {loadingTests ? (
              <p className="text-center text-gray-400 py-8">読み込み中...</p>
            ) : commonTests.length === 0 ? (
              <p className="text-center text-gray-400 py-8">公開中の共通テストはありません</p>
            ) : (
              commonTests.map((t) => (
                <button key={t.id} onClick={() => handleCommonStart(t.id)} disabled={loading}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50">
                  <p className="font-bold text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.franchise ? FRANCHISE_JA[t.franchise] : "全商材混合"} ・
                    {t.common_test_question?.[0]?.count ?? 0}問
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        <button onClick={() => { sessionStorage.clear(); router.push("/"); }}
          className="w-full mt-6 py-2 text-gray-500 text-sm hover:text-gray-700">
          ログアウト
        </button>
      </div>
    </main>
  );
}
