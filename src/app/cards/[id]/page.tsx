"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISE_JA } from "@/lib/types";
import type { Franchise } from "@/lib/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface CardDetail {
  card: {
    id: string;
    card_name: string;
    grade: string | null;
    franchise: Franchise;
    price: number;
    image_url: string | null;
    synced_at: string;
  };
  price_history: { price: number; recorded_at: string }[];
  answers: {
    correct_price: number;
    answered_value: number | null;
    is_correct: boolean;
    user_name: string;
    finished_at: string;
  }[];
  stats: { total: number; correct: number; accuracy: number };
}

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cards/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !data) {
    return <main className="flex-1 flex items-center justify-center bg-gray-50"><p className="text-gray-500">読み込み中...</p></main>;
  }

  const { card, price_history, answers, stats } = data;

  // グラフ用データ（現在価格も追加）
  const chartData = [
    ...price_history.map((h) => ({
      date: new Date(h.recorded_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" }),
      price: h.price,
    })),
    {
      date: "現在",
      price: card.price,
    },
  ];

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-600 hover:text-gray-800 mb-4">
          ← 戻る
        </button>

        {/* カード情報 */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex gap-6">
            {card.image_url && (
              <img src={card.image_url} alt={card.card_name}
                className="w-32 h-32 object-contain rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{card.card_name}</h1>
              <p className="text-gray-500">{FRANCHISE_JA[card.franchise]} {card.grade && `・ ${card.grade}`}</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{card.price.toLocaleString()}円</p>
              <p className="text-xs text-gray-400 mt-1">
                最終更新: {new Date(card.synced_at).toLocaleString("ja-JP")}
              </p>
            </div>
          </div>

          {/* 正答率 */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">出題回数</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">正解数</p>
              <p className="text-xl font-bold text-green-600">{stats.correct}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">正答率</p>
              <p className={`text-xl font-bold ${
                stats.accuracy >= 80 ? "text-green-600" : stats.accuracy >= 50 ? "text-yellow-600" : "text-red-600"
              }`}>{stats.accuracy}%</p>
            </div>
          </div>
        </div>

        {/* 価格推移グラフ */}
        {chartData.length > 1 && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">価格推移</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}円`, "価格"]} />
                <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 回答履歴 */}
        <div className="bg-white rounded-xl border">
          <h2 className="px-4 py-3 font-bold text-gray-800 border-b">回答履歴</h2>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {answers.length === 0 && (
              <p className="p-4 text-center text-gray-400">まだ回答がありません</p>
            )}
            {answers.map((a, i) => (
              <div key={i} className={`px-4 py-2 flex items-center justify-between ${a.is_correct ? "" : "bg-red-50"}`}>
                <div>
                  <p className="text-sm text-gray-900">{a.user_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(a.finished_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">
                    {a.answered_value != null ? `${a.answered_value.toLocaleString()}円` : "-"}
                    <span className="text-gray-400"> / {a.correct_price.toLocaleString()}円</span>
                  </p>
                  <span className={`text-sm font-bold ${a.is_correct ? "text-green-500" : "text-red-500"}`}>
                    {a.is_correct ? "○" : "×"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
