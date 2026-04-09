"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISE_JA, DIFFICULTY_JA } from "@/lib/types";
import type { Franchise, Difficulty } from "@/lib/types";

const C = {
  glass: "rgba(255,255,255,0.55)", glassBorder: "rgba(255,255,255,0.75)",
  text: "#292524", textMid: "#78716c", textLight: "#a8a29e",
  accent: "#b45309", accentLight: "#fef3c7", border: "#e8e3d9",
  green: "#15803d", red: "#b91c1c",
};

interface User { id: string; name: string; role: string; avatar_url?: string | null }
interface SessionRow {
  id: string; difficulty: Difficulty; franchise: Franchise;
  total_questions: number; score: number; started_at: string; finished_at: string;
  common_test_id: string | null;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // パスワード変更
  const [showPwForm, setShowPwForm] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) { router.push("/"); return; }
    const u = JSON.parse(userStr);
    setUser(u);

    fetch(`/api/exam/history?user_id=${u.id}`)
      .then(r => r.json())
      .then(data => {
        // 共通テストのセッションのみ
        const commonSessions = (data.sessions ?? []).filter(
          (s: { common_test_id: string | null }) => s.common_test_id
        );
        setSessions(commonSessions);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    if (newPw.length < 4) { setPwMsg("4文字以上にしてください"); return; }
    if (newPw !== confirmPw) { setPwMsg("パスワードが一致しません"); return; }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user!.id, new_password: newPw }),
    });
    if (res.ok) {
      setPwMsg("パスワードを変更しました");
      setNewPw(""); setConfirmPw(""); setShowPwForm(false);
    } else {
      const err = await res.json();
      setPwMsg(err.error ?? "変更に失敗しました");
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #f8f6f1, #f0ebe0, #f5f0e8)" }}>
      <p style={{ color: C.textLight }}>読み込み中...</p>
    </div>;
  }

  const totalTests = sessions.length;
  const avgAccuracy = totalTests > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.total_questions ? (s.score / s.total_questions) * 100 : 0), 0) / totalTests)
    : 0;

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .su { animation: slideUp 0.4s cubic-bezier(0.4,0,0.2,1) both; }
        .su1 { animation-delay: 0.04s; } .su2 { animation-delay: 0.08s; } .su3 { animation-delay: 0.12s; }
      `}</style>

      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f8f6f1 0%, #f0ebe0 40%, #f5f0e8 100%)", color: C.text }}>
        {/* Header */}
        <header className="su sticky top-0 z-20 flex items-center justify-between" style={{
          padding: "12px 28px", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.glassBorder}`,
        }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-bold" style={{
              background: `linear-gradient(135deg, ${C.text}, #44403c)`, color: "#f59e0b", fontSize: 15, fontFamily: "'DM Serif Display', serif", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>P</div>
            <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "'DM Serif Display', serif", letterSpacing: "0.04em" }}>PROVA</span>
          </div>
          <button onClick={() => router.push("/exam")} style={{
            padding: "6px 14px", borderRadius: 8, background: C.accentLight, border: "1px solid #fde68a", color: C.accent, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>← テストに戻る</button>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Profile card */}
          <div className="su su1 rounded-[18px] p-8 mb-6" style={{
            background: C.glass, backdropFilter: "blur(16px)", border: `1.5px solid ${C.glassBorder}`,
            boxShadow: "0 2px 12px rgba(180,83,9,0.06)",
          }}>
            <div className="flex items-center gap-5 mb-6">
              {/* Avatar */}
              <div className="relative group">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name}
                    className="w-20 h-20 rounded-2xl object-cover"
                    style={{ boxShadow: `0 4px 16px ${C.accent}30` }} />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold" style={{
                    background: `linear-gradient(135deg, ${C.accent}, #f59e0b)`, color: "#fff",
                    boxShadow: `0 4px 16px ${C.accent}30`, fontFamily: "'DM Serif Display', serif",
                  }}>
                    {user.name[0].toUpperCase()}
                  </div>
                )}
                <label className="absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{
                  background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 11, fontWeight: 600,
                }}>
                  <span>変更</span>
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const form = new FormData();
                    form.set("user_id", user.id);
                    form.set("image", file);
                    const res = await fetch("/api/auth/avatar", { method: "POST", body: form });
                    if (res.ok) {
                      const data = await res.json();
                      const updated = { ...user, avatar_url: data.avatar_url };
                      setUser(updated);
                      sessionStorage.setItem("user", JSON.stringify(updated));
                    }
                  }} />
                </label>
              </div>
              <div>
                <h1 className="text-xl font-bold">{user.name}</h1>
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded" style={{
                  background: user.role === "admin" ? C.accentLight : "#f0fdf4",
                  color: user.role === "admin" ? C.accent : C.green,
                  letterSpacing: "0.08em",
                }}>{user.role}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.5)" }}>
                <p className="text-[10px] font-semibold uppercase" style={{ color: C.textLight, letterSpacing: "0.06em" }}>共通テスト</p>
                <p className="font-mono text-2xl font-bold mt-1">{totalTests}</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.5)" }}>
                <p className="text-[10px] font-semibold uppercase" style={{ color: C.textLight, letterSpacing: "0.06em" }}>平均正答率</p>
                <p className="font-mono text-2xl font-bold mt-1" style={{ color: avgAccuracy >= 80 ? C.green : avgAccuracy >= 50 ? C.accent : C.red }}>{avgAccuracy}%</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.5)" }}>
                <p className="text-[10px] font-semibold uppercase" style={{ color: C.textLight, letterSpacing: "0.06em" }}>ランク</p>
                <p className="text-2xl font-bold mt-1" style={{ color: C.textLight }}>—</p>
                <p className="text-[9px]" style={{ color: C.textLight }}>Coming Soon</p>
              </div>
            </div>

            {/* Password */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              {!showPwForm ? (
                <button onClick={() => setShowPwForm(true)} style={{
                  background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>パスワードを変更</button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <p className="text-sm font-semibold" style={{ color: C.textMid }}>パスワード変更</p>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="新しいパスワード" required minLength={4}
                    className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text }} />
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="確認" required minLength={4}
                    className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text }} />
                  {pwMsg && <p className="text-xs" style={{ color: pwMsg.includes("変更しました") ? C.green : C.red }}>{pwMsg}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: C.accent }}>変更</button>
                    <button type="button" onClick={() => { setShowPwForm(false); setPwMsg(""); }} className="px-4 py-2 rounded-lg text-sm" style={{ color: C.textLight }}>キャンセル</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Common test history */}
          <div className="su su2">
            <div className="mb-3" style={{ fontSize: 11, fontWeight: 600, color: C.textLight, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              共通テスト成績
            </div>
            <div className="rounded-[14px] overflow-hidden" style={{
              background: C.glass, backdropFilter: "blur(16px)", border: `1.5px solid ${C.glassBorder}`,
            }}>
              {sessions.length === 0 ? (
                <p className="p-8 text-center" style={{ color: C.textLight }}>まだ共通テストを受けていません</p>
              ) : (
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["商材", "難易度", "スコア", "正答率", "受験日"].map(h => (
                        <th key={h} className="text-left" style={{
                          padding: "11px 18px", fontSize: 10.5, fontWeight: 600, color: C.textLight,
                          letterSpacing: "0.08em", textTransform: "uppercase" as const,
                          background: "rgba(243,240,234,0.5)", borderBottom: `1px solid ${C.border}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => {
                      const acc = s.total_questions ? Math.round((s.score / s.total_questions) * 100) : 0;
                      return (
                        <tr key={s.id} className="transition-[background] duration-150 hover:bg-[rgba(180,83,9,0.05)]" style={{ borderBottom: `1px solid ${C.border}20` }}>
                          <td style={{ padding: "13px 18px", fontSize: 13.5, color: C.textMid }}>{FRANCHISE_JA[s.franchise] ?? s.franchise}</td>
                          <td style={{ padding: "13px 18px", fontSize: 13.5 }}>{DIFFICULTY_JA[s.difficulty] ?? s.difficulty}</td>
                          <td className="font-mono font-semibold" style={{ padding: "13px 18px", fontSize: 13.5 }}>{s.score}/{s.total_questions}</td>
                          <td style={{ padding: "13px 18px" }}>
                            <span className="font-mono text-[13px] font-semibold" style={{ color: acc >= 80 ? C.green : acc >= 50 ? C.accent : C.red }}>{acc}%</span>
                          </td>
                          <td className="font-mono" style={{ padding: "13px 18px", fontSize: 12.5, color: C.textLight }}>
                            {new Date(s.finished_at).toLocaleDateString("ja-JP")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
