"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA, DIFFICULTIES, DIFFICULTY_JA } from "@/lib/types";
import type { Franchise, Difficulty } from "@/lib/types";

interface CommonTestItem {
  id: string;
  title: string;
  franchise: Franchise | null;
  common_test_question: { count: number }[];
}

interface AnnouncementItem {
  id: string;
  title: string;
  body: string | null;
  is_pinned: boolean;
  starts_at: string;
  expires_at: string | null;
}

type Mode = "normal" | "endless";

export default function ExamStartPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"random" | "common">("random");
  const [franchise, setFranchise] = useState<Franchise | "all">("Pokemon");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<Mode>("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [commonTests, setCommonTests] = useState<CommonTestItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [normalAnswered, setNormalAnswered] = useState(0);
  const hardUnlocked = normalAnswered >= 20;

  useEffect(() => {
    fetch("/api/exam/common-tests")
      .then((r) => r.json())
      .then((data) => setCommonTests(Array.isArray(data) ? data : []))
      .finally(() => setLoadingTests(false));
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => setAnnouncements(Array.isArray(data) ? data.slice(0, 5) : []));

    // ノーマル難易度の回答数を取得（むずかしい解放判定用）
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      fetch(`/api/exam/history?user_id=${user.id}`)
        .then((r) => r.json())
        .then((data) => {
          const normalSessions = (data.sessions ?? []).filter(
            (s: { difficulty: string }) => s.difficulty === "normal"
          );
          const total = normalSessions.reduce(
            (sum: number, s: { total_questions: number }) => sum + s.total_questions, 0
          );
          setNormalAnswered(total);
        });
    }
  }, []);

  async function handleRandomStart() {
    setError("");
    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user")!);
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, franchise, difficulty, mode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      sessionStorage.setItem("exam", JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty", difficulty);
      router.push("/exam/play");
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommonStart(testId: string) {
    setError("");
    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user")!);
      const res = await fetch("/api/exam/common/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, common_test_id: testId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      sessionStorage.setItem("exam", JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty", "common");
      router.push("/exam/play");
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  const activeBtn = "border-[#b45309] bg-[#fef3c7] text-[#b45309] font-semibold shadow-[0_1px_4px_rgba(180,83,9,0.1)]";
  const inactiveBtn = "border-[#e8e3d9] bg-white text-[#78716c] hover:bg-[#f3f0ea]";

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold"
              style={{ background: "linear-gradient(135deg, #292524, #44403c)", color: "#f59e0b", fontFamily: "'DM Serif Display', serif", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
              P
            </div>
            <div>
              <div style={{ color: "#292524", fontFamily: "'DM Serif Display', serif", fontSize: 18, letterSpacing: "0.04em", lineHeight: 1.1 }}>
                PROVA
              </div>
            </div>
          </div>
          <button onClick={() => router.push("/exam/history")}
            className="text-[12px] font-semibold" style={{ color: "#b45309" }}>
            成績履歴 →
          </button>
        </div>

        {/* お知らせ */}
        {announcements.length > 0 && (
          <div className="mb-5 space-y-2">
            {announcements.map((a) => (
              <div key={a.id}
                className="glass rounded-[10px] px-3.5 py-2.5"
                style={{ border: a.is_pinned ? "1px solid #fef08a" : "1px solid rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-center gap-2">
                  {a.is_pinned && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#fef3c7", color: "#b45309" }}>固定</span>}
                  <span className="text-[12.5px] font-[550]" style={{ color: "#292524" }}>{a.title}</span>
                  <span className="ml-auto font-mono text-[10px]" style={{ color: "#a8a29e" }}>
                    {new Date(a.starts_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                {a.body && <p className="text-[11.5px] mt-1" style={{ color: "#78716c" }}>{a.body}</p>}
              </div>
            ))}
          </div>
        )}

        {/* タブ */}
        <div className="glass rounded-[10px] p-1 flex gap-1 mb-5">
          {(["random", "common"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-[8px] text-[13px] font-[500] transition-all duration-150"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#292524" : "#a8a29e",
                fontWeight: tab === t ? 600 : 450,
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {t === "random" ? "通常テスト" : "共通テスト"}
              {t === "common" && commonTests.length > 0 && (
                <span className="ml-1 font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: tab === t ? "#fef3c7" : "#f3f0ea", color: tab === t ? "#b45309" : "#a8a29e" }}>
                  {commonTests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-[12.5px] mb-3" style={{ color: "#b91c1c" }}>{error}</p>}

        {/* 通常テスト */}
        {tab === "random" && (
          <div className="glass rounded-[14px] p-5 space-y-5">
            {/* モード */}
            <div>
              <label className="block text-[11px] font-semibold uppercase mb-2" style={{ color: "#a8a29e", letterSpacing: "0.06em" }}>モード</label>
              <div className="grid grid-cols-2 gap-2">
                {([["normal", "10問テスト", ""], ["endless", "エンドレス", "全問+タイマー"]] as const).map(([val, label, sub]) => (
                  <button key={val} onClick={() => setMode(val as Mode)}
                    className={`py-2.5 px-3 rounded-[9px] border-[1.5px] text-[13px] transition-all duration-150 ${mode === val ? activeBtn : inactiveBtn}`}>
                    {label}
                    {sub && <span className="block text-[10px] font-normal opacity-70 mt-0.5">{sub}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 商材 */}
            <div>
              <label className="block text-[11px] font-semibold uppercase mb-2" style={{ color: "#a8a29e", letterSpacing: "0.06em" }}>商材</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setFranchise("all")}
                  className={`py-2.5 px-3 rounded-[9px] border-[1.5px] text-[13px] transition-all duration-150 ${franchise === "all" ? activeBtn : inactiveBtn}`}>
                  全商材混合
                </button>
                {FRANCHISES.map((f) => (
                  <button key={f} onClick={() => setFranchise(f)}
                    className={`py-2.5 px-3 rounded-[9px] border-[1.5px] text-[13px] transition-all duration-150 ${franchise === f ? activeBtn : inactiveBtn}`}>
                    {FRANCHISE_JA[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* 難易度 */}
            <div>
              <label className="block text-[11px] font-semibold uppercase mb-2" style={{ color: "#a8a29e", letterSpacing: "0.06em" }}>難易度</label>
              <div className={`grid gap-2 ${hardUnlocked ? "grid-cols-3" : "grid-cols-2"}`}>
                {DIFFICULTIES.filter((d) => d !== "hard" || hardUnlocked).map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`py-2.5 px-2 rounded-[9px] border-[1.5px] text-[13px] transition-all duration-150 ${difficulty === d ? activeBtn : inactiveBtn}`}>
                    {DIFFICULTY_JA[d]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px]" style={{ color: "#a8a29e" }}>
                {difficulty === "easy" && "4択から選ぶモードです"}
                {difficulty === "normal" && "価格を直接入力します（許容範囲あり）"}
                {difficulty === "hard" && "価格を直接入力します（許容範囲が狭い）"}
              </p>
            </div>

            <button onClick={handleRandomStart} disabled={loading}
              className="w-full py-3 rounded-[9px] text-[14px] font-semibold text-white disabled:opacity-50 transition-colors duration-150"
              style={{ background: "#b45309" }}>
              {loading ? "準備中..." : mode === "endless" ? "エンドレス スタート" : "スタート"}
            </button>
          </div>
        )}

        {/* 共通テスト */}
        {tab === "common" && (
          <div className="space-y-2.5">
            {loadingTests ? (
              <p className="text-center py-8" style={{ color: "#a8a29e" }}>読み込み中...</p>
            ) : commonTests.length === 0 ? (
              <div className="glass rounded-[14px] p-8 text-center" style={{ color: "#a8a29e" }}>
                公開中の共通テストはありません
              </div>
            ) : (
              commonTests.map((t) => (
                <button key={t.id} onClick={() => handleCommonStart(t.id)} disabled={loading}
                  className="w-full glass rounded-[12px] p-4 text-left transition-all duration-200 hover:translate-y-[-2px] disabled:opacity-50"
                  style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>
                  <p className="text-[14px] font-[600]" style={{ color: "#292524" }}>{t.title}</p>
                  <p className="text-[11.5px] mt-1" style={{ color: "#a8a29e" }}>
                    {t.franchise ? FRANCHISE_JA[t.franchise] : "全商材混合"} ・
                    <span className="font-mono">{t.common_test_question?.[0]?.count ?? 0}</span>問
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        <button onClick={() => { sessionStorage.clear(); router.push("/"); }}
          className="w-full mt-5 py-2 text-[12px] transition-colors duration-150"
          style={{ color: "#a8a29e" }}>
          ログアウト
        </button>
      </div>
    </main>
  );
}
