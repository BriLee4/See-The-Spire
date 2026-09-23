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
</script>

<template>
  <div ref="card" class="relics-card">
    <section class="icon-section">
      <h3 class="section-label">Relics</h3>
      <div class="icon-grid">
        <UTooltip 
          v-for="relic in relics" 
          :key="relic.id" 
          :text="relicDisplayName(relic.id)"
        >
          <img 
            :src="relicImageUrl(relic.id)" 
            :alt="relicDisplayName(relic.id)" 
            class="icon-img-relic" 
          />
        </UTooltip>
      </div>
    </section>

    <section class="icon-section">
      <h3 class="section-label">Final Deck</h3>
      <div class="icon-grid">
        <div v-for="entry in cardCounts" :key="entry.card.id + (entry.card.current_upgrade_level ? '+' : '')" class="icon-wrap">
          <img
            :src="cardImageUrl(entry.card.id, !!entry.card.current_upgrade_level)"
            :alt="cardDisplayName(entry.card.id)"
            :title="cardDisplayName(entry.card.id)"
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
  margin-top: 75px;
  padding-left: 50px;
}
.section-label {
  font-size: 2em;
  font-weight: 700;
  color: #fec000;
  -webkit-text-stroke: .5px black;
  margin: 0 0 0.5rem 0;
}
.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.icon-wrap { position: relative; }
.icon-img-relic {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background-color: #2a2640;
  border-radius: 50%;
}

.icon-img-card {
  width: 150px;
  height: 200px;
  object-fit: contain; /* Prevents stretching if the source image ratio varies slightly */
}
.icon-count {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: #fec000;
  color: black;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>