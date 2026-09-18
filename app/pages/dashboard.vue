<script setup lang="ts">
import gsap from 'gsap'
import type { Run } from '~/types/run'
import type { FloorSummary } from '~/types/floorSummary'
const router = useRouter()
const runFile = useRunFile()
const { runs, loadRuns } = useRuns()
const { floors, loadFloors } = useFloors()

onMounted(async () => {
  if (!runFile.value) {
    await navigateTo('/')
    return
  }
  await loadRuns()
  loadFloors(runFile.value.data as Run)
})

const floorsByAct = computed(() => {
  const grouped = new Map<number, { actIndex: number; actName: string; floors: FloorSummary[] }>()
  for (const floor of floors.value) {
    if (!grouped.has(floor.actIndex)) {
      grouped.set(floor.actIndex, { actIndex: floor.actIndex, actName: floor.actName, floors: [] })
    }
    grouped.get(floor.actIndex)!.floors.push(floor)
  }
  return [...grouped.values()].sort((a, b) => a.actIndex - b.actIndex)
})


function goBack() {
  router.back() //
}
function titleCase(s: string): string{
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
  <main class="dashboard">
    <header class="dashboard-header">
    <UButton
      class="back-button"
      icon="i-heroicons-arrow-left"
      variant="ghost"
      color="neutral"
      @click="goBack"
    >
      Back
    </UButton>
      <h1>SeeTheSpire</h1>
      <p>View your Slay the Spire runs and stats</p>
    </header>
    <section class="stats-row">
        <StatCard label="Character" :value="runs[0]?.character || 'N/A'" />
        <StatCard label="Ascension" :value="runs[0]?.ascension || 'N/A'" />
        <StatCard label="Win" :value ="runs[0]?.win? 'Yes' : 'No'" />
        <StatCard label="Floors Reached" :value="runs[0]?.floorReached || 'N/A'" />
        <StatCard label="Damage Taken" :value="runs[0]?.damageTaken || 'N/A'" />
        
    </section>
    <section class="map-row">
    <div v-for="act in floorsByAct" :key="act.actIndex" class="act-column">
      <h3 class="act-label">Act: {{ act.actIndex + 1 }}</h3>
      <h3 class="act-label">{{ act.actName }}</h3>
      <div
        v-for="floor in act.floors"
        :key="floor.floorNumber"
        class="floor-node"
        :title="floorTitle(floor)"
      >
        {{ titleCase(floor.roomType) }}
      </div>
    </div>
    </section>
  </main>
</template>
<style scoped>

.dashboard {
  margin: 0;
  padding: 0;
  background-color: #1e1b2e;
  color: white;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
}
.dashboard-header {
  text-align: center;
  padding: 2rem 1rem;
}
.stats-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.map-row {
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
.back-button{
  position: absolute;
  display: flex;
  align-items: left;
  justify-content: left;
}
</style>