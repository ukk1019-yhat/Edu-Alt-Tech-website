const STORAGE_KEY_PREFIX = 'chat_read_';

export function getLastReadTimestamps(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function markCourseRead(userId: string, courseId: string) {
  const timestamps = getLastReadTimestamps(userId);
  timestamps[courseId] = new Date().toISOString();
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(timestamps));
}

export function computeUnreadCount(messages: any[], courseId: string, userId: string): number {
  const timestamps = getLastReadTimestamps(userId);
  const lastRead = timestamps[courseId];
  if (!lastRead) return messages.length;
  return messages.filter((m: any) => {
    const ts = m.createdAt || m.created_at || m.timestamp;
    return ts && new Date(ts).toISOString() > lastRead;
  }).length;
}
