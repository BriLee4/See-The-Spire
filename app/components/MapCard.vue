<script setup lang="ts">
import gsap from 'gsap'
defineProps<{ label: string}>()

const card = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!card.value) return
  gsap.from(card.value, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
})
</script>

<template>
  <div ref="card" class="map-card">
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.map-card { margin-inline: auto; margin-top: 1rem; padding: 10px  10px; border-radius: 20px; background: #222C11; color: white; width: 600px; height: 1000px; text-align: center; }
.map-label { font-size: 0.85rem; opacity: 0.7; margin-top: 0.25rem; }
</style>