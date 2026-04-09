"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassStat } from "@/components/glass-stat";
import { ProgressBar } from "@/components/progress-bar";
import { UserAvatar } from "@/components/user-avatar";
import { DIFFICULTY_JA, FRANCHISE_JA } from "@/lib/types";
import type { Difficulty, Franchise } from "@/lib/types";

const DIFF_VARIANT: Record<string, string> = { easy: "green", normal: "yellow", hard: "red" };
const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  green:   { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  yellow:  { bg: "#fefce8", color: "#a16207", border: "#fef08a" },
  red:     { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  neutral: { bg: "rgba(255,255,255,0.6)", color: "#78716c", border: "#e8e3d9" },
};

interface SessionRow {
  id: string; user_name: string; difficulty: Difficulty; franchise: Franchise;
  total_questions: number; score: number; accuracy: number; finished_at: string;
}
interface HardCard {
  quiz_card_id: string; card_name: string; franchise: Franchise;
  price: number; total_attempts: number; incorrect_count: number; error_rate: number;
}
interface Stats {
  sessions: SessionRow[];
  hard_cards: HardCard[];
  overall_accuracy: { total_answers: number; correct_answers: number; accuracy: number };
}

function DiffBadge({ difficulty }: { difficulty: string }) {
  const variant = DIFF_VARIANT[difficulty] ?? "neutral";
  const s = BADGE_STYLES[variant];
  return (
    <span
      className="inline-block text-[11.5px] font-semibold"
      style={{ padding: "3px 10px", borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {DIFFICULTY_JA[difficulty as Difficulty] ?? difficulty}
    </span>
  );
}

const thClass = "px-[18px] py-[11px] text-left text-[10.5px] font-semibold uppercase tracking-[0.08em]";
const tdClass = "px-[18px] py-[13px] text-[13.5px]";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "weak">("history");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) { router.push("/"); return; }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") { router.push("/exam"); return; }
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).finally(() => setLoading(false));
  }, [router]);

  if (loading || !stats) {
    return <div className="flex items-center justify-center py-20"><p style={{ color: "#a8a29e" }}>読み込み中...</p></div>;
  }

  const acc = stats.overall_accuracy;

  return (
    <div>
      {/* Bento Stats */}
      <div className="grid grid-cols-6 gap-[14px] mb-6 animate-fade-in-up">
        <div className="col-span-2 stagger-1">
          <GlassStat label="全体正答率" value={`${acc.accuracy ?? 0}%`} sub="スタッフ全体"
            icon="📊" color="#b45309" colorBg="#fef3c7" large />
        </div>
        <div className="col-span-2 stagger-2">
          <GlassStat label="総回答数" value={(acc.total_answers ?? 0).toLocaleString()} sub="累計"
            icon="✏️" color="#1d4ed8" colorBg="#eff6ff" large />
        </div>
        <div className="col-span-1 stagger-3">
          <GlassStat label="受験回数" value={String(stats.sessions.length)}
            icon="📋" color="#15803d" colorBg="#f0fdf4" />
        </div>
        <div className="col-span-1 stagger-4">
          <GlassStat label="正解数" value={(acc.correct_answers ?? 0).toLocaleString()}
            icon="✅" color="#a16207" colorBg="#fefce8" />
        </div>
      </div>

      {/* Table Card */}
      <div className="glass rounded-[14px] overflow-hidden animate-fade-in-up stagger-5">
        {/* Tabs */}
        <div className="flex gap-0 px-[18px]" style={{ borderBottom: "1px solid var(--color-border-light)" }}>
          {([
            { key: "history" as const, label: "受験履歴", count: stats.sessions.length },
            { key: "weak" as const, label: "間違えやすい問題", count: stats.hard_cards.length },
          ]).map(tab => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 border-none bg-transparent cursor-pointer transition-all duration-150"
                style={{
                  padding: "13px 16px",
                  fontSize: 13, fontWeight: active ? 600 : 450,
                  color: active ? "#292524" : "#a8a29e",
                  borderBottom: active ? "2px solid #b45309" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.label}
                <span
                  className="font-mono text-[10.5px] font-semibold rounded-[5px] transition-all duration-150"
                  style={{
                    padding: "2px 7px",
                    background: active ? "#fef3c7" : "#f3f0ea",
                    color: active ? "#b45309" : "#a8a29e",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* History Table */}
        {activeTab === "history" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["名前", "商材", "難易度", "スコア", "正答率", "受験日"].map(h => (
                    <th key={h} className={thClass} style={{ color: "#a8a29e", background: "rgba(243,240,234,0.5)", borderBottom: "1px solid #e8e3d9" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.sessions.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8" style={{ color: "#a8a29e" }}>まだ受験データがありません</td></tr>
                )}
                {stats.sessions.map((s, i) => (
                  <tr key={s.id} className="transition-[background] duration-150 ease hover:bg-[rgba(180,83,9,0.05)]"
                    style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                    <td className={tdClass}>
                      <div className="flex items-center gap-[10px]">
                        <UserAvatar name={s.user_name || "?"} index={i} />
                        <span className="font-[550]">{s.user_name}</span>
                      </div>
                    </td>
                    <td className={tdClass} style={{ color: "#78716c" }}>{FRANCHISE_JA[s.franchise]}</td>
                    <td className={tdClass}><DiffBadge difficulty={s.difficulty} /></td>
                    <td className={`${tdClass} font-mono font-semibold`}>{s.score}/{s.total_questions}</td>
                    <td className={tdClass}><ProgressBar value={s.accuracy} /></td>
                    <td className={`${tdClass} font-mono text-[12.5px]`} style={{ color: "#a8a29e" }}>
                      {new Date(s.finished_at).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Weak Cards Table */}
        {activeTab === "weak" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["カード名", "商材", "価格", "誤答率", "回答数"].map(h => (
                    <th key={h} className={thClass} style={{ color: "#a8a29e", background: "rgba(243,240,234,0.5)", borderBottom: "1px solid #e8e3d9" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.hard_cards.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8" style={{ color: "#a8a29e" }}>十分なデータがありません</td></tr>
                )}
                {stats.hard_cards.map((c) => (
                  <tr key={c.quiz_card_id}
                    className="cursor-pointer transition-[background] duration-150 ease hover:bg-[rgba(180,83,9,0.05)]"
                    onClick={() => router.push(`/cards/${c.quiz_card_id}`)}
                    style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                    <td className={`${tdClass} font-[480]`}>{c.card_name}</td>
                    <td className={tdClass}>
                      <span className="inline-block text-[11.5px] font-semibold" style={{
                        padding: "3px 10px", borderRadius: 6,
                        background: "rgba(255,255,255,0.6)", color: "#78716c", border: "1px solid #e8e3d9",
                      }}>{FRANCHISE_JA[c.franchise]}</span>
                    </td>
                    <td className={`${tdClass} font-mono font-[500]`} style={{ color: "#78716c" }}>
                      {c.price.toLocaleString()}円
                    </td>
                    <td className={tdClass}><ProgressBar value={c.error_rate} invert /></td>
                    <td className={`${tdClass} font-mono font-[500]`} style={{ color: "#a8a29e" }}>
                      {c.total_attempts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
