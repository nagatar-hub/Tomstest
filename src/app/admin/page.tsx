"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DIFFICULTY_JA, FRANCHISE_JA } from "@/lib/types";
import type { Difficulty, Franchise } from "@/lib/types";

interface SessionRow {
  id: string;
  user_name: string;
  difficulty: Difficulty;
  franchise: Franchise;
  total_questions: number;
  score: number;
  accuracy: number;
  finished_at: string;
}

interface HardCard {
  quiz_card_id: string;
  card_name: string;
  franchise: Franchise;
  price: number;
  total_attempts: number;
  incorrect_count: number;
  error_rate: number;
}

interface Stats {
  sessions: SessionRow[];
  hard_cards: HardCard[];
  overall_accuracy: { total_answers: number; correct_answers: number; accuracy: number };
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<"sessions" | "hard_cards" | "settings">("sessions");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) {
      router.push("/");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      router.push("/exam");
      return;
    }
    fetchStats();
  }, [router]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch {
      alert("統計の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">管理画面</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/settings")}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300"
            >
              許容範囲設定
            </button>
            <button
              onClick={() => router.push("/admin/users")}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300"
            >
              ユーザー管理
            </button>
            <button
              onClick={() => {
                sessionStorage.clear();
                router.push("/");
              }}
              className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* 全体サマリ */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-sm text-gray-500">全体正答率</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.overall_accuracy.accuracy ?? 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-sm text-gray-500">総回答数</p>
            <p className="text-3xl font-bold">
              {(stats.overall_accuracy.total_answers ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-sm text-gray-500">受験回数</p>
            <p className="text-3xl font-bold">
              {stats.sessions.length}
            </p>
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-1 bg-gray-200 rounded-lg p-1 mb-4">
          <button
            onClick={() => setTab("sessions")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "sessions" ? "bg-white shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            受験履歴
          </button>
          <button
            onClick={() => setTab("hard_cards")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "hard_cards" ? "bg-white shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            間違えやすい問題
          </button>
        </div>

        {/* 受験履歴テーブル */}
        {tab === "sessions" && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">名前</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">商材</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">難易度</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">スコア</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">正答率</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">受験日</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.user_name}</td>
                    <td className="px-4 py-3">{FRANCHISE_JA[s.franchise]}</td>
                    <td className="px-4 py-3">{DIFFICULTY_JA[s.difficulty]}</td>
                    <td className="px-4 py-3 text-center">
                      {s.score}/{s.total_questions}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          s.accuracy >= 80
                            ? "bg-green-100 text-green-700"
                            : s.accuracy >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.accuracy}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.finished_at).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                ))}
                {stats.sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      まだ受験データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 間違えやすい問題ランキング */}
        {tab === "hard_cards" && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">カード名</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">商材</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">価格</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">出題数</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">不正解数</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">不正解率</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.hard_cards.map((c, i) => (
                  <tr key={c.quiz_card_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{c.card_name}</td>
                    <td className="px-4 py-3">{FRANCHISE_JA[c.franchise]}</td>
                    <td className="px-4 py-3 text-right">{c.price.toLocaleString()}円</td>
                    <td className="px-4 py-3 text-center">{c.total_attempts}</td>
                    <td className="px-4 py-3 text-center">{c.incorrect_count}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        {c.error_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.hard_cards.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      十分なデータがありません（3回以上出題されたカードが対象）
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
