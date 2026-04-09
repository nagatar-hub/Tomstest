"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ExamResult } from "@/lib/types";

export default function ExamResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    const str = sessionStorage.getItem("exam_result");
    if (!str) {
      router.push("/exam");
      return;
    }
    setResult(JSON.parse(str));
  }, [router]);

  if (!result) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  const accuracy = Math.round((result.score / result.total) * 100);
  const grade =
    accuracy >= 90
      ? { label: "S", color: "text-yellow-500" }
      : accuracy >= 70
        ? { label: "A", color: "text-green-500" }
        : accuracy >= 50
          ? { label: "B", color: "text-blue-500" }
          : { label: "C", color: "text-red-500" };

  return (
    <main className="flex-1 flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        {/* スコア表示 */}
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center mb-6">
          <p className="text-gray-500 mb-2">結果</p>
          <p className={`text-6xl font-black mb-2 ${grade.color}`}>
            {grade.label}
          </p>
          <p className="text-3xl font-bold mb-1">
            {result.score} / {result.total}
          </p>
          <p className="text-gray-500">正答率 {accuracy}%</p>
          {(result as unknown as Record<string, unknown>).elapsed != null && (() => {
            const el = (result as unknown as Record<string, unknown>).elapsed as number;
            return (
              <p className="text-gray-400 text-sm mt-2">
                所要時間: {Math.floor(el / 60)}分{(el % 60).toString().padStart(2, "0")}秒
              </p>
            );
          })()}
        </div>

        {/* 回答詳細 */}
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          <h2 className="px-4 py-3 font-bold text-gray-700">回答一覧</h2>
          {result.answers.map((a, i) => (
            <div
              key={i}
              className={`px-4 py-3 flex items-center justify-between ${
                a.is_correct ? "" : "bg-red-50"
              }`}
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{a.card_name}</p>
                <p className="text-xs text-gray-500">
                  正解: {a.correct_price.toLocaleString()}円
                  {a.answered_value != null && (
                    <> / あなた: {a.answered_value.toLocaleString()}円</>
                  )}
                </p>
              </div>
              <span
                className={`text-lg font-bold ${
                  a.is_correct ? "text-green-500" : "text-red-500"
                }`}
              >
                {a.is_correct ? "○" : "×"}
              </span>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => {
              sessionStorage.removeItem("exam");
              sessionStorage.removeItem("exam_result");
              sessionStorage.removeItem("exam_difficulty");
              router.push("/exam");
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            もう一度テスト
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
