"use client";

import { useState, useEffect } from "react";

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  is_pinned: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  quiz_user: { name: string };
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState("");
  const [noExpiry, setNoExpiry] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch("/api/announcements?all=true");
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
      body: JSON.stringify({
        title,
        body: body || null,
        created_by: user.id,
        is_pinned: pinned,
        starts_at: new Date(startsAt).toISOString(),
        expires_at: noExpiry ? null : expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    });
    setTitle(""); setBody(""); setPinned(false);
    setStartsAt(new Date().toISOString().slice(0, 10));
    setExpiresAt(""); setNoExpiry(true);
    setSaving(false);
    fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("このお知らせを削除しますか？")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    fetchItems();
  }

  function isExpired(a: Announcement) {
    return a.expires_at && new Date(a.expires_at) < new Date();
  }

  return (
    <div>
      <h2 className="text-[19px] font-bold mb-6" style={{ letterSpacing: "-0.02em" }}>お知らせ管理</h2>

      {/* 投稿フォーム */}
      <form onSubmit={handlePost} className="glass rounded-[14px] p-5 mb-6 space-y-3">
        <p className="text-[11px] font-semibold uppercase" style={{ color: "#a8a29e", letterSpacing: "0.08em" }}>新規投稿</p>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="お知らせタイトル" required
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={{ border: "1px solid #e8e3d9", background: "#fff", color: "#292524" }} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="本文（任意）" rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
          style={{ border: "1px solid #e8e3d9", background: "#fff", color: "#292524" }} />

        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#78716c" }}>開始日</label>
            <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ border: "1px solid #e8e3d9", background: "#fff", color: "#292524" }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#78716c" }}>終了日</label>
            <div className="flex items-center gap-2">
              <input type="date" value={expiresAt} onChange={(e) => { setExpiresAt(e.target.value); setNoExpiry(false); }}
                disabled={noExpiry}
                className="px-3 py-2 rounded-lg text-sm disabled:opacity-40"
                style={{ border: "1px solid #e8e3d9", background: "#fff", color: "#292524" }} />
              <label className="flex items-center gap-1.5 text-xs whitespace-nowrap" style={{ color: "#78716c" }}>
                <input type="checkbox" checked={noExpiry} onChange={(e) => setNoExpiry(e.target.checked)} />
                無期限
              </label>
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "#78716c" }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            ピン留め
          </label>
          <button type="submit" disabled={saving}
            className="ml-auto px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors duration-150"
            style={{ background: "#b45309" }}>
            {saving ? "投稿中..." : "投稿"}
          </button>
        </div>
      </form>

      {/* 一覧 */}
      <div className="glass rounded-[14px] overflow-hidden">
        <div className="px-[18px] py-[11px]" style={{ background: "rgba(243,240,234,0.5)", borderBottom: "1px solid #e8e3d9" }}>
          <span className="text-[10.5px] font-semibold uppercase" style={{ color: "#a8a29e", letterSpacing: "0.08em" }}>
            お知らせ一覧
          </span>
        </div>
        {loading ? (
          <p className="p-6 text-center" style={{ color: "#a8a29e" }}>読み込み中...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center" style={{ color: "#a8a29e" }}>お知らせはありません</p>
        ) : (
          <div>
            {items.map((a) => {
              const expired = isExpired(a);
              return (
                <div key={a.id}
                  className="px-[18px] py-[14px] flex items-start gap-3 transition-[background] duration-150 hover:bg-[rgba(180,83,9,0.03)]"
                  style={{ borderBottom: "1px solid var(--color-border-light)", opacity: expired ? 0.5 : 1 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {a.is_pinned && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fef08a" }}>
                          固定
                        </span>
                      )}
                      {expired && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "#f3f0ea", color: "#a8a29e" }}>
                          期限切れ
                        </span>
                      )}
                      <span className="font-[550] text-[13.5px]" style={{ color: "#292524" }}>{a.title}</span>
                    </div>
                    {a.body && <p className="text-[12.5px] whitespace-pre-wrap" style={{ color: "#78716c" }}>{a.body}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-mono text-[11px]" style={{ color: "#a8a29e" }}>
                        {new Date(a.starts_at).toLocaleDateString("ja-JP")}
                        {a.expires_at ? ` 〜 ${new Date(a.expires_at).toLocaleDateString("ja-JP")}` : " 〜 無期限"}
                      </span>
                      <span className="text-[11px]" style={{ color: "#a8a29e" }}>by {a.quiz_user?.name}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)}
                    className="shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors duration-150"
                    style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                    削除
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
