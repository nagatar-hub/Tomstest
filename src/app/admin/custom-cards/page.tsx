"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA } from "@/lib/types";
import type { Franchise } from "@/lib/types";

interface CustomCard {
  id: string;
  franchise: Franchise;
  card_name: string;
  image_url: string | null;
  price: number | null;
  created_at: string;
}

export default function CustomCardsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Franchise>("Pokemon");
  const [cards, setCards] = useState<CustomCard[]>([]);
  const [loading, setLoading] = useState(true);

  // 新規登録フォーム
  const [cardName, setCardName] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchCards(); }, [tab]);

  async function fetchCards() {
    setLoading(true);
    const res = await fetch(`/api/admin/custom-cards?franchise=${tab}`);
    setCards(await res.json());
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!cardName.trim()) return;
    setSaving(true);
    setMessage("");

    const user = JSON.parse(sessionStorage.getItem("user")!);
    const form = new FormData();
    form.set("card_name", cardName);
    form.set("franchise", tab);
    form.set("created_by", user.id);
    if (price) form.set("price", price);
    if (imageFile) form.set("image", imageFile);

    const res = await fetch("/api/admin/custom-cards", { method: "POST", body: form });
    if (res.ok) {
      setMessage(`「${cardName}」を登録しました`);
      setCardName("");
      setPrice("");
      setImageFile(null);
      fetchCards();
    } else {
      const err = await res.json();
      setMessage(err.error ?? "登録に失敗しました");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await fetch(`/api/admin/custom-cards/${id}`, { method: "DELETE" });
    fetchCards();
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">個別登録カード</h1>
          <button onClick={() => router.push("/admin")} className="text-sm text-gray-600 hover:text-gray-800">戻る</button>
        </div>

        {/* 商材タブ */}
        <div className="flex gap-1 bg-gray-200 rounded-lg p-1 mb-6">
          {FRANCHISES.map((f) => (
            <button key={f} onClick={() => setTab(f)}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${
                tab === f ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
              }`}>{FRANCHISE_JA[f]}</button>
          ))}
        </div>

        {/* 新規登録 */}
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-6 space-y-3">
          <h2 className="font-bold text-gray-800">新規登録</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">カード名 *</label>
              <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">価格（円）</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" min="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">画像</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-700" />
          </div>
          {message && <p className="text-sm text-green-600">{message}</p>}
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? "登録中..." : "登録"}
          </button>
        </form>

        {/* 一覧 */}
        <div className="bg-white rounded-xl border divide-y">
          {loading ? (
            <p className="p-4 text-center text-gray-400">読み込み中...</p>
          ) : cards.length === 0 ? (
            <p className="p-4 text-center text-gray-400">まだ登録がありません</p>
          ) : (
            cards.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="w-12 h-12 object-contain rounded" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No img</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{c.card_name}</p>
                  <p className="text-xs text-gray-500">
                    {c.price != null ? `${c.price.toLocaleString()}円` : "価格未設定"}
                    {" ・ "}
                    {new Date(c.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <button onClick={() => handleDelete(c.id, c.card_name)}
                  className="text-red-400 hover:text-red-600 text-sm">削除</button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
