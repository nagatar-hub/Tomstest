"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISE_JA } from "@/lib/types";
import type { Franchise, Difficulty } from "@/lib/types";

/* ── Constants ── */
const C = {
  glass: "rgba(255,255,255,0.55)", glassBorder: "rgba(255,255,255,0.75)",
  border: "#e8e3d9", borderLight: "#f0ece4",
  text: "#292524", textMid: "#78716c", textLight: "#a8a29e",
  accent: "#b45309", accentLight: "#fef3c7", accentMid: "#f59e0b", accentHot: "#ea580c",
  green: "#15803d", greenBg: "#f0fdf4", red: "#b91c1c", redBg: "#fef2f2", surface: "#ffffff",
};

const MATERIALS: { id: Franchise | "all"; label: string; icon: string; desc: string; gradient: string; holoGradient: string; accent: string }[] = [
  { id: "all", label: "全商材混合", icon: "🃏", desc: "ランダム出題",
    gradient: "linear-gradient(135deg, #78716c 0%, #a8a29e 50%, #78716c 100%)",
    holoGradient: "linear-gradient(135deg, #d4d0c8, #a8a29e, #e8e3d9, #78716c, #d4d0c8)", accent: "#78716c" },
  { id: "Pokemon", label: "ポケモン", icon: "⚡", desc: "ポケモンカード",
    gradient: "linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #ea580c 100%)",
    holoGradient: "linear-gradient(135deg, #fef08a, #f59e0b, #fbbf24, #ea580c, #fef08a)", accent: "#ea580c" },
  { id: "ONE PIECE", label: "ワンピース", icon: "🏴‍☠️", desc: "ワンピースカード",
    gradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)",
    holoGradient: "linear-gradient(135deg, #fca5a5, #dc2626, #f87171, #991b1b, #fca5a5)", accent: "#dc2626" },
  { id: "YU-GI-OH!", label: "遊戯王", icon: "🔮", desc: "遊戯王カード",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)",
    holoGradient: "linear-gradient(135deg, #c4b5fd, #7c3aed, #a78bfa, #4c1d95, #c4b5fd)", accent: "#7c3aed" },
];

const DIFF_DATA = [
  { id: "easy" as Difficulty, label: "かんたん", icon: "🌱", desc: "4択から選ぶ", color: C.green, bg: C.greenBg, gradient: "linear-gradient(135deg, #bbf7d0, #86efac)" },
  { id: "normal" as Difficulty, label: "ノーマル", icon: "🔥", desc: "許容範囲あり", color: C.accent, bg: C.accentLight, gradient: "linear-gradient(135deg, #fef3c7, #fde68a)" },
  { id: "hard" as Difficulty, label: "むずかしい", icon: "💀", desc: "許容範囲が狭い", color: C.red, bg: C.redBg, gradient: "linear-gradient(135deg, #fecaca, #fca5a5)" },
];

interface CommonTestItem { id: string; title: string; franchise: Franchise | null; common_test_question: { count: number }[] }
interface AnnouncementItem { id: string; title: string; body: string | null; is_pinned: boolean; starts_at: string }

/* ── Holographic Material Card ── */
function MaterialCard({ data, selected, onClick }: { data: typeof MATERIALS[0]; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const rotateX = hovered ? (mousePos.y - 50) * -0.15 : 0;
  const rotateY = hovered ? (mousePos.x - 50) * 0.15 : 0;

  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMousePos({ x: 50, y: 50 }); }}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden flex flex-col items-center justify-center gap-2 border-none cursor-pointer"
      style={{
        padding: "28px 16px", borderRadius: 18,
        background: selected ? data.gradient : C.glass,
        backdropFilter: selected ? "none" : "blur(12px)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${selected ? "scale(1.05)" : hovered ? "scale(1.03)" : "scale(1)"}`,
        boxShadow: selected ? `0 8px 32px ${data.accent}40, 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)` : hovered ? "0 8px 24px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
        flex: 1, minWidth: 0,
      }}
    >
      {(selected || hovered) && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: data.holoGradient, backgroundSize: "200% 200%",
          backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
          opacity: selected ? 0.25 : 0.12, mixBlendMode: "overlay", transition: "opacity 0.3s",
        }} />
      )}
      {selected && <>
        <div className="absolute" style={{ top: "15%", left: "20%", width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.8)", animation: "sparkle 1.5s ease-in-out infinite" }} />
        <div className="absolute" style={{ top: "60%", right: "15%", width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.7)", animation: "sparkle 1.5s ease-in-out 0.5s infinite" }} />
        <div className="absolute" style={{ bottom: "20%", left: "35%", width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.6)", animation: "sparkle 1.5s ease-in-out 1s infinite" }} />
        <div className="absolute flex items-center justify-center" style={{
          top: 10, right: 10, width: 22, height: 22, borderRadius: "50%",
          background: "rgba(255,255,255,0.9)", color: data.accent,
          fontSize: 12, fontWeight: 700, animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}>✓</div>
      </>}
      <span className="relative z-[1]" style={{
        fontSize: 38, transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        transform: selected ? "scale(1.2)" : "scale(1)",
        filter: selected ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : hovered ? "none" : "grayscale(20%)",
      }}>{data.icon}</span>
      <span className="relative z-[1]" style={{ fontSize: 15, fontWeight: 700, color: selected ? "#fff" : C.text, textShadow: selected ? "0 1px 3px rgba(0,0,0,0.2)" : "none" }}>{data.label}</span>
      <span className="relative z-[1]" style={{ fontSize: 11, fontWeight: 500, color: selected ? "rgba(255,255,255,0.8)" : C.textLight }}>{data.desc}</span>
    </button>
  );
}

/* ── Difficulty Chip ── */
function DifficultyChip({ data, selected, onClick }: { data: typeof DIFF_DATA[0]; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center gap-1 border-none cursor-pointer"
      style={{
        padding: "16px 12px", borderRadius: 14, flex: 1,
        background: selected ? data.gradient : hovered ? "rgba(255,255,255,0.7)" : C.glass,
        backdropFilter: "blur(10px)", transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        transform: selected ? "scale(1.05)" : hovered ? "scale(1.02)" : "scale(1)",
        boxShadow: selected ? `0 4px 16px ${data.color}25` : "0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      {selected && (
        <div className="absolute flex items-center justify-center" style={{
          top: 6, right: 6, width: 16, height: 16, borderRadius: "50%",
          background: data.color, color: "#fff", fontSize: 9, fontWeight: 700,
          animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}>✓</div>
      )}
      <span style={{ fontSize: 24, filter: selected ? "none" : "grayscale(30%)", transition: "all 0.2s" }}>{data.icon}</span>
      <span style={{ fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? data.color : C.text }}>{data.label}</span>
      <span style={{ fontSize: 10, color: selected ? data.color : C.textLight }}>{data.desc}</span>
    </button>
  );
}

/* ── Main ── */
export default function ExamStartPage() {
  const router = useRouter();
  const [testType, setTestType] = useState<"normal" | "common">("normal");
  const [material, setMaterial] = useState<Franchise | "all">("Pokemon");
  const [mode, setMode] = useState<"normal" | "endless">("normal");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [commonTests, setCommonTests] = useState<CommonTestItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [hardUnlocked, setHardUnlocked] = useState(false);

  useEffect(() => {
    fetch("/api/exam/common-tests").then(r => r.json()).then(d => setCommonTests(Array.isArray(d) ? d : []));
    fetch("/api/announcements").then(r => r.json()).then(d => setAnnouncements(Array.isArray(d) ? d.slice(0, 5) : []));
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      fetch(`/api/exam/history?user_id=${user.id}`).then(r => r.json()).then(data => {
        const total = (data.sessions ?? [])
          .filter((s: { difficulty: string }) => s.difficulty === "normal")
          .reduce((sum: number, s: { total_questions: number }) => sum + s.total_questions, 0);
        setHardUnlocked(total >= 20);
      });
    }
  }, []);

  async function handleStart() {
    setError(""); setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user")!);
      const res = await fetch("/api/exam/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, franchise: material, difficulty, mode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      sessionStorage.setItem("exam", JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty", difficulty);
      router.push("/exam/play");
    } catch { setError("通信エラー"); } finally { setLoading(false); }
  }

  async function handleCommonStart(testId: string) {
    setError(""); setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user")!);
      const res = await fetch("/api/exam/common/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, common_test_id: testId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      sessionStorage.setItem("exam", JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty", "common");
      router.push("/exam/play");
    } catch { setError("通信エラー"); } finally { setLoading(false); }
  }

  const selMat = MATERIALS.find(m => m.id === material)!;
  const startLabel = mode === "endless" ? "エンドレス スタート" : "10問テスト スタート";
  const visibleDiffs = DIFF_DATA.filter(d => d.id !== "hard" || hardUnlocked);

  return (
    <>
      <style>{`
        @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes shimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .su { animation: slideUp 0.4s cubic-bezier(0.4,0,0.2,1) both; }
        .su1 { animation-delay: 0.04s; } .su2 { animation-delay: 0.08s; } .su3 { animation-delay: 0.12s; } .su4 { animation-delay: 0.16s; }
      `}</style>

      <div className="min-h-screen relative overflow-hidden" style={{
        background: "linear-gradient(160deg, #f8f6f1 0%, #f0ebe0 40%, #f5f0e8 100%)", color: C.text,
      }}>
        {/* Ambient bg */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute" style={{ top: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${selMat.accent}08 0%, transparent 70%)`, transition: "background 0.8s ease" }} />
          <div className="absolute" style={{ bottom: "-15%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.accentMid}06 0%, transparent 70%)` }} />
        </div>

        {/* Header */}
        <header className="su sticky top-0 z-20 flex items-center justify-between" style={{
          padding: "12px 28px", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.glassBorder}`,
        }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-bold" style={{
              background: `linear-gradient(135deg, ${C.text}, #44403c)`, color: C.accentMid, fontSize: 15, fontFamily: "'DM Serif Display', serif", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>P</div>
            <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "'DM Serif Display', serif", letterSpacing: "0.04em" }}>PROVA</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/exam/history")} style={{
              padding: "6px 12px", borderRadius: 8, background: C.accentLight, border: "1px solid #fde68a", color: C.accent, fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>成績履歴 →</button>
            <div style={{ width: 1, height: 24, background: C.border }} />
            <button onClick={() => router.push("/exam/mypage")}
              className="flex items-center justify-center transition-all duration-150 hover:scale-110 overflow-hidden"
              title="MY PAGE"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.accent}, #f59e0b)`,
                color: "#fff", fontSize: 14, fontWeight: 700,
                fontFamily: "'DM Serif Display', serif",
                boxShadow: `0 2px 8px ${C.accent}30`,
                border: "none", cursor: "pointer",
              }}
            >
              {(() => {
                if (typeof window === "undefined") return "?";
                const u = JSON.parse(sessionStorage.getItem("user") ?? "{}");
                if (u.avatar_url) return <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />;
                return u.name?.[0]?.toUpperCase() ?? "?";
              })()}
            </button>
            <button onClick={() => { sessionStorage.clear(); router.push("/"); }} style={{
              background: "none", border: "none", color: C.textLight, fontSize: 12, cursor: "pointer",
            }}>ログアウト</button>
          </div>
        </header>

        {/* Body */}
        <div className="relative z-[1]" style={{
          display: "grid", gridTemplateColumns: noticeOpen ? "280px 1fr" : "1fr", minHeight: "calc(100vh - 57px)",
        }}>
          {/* Notices sidebar */}
          {noticeOpen && (
            <aside className="su su1 overflow-auto" style={{
              borderRight: `1px solid ${C.borderLight}`, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", padding: "18px 14px",
            }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 13, fontWeight: 700 }}>📢 お知らせ</span>
                <button onClick={() => setNoticeOpen(false)} className="transition-all duration-150" style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.textLight, padding: "3px 7px", borderRadius: 5,
                }}>✕</button>
              </div>
              {announcements.map((n) => (
                <div key={n.id} className="mb-2 cursor-default transition-transform duration-150 hover:translate-y-[-1px]" style={{
                  padding: 12, background: n.is_pinned ? C.accentLight : C.glass, border: `1px solid ${n.is_pinned ? "#fde68a" : C.glassBorder}`, borderRadius: 12,
                }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {n.is_pinned && <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: C.redBg, padding: "1px 5px", borderRadius: 4 }}>固定</span>}
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{n.title}</span>
                  </div>
                  {n.body && <div style={{ fontSize: 11.5, color: C.textMid, lineHeight: 1.5 }}>{n.body}</div>}
                  <div className="font-mono" style={{ fontSize: 10, color: C.textLight, marginTop: 6 }}>{new Date(n.starts_at).toLocaleDateString("ja-JP")}</div>
                </div>
              ))}
              {announcements.length === 0 && <p style={{ fontSize: 12, color: C.textLight, textAlign: "center", padding: 16 }}>お知らせはありません</p>}
            </aside>
          )}

          {/* Main config area */}
          <div className="flex flex-col items-center justify-center relative" style={{ padding: "32px 40px" }}>
            {!noticeOpen && (
              <button onClick={() => setNoticeOpen(true)} className="absolute" style={{
                top: 14, left: 14, padding: "5px 10px", borderRadius: 8, background: C.glass, backdropFilter: "blur(8px)", border: `1px solid ${C.glassBorder}`, fontSize: 11, color: C.textLight, cursor: "pointer",
              }}>📢 ({announcements.length})</button>
            )}

            <div style={{ width: "100%", maxWidth: 800 }}>
              {/* Test type toggle */}
              <div className="su su1" style={{
                display: "flex", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)", borderRadius: 11, padding: 3, border: `1px solid ${C.glassBorder}`, marginBottom: 28, maxWidth: 280,
              }}>
                {(["normal", "common"] as const).map(id => {
                  const active = testType === id;
                  return (
                    <button key={id} onClick={() => setTestType(id)} style={{
                      flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                      background: active ? C.surface : "transparent", color: active ? C.text : C.textLight,
                      fontSize: 13, fontWeight: active ? 650 : 450, transition: "all 0.2s",
                      boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                    }}>{id === "normal" ? "通常テスト" : "共通テスト"}</button>
                  );
                })}
              </div>

              {error && <p className="mb-3" style={{ fontSize: 12.5, color: C.red }}>{error}</p>}

              {testType === "normal" && (
                <>
                  {/* Material selection */}
                  <div className="su su2 mb-6">
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12 }}>商材を選択</div>
                    <div className="grid grid-cols-4 gap-3">
                      {MATERIALS.map(m => <MaterialCard key={m.id} data={m} selected={material === m.id} onClick={() => setMaterial(m.id)} />)}
                    </div>
                  </div>

                  {/* Mode + Difficulty */}
                  <div className="su su3 grid gap-5 mb-8" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12 }}>モード</div>
                      <div className="flex gap-2.5">
                        {([{ id: "normal" as const, icon: "⚡", label: "10問テスト", desc: "サクッと挑戦" }, { id: "endless" as const, icon: "♾️", label: "エンドレス", desc: "全問+タイマー" }]).map(m => {
                          const sel = mode === m.id;
                          return (
                            <button key={m.id} onClick={() => setMode(m.id)} className="flex flex-col items-center gap-1 border-none cursor-pointer" style={{
                              flex: 1, padding: "16px 12px", borderRadius: 14,
                              border: sel ? `2px solid ${C.accent}` : "2px solid transparent",
                              background: sel ? C.accentLight : C.glass, backdropFilter: "blur(10px)",
                              transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)", transform: sel ? "scale(1.03)" : "scale(1)",
                              boxShadow: sel ? `0 4px 12px ${C.accent}15` : "none",
                            }}>
                              <span style={{ fontSize: 24 }}>{m.icon}</span>
                              <span style={{ fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? C.accent : C.text }}>{m.label}</span>
                              <span style={{ fontSize: 10, color: sel ? C.accent : C.textLight }}>{m.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12 }}>難易度</div>
                      <div className="flex gap-2.5">
                        {visibleDiffs.map(d => <DifficultyChip key={d.id} data={d} selected={difficulty === d.id} onClick={() => setDifficulty(d.id)} />)}
                      </div>
                      <div className="mt-2 text-center" style={{ fontSize: 11, color: C.textLight }}>
                        {difficulty === "easy" && "4択から選ぶモードです"}
                        {difficulty === "normal" && "価格を直接入力します（許容範囲あり）"}
                        {difficulty === "hard" && "価格を直接入力します（許容範囲が狭い）"}
                      </div>
                    </div>
                  </div>

                  {/* Start button */}
                  <div className="su su4" style={{ maxWidth: 420, margin: "0 auto" }}>
                    <button onClick={handleStart} disabled={loading} className="w-full relative overflow-hidden disabled:opacity-50" style={{
                      padding: "18px 0", borderRadius: 16, border: "none",
                      background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentHot} 100%)`,
                      backgroundSize: "200% 200%", animation: "shimmer 3s ease infinite",
                      color: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em",
                      boxShadow: `0 4px 20px ${C.accent}35, 0 2px 8px rgba(0,0,0,0.1)`,
                      transition: "transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.01)"; e.currentTarget.style.boxShadow = `0 8px 32px ${C.accent}45`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 20px ${C.accent}35`; }}
                    onMouseDown={e => { e.currentTarget.style.transform = "translateY(1px) scale(0.99)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.01)"; }}
                    >
                      <div className="absolute top-0 pointer-events-none" style={{ left: "-100%", width: "60%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", animation: "shimmer 3s ease infinite" }} />
                      <span className="relative z-[1]">{loading ? "準備中..." : `${startLabel} →`}</span>
                    </button>
                  </div>
                </>
              )}

              {/* Common tests */}
              {testType === "common" && (
                <div className="su su2 space-y-3">
                  {commonTests.length === 0 ? (
                    <div className="text-center py-12" style={{ color: C.textLight }}>公開中の共通テストはありません</div>
                  ) : commonTests.map(t => (
                    <button key={t.id} onClick={() => handleCommonStart(t.id)} disabled={loading}
                      className="w-full text-left transition-all duration-200 hover:translate-y-[-2px] disabled:opacity-50"
                      style={{ padding: 16, borderRadius: 14, background: C.glass, backdropFilter: "blur(12px)", border: `1.5px solid ${C.glassBorder}`, cursor: "pointer" }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.title}</span>
                      <span className="block font-mono mt-1" style={{ fontSize: 11.5, color: C.textLight }}>
                        {t.franchise ? FRANCHISE_JA[t.franchise] : "全商材混合"} ・ {t.common_test_question?.[0]?.count ?? 0}問
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
