<script setup lang="ts">
import gsap from 'gsap'
import type { FloorSummary } from '~/types/floorSummary'

const props = defineProps<{ floors: FloorSummary[] }>()

const card = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!card.value) return
  gsap.from(card.value, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
})

const floorsByAct = computed(() => {
  const grouped = new Map<number, { actIndex: number; actName: string; floors: FloorSummary[] }>()
  for (const floor of props.floors) {
    if (!grouped.has(floor.actIndex)) {
      grouped.set(floor.actIndex, { actIndex: floor.actIndex, actName: floor.actName, floors: [] })
    }
    grouped.get(floor.actIndex)!.floors.push(floor)
  }
  return [...grouped.values()].sort((a, b) => a.actIndex - b.actIndex)
})

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split('_')
    .map(word => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
}

function formatMonsterName(id: string): string {
  return titleCase(id.replace(/^MONSTER\./, ''))
}

function floorTitle(floor: FloorSummary): string {
  const location = `Floor ${floor.floorNumber} (${floor.actName})`
  if (['monster', 'elite', 'boss'].includes(floor.roomType) && floor.monsterIds?.length) {
    return `${location} — ${floor.monsterIds.map(formatMonsterName).join(' + ')}`
  }
  return `${location} — ${titleCase(floor.roomType)}`
}
</script>

<template>
  <div ref="card" class="map-card">
    <div v-for="act in floorsByAct" :key="act.actIndex" class="act-column">
      <h3 class="act-label">Act {{ act.actIndex + 1 }}: {{ act.actName }}</h3>
      <div
        v-for="floor in act.floors"
        :key="floor.floorNumber"
        class="floor-node"
        :title="floorTitle(floor)"
      >
        {{ titleCase(floor.roomType) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-card {
  margin-inline: auto;
  margin-top: 1rem;
  padding: 20px;
  border-radius: 20px;
  background: #a38a6b;
  color: white;
  width: 600px;
  min-height: 1000px;
  display: flex;
  flex-direction: row;
  gap: 60px;
  align-items: flex-start;
  justify-content: center;
}
.act-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.act-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 4px;
}
.floor-node {
  display: flex;
  flex-wrap: wrap;
  padding: 6px 10px;
  border-radius: 8px;
  background: #2a2640;
  font-size: 0.8rem;
  cursor: default;
  margin-bottom: 6px;
}
</style>  