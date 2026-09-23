<script setup lang="ts">
import gsap from 'gsap'

defineProps<{
  title?: string
  stats: { label: string; value: string | number }[]
}>()

const card = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!card.value) return
  gsap.from(card.value, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
})
</script>

<template>
  <div ref="card" class="stat-card">
    <h3 v-if="title" class="stat-card-title">{{ title }}</h3>
    <div v-for="stat in stats" :key="stat.label" class="stat-row">
      <div class="stat-label">{{ stat.label }}</div>
      <div class="stat-value">{{ stat.value }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 20px;
  background: #1e1b2e;
  color: white;
  width: 240px;
  text-align: center;
  gap: 0.5rem;
  margin-left: auto;
  margin-right: auto;
}
.stat-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fec000;
  -webkit-text-stroke: .5px black;
  margin: 0 0 0.25rem 0;
}
.stat-row { display: flex; flex-direction: column; }
.stat-value { font-size: 1.75rem; font-weight: 700; }
.stat-label { font-size: 1.1rem; font-weight: 700; margin-top: 0.25rem; color: #fec000; -webkit-text-stroke: .5px black; }
</style>