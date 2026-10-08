import type { H3Event } from 'h3'

// Bindings from wrangler.jsonc. Present in production and in `nuxt dev` via nitro-cloudflare-dev.
export function useCloudflareEnv(event: H3Event): Env {
  const env = event.context.cloudflare?.env as unknown as Env | undefined
  if (!env) {
    throw createError({ statusCode: 503, statusMessage: 'Cloudflare bindings are not available in this environment' })
  }
  return env
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export type CoachEvent = 'analysis' | 'cache_hit' | 'rate_limited' | 'ai_error' | 'feedback'

// One row per AI coach event in Workers Analytics Engine (dataset see_the_spire_events).
// blob1 = event, blob2 = character, blob3 = model, blob4 = prompt version, blob5 = outcome
// double1 = latency ms, double2 = ascension, double3 = floors, double4 = rating / feedback
export function trackCoachEvent(env: Env, event: CoachEvent, data: {
  character?: string
  model?: string
  promptVersion?: string
  outcome?: string
  latencyMs?: number
  ascension?: number
  floors?: number
  score?: number
}) {
  try {
    env.ANALYTICS?.writeDataPoint({
      indexes: [event],
      blobs: [event, data.character ?? '', data.model ?? '', data.promptVersion ?? '', data.outcome ?? ''],
      doubles: [data.latencyMs ?? 0, data.ascension ?? 0, data.floors ?? 0, data.score ?? 0]
    })
  } catch (err) {
    // Analytics must never break a request.
    console.warn('analytics write failed', err)
  }
}
