<script setup lang="ts">
import gsap from 'gsap'
import type { Relic, Deck } from '~/types/run'
import { relicImageUrl, relicDisplayName, cardImageUrl, cardDisplayName } from '~/utils/assets'
const props = defineProps<{ relics: Relic[]; deck: Deck[] }>()

const card = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!card.value) return
  gsap.from(card.value, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
})

const cardCounts = computed(() => {
  const seen = new Map<string, { card: Deck; count: number }>()
  for (const c of props.deck) {
    const key = c.current_upgrade_level ? `${c.id}+` : c.id
    const existing = seen.get(key)
    if (existing) existing.count++
    else seen.set(key, { card: c, count: 1 })
  }
  return [...seen.values()]
})
const { data: relicInfo } = useFetch('/api/relics', {
  query: { ids: computed(() => props.relics.map(r => r.id).join(',')) },
})

const info = (id: string) => relicInfo.value?.[id.replace(/^RELIC\./, '')]

const stripTags = (s: string) => s.replace(/\[\/?[a-z]+\]/gi, '')

const relicName = (id: string) => info(id)?.name
const relicImage = (id: string) => info(id)?.image_url ?? 'N/A'
const relicTooltip = (id: string) => {
  const desc = info(id)?.description
  return desc ? `${relicName(id)}: ${stripTags(desc)}` : relicName(id)
}

</script>

<template>
  <div ref="card" class="relics-card">
    <section class="icon-section">
      <h3 class="section-label">Relics</h3>
      <div class="icon-grid">
        <UPopover v-for="relic in relics" :key="relic.id" mode="hover">
          <img :src="relicImage(relic.id)" :alt="relicName(relic.id)" class="icon-img-relic" />
          <template #content>
            <UCard class="relic-popover-card">
              <div class="relic-description">
                {{ relicTooltip(relic.id) }}
              </div>
            </UCard>
          </template>
        </UPopover>
      </div>
    </section>


    <section class="icon-section">
      <h3 class="section-label">Final Deck</h3>
      <div class="icon-grid">
        <div v-for="entry in cardCounts" :key="entry.card.id + (entry.card.current_upgrade_level ? '+' : '')" class="icon-wrap">
          <img
            :src="cardImageUrl(entry.card.id, !!entry.card.current_upgrade_level)"
            :alt="cardDisplayName(entry.card.id)"
            class="icon-img-card"
          />
          <span v-if="entry.count > 1" class="icon-count">{{ entry.count }}</span>
        </div>
      </div> 
    </section>
    </div>
</template>

<style scoped>
.relics-card {
  padding: 20px;
  border-radius: 20px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 4.5rem;
  padding-left: 3.125rem;
}
.section-label {
  font-size: 2em;
  font-weight: 700;
  color: #fec000;
  -webkit-text-stroke: .5px black;
  margin: 0 0 0.5rem 0;
}
.relic-popover-card {
  max-width: 200;
}
.relic-description {
  white-space: normal;
  word-break: break-word;
}
.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.icon-wrap { position: relative; }
.icon-img-relic {
  width: 3rem;
  height: 3rem;
  object-fit: contain;
  background-color: #2a2640;
  border-radius: 50%;
}

.icon-img-card {
  width: 9rem;
  height:12.5rem;
  object-fit: contain; /* Prevents stretching if the source image ratio varies slightly */
}
.icon-count {
  position: absolute;
  bottom: .25rem;
  right: .25rem;
  background: #fec000;
  color: black;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>