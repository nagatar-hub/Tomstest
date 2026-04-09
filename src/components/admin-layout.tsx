"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid, Target, FileText, Database, FolderOpen, Plus,
  Bell, SlidersHorizontal, Users, LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "ダッシュボード", href: "/admin", icon: LayoutGrid },
  { label: "模擬テスト", href: "/admin/trial", icon: Target },
  { label: "共通テスト", href: "/admin/common-tests", icon: FileText },
  { label: "カードDB", href: "/admin/card-db", icon: FolderOpen },
  { label: "問題DB", href: "/admin/question-bank", icon: Database },
  { label: "個別登録", href: "/admin/custom-cards", icon: Plus },
  { label: "お知らせ", href: "/admin/announcements", icon: Bell },
  { label: "許容範囲", href: "/admin/settings", icon: SlidersHorizontal },
  { label: "ユーザー", href: "/admin/users", icon: Users },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    sessionStorage.clear();
    router.push("/");
  }

  // ユーザー情報取得
  let userName = "管理者";
  if (typeof window !== "undefined") {
    try {
      const u = JSON.parse(sessionStorage.getItem("user") ?? "{}");
      if (u.name) userName = u.name;
    } catch { /* ignore */ }
  }

  return (
    <div className="flex min-h-screen">
      {/* サイドバー（固定） */}
      <aside
        className="w-[244px] glass-strong flex flex-col shrink-0 fixed top-0 left-0 h-screen z-20 overflow-y-auto"
        style={{ borderRight: "1px solid var(--color-border-light)" }}
      >
        {/* Brand */}
        <div className="px-[18px] py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-border-light)" }}>
          <div
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center font-mono text-[13px] font-bold"
            style={{
              background: "linear-gradient(135deg, #292524 0%, #44403c 100%)",
              color: "#f59e0b",
              letterSpacing: "-0.05em",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            TS
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color: "#292524", letterSpacing: "-0.02em" }}>
              TOM.Stocks
            </div>
            <div className="text-[10px] font-semibold uppercase" style={{ color: "#b45309", letterSpacing: "0.12em" }}>
              Quiz Admin
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-[10px] py-[14px] flex flex-col gap-0.5">
          <div
            className="text-[10px] font-semibold uppercase px-3 pt-2 pb-1.5"
            style={{ color: "#a8a29e", letterSpacing: "0.1em" }}
          >
            メニュー
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-[10px] px-3 py-[9px] rounded-[9px] text-[13.5px] text-left border-none cursor-pointer",
                  "transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  active
                    ? "font-semibold"
                    : "font-[450] hover:bg-white/60"
                )}
                style={{
                  background: active ? "#fef3c7" : undefined,
                  color: active ? "#b45309" : "#78716c",
                  boxShadow: active ? "0 1px 4px rgba(180,83,9,0.1)" : undefined,
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={1.7}
                  className="transition-opacity duration-150"
                  style={{ opacity: active ? 1 : 0.5 }}
                />
                <span>{item.label}</span>
                {active && (
                  <div className="ml-auto w-[5px] h-[5px] rounded-full" style={{ background: "#b45309" }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-[18px] py-[14px] flex items-center gap-[10px]" style={{ borderTop: "1px solid var(--color-border-light)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #b45309, #f59e0b)",
              boxShadow: "0 2px 6px rgba(180,83,9,0.3)",
            }}
          >
            {userName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold truncate">{userName}</div>
            <div className="text-[10.5px]" style={{ color: "#a8a29e" }}>admin</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md transition-colors duration-150 hover:bg-red-50"
            style={{ color: "#a8a29e" }}
            title="ログアウト"
          >
            <LogOut size={15} strokeWidth={1.7} />
          </button>
        </div>
      </aside>

      {/* Main（サイドバー幅分オフセット） */}
      <main className="flex-1 overflow-auto ml-[244px]">
        {/* Header */}
        <header
          className="sticky top-0 z-10 px-7 py-[18px] flex justify-between items-center"
          style={{
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--color-border-light)",
          }}
        >
          <div>
            <h1 className="text-[19px] font-bold" style={{ letterSpacing: "-0.02em" }}>
              {NAV_ITEMS.find((n) => pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href)))?.label ?? ""}
            </h1>
            <p className="text-[12.5px] mt-0.5" style={{ color: "#a8a29e" }}>
              TOM.Stocks Quiz 管理システム
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-[5px] rounded-full"
            style={{
              background: "rgba(240,253,244,0.8)",
              backdropFilter: "blur(8px)",
              border: "1px solid #bbf7d0",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#15803d", boxShadow: "0 0 6px rgba(21,128,61,0.6)" }}
            />
            <span className="text-xs font-semibold" style={{ color: "#15803d" }}>稼働中</span>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 px-7 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
