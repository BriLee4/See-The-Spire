// Prints exactly what the AI coach sends to the model for a run file, plus token estimate.
// Use it to iterate on server/utils/runDigest.ts and server/utils/coachPrompt.ts without deploying.
//
//   npm run digest -- public/data/1788790424.run
//   npm run digest -- public/data/1788790424.run --prompt   (include the system prompt)
import { readFileSync } from 'node:fs'
import { buildRunDigest } from '../server/utils/runDigest.ts'
import { SYSTEM_PROMPT, PROMPT_VERSION, userPrompt } from '../server/utils/coachPrompt.ts'

const [file, ...flags] = process.argv.slice(2)
if (!file) {
  console.error('usage: npm run digest -- <path/to/file.run> [--prompt]')
  process.exit(1)
}

const run = JSON.parse(readFileSync(file, 'utf8'))
const { facts, text } = buildRunDigest(run)
const prompt = userPrompt(text)

if (flags.includes('--prompt')) console.log(`=== SYSTEM (${PROMPT_VERSION}) ===\n${SYSTEM_PROMPT}\n`)
console.log(`=== USER ===\n${prompt}\n`)
console.log('=== FACTS ===')
console.log(JSON.stringify(facts, null, 2))
// ~4 chars per token is close enough to spot a digest that's getting too big.
console.error(`\n~${Math.round((SYSTEM_PROMPT.length + prompt.length) / 4)} input tokens (relic descriptions come from D1 at runtime and are not included here)`)
