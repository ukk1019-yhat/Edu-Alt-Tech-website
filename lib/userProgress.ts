import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { QuizAttempt, UserMetrics, AdaptiveLevel } from '../types';
import { trackActivity } from './analytics';

const METRICS_COLLECTION = 'user_metrics';

export async function getOrCreateMetrics(userId: string, courseId: string, totalModules: number = 1): Promise<UserMetrics> {
  const ref = doc(db, METRICS_COLLECTION, `${userId}_${courseId}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as unknown as UserMetrics;
  }
  const data: Omit<UserMetrics, 'id'> = {
    userId,
    courseId,
    avgScore: 0,
    totalTimeSpent: 0,
    completedModules: 0,
    totalModules,
    quizAttempts: 0,
    currentDifficulty: 'beginner',
    strengths: [],
    weaknesses: [],
    lastActivityAt: serverTimestamp(),
    engagementScore: 0,
    consistencyScore: 0,
    predictedDropoutRisk: 'low',
    recommendations: [],
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data } as UserMetrics;
}

export async function recordQuizAttempt(
  attempt: Omit<QuizAttempt, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'quiz_attempts'), {
    ...attempt,
    completedAt: serverTimestamp(),
  });
  await trackActivity(attempt.userId, 'quiz_attempt', attempt.courseId, {
    score: attempt.score,
    total: attempt.totalQuestions,
    title: attempt.title,
  });
  await updateMetricsFromQuiz(attempt.userId, attempt.courseId);
  return ref.id;
}

export async function updateMetricsFromQuiz(userId: string, courseId: string): Promise<void> {
  const q = query(
    collection(db, 'quiz_attempts'),
    where('userId', '==', userId),
    where('courseId', '==', courseId)
  );
  const snap = await getDocs(q);
  const attempts = snap.docs.map(d => d.data() as QuizAttempt);

  if (attempts.length === 0) return;

  const avgScore = attempts.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / attempts.length;
  const allMistakes: string[] = [];
  const allCorrect: string[] = [];

  for (const a of attempts) {
    for (let i = 0; i < a.questions.length; i++) {
      const q = a.questions[i];
      const isCorrect = a.userAnswers[i] === q.correctAnswer;
      if (isCorrect && q.topic) allCorrect.push(q.topic);
      else if (!isCorrect && q.topic) allMistakes.push(q.topic);
    }
  }

  const weaknessCounts: Record<string, number> = {};
  allMistakes.forEach(t => { weaknessCounts[t] = (weaknessCounts[t] || 0) + 1; });
  const strengthCounts: Record<string, number> = {};
  allCorrect.forEach(t => { strengthCounts[t] = (strengthCounts[t] || 0) + 1; });

  const weaknesses = Object.entries(weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
  const strengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  let difficulty: AdaptiveLevel = 'beginner';
  if (avgScore >= 75) difficulty = 'advanced';
  else if (avgScore >= 50) difficulty = 'intermediate';

  const ref = doc(db, METRICS_COLLECTION, `${userId}_${courseId}`);
  await updateDoc(ref, {
    avgScore,
    quizAttempts: attempts.length,
    currentDifficulty: difficulty,
    strengths,
    weaknesses,
    lastActivityAt: serverTimestamp(),
  });
}

export async function recordModuleComplete(userId: string, courseId: string): Promise<void> {
  const ref = doc(db, METRICS_COLLECTION, `${userId}_${courseId}`);
  await updateDoc(ref, {
    completedModules: increment(1),
    lastActivityAt: serverTimestamp(),
  });
  await trackActivity(userId, 'module_complete', courseId);
}

export async function recordTimeSpent(userId: string, courseId: string, seconds: number): Promise<void> {
  const ref = doc(db, METRICS_COLLECTION, `${userId}_${courseId}`);
  await updateDoc(ref, {
    totalTimeSpent: increment(seconds),
    lastActivityAt: serverTimestamp(),
  });
}

export async function getUserQuizAttempts(userId: string, courseId: string): Promise<QuizAttempt[]> {
  try {
    const q = query(
      collection(db, 'quiz_attempts'),
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      orderBy('completedAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizAttempt));
  } catch {
    return [];
  }
}
