"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA } from "@/lib/types";
import type { Franchise } from "@/lib/types";

interface QuestionRow {
  id: string;
  sort_order: number;
  question_type: "choice" | "numeric";
  quiz_card: {
    card_name: string;
    grade: string | null;
    franchise: Franchise;
    price: number;
    image_url: string | null;
  };
}

interface SearchCard {
  id: string;
  franchise: Franchise;
  card_name: string;
  grade: string | null;
  price: number;
  image_url: string | null;
}

export default function EditCommonTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [test, setTest] = useState<{
    title: string;
    franchise: Franchise | null;
    is_published: boolean;
    questions: QuestionRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // カード検索
  const [searchFranchise, setSearchFranchise] = useState<Franchise | "">("Pokemon");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addType, setAddType] = useState<"choice" | "numeric">("choice");

  useEffect(() => {
    fetchTest();
  }, [id]);

  async function fetchTest() {
    const res = await fetch(`/api/admin/common-tests/${id}`);
    const data = await res.json();
    setTest(data);
    setLoading(false);
    if (data.franchise) setSearchFranchise(data.franchise);
  }

  async function searchCards() {
    setSearching(true);
    const params = new URLSearchParams();
    if (searchFranchise) params.set("franchise", searchFranchise);
    if (searchText) params.set("search", searchText);
    params.set("limit", "100");
    const res = await fetch(`/api/admin/cards?${params}`);
    setSearchResults(await res.json());
    setSearching(false);
  }

  function toggleSelect(cardId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(cardId) ? next.delete(cardId) : next.add(cardId);
      return next;
    });
  }

  async function addQuestions() {
    if (selectedIds.size === 0) return;
    await fetch(`/api/admin/common-tests/${id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz_card_ids: [...selectedIds], question_type: addType }),
    });
    setSelectedIds(new Set());
    setSearchResults([]);
    fetchTest();
  }

  async function removeQuestion(questionId: string) {
    await fetch(`/api/admin/common-tests/${id}/questions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_ids: [questionId] }),
    });
    fetchTest();
  }

  async function toggleQuestionType(questionId: string, current: string) {
    const next = current === "choice" ? "numeric" : "choice";
    await fetch(`/api/admin/common-tests/${id}/questions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ question_id: questionId, question_type: next }]),
    });
    fetchTest();
  }

  async function togglePublish() {
    if (!test) return;
    await fetch(`/api/admin/common-tests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !test.is_published }),
    });
    fetchTest();
  }

  if (loading || !test) {
    return <main className="flex-1 flex items-center justify-center bg-gray-50"><p className="text-gray-500">読み込み中...</p></main>;
  }

  // 既に追加済みのカードID
  const existingCardIds = new Set(test.questions.map((q) => q.quiz_card?.card_name));

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-sm text-gray-500">
              {test.franchise ? FRANCHISE_JA[test.franchise] : "全商材混合"} ・ {test.questions.length}問
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={togglePublish}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                test.is_published
                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}>
              {test.is_published ? "非公開にする" : "公開する"}
            </button>
            <button onClick={() => router.push("/admin/common-tests")}
              className="text-sm text-gray-600 hover:text-gray-800">一覧に戻る</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左: 登録済み問題 */}
          <div>
            <h2 className="font-bold text-gray-800 mb-2">登録済み問題 ({test.questions.length})</h2>
            <div className="bg-white rounded-xl border divide-y max-h-[600px] overflow-y-auto">
              {test.questions.length === 0 && (
                <p className="p-4 text-gray-400 text-center">問題がまだありません。右から追加してください。</p>
              )}
              {test.questions.map((q, i) => (
                <div key={q.id} className="px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                  {q.quiz_card?.image_url && (
                    <img src={q.quiz_card.image_url} alt="" className="w-10 h-10 object-contain rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{q.quiz_card?.card_name}</p>
                    <p className="text-xs text-gray-500">
                      {q.quiz_card?.grade && `${q.quiz_card.grade} ・ `}
                      {q.quiz_card?.price?.toLocaleString()}円
                    </p>
                  </div>
                  <button onClick={() => toggleQuestionType(q.id, q.question_type)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      q.question_type === "choice"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                    {q.question_type === "choice" ? "4択" : "筆記"}
                  </button>
                  <button onClick={() => removeQuestion(q.id)}
                    className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* 右: カード検索・追加 */}
          <div>
            <h2 className="font-bold text-gray-800 mb-2">カード検索</h2>
            <div className="bg-white rounded-xl border p-4 space-y-3">
              {/* 商材フィルタ */}
              <div className="flex gap-1 flex-wrap">
                {test.franchise ? (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm">{FRANCHISE_JA[test.franchise]}</span>
                ) : (
                  <>
                    <button onClick={() => setSearchFranchise("")}
                      className={`px-2 py-1 rounded text-xs ${!searchFranchise ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>全て</button>
                    {FRANCHISES.map((f) => (
                      <button key={f} onClick={() => setSearchFranchise(f)}
                        className={`px-2 py-1 rounded text-xs ${searchFranchise === f ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{FRANCHISE_JA[f]}</button>
                    ))}
                  </>
                )}
              </div>

              {/* 検索 */}
              <div className="flex gap-2">
                <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchCards()}
                  placeholder="カード名で検索"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500" />
                <button onClick={searchCards} disabled={searching}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 disabled:opacity-50">
                  {searching ? "..." : "検索"}
                </button>
              </div>

              {/* 追加形式 */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">追加形式:</span>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" checked={addType === "choice"} onChange={() => setAddType("choice")} />
                  4択
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" checked={addType === "numeric"} onChange={() => setAddType("numeric")} />
                  筆記
                </label>
                {selectedIds.size > 0 && (
                  <button onClick={addQuestions}
                    className="ml-auto px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    {selectedIds.size}件追加
                  </button>
                )}
              </div>

              {/* 検索結果 */}
              <div className="max-h-[400px] overflow-y-auto divide-y">
                {searchResults.map((c) => {
                  const alreadyAdded = existingCardIds.has(c.card_name);
                  const selected = selectedIds.has(c.id);
                  return (
                    <div key={c.id}
                      onClick={() => !alreadyAdded && toggleSelect(c.id)}
                      className={`px-2 py-2 flex items-center gap-2 cursor-pointer ${
                        alreadyAdded ? "opacity-40 cursor-not-allowed" : selected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}>
                      <input type="checkbox" checked={selected} disabled={alreadyAdded} readOnly className="pointer-events-none" />
                      {c.image_url && (
                        <img src={c.image_url} alt="" className="w-10 h-10 object-contain rounded"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.card_name}</p>
                        <p className="text-xs text-gray-500">
                          {FRANCHISE_JA[c.franchise]} {c.grade && `・ ${c.grade}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{c.price.toLocaleString()}円</span>
                    </div>
                  );
                })}
                {searchResults.length === 0 && !searching && (
                  <p className="py-4 text-center text-gray-400 text-sm">検索してカードを追加</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
