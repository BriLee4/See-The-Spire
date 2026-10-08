// Prompt + output contract for the AI coach. Pure module (no Nuxt imports) so
// scripts/preview-digest.ts can print the exact prompt.
import type { CoachAnalysis, CoachPoint } from '../../shared/types/runAnalysis'

// Bump whenever SYSTEM_PROMPT, userPrompt, the schema or the digest format changes.
// It is part of the cache key, and feedback in D1 / AI Gateway is grouped by it.
export const PROMPT_VERSION = 'coach-v1'

export const SYSTEM_PROMPT = `You are an expert Slay the Spire 2 coach reviewing one of a player's runs.
You receive a digest of the run: computed stats, the final deck and relics, and a floor-by-floor log.

How to coach:
- Ground every point in the digest. Cite floor numbers ("F12") whenever a point is about a specific floor.
- Judge decisions, not luck: card and relic picks vs. what was offered, skips, rest site heal vs smith, elite pathing, shop spending, potion use, deck size and removals.
- The "Computed stats" section is correct. Never recompute or contradict those numbers.
- Slay the Spire 2 is a new game. If you are unsure what a card does, reason from its name and the run's outcome and say so instead of inventing effects. Relic effects are given; use them.
- Be specific and direct like a good coach: name the card, the floor, the alternative. No generic advice like "play better" or "build synergy".
- If the run was won, still find what could be tighter. If it was lost, explain the most likely causes of death.
- rating is 1-10 for decision quality given the options, not for whether the run was won.

Respond with JSON only, matching the schema.`

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
  required: ['title', 'detail', 'floor']
} as const

export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', description: 'One sentence headline for the run' },
    rating: { type: 'integer', minimum: 1, maximum: 10 },
    summary: { type: 'string', description: '2-4 sentence overview' },
    strengths: { type: 'array', items: point, description: '2-4 good decisions' },
    mistakes: { type: 'array', items: point, description: '2-4 costly decisions' },
    keyMoments: { type: 'array', items: point, description: '3-5 turning points in floor order' },
    tips: { type: 'array', items: point, description: '3 actionable tips for the next run with this character' }
  },
  required: ['verdict', 'rating', 'summary', 'strengths', 'mistakes', 'keyMoments', 'tips']
} as const

// Models drift from the schema in small ways (missing fields, floor as a string, extra items).
// Coerce everything into a shape the page can render without defensive checks.
export function normalizeAnalysis(raw: unknown, floorCount: number): CoachAnalysis {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

  const floor = (v: unknown): number | null => {
    const n = typeof v === 'string' ? Number.parseInt(v.replace(/^F/i, ''), 10) : v
    return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= floorCount ? n : null
  }

  const points = (v: unknown, max: number): CoachPoint[] =>
    (Array.isArray(v) ? v : [])
      .map((p): CoachPoint => {
        const item = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>
        return { title: text(item.title, 80), detail: text(item.detail, 600), floor: floor(item.floor) }
      })
      .filter(p => p.title || p.detail)
      .slice(0, max)

  const rating = Math.round(Number(obj.rating))

  const analysis: CoachAnalysis = {
    verdict: text(obj.verdict, 200),
    rating: Number.isFinite(rating) ? Math.min(10, Math.max(1, rating)) : 5,
    summary: text(obj.summary, 1200),
    strengths: points(obj.strengths, 5),
    mistakes: points(obj.mistakes, 5),
    keyMoments: points(obj.keyMoments, 6).sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0)),
    tips: points(obj.tips, 5)
  }

  if (!analysis.summary && !analysis.strengths.length && !analysis.mistakes.length) {
    throw new Error('Model returned an empty analysis')
  }
  return analysis
}
