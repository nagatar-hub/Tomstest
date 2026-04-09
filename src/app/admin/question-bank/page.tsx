"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA } from "@/lib/types";
import type { Franchise } from "@/lib/types";

interface QuestionItem {
  id: string;
  franchise: Franchise;
  question_type: string;
  question_text: string | null;
  custom_answer: string | null;
  quiz_card: { card_name: string; grade: string | null; price: number; image_url: string | null } | null;
  custom_card: { card_name: string; price: number | null; image_url: string | null } | null;
  created_at: string;
}

export default function QuestionBankPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Franchise>("Pokemon");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 削除ダイアログ
  const [deleteTarget, setDeleteTarget] = useState<QuestionItem | null>(null);
  const [purge, setPurge] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");

  useEffect(() => { fetchQuestions(); }, [tab]);

  async function fetchQuestions() {
    setLoading(true);
    const res = await fetch(`/api/admin/question-bank?franchise=${tab}`);
    setQuestions(await res.json());
    setLoading(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const user = JSON.parse(sessionStorage.getItem("user")!);
    const params = new URLSearchParams();
    if (purge) params.set("purge", "true");
    if (announceTitle.trim()) {
      params.set("announce_title", announceTitle);
      params.set("announce_body", announceBody);
      params.set("created_by", user.id);
    }

    await fetch(`/api/admin/question-bank/${deleteTarget.id}?${params}`, { method: "DELETE" });
    setDeleteTarget(null);
    setPurge(false);
    setAnnounceTitle("");
    setAnnounceBody("");
    fetchQuestions();
  }

  function getCardInfo(q: QuestionItem) {
    const card = q.quiz_card ?? q.custom_card;
    return {
      name: card?.card_name ?? "不明",
      price: card?.price,
      image: card?.image_url,
    };
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">問題DB</h1>
          <div className="flex gap-2">
            <button onClick={() => router.push("/admin/question-bank/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">新規作成</button>
            <button onClick={() => router.push("/admin")}
              className="text-sm text-gray-600 hover:text-gray-800">戻る</button>
          </div>
        </div>

        {/* 商材タブ */}
        <div className="flex gap-1 bg-gray-200 rounded-lg p-1 mb-4">
          {FRANCHISES.map((f) => (
            <button key={f} onClick={() => setTab(f)}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${
                tab === f ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
              }`}>{FRANCHISE_JA[f]}</button>
          ))}
        </div>

        {/* 一覧 */}
        <div className="bg-white rounded-xl border divide-y">
          {loading ? (
            <p className="p-4 text-center text-gray-400">読み込み中...</p>
          ) : questions.length === 0 ? (
            <p className="p-8 text-center text-gray-400">問題がまだありません</p>
          ) : (
            questions.map((q) => {
              const info = getCardInfo(q);
              return (
                <div key={q.id} className="px-4 py-3 flex items-center gap-3">
                  {info.image ? (
                    <img src={info.image} alt="" className="w-10 h-10 object-contain rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{info.name}</p>
                    <p className="text-xs text-gray-500">
                      {q.question_text ?? "この商品の買取価格は？"} ・
                      <span className={q.question_type === "choice" ? "text-blue-600" : q.question_type === "numeric" ? "text-purple-600" : "text-green-600"}>
                        {q.question_type === "choice" ? "4択" : q.question_type === "numeric" ? "筆記" : "記述"}
                      </span>
                      {info.price != null && ` ・ ${info.price.toLocaleString()}円`}
                    </p>
                  </div>
                  <button onClick={() => router.push(`/admin/question-bank/${q.id}`)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">編集</button>
                  <button onClick={() => { setDeleteTarget(q); setPurge(false); setAnnounceTitle(""); setAnnounceBody(""); }}
                    className="px-3 py-1.5 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200">削除</button>
                </div>
              );
            })
          )}
        </div>

        {/* 削除ダイアログ */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
              <h2 className="text-lg font-bold text-gray-900">問題を削除</h2>
              <p className="text-sm text-gray-600">
                「{getCardInfo(deleteTarget).name}」の問題を削除します。
              </p>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={purge} onChange={(e) => setPurge(e.target.checked)} />
                <span className="text-red-600">スタッフの回答履歴も削除する</span>
              </label>
              {!purge && (
                <p className="text-xs text-gray-400">チェックしない場合、問題は非表示になりますが履歴は残ります。</p>
              )}

              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">お知らせを投稿（任意）</p>
                <input type="text" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder="例: 問題の修正について"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 mb-2" />
                <textarea value={announceBody} onChange={(e) => setAnnounceBody(e.target.value)}
                  placeholder="詳細（任意）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 h-20" />
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">キャンセル</button>
                <button onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                  削除{purge ? "（履歴含む）" : ""}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
