"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyRegisterLink() {
    const url = `${window.location.origin}/register`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessage(`「${data.name}」を登録しました（${data.role}）`);
      setName("");
      setPassword("");
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">ユーザー登録</h1>
          <button
            onClick={() => router.push("/admin")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            戻る
          </button>
        </div>

        <div className="bg-white rounded-xl border p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">スタッフ登録リンク</p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm text-gray-800 truncate">
              {typeof window !== "undefined" ? `${window.location.origin}/register` : "/register"}
            </code>
            <button
              onClick={copyRegisterLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap"
            >
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">このリンクをスタッフに共有してください。自分で名前とパスワードを登録できます。</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
              minLength={4}
            />
            <p className="text-xs text-gray-400 mt-1">4文字以上</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">権限</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={role === "staff"}
                  onChange={() => setRole("staff")}
                />
                <span className="text-sm">スタッフ</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={role === "admin"}
                  onChange={() => setRole("admin")}
                />
                <span className="text-sm">管理者</span>
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録"}
          </button>
        </form>
      </div>
    </main>
  );
}
