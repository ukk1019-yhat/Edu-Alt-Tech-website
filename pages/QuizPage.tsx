import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ChevronLeft, ChevronRight, RotateCw, CheckCircle2, XCircle, Brain, ArrowLeft, BarChart3, Clock, Award } from 'lucide-react';
import { sendAIChat } from '../lib/ai';
import { extractJSON } from '../lib/jsonUtils';
import { recordQuizAttempt } from '../lib/userProgress';
import { auth } from '../lib/firebase';
import type { QuizQuestion } from '../types';
import { useNavigate } from 'react-router-dom';

const QuizPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const navigate = useNavigate();

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setSubmitted(false);
    setUserAnswers([]);
    setQuestions([]);
    setScore(0);
    setCurrentIdx(0);
    setStarted(false);
    setTimeSpent(0);

    const prompt = `Generate ${numQuestions} multiple choice quiz questions about "${topic}".
Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{"questions":[
  {"id":"q1","question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Why this is correct","difficulty":"medium","topic":"${topic}"}
]}
Mix easy, medium, and hard questions. Each must have 4 options. correctAnswer is the index (0-3).`;

    try {
      const res = await sendAIChat(`You are a quiz generator. Always return valid JSON only.\n\n${prompt}`, 'course');
      const parsed = extractJSON<{ questions: QuizQuestion[] }>(res.content);
      if (!parsed?.questions?.length) throw new Error('AI returned invalid JSON for quiz questions');
      setQuestions(parsed.questions);
      setStarted(true);
    } catch (e: any) {
      setError(e.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answerIdx: number) => {
    if (submitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[currentIdx] = answerIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const total = questions.length;
    const correct = questions.reduce((acc, q, i) => acc + (userAnswers[i] === q.correctAnswer ? 1 : 0), 0);
    setScore(correct);
    setSubmitted(true);

    const user = auth.currentUser;
    if (user) {
      await recordQuizAttempt({
        userId: user.uid,
        courseId: 'general',
        title: topic,
        questions,
        userAnswers,
        score: correct,
        totalQuestions: total,
        timeSpent,
        difficulty: 'medium',
        completedAt: new Date().toISOString(),
      });
    }
  };

  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;
  const isAllAnswered = questions.every((_, i) => userAnswers[i] !== undefined);

  return (
    <div className="min-h-screen pt-28 pb-32 px-6 bg-slate-50 dark:bg-[#020617] selection:bg-emerald-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-bold mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Test Generator</h1>
                  <p className="text-slate-500 font-medium text-sm">AI-powered quiz on any topic</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Topic</label>
                  <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Quantum Physics, JavaScript Basics..." className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Number of Questions</label>
                  <input type="range" min={3} max={15} value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="w-full accent-emerald-500" />
                  <span className="text-sm font-bold text-emerald-500">{numQuestions}</span>
                </div>
                <button onClick={generateQuiz} disabled={loading || !topic.trim()} className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  {loading ? 'Generating...' : 'Generate Quiz'}
                </button>
                {error && <p className="text-red-500 font-bold text-sm bg-red-500/10 p-4 rounded-2xl">{error}</p>}
              </div>
            </motion.div>
          ) : (
            <motion.div key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-emerald-500" />
                    <span className="font-bold text-lg">{topic}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-400">{currentIdx + 1}/{questions.length}</span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
                  <motion.div className="bg-emerald-500 h-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={currentIdx} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                    <h2 className="text-xl font-bold leading-relaxed">{questions[currentIdx]?.question}</h2>
                    <div className="space-y-3">
                      {questions[currentIdx]?.options.map((opt, i) => {
                        const isSelected = userAnswers[currentIdx] === i;
                        const isCorrect = submitted && i === questions[currentIdx].correctAnswer;
                        const isWrong = submitted && isSelected && i !== questions[currentIdx].correctAnswer;
                        return (
                          <button key={i} onClick={() => handleAnswer(i)} disabled={submitted}
                            className={`w-full p-5 rounded-2xl text-left font-bold transition-all flex items-center gap-4 ${
                              isCorrect ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500 border' :
                              isWrong ? 'bg-red-500/10 text-red-600 border-red-500 border' :
                              isSelected ? 'bg-emerald-500 text-white border-emerald-500 border' :
                              'bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-emerald-500/30'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                              isCorrect ? 'bg-emerald-500 text-white' :
                              isWrong ? 'bg-red-500 text-white' :
                              isSelected ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                            }`}>{String.fromCharCode(65 + i)}</span>
                            {opt}
                            {isCorrect && <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-500" />}
                            {isWrong && <XCircle className="w-5 h-5 ml-auto text-red-500" />}
                          </button>
                        );
                      })}
                    </div>

                    {submitted && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                        <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">Explanation</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">{questions[currentIdx]?.explanation}</p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  {!submitted && currentIdx === questions.length - 1 && isAllAnswered && (
                    <button onClick={handleSubmit} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                      <Award className="w-5 h-5" /> Submit
                    </button>
                  )}

                  <button onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} disabled={currentIdx === questions.length - 1} className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {submitted && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                      <span className="text-3xl font-black text-white">{score}/{questions.length}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black mb-1">{score >= questions.length * 0.7 ? 'Great job!' : score >= questions.length * 0.4 ? 'Keep practicing!' : 'Review and try again'}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> {Math.round((score / questions.length) * 100)}%</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {Math.round(timeSpent / 60)}m</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={generateQuiz} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105">
                      <RotateCw className="w-4 h-4" /> Try Again
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;
