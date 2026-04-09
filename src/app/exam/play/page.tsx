"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Question, ExamResult } from "@/lib/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ExamPlayPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    correctPrice: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("");
  const [mode, setMode] = useState("normal");

  // タイマー
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const examStr = sessionStorage.getItem("exam");
    const diff = sessionStorage.getItem("exam_difficulty") ?? "";
    if (!examStr) {
      router.push("/exam");
      return;
    }
    const exam = JSON.parse(examStr);
    setSessionId(exam.session_id);
    setQuestions(exam.questions);
    setDifficulty(diff);
    setMode(exam.mode ?? "normal");

    // タイマー開始
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router]);

  const currentQuestion = questions[currentIndex];

  const submitAnswer = useCallback(async (value: number) => {
    if (loading || !currentQuestion) return;
    setLoading(true);

    try {
      const res = await fetch("/api/exam/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          quiz_card_id: currentQuestion.quiz_card_id,
          answered_value: value,
        }),
      });
      const data = await res.json();

      setFeedback({
        show: true,
        isCorrect: data.is_correct,
        correctPrice: data.correct_price,
      });

      setTimeout(() => {
        setFeedback(null);
        setInputValue("");

        if (currentIndex + 1 >= questions.length) {
          finishExam();
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 1500);
    } catch {
      alert("通信エラー");
    } finally {
      setLoading(false);
    }
  }, [loading, currentQuestion, sessionId, currentIndex, questions.length]);

  async function finishExam() {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await fetch("/api/exam/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data: ExamResult = await res.json();
      sessionStorage.setItem("exam_result", JSON.stringify({ ...data, elapsed }));
      router.push("/exam/result");
    } catch {
      alert("結果の取得に失敗しました");
    }
  }

  function handleNumericSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < 0) return;
    submitAnswer(num);
  }

  async function handleQuit() {
    if (!confirm("テストを終了しますか？ここまでの結果が保存されます。")) return;
    await finishExam();
  }

  if (!currentQuestion) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  const diffLabel = difficulty === "easy" ? "かんたん"
    : difficulty === "normal" ? "ノーマル"
    : difficulty === "hard" ? "むずかしい"
    : "共通テスト";

  return (
    <main className="flex-1 flex flex-col items-center bg-gray-50 p-4">
      {/* ヘッダー: 進捗 + タイマー */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>問題 {currentIndex + 1} / {questions.length}</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-blue-600 font-bold">{formatTime(elapsed)}</span>
            <span>{diffLabel}{mode === "endless" ? " (エンドレス)" : ""}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* カード情報 */}
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border p-6 mb-6">
        {currentQuestion.image_url && (
          <div className="flex justify-center mb-4">
            <img src={currentQuestion.image_url} alt={currentQuestion.card_name}
              className="max-h-48 object-contain rounded"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">{currentQuestion.card_name}</h2>
        {currentQuestion.grade && (
          <p className="text-gray-500 text-center text-sm">{currentQuestion.grade}</p>
        )}
        {currentQuestion.franchise && mode === "endless" && (
          <p className="text-blue-500 text-center text-xs mt-1">{currentQuestion.franchise}</p>
        )}
      </div>

      {/* フィードバック */}
      {feedback?.show && (
        <div className={`w-full max-w-lg p-4 rounded-lg mb-4 text-center font-bold text-lg ${
          feedback.isCorrect
            ? "bg-green-100 text-green-700 border border-green-300"
            : "bg-red-100 text-red-700 border border-red-300"
        }`}>
          {feedback.isCorrect ? "正解!" : (
            <>不正解... 正解は <span className="text-2xl">{feedback.correctPrice.toLocaleString()}円</span></>
          )}
        </div>
      )}

      {/* 回答エリア */}
      {!feedback?.show && (
        <div className="w-full max-w-lg">
          <p className="text-center text-gray-700 mb-4 font-medium">この商品の買取価格は？</p>

          {currentQuestion.choices && currentQuestion.choices.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.choices.map((choice) => (
                <button key={choice} onClick={() => submitAnswer(choice)} disabled={loading}
                  className="py-4 px-4 bg-white border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-900 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50">
                  {choice.toLocaleString()}円
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleNumericSubmit} className="flex gap-2">
              <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder="価格を入力（円）" autoFocus min="0" step="100"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
              <button type="submit" disabled={loading || !inputValue}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                回答
              </button>
            </form>
          )}

          {/* やめるボタン（エンドレスモード or 途中終了） */}
          <button onClick={handleQuit}
            className="w-full mt-4 py-2 text-gray-400 text-sm hover:text-gray-600">
            テストを終了する
          </button>
        </div>
      )}
    </main>
  );
}
