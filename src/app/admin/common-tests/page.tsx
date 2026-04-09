"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISE_JA } from "@/lib/types";
import type { Franchise } from "@/lib/types";

interface CommonTest {
  id: string;
  title: string;
  franchise: Franchise | null;
  is_published: boolean;
  created_at: string;
  quiz_user: { name: string };
  common_test_question: { count: number }[];
}

export default function CommonTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<CommonTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  async function fetchTests() {
    const res = await fetch("/api/admin/common-tests");
    setTests(await res.json());
    setLoading(false);
  }

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/admin/common-tests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !current }),
    });
    fetchTests();
  }

  async function deleteTest(id: string) {
    if (!confirm("このテストを削除しますか？")) return;
    await fetch(`/api/admin/common-tests/${id}`, { method: "DELETE" });
    fetchTests();
  }

  if (loading) {
    return <main className="flex-1 flex items-center justify-center bg-gray-50"><p className="text-gray-500">読み込み中...</p></main>;
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">共通テスト管理</h1>
          <div className="flex gap-2">
            <button onClick={() => router.push("/admin/common-tests/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              新規作成
            </button>
            <button onClick={() => router.push("/admin")}
              className="text-sm text-gray-600 hover:text-gray-800">戻る</button>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
            共通テストがまだありません
          </div>
        ) : (
          <div className="bg-white rounded-xl border divide-y">
            {tests.map((t) => (
              <div key={t.id} className="px-4 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{t.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      t.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {t.is_published ? "公開中" : "非公開"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t.franchise ? FRANCHISE_JA[t.franchise] : "全商材混合"} ・
                    {t.common_test_question?.[0]?.count ?? 0}問 ・
                    作成: {t.quiz_user?.name} ・
                    {new Date(t.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <button onClick={() => router.push(`/admin/common-tests/${t.id}`)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                  編集
                </button>
                <button onClick={() => togglePublish(t.id, t.is_published)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    t.is_published
                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}>
                  {t.is_published ? "非公開にする" : "公開する"}
                </button>
                <button onClick={() => deleteTest(t.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200">
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
