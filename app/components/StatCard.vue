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
  padding: .625rem;
  border-radius: 1.25rem;
  color: white;
  width:25rem;
  text-align: center;
  gap: 0.5rem;
  margin-left: auto;
  margin-right: auto;
}
.stat-card-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fec000;
  -webkit-text-stroke: .5px black;
  margin: 0 0 2rem 0;
}
.stat-row { display: flex; flex-direction: column; }
.stat-value { font-size: 2rem; font-weight: 700; }
.stat-label { font-size: 2rem; font-weight: 700; margin-top: 1rem; color: #fec000; -webkit-text-stroke: .5px black; }
</style>