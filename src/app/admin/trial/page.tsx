"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISES, FRANCHISE_JA, DIFFICULTIES, DIFFICULTY_JA } from "@/lib/types";
import type { Franchise, Difficulty, Question, ExamResult } from "@/lib/types";

type Phase = "setup" | "playing" | "result";

export default function AdminTrialPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");
  const [franchise, setFranchise] = useState<Franchise>("Pokemon");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // playing state
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    correctPrice: number;
  } | null>(null);
  const [answering, setAnswering] = useState(false);

  // result
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) {
      router.push("/");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      router.push("/exam");
    }
  }, [router]);

  async function handleStart() {
    setError("");
    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user")!);
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, franchise, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      setSessionId(data.session_id);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setPhase("playing");
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = questions[currentIndex];

  const submitAnswer = useCallback(async (value: number) => {
    if (answering || !currentQuestion) return;
    setAnswering(true);
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
      setFeedback({ show: true, isCorrect: data.is_correct, correctPrice: data.correct_price });

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
      setAnswering(false);
    }
  }, [answering, currentQuestion, sessionId, currentIndex, questions.length]);

  async function finishExam() {
    const res = await fetch("/api/exam/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data: ExamResult = await res.json();
    setResult(data);
    setPhase("result");
  }

  function handleNumericSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < 0) return;
    submitAnswer(num);
  }

  function resetToSetup() {
    setPhase("setup");
    setResult(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSessionId("");
  }

  // ── Setup ──
  if (phase === "setup") {
    return (
      <main className="flex-1 bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">模擬テスト</h1>
            <button onClick={() => router.push("/admin")} className="text-sm text-gray-600 hover:text-gray-800">
              戻る
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">商材</label>
              <div className="grid grid-cols-3 gap-2">
                {FRANCHISES.map((f) => (
                  <button key={f} onClick={() => setFranchise(f)}
                    className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      franchise === f
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >{FRANCHISE_JA[f]}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">難易度</label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      difficulty === d
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >{DIFFICULTY_JA[d]}</button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button onClick={handleStart} disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 disabled:opacity-50"
            >{loading ? "準備中..." : "スタート"}</button>
          </div>
        </div>
      </main>
    );
  }

  // ── Playing ──
  if (phase === "playing" && currentQuestion) {
    return (
      <main className="flex-1 flex flex-col items-center bg-gray-50 p-4">
        <div className="w-full max-w-lg mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>問題 {currentIndex + 1} / {questions.length}</span>
            <span>{DIFFICULTY_JA[difficulty]}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

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
        </div>

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

        {!feedback?.show && (
          <div className="w-full max-w-lg">
            <p className="text-center text-gray-700 mb-4 font-medium">この商品の買取価格は？</p>
            {difficulty === "easy" && currentQuestion.choices ? (
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.choices.map((choice) => (
                  <button key={choice} onClick={() => submitAnswer(choice)} disabled={answering}
                    className="py-4 px-4 bg-white border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-900 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >{choice.toLocaleString()}円</button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleNumericSubmit} className="flex gap-2">
                <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                  placeholder="価格を入力（円）" autoFocus min="0" step="100"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <button type="submit" disabled={answering || !inputValue}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >回答</button>
              </form>
            )}
          </div>
        )}
      </main>
    );
  }

  // ── Result ──
  if (phase === "result" && result) {
    const accuracy = Math.round((result.score / result.total) * 100);
    const grade = accuracy >= 90 ? { label: "S", color: "text-yellow-500" }
      : accuracy >= 70 ? { label: "A", color: "text-green-500" }
      : accuracy >= 50 ? { label: "B", color: "text-blue-500" }
      : { label: "C", color: "text-red-500" };

    return (
      <main className="flex-1 flex flex-col items-center bg-gray-50 p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center mb-6">
            <p className="text-gray-500 mb-2">結果</p>
            <p className={`text-6xl font-black mb-2 ${grade.color}`}>{grade.label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{result.score} / {result.total}</p>
            <p className="text-gray-500">正答率 {accuracy}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border divide-y">
            <h2 className="px-4 py-3 font-bold text-gray-700">回答一覧</h2>
            {result.answers.map((a, i) => (
              <div key={i} className={`px-4 py-3 flex items-center justify-between ${a.is_correct ? "" : "bg-red-50"}`}>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{a.card_name}</p>
                  <p className="text-xs text-gray-500">
                    正解: {a.correct_price.toLocaleString()}円
                    {a.answered_value != null && <> / あなた: {a.answered_value.toLocaleString()}円</>}
                  </p>
                </div>
                <span className={`text-lg font-bold ${a.is_correct ? "text-green-500" : "text-red-500"}`}>
                  {a.is_correct ? "○" : "×"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <button onClick={resetToSetup}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >もう一度</button>
            <button onClick={() => router.push("/admin")}
              className="w-full py-2 text-gray-600 text-sm hover:text-gray-800"
            >管理画面に戻る</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">読み込み中...</p>
    </main>
  );
}
