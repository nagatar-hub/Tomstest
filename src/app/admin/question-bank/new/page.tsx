"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA } from "@/lib/types";
import type { Franchise } from "@/lib/types";

type Source = "quiz_card" | "custom_card";

interface SearchCard {
  id: string;
  card_name: string;
  grade: string | null;
  price: number;
  image_url: string | null;
}

interface CustomCardItem {
  id: string;
  card_name: string;
  price: number | null;
  image_url: string | null;
}

export default function NewQuestionPage() {
  const router = useRouter();
  const [franchise, setFranchise] = useState<Franchise>("Pokemon");
  const [source, setSource] = useState<Source>("quiz_card");
  const [questionType, setQuestionType] = useState<"choice" | "numeric" | "text">("choice");
  const [questionText, setQuestionText] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [customChoices, setCustomChoices] = useState(["", "", "", ""]);

  // カード選択
  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedCardName, setSelectedCardName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchCard[]>([]);
  const [customCards, setCustomCards] = useState<CustomCardItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (source === "custom_card") {
      fetch(`/api/admin/custom-cards?franchise=${franchise}`)
        .then((r) => r.json())
        .then(setCustomCards);
    }
  }, [source, franchise]);

  async function searchCards() {
    const params = new URLSearchParams({ franchise, limit: "50" });
    if (searchText) params.set("search", searchText);
    const res = await fetch(`/api/admin/cards?${params}`);
    setSearchResults(await res.json());
  }

  async function handleSave() {
    if (!selectedCardId) { setError("対象カードを選択してください"); return; }
    setError("");
    setSaving(true);

    const user = JSON.parse(sessionStorage.getItem("user")!);
    const body: Record<string, unknown> = {
      franchise,
      question_type: questionType,
      question_text: questionText.trim() || null,
      created_by: user.id,
    };

    if (source === "quiz_card") {
      body.quiz_card_id = selectedCardId;
    } else {
      body.custom_card_id = selectedCardId;
    }

    if (questionType === "text") {
      body.custom_answer = customAnswer || null;
    }
    if (questionType === "text" || (questionType === "choice" && customChoices.some((c) => c.trim()))) {
      const filtered = customChoices.filter((c) => c.trim());
      if (filtered.length > 0) body.custom_choices = filtered;
    }

    const res = await fetch("/api/admin/question-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin/question-bank");
    } else {
      const err = await res.json();
      setError(err.error ?? "保存に失敗しました");
    }
    setSaving(false);
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">問題作成</h1>
          <button onClick={() => router.push("/admin/question-bank")}
            className="text-sm text-gray-600 hover:text-gray-800">戻る</button>
        </div>

        <div className="space-y-6">
          {/* 商材 */}
          <div className="bg-white rounded-xl border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">商材</label>
            <div className="flex gap-2">
              {FRANCHISES.map((f) => (
                <button key={f} onClick={() => { setFranchise(f); setSelectedCardId(""); setSelectedCardName(""); }}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium ${
                    franchise === f ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700"
                  }`}>{FRANCHISE_JA[f]}</button>
              ))}
            </div>
          </div>

          {/* 対象カード選択 */}
          <div className="bg-white rounded-xl border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">対象カード</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => { setSource("quiz_card"); setSelectedCardId(""); setSelectedCardName(""); }}
                className={`px-3 py-1.5 rounded text-sm ${source === "quiz_card" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                リストから選択
              </button>
              <button onClick={() => { setSource("custom_card"); setSelectedCardId(""); setSelectedCardName(""); }}
                className={`px-3 py-1.5 rounded text-sm ${source === "custom_card" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                個別登録カード
              </button>
            </div>

            {selectedCardName && (
              <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">{selectedCardName}</span>
                <button onClick={() => { setSelectedCardId(""); setSelectedCardName(""); }}
                  className="text-blue-400 hover:text-blue-600 text-sm">変更</button>
              </div>
            )}

            {!selectedCardId && source === "quiz_card" && (
              <>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchCards()}
                    placeholder="カード名で検索"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
                  <button onClick={searchCards} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm">検索</button>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y">
                  {searchResults.map((c) => (
                    <button key={c.id} onClick={() => { setSelectedCardId(c.id); setSelectedCardName(`${c.card_name} (${c.price.toLocaleString()}円)`); }}
                      className="w-full px-2 py-2 flex items-center gap-2 text-left hover:bg-gray-50">
                      {c.image_url && <img src={c.image_url} alt="" className="w-8 h-8 object-contain rounded" />}
                      <span className="text-sm text-gray-900 truncate">{c.card_name}</span>
                      <span className="ml-auto text-sm text-gray-500">{c.price.toLocaleString()}円</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {!selectedCardId && source === "custom_card" && (
              <div className="max-h-48 overflow-y-auto divide-y">
                {customCards.length === 0 && (
                  <p className="p-4 text-center text-gray-400 text-sm">
                    個別登録カードがありません。
                    <button onClick={() => router.push("/admin/custom-cards")} className="text-blue-600 hover:underline ml-1">登録する</button>
                  </p>
                )}
                {customCards.map((c) => (
                  <button key={c.id} onClick={() => { setSelectedCardId(c.id); setSelectedCardName(c.card_name); }}
                    className="w-full px-2 py-2 flex items-center gap-2 text-left hover:bg-gray-50">
                    {c.image_url && <img src={c.image_url} alt="" className="w-8 h-8 object-contain rounded" />}
                    <span className="text-sm text-gray-900 truncate">{c.card_name}</span>
                    {c.price != null && <span className="ml-auto text-sm text-gray-500">{c.price.toLocaleString()}円</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 問題設定 */}
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">問題形式</label>
              <div className="flex gap-2">
                {([["choice", "4択"], ["numeric", "筆記（数値）"], ["text", "記述"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setQuestionType(val)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium ${
                      questionType === val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700"
                    }`}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">問題文（任意）</label>
              <input type="text" value={questionText} onChange={(e) => setQuestionText(e.target.value)}
                placeholder="空欄なら「この商品の買取価格は？」"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
            </div>

            {questionType === "text" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">正解</label>
                <input type="text" value={customAnswer} onChange={(e) => setCustomAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
              </div>
            )}

            {questionType === "choice" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カスタム選択肢（任意、空なら自動生成）</label>
                {customChoices.map((c, i) => (
                  <input key={i} type="text" value={c}
                    onChange={(e) => {
                      const next = [...customChoices];
                      next[i] = e.target.value;
                      setCustomChoices(next);
                    }}
                    placeholder={`選択肢${i + 1}`}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 mb-1" />
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "保存中..." : "問題を保存"}
          </button>
        </div>
      </div>
    </main>
  );
}
