export function extractJSON<T>(text: string): T | null {
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) return null;

  let jsonStr = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    jsonStr = jsonStr
      .replace(/\/\/.*?(\n|$)/g, '')
      .replace(/#.*?(\n|$)/g, '')
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/([{,])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*?)'\s*([,}\]])/g, ':"$1"$2');
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      jsonStr = jsonStr
        .replace(/:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'))
        .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
      try {
        return JSON.parse(jsonStr) as T;
      } catch {
        return null;
      }
    }
  }
}
