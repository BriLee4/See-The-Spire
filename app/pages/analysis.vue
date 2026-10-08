<script setup lang="ts">
import gsap from 'gsap'
import type { AnalyzeResponse, CoachPoint } from '#shared/types/runAnalysis'
import { titleCase } from '~/utils/text'

const runFile = useRunFile()
const result = ref<AnalyzeResponse | null>(null)
const errorMessage = ref('')
const loading = ref(false)
const feedback = ref<'up' | 'down' | null>(null)
const content = ref<HTMLElement | null>(null)

async function analyze() {
  if (!runFile.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    result.value = await $fetch<AnalyzeResponse>('/api/analyze', {
      method: 'POST',
      body: { run: runFile.value.data }
    })
    await nextTick()
    if (content.value) {
      gsap.from(content.value.querySelectorAll('.coach-panel'), { opacity: 0, y: 20, duration: 0.5, stagger: 0.08, ease: 'power2.out' })
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage ?? err?.statusMessage ?? 'Something went wrong while analysing your run.'
  } finally {
    loading.value = false
  }
}

async function sendFeedback(helpful: boolean) {
  if (!result.value || feedback.value) return
  feedback.value = helpful ? 'up' : 'down'
  try {
    await $fetch('/api/analyze/feedback', { method: 'POST', body: { key: result.value.key, helpful } })
  } catch {
    feedback.value = null
  }
}

onMounted(async () => {
  if (!runFile.value) {
    await navigateTo('/')
    return
  }
  await analyze()
})

const facts = computed(() => result.value?.facts)
const analysis = computed(() => result.value?.analysis)

const factRows = computed(() => {
  const f = facts.value
  if (!f) return []
  return [
    { label: 'Result', value: f.win ? 'Victory' : f.abandoned ? 'Abandoned' : `Died${f.killedBy ? ` to ${titleCase(f.killedBy)}` : ''}` },
    { label: 'Floors', value: f.floorsReached },
    { label: 'Damage by act', value: f.damageByAct.map(a => a.damage).join(' / ') },
    { label: 'Lowest HP', value: f.lowestHp ? `${f.lowestHp.hp}/${f.lowestHp.maxHp} (F${f.lowestHp.floor})` : '—' },
    { label: 'Elites fought', value: f.elitesFought },
    { label: 'Card rewards taken', value: `${f.cardRewards.picked}/${f.cardRewards.seen}` },
    { label: 'Rest: heal / smith', value: `${f.restSites.heal} / ${f.restSites.smith}` },
    { label: 'Cards removed', value: f.cardsRemoved },
    { label: 'Gold spent', value: f.goldSpent },
    { label: 'Potions used', value: f.potionsUsed },
    { label: 'Final deck', value: `${f.finalDeckSize} cards` }
  ]
})

const sections = computed<{ title: string; tone: string; points: CoachPoint[] }[]>(() => {
  const a = analysis.value
  if (!a) return []
  return [
    { title: 'What went well', tone: 'good', points: a.strengths },
    { title: 'What cost you', tone: 'bad', points: a.mistakes },
    { title: 'Tips for next run', tone: 'tip', points: a.tips }
  ].filter(section => section.points.length)
})
</script>

<template>
  <div class="page-container">
    <main class="analysis-page">
      <div class="top-bar">
        <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" to="/dashboard">
          Dashboard
        </UButton>
      </div>

      <header class="analysis-header">
        <h1>See<span class="highlight">The</span>Spire <span class="subtitle">Coach</span></h1>
        <p v-if="facts" class="run-line">
          {{ titleCase(facts.character) }} · Ascension {{ facts.ascension }} · {{ facts.runTimeMinutes }} min
        </p>
      </header>

      <section v-if="loading" class="coach-panel loading-panel">
        <p class="loading-text">The coach is reviewing your run floor by floor…</p>
        <USkeleton v-for="n in 4" :key="n" class="h-6 w-full bg-white/10" />
      </section>

      <section v-else-if="errorMessage" class="coach-panel error-panel">
        <p>{{ errorMessage }}</p>
        <UButton color="secondary" @click="analyze">Try again</UButton>
      </section>

      <div v-else-if="analysis && facts" ref="content" class="analysis-grid">
        <aside class="coach-panel facts-panel">
          <h2 class="section-label">By the numbers</h2>
          <p class="panel-note">Computed from your run file, not by AI.</p>
          <dl>
            <div v-for="row in factRows" :key="row.label" class="fact-row">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
          <div v-if="facts.costliestFights.length" class="costly">
            <h3>Costliest fights</h3>
            <p v-for="fight in facts.costliestFights" :key="fight.floor">
              <span class="floor-chip">F{{ fight.floor }}</span> {{ titleCase(fight.encounter) }} <span class="dmg">-{{ fight.damage }}</span>
            </p>
          </div>
        </aside>

        <section class="main-column">
          <div class="coach-panel verdict-panel">
            <div class="rating" :title="'Decision quality, not outcome'">
              <span class="rating-value">{{ analysis.rating }}</span><span class="rating-max">/10</span>
            </div>
            <div>
              <h2 class="verdict">{{ analysis.verdict }}</h2>
              <p class="summary">{{ analysis.summary }}</p>
            </div>
          </div>

          <div v-if="sections.length" class="point-columns" :style="{ '--columns': sections.length }">
            <div v-for="section in sections" :key="section.title" class="coach-panel" :class="`tone-${section.tone}`">
              <h2 class="section-label">{{ section.title }}</h2>
              <ul class="points">
                <li v-for="(point, i) in section.points" :key="i">
                  <p v-if="point.title || point.floor" class="point-title">
                    <span v-if="point.floor" class="floor-chip">F{{ point.floor }}</span>{{ point.title }}
                  </p>
                  <p v-if="point.detail" class="point-detail">{{ point.detail }}</p>
                </li>
              </ul>
            </div>
          </div>

          <div v-if="analysis.keyMoments.length" class="coach-panel">
            <h2 class="section-label">Key moments</h2>
            <ol class="timeline">
              <li v-for="(moment, i) in analysis.keyMoments" :key="i">
                <span class="floor-chip">{{ moment.floor ? `F${moment.floor}` : '•' }}</span>
                <div>
                  <p v-if="moment.title" class="point-title">{{ moment.title }}</p>
                  <p v-if="moment.detail" class="point-detail">{{ moment.detail }}</p>
                </div>
              </li>
            </ol>
          </div>

          <div class="coach-panel feedback-panel">
            <span>Was this useful?</span>
            <UButton
              icon="i-heroicons-hand-thumb-up"
              variant="ghost"
              class="feedback-button"
              :class="{ selected: feedback === 'up' }"
              color="neutral"
              :disabled="!!feedback"
              @click="sendFeedback(true)"
            >
              Yes
            </UButton>
            <UButton
              icon="i-heroicons-hand-thumb-down"
              variant="ghost"
              class="feedback-button"
              :class="{ selected: feedback === 'down' }"
              color="neutral"
              :disabled="!!feedback"
              @click="sendFeedback(false)"
            >
              No
            </UButton>
            <span v-if="feedback" class="panel-note">Thanks, this helps tune the coach.</span>
            <span class="model-note">
              AI-generated with Cloudflare Workers AI · {{ result?.cached ? 'cached' : 'fresh' }} · {{ result?.promptVersion }}
            </span>
          </div>
        </section>
      </div>
    </main>

    <UFooter>
      <template #default>
        <div class="flex justify-center items-center">
          <UButton
            label="Powered by Cloudflare Workers AI"
            icon="i-devicon-cloudflare"
            trailing
            color="neutral"
            variant="ghost"
            to="https://www.cloudflare.com/developer-platform/products/workers-ai/"
            aria-label="Cloudflare Workers AI"
            class="scale-150"
          />
        </div>
      </template>
    </UFooter>
  </div>
</template>

<style scoped>
.page-container {
  background-image: url("/imgs/overgrowth.webp");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.analysis-page {
  flex: 1;
  color: white;
  padding: 2rem;
  max-width: 110rem;
  width: 100%;
  margin: 0 auto;
  font-size: 1.4rem;
}
.top-bar { margin-bottom: 1rem; }
.analysis-header { text-align: center; margin-bottom: 2rem; }
.analysis-header h1 { font-size: 2.5rem; }
.subtitle { color: white; font-size: 0.8em; }
.run-line { font-size: 1.5rem; opacity: 0.9; }
.highlight { color: #fec000; -webkit-text-stroke: .5px black; }

.coach-panel {
  background: rgba(20, 16, 32, 0.78);
  border: 1px solid rgba(254, 192, 0, 0.25);
  border-radius: 1.25rem;
  padding: 1.5rem;
  backdrop-filter: blur(4px);
}
.section-label {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fec000;
  -webkit-text-stroke: .5px black;
  margin-bottom: 0.75rem;
}
.panel-note { font-size: 1rem; opacity: 0.7; }

.loading-panel, .error-panel {
  max-width: 50rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
.loading-text { font-size: 1.6rem; }

.analysis-grid {
  display: grid;
  grid-template-columns: 22rem 1fr;
  gap: 1.5rem;
  align-items: start;
}
.main-column { display: flex; flex-direction: column; gap: 1.5rem; }

.facts-panel dl { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
.fact-row { display: flex; justify-content: space-between; gap: 1rem; }
.fact-row dt { color: #fec000; }
.fact-row dd { font-weight: 700; text-align: right; }
.costly { margin-top: 1.25rem; }
.costly h3 { color: #fec000; margin-bottom: 0.5rem; }
.dmg { color: #f87171; font-weight: 700; }

.verdict-panel { display: flex; gap: 1.5rem; align-items: center; }
.rating {
  flex-shrink: 0;
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  border: 3px solid #fec000;
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 1.6rem;
}
.rating-value { font-size: 3rem; font-weight: 700; color: #fec000; -webkit-text-stroke: .5px black; }
.rating-max { font-size: 1.2rem; opacity: 0.8; }
.verdict { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
.summary { line-height: 1.5; }

.point-columns { display: grid; grid-template-columns: repeat(var(--columns, 3), 1fr); gap: 1.5rem; }
.tone-good { border-color: rgba(74, 222, 128, 0.45); }
.tone-bad { border-color: rgba(248, 113, 113, 0.45); }
.tone-tip { border-color: rgba(96, 165, 250, 0.45); }
.points { display: flex; flex-direction: column; gap: 1rem; }
.point-title { font-weight: 700; }
.point-detail { line-height: 1.45; opacity: 0.92; font-size: 1.25rem; }

.floor-chip {
  display: inline-block;
  background: #fec000;
  color: black;
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: 0.5rem;
  padding: 0 0.45rem;
  margin-right: 0.5rem;
  min-width: 2.6rem;
  text-align: center;
}
.timeline { display: flex; flex-direction: column; gap: 1rem; }
.timeline li { display: flex; gap: 0.5rem; align-items: flex-start; }

.feedback-panel { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding: 1rem 1.5rem; }
.feedback-button {
  color: white;
  font-size: 1.1rem;
  padding-inline: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.feedback-button:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); }
.feedback-button.selected { background: #fec000; border-color: #fec000; color: black; opacity: 1; }
.model-note { margin-left: auto; font-size: 1rem; opacity: 0.6; }

@media (max-width: 1100px) {
  .point-columns { grid-template-columns: 1fr; }
}
@media (max-width: 800px) {
  .analysis-page { padding: 1rem; font-size: 1.6rem; }
  .analysis-grid { grid-template-columns: 1fr; }
  .verdict-panel { flex-direction: column; text-align: center; }
}
</style>
