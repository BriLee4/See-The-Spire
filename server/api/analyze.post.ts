import type { Run } from '../../app/types/run'
import type { AnalyzeResponse } from '#shared/types/runAnalysis'
import type { CardText, RelicText } from '../utils/runDigest'

const MAX_RUN_BYTES = 2_000_000
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30

type CachedAnalysis = Omit<AnalyzeResponse, 'cached'>

// AI coach: run file in, structured feedback out.
// KV cache -> rate limit -> Workers AI (through AI Gateway) -> KV + D1 + R2 + Analytics Engine.
export default defineEventHandler(async (event): Promise<AnalyzeResponse> => {
  const env = useCloudflareEnv(event)

  if (Number(getRequestHeader(event, 'content-length') ?? 0) > MAX_RUN_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Run file is too large' })
  }
  const body = await readBody<{ run?: Run }>(event)
  const run = body?.run
  if (!run?.players?.length || !Array.isArray(run.map_point_history) || !Array.isArray(run.acts)) {
    throw createError({ statusCode: 400, statusMessage: "That doesn't look like a Slay the Spire 2 run" })
  }

  const [relics, cards] = await Promise.all([loadRelicText(relicIds(run)), loadCardText(cardIds(run))])
  const digest = buildRunDigest(run, { relics, cards })
  const { facts } = digest
  const model = env.AI_MODEL
  const runHash = await sha256(digest.text)
  const key = await sha256(`${runHash}:${PROMPT_VERSION}:${model}`)
  const tags = { character: facts.character, model, promptVersion: PROMPT_VERSION, ascension: facts.ascension, floors: facts.floorsReached }

  const cached = await env.ANALYSIS_CACHE.get<CachedAnalysis>(key, 'json')
  if (cached) {
    trackCoachEvent(env, 'cache_hit', tags)
    return { ...cached, cached: true }
  }

  // Only uncached analyses cost money, so only they count against the limit.
  const ip = getRequestHeader(event, 'cf-connecting-ip') ?? 'unknown'
  const limit = await env.AI_RATE_LIMITER?.limit({ key: ip })
  if (limit && !limit.success) {
    trackCoachEvent(env, 'rate_limited', tags)
    throw createError({ statusCode: 429, statusMessage: 'Too many analyses. Try again in a minute.' })
  }

  const started = Date.now()
  let raw: unknown
  try {
    // The input shape depends on the model (see buildModelRequest), so the per-model typings can't apply here.
    const result = await (env.AI.run as (model: string, input: unknown, options: AiOptions) => Promise<unknown>)(
      model,
      buildModelRequest(model, digest.text),
      {
        gateway: {
          id: env.AI_GATEWAY_ID,
          metadata: { key, promptVersion: PROMPT_VERSION, character: facts.character, win: facts.win }
        }
      }
    )
    raw = parseModelOutput(result)
  } catch (err) {
    trackCoachEvent(env, 'ai_error', { ...tags, latencyMs: Date.now() - started })
    console.error('AI analysis failed', err)
    throw createError({ statusCode: 502, statusMessage: 'The AI coach could not analyse this run. Please try again.' })
  }
  const latencyMs = Date.now() - started

  let analysis
  try {
    analysis = normalizeAnalysis(raw, facts.floorsReached)
  } catch (err) {
    trackCoachEvent(env, 'ai_error', { ...tags, latencyMs })
    console.error('AI analysis was unusable', err, raw)
    throw createError({ statusCode: 502, statusMessage: 'The AI coach returned an unreadable answer. Please try again.' })
  }

  const response: CachedAnalysis = { key, model, promptVersion: PROMPT_VERSION, facts, analysis }
  // Only set when the call went through AI Gateway; D1 rejects anything but a string or null.
  const gatewayLogId = typeof env.AI.aiGatewayLogId === 'string' ? env.AI.aiGatewayLogId : null

  // Persist after responding; none of this should slow the player down.
  event.waitUntil(Promise.allSettled([
    env.ANALYSIS_CACHE.put(key, JSON.stringify(response), { expirationTtl: CACHE_TTL_SECONDS }),
    env.RUN_ARCHIVE?.put(`runs/${runHash}.run`, JSON.stringify(run), {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { character: facts.character, ascension: String(facts.ascension), win: String(facts.win) }
    }),
    useDatabase('myDatabase')
      .prepare(`INSERT OR REPLACE INTO run_analyses
        (key, run_hash, character, ascension, win, floors, model, prompt_version, rating, gateway_log_id, latency_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(key, runHash, facts.character, facts.ascension, facts.win ? 1 : 0, facts.floorsReached,
        model, PROMPT_VERSION, analysis.rating, gatewayLogId, latencyMs)
  ]).then(results => results.forEach(r => r.status === 'rejected' && console.error('persist failed', r.reason))))

  trackCoachEvent(env, 'analysis', { ...tags, latencyMs, outcome: facts.win ? 'win' : 'loss', score: analysis.rating })
  return { ...response, cached: false }
})

// D1 allows at most 100 bound parameters per query; a long run can touch more cards than that.
async function selectByIds<T>(table: 'cards' | 'relics', columns: string, ids: string[]): Promise<T[]> {
  const db = useDatabase('myDatabase')
  const rows: T[] = []
  for (let i = 0; i < ids.length; i += 90) {
    const chunk = ids.slice(i, i + 90)
    const placeholders = chunk.map(() => '?').join(',')
    rows.push(...await db.prepare(`SELECT ${columns} FROM ${table} WHERE id IN (${placeholders})`).all(...chunk) as T[])
  }
  return rows
}

async function loadCardText(ids: string[]): Promise<Map<string, CardText>> {
  const rows = await selectByIds<Record<string, unknown>>('cards',
    'id, name, cost, is_x_cost, star_cost, type, rarity, description, upgrade_description, upgrade', ids)
  return new Map(rows.map(r => [String(r.id), toCardText(r)]))
}

async function loadRelicText(ids: string[]): Promise<Map<string, RelicText>> {
  const rows = await selectByIds<{ id: string } & RelicText>('relics', 'id, name, description', ids)
  return new Map(rows.map(r => [r.id, { name: r.name, description: r.description }]))
}
