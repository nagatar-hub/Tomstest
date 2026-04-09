"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("パスワードが一致しません"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, role: "staff" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      sessionStorage.setItem("user", JSON.stringify(data));
      router.push("/exam");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">新規登録</CardTitle>
          <CardDescription>スタッフアカウントを作成</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名前</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">パスワード</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
              <p className="text-xs text-muted-foreground">4文字以上</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">パスワード（確認）</label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={4} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登録中..." : "登録してはじめる"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            アカウントをお持ちの方は{" "}
            <button onClick={() => router.push("/")} className="text-primary underline-offset-4 hover:underline">
              ログイン
            </button>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
