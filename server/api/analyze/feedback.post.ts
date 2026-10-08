import type { FeedbackRequest } from '#shared/types/runAnalysis'

// Thumbs up/down on an analysis. Recorded in three places so prompt changes can be judged:
// D1 (queryable per prompt version), AI Gateway (next to the logged prompt/response), Analytics Engine.
export default defineEventHandler(async (event) => {
  const env = useCloudflareEnv(event)
  const body = await readBody<Partial<FeedbackRequest>>(event)

  if (typeof body?.key !== 'string' || !/^[0-9a-f]{64}$/.test(body.key) || typeof body.helpful !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Expected { key, helpful }' })
  }
  const score = body.helpful ? 1 : -1

  const db = useDatabase('myDatabase')
  const row = await db
    .prepare('SELECT gateway_log_id, character, model, prompt_version FROM run_analyses WHERE key = ?')
    .get(body.key) as { gateway_log_id: string | null; character: string; model: string; prompt_version: string } | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Analysis not found' })

  await db.prepare('UPDATE run_analyses SET feedback = ? WHERE key = ?').run(score, body.key)

  if (row.gateway_log_id) {
    event.waitUntil(
      env.AI.gateway(env.AI_GATEWAY_ID)
        .patchLog(row.gateway_log_id, { feedback: score })
        .catch(err => console.warn('AI Gateway feedback failed', err))
    )
  }

  trackCoachEvent(env, 'feedback', {
    character: row.character, model: row.model, promptVersion: row.prompt_version, score
  })
  return { ok: true }
})
