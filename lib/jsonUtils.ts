export function extractJSON<T>(text: string): T | null {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    const fixed = jsonStr
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
      .replace(/:\s*'([^']*)'/g, ':"$1"')
      .replace(/\s+/g, ' ')
      .trim();
    try {
      return JSON.parse(fixed) as T;
    } catch {
      return null;
    }
  }
}
