"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  is_pinned: boolean;
  created_at: string;
  quiz_user: { name: string };
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch("/api/announcements");
    setItems(await res.json());
    setLoading(false);
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const user = JSON.parse(sessionStorage.getItem("user")!);
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body: body || null, created_by: user.id, is_pinned: pinned }),
    });
    setTitle("");
    setBody("");
    setPinned(false);
    setSaving(false);
    fetchItems();
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">お知らせ管理</h1>
          <button onClick={() => router.push("/admin")} className="text-sm text-gray-600 hover:text-gray-800">戻る</button>
        </div>

        {/* 投稿フォーム */}
        <form onSubmit={handlePost} className="bg-white rounded-xl border p-4 mb-6 space-y-3">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="お知らせタイトル"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" required />
          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="本文（任意）"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 h-20" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              ピン留め
            </label>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? "投稿中..." : "投稿"}
            </button>
          </div>
        </form>

        {/* 一覧 */}
        <div className="bg-white rounded-xl border divide-y">
          {loading ? (
            <p className="p-4 text-center text-gray-400">読み込み中...</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-center text-gray-400">お知らせはありません</p>
          ) : (
            items.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  {a.is_pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">固定</span>}
                  <span className="font-bold text-gray-900">{a.title}</span>
                </div>
                {a.body && <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.body}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {a.quiz_user?.name} ・ {new Date(a.created_at).toLocaleString("ja-JP")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
