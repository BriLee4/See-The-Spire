# See The Spire

Slay the Spire 2 run dashboard + AI coach. Nuxt 4 (Vue 3, Nuxt UI, Tailwind 4) served by a
Cloudflare Worker (Nitro `cloudflare_module` preset). Live at https://www.seethespire.com.

## Commands

| Task | Command |
| --- | --- |
| Dev server (bindings via nitro-cloudflare-dev, needs `wrangler login`) | `npm run dev` |
| Production build | `npm run build` |
| Build + run the real Worker locally | `npm run preview` |
| Deploy | `npm run deploy` |
| Regenerate binding types after editing `wrangler.jsonc` | `npm run cf-typegen` |
| Apply D1 migrations (remote) | `npm run db:migrate` |
| Load/refresh card data in remote D1 from `data/cards.json` | `npm run db:seed:cards` |
| Unit tests (model-output normalisation; add a case for every bad output seen in prod) | `npm test` |
| Print the exact AI prompt for a run (no deploy, no AI call) | `npm run digest -- public/data/1788790424.run --prompt` |
| Typecheck | `npx -p typescript@5 -p vue-tsc@2 vue-tsc --noEmit -p .nuxt/tsconfig.server.json` (and `tsconfig.app.json`) |

`app/pages/index.vue` has a known pre-existing type error (`size=''` on `UFileUpload`); anything else is new.

## Layout

- `app/pages/` — `index` (upload a `.run`), `dashboard` (stats, map, relics), `analysis` (AI coach).
- `app/composables/useRunFile.ts` — the uploaded run lives only in client `useState`; pages redirect to `/` without it.
- `app/types/run.ts` — shape of the game's `.run` JSON. IDs are prefixed (`CARD.`, `RELIC.`, `ENCOUNTER.`, `ACT.` …).
- `shared/types/` — types shared by app and server (`#shared/...`).
- `server/api/relics.get.ts` — relic text from D1.
- `server/api/analyze.post.ts` — AI coach. `server/api/analyze/feedback.post.ts` — thumbs up/down.
- `server/utils/runDigest.ts` — run file -> computed `RunFacts` + compact text digest for the model.
- `server/utils/coachPrompt.ts` — system prompt, JSON schema, `PROMPT_VERSION`, output normaliser.
- `migrations/` — D1 migrations (`wrangler d1 migrations`). `seed.sql` is the original relics/potions dump.
- `data/cards.json` — source card data (577 cards). `scripts/build-cards-sql.ts` turns it into `db/cards.sql`
  (generated, gitignored) with image links rewritten to our CDN: `cards/<id>.png` and `cards/<id>_plus.png`
  (`image_url_upgraded` is NULL for cards that can't upgrade). After a game patch: replace the JSON, rerun the seed.
- `public/data/*.run` — sample runs (one 48-floor Ironclad win, one 8-floor Defect loss). Use them for every check.

## Cloudflare bindings (`wrangler.jsonc`)

| Binding | Product | Used for |
| --- | --- | --- |
| `AI` | Workers AI (via AI Gateway `AI_GATEWAY_ID`) | Run analysis; gateway logs + feedback scores |
| `DB` | D1 | `relics`, `potions`, `cards`, `run_analyses` |
| `ANALYSIS_CACHE` | KV | Finished analyses, 30-day TTL |
| `RUN_ARCHIVE` | R2 | Uploaded runs at `runs/<sha256(digest)>.run`, for replaying prompt changes |
| `ANALYTICS` | Analytics Engine | Coach events; column meanings documented in `server/utils/cloudflare.ts` |
| `AI_RATE_LIMITER` | Rate Limiting | 5 uncached analyses / minute / IP |
| `ASSETS` | Static Assets | Nuxt public output |

Images are served from R2 at `runtimeConfig.public.assetBaseUrl` (cdn.seethespire.com).
Server code gets bindings with `useCloudflareEnv(event)`; D1 queries use `useDatabase('myDatabase')`.

## AI coach conventions

- Numbers are computed in `runDigest.ts`, never by the model. The prompt tells the model to trust them, and the
  page shows them in a separate "By the numbers" panel.
- **Bump `PROMPT_VERSION`** whenever the prompt, schema or digest format changes. It is part of the KV cache key, and
  feedback in D1 / AI Gateway is grouped by it, which is how we tell whether a change helped:
  `SELECT prompt_version, COUNT(*), AVG(feedback) FROM run_analyses WHERE feedback IS NOT NULL GROUP BY 1`.
- Iterate on prompts with `npm run digest` first; it runs the same pure modules the Worker uses.
- Model output is untrusted: everything goes through `normalizeAnalysis`. It accepts points as plain strings, common
  alternative keys (`description`, `tip`, ...) and object maps; cuts long text at sentence/word boundaries (a paragraph
  verdict becomes its first sentence); pulls floor numbers out of text; and throws when there are no coaching points,
  so an unusable answer is never cached. Llama 3.3 returned string points in production (`coach-v2`), which used to
  blank every section. Every new bad shape gets a case in `tests/coachPrompt.test.ts`.
- Partial answers log `AI analysis missing sections` (Workers Logs). The raw model output is in the AI Gateway logs.
- Cached answers stay broken until `PROMPT_VERSION` changes, so bump it with any fix that changes what gets stored.
- The digest includes a card reference: text for every card in the deck or offered during the run (from D1 `cards`;
  `npm run digest` reads `data/cards.json` + `seed.sql` instead, so local output matches production). Upgrades that only
  change numbers are written inline as `Deal 6→8 damage`. D1 lookups are chunked (100 bound-parameter limit).
- Current model: `@cf/openai/gpt-oss-120b` (reasoning model, Chat Completions format, strict JSON schema, 8k
  `max_tokens` to cover reasoning + answer). It replaced Llama 3.3 70B, which drifted from the schema.
- Switch models by changing `AI_MODEL` in `wrangler.jsonc` (then `npm run cf-typegen`). `buildModelRequest` /
  `parseModelOutput` handle both Workers AI shapes: Workers-native (`{ response }`, listed in `WORKERS_NATIVE_MODELS`)
  and OpenAI Chat Completions (`choices[0].message.content`, everything else). The model must support JSON schema output.

## Working agreement

- Verify against the sample runs before calling something done: `npm run build`, typecheck, `npm test`, `npm run digest`.
- After a build, run `npx nuxi prepare` before typechecking, or new server utils show up as "Cannot find name".
- End-to-end without Cloudflare credentials: run the built Worker with `wrangler dev` and bind `AI` to a local mock
  Worker (a `WorkerEntrypoint` with a `run()` method) through a service binding. That exercises D1, KV, R2 and feedback.
- UI changes: check desktop and ~390px mobile widths; match the gold (`#fec000`) heading style and Kreon font.
  Nuxt UI `neutral` button variants paint light backgrounds (the app runs in light mode), so white text on them
  disappears; style buttons on dark panels explicitly.
- Stopping a local `wrangler dev`: kill by process name (`workerd`, node running `wrangler-dist`), never
  `pkill -f wrangler` from a shell whose own command line contains "wrangler": it kills the shell.
- Keep `worker-configuration.d.ts` generated (`npm run cf-typegen`), never hand-edited.
- Roadmap context: career analytics will come from the game's progress save file (not in the repo yet). The AI coach
  is per-run today; career-level coaching should reuse `run_analyses` + the R2 archive.
