const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatRequest {
  messages: { role: string; content: string }[];
  model?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Must use POST.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured in environment variables.' });
  }

  const { messages, model } = req.body as ChatRequest;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required in the body' });
  }

  const selectedModel = model || process.env.VITE_OPENROUTER_MODEL || 'google/gemma-3-27b-it';

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.origin || 'https://edu-alt-tech.vercel.app',
        'X-Title': 'Edu-Alt-Tech',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'OpenRouter API request failed' });
    }

    return res.status(200).json({
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage || null,
    });
  } catch (error: any) {
    console.error('Error calling OpenRouter:', error);
    return res.status(500).json({ error: error.message || 'Failed to communicate with AI provider' });
  }
}
