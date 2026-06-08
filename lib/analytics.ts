import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import type { ActivityType, UserActivity } from '../types';

export async function trackActivity(
  userId: string,
  type: ActivityType,
  courseId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await addDoc(collection(db, 'user_activities'), {
      userId,
      type,
      courseId: courseId || null,
      metadata: metadata || {},
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Analytics track failed:', e);
  }
}

export async function getUserActivities(
  userId: string,
  max: number = 50
): Promise<UserActivity[]> {
  try {
    const q = query(
      collection(db, 'user_activities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserActivity));
  } catch {
    return [];
  }
}

export async function getCourseActivities(
  courseId: string,
  max: number = 100
): Promise<UserActivity[]> {
  try {
    const q = query(
      collection(db, 'user_activities'),
      where('courseId', '==', courseId),
      orderBy('timestamp', 'desc'),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserActivity));
  } catch {
    return [];
  }
}
