// Regression tests for turning model output into something the /analysis page can render.
// Run with `npm test`. Each case is a shape a real model has returned (or is known to return).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAnalysis, parseModelOutput } from '../server/utils/coachPrompt.ts'

const LONG_VERDICT = "The player's decision quality was good, but not exceptional. They made some excellent choices, such as taking the Burning Blood and Cursed Pearl relics, and building a strong foundation with cards like Bludgeon and Inflame."

const valid = {
  verdict: 'Solid win.',
  rating: 8,
  summary: 'Good run.',
  strengths: [{ title: 'Elites', detail: 'Took elites early.', floor: 8 }],
  mistakes: [{ title: 'Bloat', detail: 'Too many cards.', floor: null }],
  keyMoments: [{ title: 'Boss', detail: 'Close.', floor: 17 }],
  tips: [{ title: 'Remove', detail: 'Remove Strikes.', floor: null }]
}

test('schema-shaped output passes through', () => {
  const a = normalizeAnalysis(valid, 48)
  assert.equal(a.strengths[0]?.title, 'Elites')
  assert.equal(a.strengths[0]?.floor, 8)
  assert.equal(a.verdict, 'Solid win.')
})

// Llama 3.3 in production (coach-v2): points came back as plain strings, so every section rendered empty.
test('points as plain strings are kept, with floors pulled from the text', () => {
  const a = normalizeAnalysis({
    ...valid,
    strengths: ['Took Burning Blood on F1, which sustained you all run.'],
    mistakes: ['Never removed a Strike after floor 12.'],
    keyMoments: ['Floor 17: the Vantom fight dropped you to 8 HP.'],
    tips: ['Heal before bosses when under half HP.']
  }, 48)
  assert.equal(a.strengths.length, 1)
  assert.equal(a.strengths[0]?.detail, 'Took Burning Blood on F1, which sustained you all run.')
  assert.equal(a.strengths[0]?.floor, 1)
  assert.equal(a.mistakes[0]?.floor, 12)
  assert.equal(a.keyMoments[0]?.floor, 17)
  assert.equal(a.tips.length, 1)
})

test('common alternative key names are understood', () => {
  const a = normalizeAnalysis({
    ...valid,
    strengths: [{ name: 'Relics', description: 'Great relic picks.', floor_number: 3 }],
    mistakes: [{ point: 'Pathing', explanation: 'Skipped elites in Act 2.' }],
    tips: [{ tip: 'Smith more often.' }]
  }, 48)
  assert.deepEqual(a.strengths[0], { title: 'Relics', detail: 'Great relic picks.', floor: 3 })
  assert.deepEqual(a.mistakes[0], { title: 'Pathing', detail: 'Skipped elites in Act 2.', floor: null })
  assert.equal(a.tips[0]?.detail, 'Smith more often.')
})

test('a section returned as an object map is treated as a list', () => {
  const a = normalizeAnalysis({ ...valid, tips: { 1: { title: 'A', detail: 'a' }, 2: { title: 'B', detail: 'b' } } }, 48)
  assert.deepEqual(a.tips.map(t => t.title), ['A', 'B'])
})

test('a paragraph-long verdict is cut to its first sentence, not mid-word', () => {
  const a = normalizeAnalysis({ ...valid, verdict: LONG_VERDICT }, 48)
  assert.equal(a.verdict, "The player's decision quality was good, but not exceptional.")
})

test('long text is clipped at a sentence or word boundary', () => {
  const detail = 'Word '.repeat(200).trim()
  const a = normalizeAnalysis({ ...valid, strengths: [{ title: 'T', detail }] }, 48)
  assert.ok(a.strengths[0]!.detail.length <= 601)
  assert.ok(a.strengths[0]!.detail.endsWith('Word…'))
})

test('floors outside the run are dropped', () => {
  const a = normalizeAnalysis({ ...valid, strengths: [{ title: 'T', detail: 'D', floor: 99 }] }, 48)
  assert.equal(a.strengths[0]?.floor, null)
})

test('an answer with no coaching points is rejected so it is not cached', () => {
  assert.throws(() => normalizeAnalysis({ verdict: LONG_VERDICT, rating: 8, summary: 'Summary only.' }, 48), /no coaching points/)
})

test('parseModelOutput handles both Workers AI response shapes', () => {
  assert.deepEqual(parseModelOutput({ response: { a: 1 } }), { a: 1 })
  assert.deepEqual(parseModelOutput({ response: '```json\n{"a":1}\n```' }), { a: 1 })
  assert.deepEqual(parseModelOutput({ choices: [{ message: { content: '{"a":1}' } }] }), { a: 1 })
})
