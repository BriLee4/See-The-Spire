// Prompt + output contract for the AI coach. Pure module (no Nuxt imports) so
// scripts/preview-digest.ts can print the exact prompt.
import type { CoachAnalysis, CoachPoint } from '../../shared/types/runAnalysis'

// Bump whenever SYSTEM_PROMPT, userPrompt, the schema or the digest format changes.
// It is part of the cache key, and feedback in D1 / AI Gateway is grouped by it.
export const PROMPT_VERSION = 'coach-v3'

export const SYSTEM_PROMPT = `You are an expert Slay the Spire 2 coach reviewing one of a player's runs.
You receive a digest of the run: computed stats, the final deck and relics, a card reference with the text of
every card the player had or was offered, and a floor-by-floor log.

How to coach:
- Ground every point in the digest. Cite floor numbers ("F12") whenever a point is about a specific floor.
- Judge decisions, not luck: card and relic picks vs. what was offered, skips, rest site heal vs smith, elite pathing, shop spending, potion use, deck size and removals.
- The "Computed stats" section is correct. Never recompute or contradict those numbers.
- Slay the Spire 2 is a new game, so your memory of Slay the Spire 1 cards is not reliable. Use only the card reference and relic text
  for what things do. When judging a pick, compare the text of the card taken against the cards passed on, given the deck at that point.
- Upgrades: "a→b" in the card reference means the base value a becomes b when upgraded. Judge smith choices with that.
- Be specific and direct like a good coach: name the card, the floor, the alternative. No generic advice like "play better" or "build synergy".
- If the run was won, still find what could be tighter. If it was lost, explain the most likely causes of death.
- rating is 1-10 for decision quality given the options, not for whether the run was won.
- Talk to the player directly ("you took...", "your deck..."), never "the player".

Output format: one JSON object, nothing else. verdict is ONE sentence of at most 20 words. summary is 2-4 sentences.
Every item in strengths, mistakes, keyMoments and tips must be an object with exactly "title" (under 8 words),
"detail" (1-3 sentences) and "floor" (a floor number, or null). Never use plain strings for these items.
Give 2-4 strengths, 2-4 mistakes, 3-5 keyMoments in floor order, and 3 tips. Example of the shape:
{"verdict":"A clean A7 win held back by a slow Act 2.","rating":7,"summary":"...",
 "strengths":[{"title":"Early elite aggression","detail":"Fighting Byrdonis on F8 at full HP won you Vajra early.","floor":8}],
 "mistakes":[{"title":"No card removal","detail":"...","floor":null}],
 "keyMoments":[{"title":"...","detail":"...","floor":17}],
 "tips":[{"title":"...","detail":"...","floor":null}]}`

export function userPrompt(digest: string): string {
  return `Review this run.\n\n${digest}`
}

const point = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Short label, under 8 words' },
    detail: { type: 'string', description: '1-3 sentences' },
    floor: { type: ['integer', 'null'], description: 'Floor number this is about, or null' }
  },
  required: ['title', 'detail', 'floor'],
  additionalProperties: false
} as const

export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', description: 'ONE sentence, at most 20 words' },
    rating: { type: 'integer', minimum: 1, maximum: 10 },
    summary: { type: 'string', description: '2-4 sentence overview' },
    strengths: { type: 'array', items: point, description: '2-4 good decisions' },
    mistakes: { type: 'array', items: point, description: '2-4 costly decisions' },
    keyMoments: { type: 'array', items: point, description: '3-5 turning points in floor order' },
    tips: { type: 'array', items: point, description: '3 actionable tips for the next run with this character' }
  },
  required: ['verdict', 'rating', 'summary', 'strengths', 'mistakes', 'keyMoments', 'tips'],
  additionalProperties: false
} as const

// Models drift from the schema: points as plain strings, other key names ("description", "tip"), sections as
// objects instead of arrays, paragraph-long verdicts. Llama 3.3 did all of these in production. Accept what we can,
// coerce it into the shape the page renders, and reject answers with nothing to show (so they aren't cached).
const TITLE_KEYS = ['title', 'name', 'heading', 'label', 'point', 'headline']
const DETAIL_KEYS = ['detail', 'details', 'description', 'explanation', 'text', 'reason', 'advice', 'tip', 'content', 'body', 'why']
const FLOOR_KEYS = ['floor', 'floorNumber', 'floor_number', 'floorNum']

// Cut at the last sentence end that keeps most of the text, else the last word, never mid-word.
function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  if (sentenceEnd > max * 0.5) return cut.slice(0, sentenceEnd + 1)
  const space = cut.lastIndexOf(' ')
  return `${cut.slice(0, space > 0 ? space : max).replace(/[\s,;:]+$/, '')}…`
}

function firstSentence(text: string): string {
  const match = /^.+?[.!?](?=\s|$)/.exec(text)
  return match ? match[0] : text
}

export function normalizeAnalysis(raw: unknown, floorCount: number): CoachAnalysis {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
  const pick = (item: Record<string, unknown>, keys: string[]) => keys.map(k => str(item[k])).find(Boolean) ?? ''

  const validFloor = (n: number) => (Number.isInteger(n) && n >= 1 && n <= floorCount ? n : null)
  const floor = (v: unknown): number | null => {
    if (typeof v === 'number') return validFloor(v)
    if (typeof v === 'string') return validFloor(Number.parseInt(v.replace(/^F(loor)?\s*/i, ''), 10))
    return null
  }
  // "on F12", "Floor 12", "floor 12:" in free text.
  const floorInText = (text: string) => {
    const match = /\b(?:F|floor\s*)(\d{1,2})\b/i.exec(text)
    return match ? validFloor(Number(match[1])) : null
  }

  const toPoint = (p: unknown): CoachPoint => {
    if (typeof p === 'string') {
      const detail = p.trim()
      return { title: '', detail: clip(detail, 600), floor: floorInText(detail) }
    }
    const item = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>
    let title = pick(item, TITLE_KEYS)
    let detail = pick(item, DETAIL_KEYS)
    if (!title && !detail) {
      // Unknown keys: use the longest string value as the detail.
      detail = Object.values(item).map(str).sort((x, y) => y.length - x.length)[0] ?? ''
    }
    if (title.length > 80 && !detail) [title, detail] = ['', title]
    const explicitFloor = FLOOR_KEYS.map(k => floor(item[k])).find(f => f !== null) ?? null
    return {
      title: clip(title, 80),
      detail: clip(detail, 600),
      floor: explicitFloor ?? floorInText(`${title} ${detail}`)
    }
  }

  const points = (v: unknown, max: number): CoachPoint[] => {
    const list = Array.isArray(v) ? v
      : typeof v === 'string' ? v.split(/\n+/).map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')).filter(Boolean)
      : v && typeof v === 'object' ? Object.values(v)
      : []
    return list.map(toPoint).filter(p => p.title || p.detail).slice(0, max)
  }

  const rating = Math.round(Number(obj.rating))
  const verdict = str(obj.verdict ?? obj.headline)

  const analysis: CoachAnalysis = {
    // The verdict is a one-line headline; models sometimes write a paragraph.
    verdict: clip(verdict.length > 140 ? firstSentence(verdict) : verdict, 200),
    rating: Number.isFinite(rating) ? Math.min(10, Math.max(1, rating)) : 5,
    summary: clip(str(obj.summary ?? obj.overview), 1200),
    strengths: points(obj.strengths, 5),
    mistakes: points(obj.mistakes ?? obj.weaknesses, 5),
    keyMoments: points(obj.keyMoments ?? obj.key_moments, 6).sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0)),
    tips: points(obj.tips, 5)
  }

  if (!analysis.strengths.length && !analysis.mistakes.length && !analysis.tips.length) {
    throw new Error(`Model returned no coaching points (keys: ${Object.keys(obj).join(', ') || 'none'})`)
  }
  return analysis
}

// Workers AI has two request/response shapes. The older Workers-native models take a bare schema and return
// `{ response }`; newer models (gpt-oss, Kimi, GLM, DeepSeek, Qwen 3.x, ...) use OpenAI Chat Completions and
// return `{ choices: [{ message: { content } }] }`. Anything not listed here is treated as Chat Completions.
const WORKERS_NATIVE_MODELS = new Set([
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-4-scout-17b-16e-instruct',
  '@cf/qwen/qwen3-30b-a3b-fp8'
])

export function buildModelRequest(model: string, digest: string): Record<string, unknown> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt(digest) }
  ]
  if (WORKERS_NATIVE_MODELS.has(model)) {
    return {
      messages,
      response_format: { type: 'json_schema', json_schema: ANALYSIS_SCHEMA },
      max_tokens: 2048,
      temperature: 0.4
    }
  }
  return {
    messages,
    response_format: { type: 'json_schema', json_schema: { name: 'run_analysis', schema: ANALYSIS_SCHEMA, strict: true } },
    // Reasoning models spend output tokens thinking before they answer; leave room for both.
    max_tokens: 8192,
    temperature: 0.4
  }
}

// Pulls the analysis object out of either response shape. Some models return the JSON as a string,
// occasionally wrapped in a ```json fence.
export function parseModelOutput(result: unknown): unknown {
  const r = (result ?? {}) as { response?: unknown; choices?: { message?: { content?: unknown } }[] }
  const payload = r.response ?? r.choices?.[0]?.message?.content
  if (payload === undefined || payload === null) throw new Error('Model returned no content')
  if (typeof payload !== 'string') return payload
  const text = payload.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
  return JSON.parse(text)
}
