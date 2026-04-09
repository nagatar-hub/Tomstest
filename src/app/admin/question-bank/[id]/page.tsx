"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [question, setQuestion] = useState<Record<string, unknown> | null>(null);
  const [questionType, setQuestionType] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/question-bank/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestion(data);
        setQuestionType(data.question_type ?? "choice");
        setQuestionText(data.question_text ?? "");
        setCustomAnswer(data.custom_answer ?? "");
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/question-bank/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_type: questionType,
        question_text: questionText.trim() || null,
        custom_answer: customAnswer.trim() || null,
      }),
    });
    setSaving(false);
    router.push("/admin/question-bank");
  }

  if (loading || !question) {
    return <main className="flex-1 flex items-center justify-center bg-gray-50"><p className="text-gray-500">読み込み中...</p></main>;
  }

  const card = (question.quiz_card ?? question.custom_card) as Record<string, unknown> | null;

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">問題編集</h1>
          <button onClick={() => router.push("/admin/question-bank")}
            className="text-sm text-gray-600 hover:text-gray-800">戻る</button>
        </div>

        {/* 対象カード情報 */}
        {card && (
          <div className="bg-white rounded-xl border p-4 mb-4 flex items-center gap-3">
            {typeof card.image_url === "string" && card.image_url && (
              <img src={card.image_url} alt="" className="w-16 h-16 object-contain rounded" />
            )}
            <div>
              <p className="font-bold text-gray-900">{card.card_name as string}</p>
              {card.price != null && <p className="text-sm text-gray-500">{(card.price as number).toLocaleString()}円</p>}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">問題形式</label>
            <div className="flex gap-2">
              {([["choice", "4択"], ["numeric", "筆記（数値）"], ["text", "記述"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setQuestionType(val)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium ${
                    questionType === val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700"
                  }`}>{label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">問題文</label>
            <input type="text" value={questionText} onChange={(e) => setQuestionText(e.target.value)}
              placeholder="空欄なら「この商品の買取価格は？」"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
          </div>

          {questionType === "text" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">正解</label>
              <input type="text" value={customAnswer} onChange={(e) => setCustomAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </main>
  );
}
