"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISE_JA, DIFFICULTY_JA } from "@/lib/types";
import type { Franchise, Difficulty } from "@/lib/types";

interface SessionRow {
  id: string;
  difficulty: Difficulty;
  franchise: Franchise;
  total_questions: number;
  score: number;
  started_at: string;
  finished_at: string;
}

interface CardStat {
  quiz_card_id: string;
  card_name: string;
  grade: string | null;
  franchise: string;
  price: number;
  image_url: string | null;
  total: number;
  correct: number;
  accuracy: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"sessions" | "cards">("sessions");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [cardStats, setCardStats] = useState<CardStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) { router.push("/"); return; }
    const user = JSON.parse(userStr);
    fetch(`/api/exam/history?user_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setCardStats(data.card_stats ?? []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function startReview() {
    const user = JSON.parse(sessionStorage.getItem("user")!);
    const res = await fetch("/api/exam/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, difficulty: "easy" }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    sessionStorage.setItem("exam", JSON.stringify(data));
    sessionStorage.setItem("exam_difficulty", "easy");
    router.push("/exam/play");
  }

  if (loading) {
    return <main className="flex-1 flex items-center justify-center bg-gray-50"><p className="text-gray-500">読み込み中...</p></main>;
  }

  const wrongCards = cardStats.filter((c) => c.accuracy < 100);

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">成績履歴</h1>
          <div className="flex gap-2">
            {wrongCards.length > 0 && (
              <button onClick={startReview}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">
                復習モード ({wrongCards.length}問)
              </button>
            )}
            <button onClick={() => router.push("/exam")}
              className="text-sm text-gray-600 hover:text-gray-800">戻る</button>
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-1 bg-gray-200 rounded-lg p-1 mb-4">
          <button onClick={() => setTab("sessions")}
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              tab === "sessions" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
            }`}>テスト履歴</button>
          <button onClick={() => setTab("cards")}
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              tab === "cards" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
            }`}>カード別成績</button>
        </div>

        {/* テスト履歴 */}
        {tab === "sessions" && (
          <div className="bg-white rounded-xl border divide-y">
            {sessions.length === 0 && (
              <p className="p-8 text-center text-gray-400">まだテストを受けていません</p>
            )}
            {sessions.map((s) => {
              const acc = s.total_questions ? Math.round((s.score / s.total_questions) * 100) : 0;
              const duration = s.finished_at && s.started_at
                ? Math.round((new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 1000)
                : null;
              return (
                <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {FRANCHISE_JA[s.franchise] ?? s.franchise} ・ {DIFFICULTY_JA[s.difficulty] ?? s.difficulty}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.finished_at).toLocaleString("ja-JP")}
                      {duration != null && ` ・ ${Math.floor(duration / 60)}分${(duration % 60).toString().padStart(2, "0")}秒`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{s.score}/{s.total_questions}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      acc >= 80 ? "bg-green-100 text-green-700"
                      : acc >= 50 ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                    }`}>{acc}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* カード別成績 */}
        {tab === "cards" && (
          <div className="bg-white rounded-xl border divide-y">
            {cardStats.length === 0 && (
              <p className="p-8 text-center text-gray-400">まだ回答データがありません</p>
            )}
            {cardStats.map((c) => (
              <div key={c.quiz_card_id}
                onClick={() => router.push(`/cards/${c.quiz_card_id}`)}
                className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                {c.image_url && (
                  <img src={c.image_url} alt="" className="w-10 h-10 object-contain rounded"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.card_name}</p>
                  <p className="text-xs text-gray-500">
                    {FRANCHISE_JA[c.franchise as Franchise] ?? c.franchise}
                    {c.grade && ` ・ ${c.grade}`} ・ {c.price.toLocaleString()}円
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">{c.correct}/{c.total}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    c.accuracy >= 80 ? "bg-green-100 text-green-700"
                    : c.accuracy >= 50 ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}>{c.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
