"use client";

import { useState, useEffect, useCallback } from "react";
import { FRANCHISES, FRANCHISE_JA } from "@/lib/types";
import type { Franchise } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CardItem {
  id: string;
  franchise: Franchise;
  card_name: string;
  grade: string | null;
  price: number;
  image_url: string | null;
  rarity: string | null;
}

type QuestionMode = null | "setup";
type QuestionType = "choice" | "numeric" | "text";

export default function CardDBPage() {
  const [tab, setTab] = useState<Franchise>("Pokemon");
  const [search, setSearch] = useState("");
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // ポップアップ
  const [selected, setSelected] = useState<CardItem | null>(null);

  // 問題作成
  const [questionMode, setQuestionMode] = useState<QuestionMode>(null);
  const [questionType, setQuestionType] = useState<QuestionType>("choice");
  const [questionText, setQuestionText] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ franchise: tab, limit: "200" });
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/admin/cards?${params}`);
    const data = await res.json();
    setCards(Array.isArray(data) ? data : []);
    setTotal(Array.isArray(data) ? data.length : 0);
    setLoading(false);
  }, [tab, search]);

  useEffect(() => { fetchCards(); }, [tab]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCards();
  }

  function openCard(card: CardItem) {
    setSelected(card);
    setQuestionMode(null);
    setSaveMsg("");
  }

  function closeCard() {
    setSelected(null);
    setQuestionMode(null);
    setSaveMsg("");
    resetForm();
  }

  function resetForm() {
    setQuestionType("choice");
    setQuestionText("");
    setCustomAnswer("");
    setChoices(["", "", "", ""]);
    setSaveMsg("");
  }

  function startCreateQuestion() {
    resetForm();
    setQuestionMode("setup");
  }

  async function handleSaveQuestion() {
    if (!selected) return;
    setSaving(true);
    setSaveMsg("");

    const user = JSON.parse(sessionStorage.getItem("user")!);
    const body: Record<string, unknown> = {
      franchise: selected.franchise,
      quiz_card_id: selected.id,
      question_type: questionType,
      question_text: questionText.trim() || null,
      created_by: user.id,
    };

    if (questionType === "text") {
      body.custom_answer = customAnswer.trim() || null;
    }

    if (questionType === "choice") {
      const filled = choices.filter((c) => c.trim());
      if (filled.length > 0) {
        body.custom_choices = filled;
      }
    }

    const res = await fetch("/api/admin/question-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSaveMsg("問題DBに保存しました");
      setQuestionMode(null);
    } else {
      const err = await res.json();
      setSaveMsg(err.error ?? "保存に失敗しました");
    }
    setSaving(false);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-6">カードDB</h2>

      {/* 商材タブ */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as Franchise); setSearch(""); }}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            {FRANCHISES.map((f) => (
              <TabsTrigger key={f} value={f}>{FRANCHISE_JA[f]}</TabsTrigger>
            ))}
          </TabsList>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="カード名で検索..." className="w-64" />
            <Button type="submit" variant="secondary" size="sm">検索</Button>
          </form>
        </div>
      </Tabs>

      {/* 件数 */}
      <p className="text-sm text-muted-foreground mb-4">
        {FRANCHISE_JA[tab]} — {total}件{search && `（「${search}」で絞り込み）`}
      </p>

      {/* カード一覧グリッド */}
      {loading ? (
        <p className="text-center text-muted-foreground py-12">読み込み中...</p>
      ) : cards.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">カードが見つかりません</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cards.map((card) => (
            <Card key={card.id}
              onClick={() => openCard(card)}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden group">
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.card_name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span className="text-muted-foreground text-xs">No Image</span>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{card.card_name}</p>
                <p className="text-xs text-muted-foreground">{card.grade ?? ""}</p>
                <p className="text-sm font-bold text-primary">{card.price.toLocaleString()}円</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* カード詳細ポップアップ */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeCard(); }}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.card_name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* カード画像 */}
                {selected.image_url && (
                  <div className="flex justify-center bg-muted rounded-lg p-4">
                    <img src={selected.image_url} alt={selected.card_name}
                      className="max-h-64 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}

                {/* カード情報 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{FRANCHISE_JA[selected.franchise]}</Badge>
                  {selected.grade && <Badge variant="outline">{selected.grade}</Badge>}
                  {selected.rarity && <Badge variant="outline">{selected.rarity}</Badge>}
                  <span className="ml-auto text-xl font-bold">{selected.price.toLocaleString()}円</span>
                </div>

                {/* 成功メッセージ */}
                {saveMsg && (
                  <p className={`text-sm ${saveMsg.includes("失敗") ? "text-destructive" : "text-green-600"}`}>
                    {saveMsg}
                  </p>
                )}

                {/* 問題作成モードでないとき */}
                {questionMode === null && (
                  <Button onClick={startCreateQuestion} className="w-full">
                    このカードで問題を作る
                  </Button>
                )}

                {/* 問題作成フォーム */}
                {questionMode === "setup" && (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <p className="text-sm font-medium">問題作成</p>

                    {/* 問題形式 */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">問題形式</label>
                      <div className="flex gap-2">
                        {([["choice", "4択"], ["numeric", "筆記（価格）"], ["text", "記述"]] as const).map(([val, label]) => (
                          <Button key={val} size="sm"
                            variant={questionType === val ? "default" : "outline"}
                            onClick={() => setQuestionType(val)}>
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* 問題文 */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">問題文（任意）</label>
                      <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="空欄なら「この商品の買取価格は？」" />
                    </div>

                    {/* 4択: カスタム選択肢 */}
                    {questionType === "choice" && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          選択肢（空なら価格ベースで自動生成）
                        </label>
                        <div className="space-y-1">
                          {choices.map((c, i) => (
                            <Input key={i} value={c}
                              onChange={(e) => {
                                const next = [...choices];
                                next[i] = e.target.value;
                                setChoices(next);
                              }}
                              placeholder={`選択肢${i + 1}`} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 記述: 正解 */}
                    {questionType === "text" && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">正解</label>
                        <Input value={customAnswer} onChange={(e) => setCustomAnswer(e.target.value)} />
                      </div>
                    )}

                    {/* 筆記（価格）の説明 */}
                    {questionType === "numeric" && (
                      <p className="text-xs text-muted-foreground">
                        正解は現在の価格（{selected.price.toLocaleString()}円）が自動で使われます。
                        許容範囲は設定画面の値が適用されます。
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={handleSaveQuestion} disabled={saving} className="flex-1">
                        {saving ? "保存中..." : "問題DBに保存"}
                      </Button>
                      <Button variant="outline" onClick={() => { setQuestionMode(null); resetForm(); }}>
                        キャンセル
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
