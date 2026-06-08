import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import type { LearningPath, LearningPathModule, UserMetrics, AdaptiveLevel } from '../types';
import { sendAIChat } from './ai';

const PATHS_COLLECTION = 'learning_paths';

export async function generateLearningPath(
  userId: string,
  courseId: string,
  courseTitle: string,
  courseDescription: string,
  goal: string,
  currentLevel: AdaptiveLevel = 'beginner'
): Promise<LearningPath> {
  const prompt = `Generate a personalized learning roadmap for a student taking "${courseTitle}".
Course description: ${courseDescription}
Student's goal: ${goal}
Current level: ${currentLevel}

You are a learning path designer. Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "modules": [
    {
      "title": "Module title",
      "description": "Brief description",
      "order": 1,
      "estimatedHours": 2,
      "prerequisites": ["prerequisite topic"],
      "topics": ["topic1", "topic2"]
    }
  ]
}
Generate 5-8 modules suitable for a ${currentLevel} learner.`;

  const res = await sendAIChat(prompt, 'course');
  const cleaned = res.content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let modules: LearningPathModule[];
  try {
    const parsed = JSON.parse(cleaned);
    modules = (parsed.modules || parsed).map((m: any, i: number) => ({
      moduleId: `gen_${i + 1}`,
      title: m.title,
      description: m.description || '',
      order: m.order || i + 1,
      status: 'pending' as const,
      estimatedHours: m.estimatedHours || 2,
      prerequisites: m.prerequisites || [],
      topics: m.topics || [],
    }));
  } catch {
    modules = [
      { moduleId: 'gen_1', title: 'Getting Started', description: 'Introduction to the course', order: 1, status: 'pending', estimatedHours: 2 },
      { moduleId: 'gen_2', title: 'Core Concepts', description: 'Fundamental topics', order: 2, status: 'pending', estimatedHours: 3 },
      { moduleId: 'gen_3', title: 'Advanced Topics', description: 'Deep dive into advanced material', order: 3, status: 'pending', estimatedHours: 4 },
    ];
  }

  const pathData: Omit<LearningPath, 'id'> = {
    userId,
    courseId,
    goal,
    modules,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentDifficulty: currentLevel,
  };

  const ref = doc(db, PATHS_COLLECTION, `${userId}_${courseId}`);
  await setDoc(ref, pathData);
  return { id: ref.id, ...pathData } as LearningPath;
}

export async function getLearningPath(userId: string, courseId: string): Promise<LearningPath | null> {
  try {
    const ref = doc(db, PATHS_COLLECTION, `${userId}_${courseId}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as LearningPath;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateModuleStatus(
  userId: string,
  courseId: string,
  moduleId: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<void> {
  const ref = doc(db, PATHS_COLLECTION, `${userId}_${courseId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const path = snap.data() as LearningPath;
  const updatedModules = path.modules.map(m =>
    m.moduleId === moduleId ? { ...m, status } : m
  );

  await updateDoc(ref, {
    modules: updatedModules,
    updatedAt: new Date().toISOString(),
  });
}

export async function adaptDifficulty(
  userId: string,
  courseId: string,
  metrics: UserMetrics
): Promise<AdaptiveLevel> {
  let newLevel: AdaptiveLevel = metrics.currentDifficulty;

  if (metrics.avgScore >= 80 && metrics.completedModules >= 2) {
    newLevel = 'advanced';
  } else if (metrics.avgScore >= 55 && metrics.completedModules >= 1) {
    newLevel = 'intermediate';
  } else {
    newLevel = 'beginner';
  }

  if (newLevel !== metrics.currentDifficulty) {
    const ref = doc(db, 'user_metrics', `${userId}_${courseId}`);
    await updateDoc(ref, { currentDifficulty: newLevel });
  }

  return newLevel;
}
