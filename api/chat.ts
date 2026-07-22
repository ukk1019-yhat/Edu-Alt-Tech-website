const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const config = { runtime: 'nodejs' };

// ── Rate Limiting (in-memory; resets per cold start) ──────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20;           // max requests per window per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  entry.count++;
  return { allowed: entry.count <= RATE_LIMIT_MAX, remaining: Math.max(0, RATE_LIMIT_MAX - entry.count) };
}

// ── Input Validation ──────────────────────────────────────────────
const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 4000;

interface ChatRequest {
  messages: { role: string; content: string }[];
  model?: string;
}

function sanitizeMessage(content: string): string {
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
}

function validateMessages(messages: { role: string; content: string }[]): boolean {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return false;
  const validRoles = ['user', 'assistant', 'system'];
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') return false;
    if (!validRoles.includes(msg.role)) return false;
    if (typeof msg.content !== 'string') return false;
    if (msg.content.length > MAX_CONTENT_LENGTH) return false;
  }
  return true;
}

export default async function handler(req: any, res: any) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Method check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const { allowed, remaining } = rateLimit(ip);
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // API key check
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service is not configured.' });
  }

  // Body parsing & validation
  const { messages, model } = req.body as ChatRequest;
  if (!validateMessages(messages)) {
    return res.status(400).json({ error: 'Invalid request format.' });
  }

  const sanitizedMessages = messages.map(msg => ({
    role: msg.role,
    content: sanitizeMessage(msg.content),
  }));

  if (sanitizedMessages.some(m => m.content.length === 0)) {
    return res.status(400).json({ error: 'Messages cannot be empty.' });
  }

  const selectedModel = model || process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free';

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: sanitizedMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: 'AI service request failed.' });
    }

    return res.status(200).json({
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage || null,
    });
  } catch {
    return res.status(502).json({ error: 'Failed to communicate with AI provider.' });
  }
}
