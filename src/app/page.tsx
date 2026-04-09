"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      sessionStorage.setItem("user", JSON.stringify(data));
      router.push(data.role === "admin" ? "/admin" : "/exam");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-sm glass rounded-[18px] p-8 animate-fade-in-up">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[17px] font-bold"
            style={{
              background: "linear-gradient(135deg, #292524 0%, #44403c 100%)",
              color: "#f59e0b",
              fontFamily: "'DM Serif Display', serif",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >P</div>
          <div>
            <div style={{ color: "#292524", fontFamily: "'DM Serif Display', serif", fontSize: 24, letterSpacing: "0.04em", lineHeight: 1.1 }}>
              PROVA
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#78716c" }}>名前</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
              style={{
                border: "1px solid #e8e3d9",
                background: "#ffffff",
                color: "#292524",
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#b45309"; e.target.style.boxShadow = "0 0 0 3px rgba(180,83,9,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e8e3d9"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#78716c" }}>パスワード</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
              style={{
                border: "1px solid #e8e3d9",
                background: "#ffffff",
                color: "#292524",
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#b45309"; e.target.style.boxShadow = "0 0 0 3px rgba(180,83,9,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e8e3d9"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: "#b91c1c" }}>{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
            style={{ background: "#b45309" }}
            onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.background = "#f59e0b"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "#b45309"; }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12.5px]" style={{ color: "#a8a29e" }}>
          はじめての方は{" "}
          <button onClick={() => router.push("/register")} className="font-semibold hover:underline" style={{ color: "#b45309" }}>
            新規登録
          </button>
        </p>
      </div>
    </main>
  );
}
