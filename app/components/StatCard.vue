<script setup lang="ts">
import gsap from 'gsap'
defineProps<{ label: string; value: string | number }>()

const card = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!card.value) return
  gsap.from(card.value, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
})
</script>

<template>
  <div ref="card" class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value">{{ value }}</div>

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
}
.stat-value { font-size: 1.75rem; font-weight: 700; }
.stat-label { font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem; color: #fec000;  -webkit-text-stroke: .5px black;}
</style>
