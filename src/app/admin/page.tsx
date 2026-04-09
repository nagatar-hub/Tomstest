"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DIFFICULTY_JA, FRANCHISE_JA } from "@/lib/types";
import type { Difficulty, Franchise } from "@/lib/types";

interface SessionRow {
  id: string;
  user_name: string;
  difficulty: Difficulty;
  franchise: Franchise;
  total_questions: number;
  score: number;
  accuracy: number;
  finished_at: string;
}

interface HardCard {
  quiz_card_id: string;
  card_name: string;
  franchise: Franchise;
  price: number;
  total_attempts: number;
  incorrect_count: number;
  error_rate: number;
}

interface Stats {
  sessions: SessionRow[];
  hard_cards: HardCard[];
  overall_accuracy: { total_answers: number; correct_answers: number; accuracy: number };
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) { router.push("/"); return; }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") { router.push("/exam"); return; }
    fetchStats();
  }, [router]);

  async function fetchStats() {
    setLoading(true);
    const res = await fetch("/api/admin/stats");
    setStats(await res.json());
    setLoading(false);
  }

  if (loading || !stats) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">読み込み中...</p></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-6">ダッシュボード</h2>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">全体正答率</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.overall_accuracy.accuracy ?? 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">総回答数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(stats.overall_accuracy.total_answers ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">受験回数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.sessions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* タブ */}
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">受験履歴</TabsTrigger>
          <TabsTrigger value="hard_cards">間違えやすい問題</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>商材</TableHead>
                  <TableHead>難易度</TableHead>
                  <TableHead className="text-center">スコア</TableHead>
                  <TableHead className="text-center">正答率</TableHead>
                  <TableHead>受験日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.sessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      まだ受験データがありません
                    </TableCell>
                  </TableRow>
                )}
                {stats.sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.user_name}</TableCell>
                    <TableCell>{FRANCHISE_JA[s.franchise]}</TableCell>
                    <TableCell>{DIFFICULTY_JA[s.difficulty]}</TableCell>
                    <TableCell className="text-center">{s.score}/{s.total_questions}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={s.accuracy >= 80 ? "default" : s.accuracy >= 50 ? "secondary" : "destructive"}>
                        {s.accuracy}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.finished_at).toLocaleString("ja-JP")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="hard_cards">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>カード名</TableHead>
                  <TableHead>商材</TableHead>
                  <TableHead className="text-right">価格</TableHead>
                  <TableHead className="text-center">出題数</TableHead>
                  <TableHead className="text-center">不正解数</TableHead>
                  <TableHead className="text-center">不正解率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.hard_cards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      十分なデータがありません（3回以上出題されたカードが対象）
                    </TableCell>
                  </TableRow>
                )}
                {stats.hard_cards.map((c, i) => (
                  <TableRow key={c.quiz_card_id} className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/cards/${c.quiz_card_id}`)}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{c.card_name}</TableCell>
                    <TableCell>{FRANCHISE_JA[c.franchise]}</TableCell>
                    <TableCell className="text-right">{c.price.toLocaleString()}円</TableCell>
                    <TableCell className="text-center">{c.total_attempts}</TableCell>
                    <TableCell className="text-center">{c.incorrect_count}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{c.error_rate}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
