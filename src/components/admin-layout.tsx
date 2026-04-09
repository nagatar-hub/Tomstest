"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "ダッシュボード", href: "/admin", icon: "📊" },
  { label: "模擬テスト", href: "/admin/trial", icon: "🎯" },
  { label: "共通テスト", href: "/admin/common-tests", icon: "📝" },
  { label: "問題DB", href: "/admin/question-bank", icon: "📚" },
  { label: "個別登録", href: "/admin/custom-cards", icon: "🃏" },
  { label: "お知らせ", href: "/admin/announcements", icon: "📢" },
  { label: "許容範囲", href: "/admin/settings", icon: "⚙️" },
  { label: "ユーザー", href: "/admin/users", icon: "👥" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    sessionStorage.clear();
    router.push("/");
  }

  return (
    <div className="flex min-h-full">
      {/* サイドバー */}
      <aside className="w-56 bg-card border-r flex flex-col shrink-0">
        <div className="px-5 py-5 border-b">
          <h1 className="text-lg font-bold tracking-tight">Tomstest</h1>
          <p className="text-xs text-muted-foreground">管理画面</p>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors text-left"
          >
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-background overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
