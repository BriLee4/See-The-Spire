// Contract between /api/analyze and the /analysis page.

export interface CoachPoint {
  title: string
  detail: string
  floor: number | null   // floor the point refers to, if any (validated against the run)
}

// What the model writes. Normalised server-side, so every field is always present.
export interface CoachAnalysis {
  verdict: string        // one-line headline for the run
  rating: number         // 1-10 play quality, not outcome
  summary: string
  strengths: CoachPoint[]
  mistakes: CoachPoint[]
  keyMoments: CoachPoint[]
  tips: CoachPoint[]
}

// Numbers computed from the run file, never by the model. Shown next to the AI text
// so players can check the advice against the data.
export interface RunFacts {
  character: string
  ascension: number
  win: boolean
  abandoned: boolean
  killedBy: string | null
  floorsReached: number
  runTimeMinutes: number
  finalDeckSize: number
  finalRelicCount: number
  damageByAct: { act: string; damage: number }[]
  elitesFought: number
  lowestHp: { floor: number; hp: number; maxHp: number } | null
  costliestFights: { floor: number; encounter: string; damage: number }[]
  cardRewards: { seen: number; picked: number; skipped: number }
  restSites: { heal: number; smith: number; other: number }
  cardsRemoved: number
  goldSpent: number
  potionsUsed: number
}

export interface AnalyzeResponse {
  key: string            // pass back to /api/analyze/feedback
  cached: boolean
  model: string
  promptVersion: string
  facts: RunFacts
  analysis: CoachAnalysis
}

export interface FeedbackRequest {
  key: string
  helpful: boolean
}
