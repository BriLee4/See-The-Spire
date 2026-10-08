// Prints exactly what the AI coach sends to the model for a run file, plus a token estimate.
// Uses the same reference data as the Worker: relics from seed.sql, cards from data/cards.json.
// Use it to iterate on server/utils/runDigest.ts and server/utils/coachPrompt.ts without deploying.
//
//   npm run digest -- public/data/1788790424.run
//   npm run digest -- public/data/1788790424.run --prompt   (include the system prompt)
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { buildRunDigest, cardIds, relicIds, toCardText, type CardText, type RelicText } from '../server/utils/runDigest.ts'
import { SYSTEM_PROMPT, PROMPT_VERSION, userPrompt } from '../server/utils/coachPrompt.ts'

const [file, ...flags] = process.argv.slice(2)
if (!file) {
  console.error('usage: npm run digest -- <path/to/file.run> [--prompt]')
  process.exit(1)
}

const run = JSON.parse(readFileSync(file, 'utf8'))

const db = new DatabaseSync(':memory:')
db.exec(readFileSync('seed.sql', 'utf8'))
const relics = new Map<string, RelicText>()
for (const id of relicIds(run)) {
  const row = db.prepare('SELECT name, description FROM relics WHERE id = ?').get(id) as RelicText | undefined
  if (row) relics.set(id, row)
}

const allCards = JSON.parse(readFileSync('data/cards.json', 'utf8')) as Record<string, unknown>[]
const byId = new Map(allCards.map(c => [String(c.id), c]))
const cards = new Map<string, CardText>()
const missing: string[] = []
for (const id of cardIds(run)) {
  const row = byId.get(id)
  if (row) cards.set(id, toCardText(row))
  else missing.push(id)
}

const { facts, text } = buildRunDigest(run, { relics, cards })
const prompt = userPrompt(text)

if (flags.includes('--prompt')) console.log(`=== SYSTEM (${PROMPT_VERSION}) ===\n${SYSTEM_PROMPT}\n`)
console.log(`=== USER ===\n${prompt}\n`)
console.log('=== FACTS ===')
console.log(JSON.stringify(facts, null, 2))
// ~4 chars per token is close enough to spot a digest that's getting too big.
console.error(`\n~${Math.round((SYSTEM_PROMPT.length + prompt.length) / 4)} input tokens · ${relics.size} relics · ${cards.size} cards`)
if (missing.length) console.error(`Cards missing from data/cards.json: ${missing.join(', ')}`)
