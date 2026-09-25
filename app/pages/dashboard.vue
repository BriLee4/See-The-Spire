<script setup lang="ts">
import gsap from 'gsap'
import type { Run } from '~/types/run'
import type { FloorSummary } from '~/types/floorSummary'
const router = useRouter()
const runFile = useRunFile()
const { runs, loadRuns } = useRuns()
const { floors, loadFloors } = useFloors()

const player = computed(() => (runFile.value?.data as Run | undefined)?.players[0])

onMounted(async () => {
  if (!runFile.value) {
    await navigateTo('/')
    return
  }
  await loadRuns()
  loadFloors(runFile.value.data as Run)
})
function goBack() {
  router.back() //
}
const act1Name = computed(() => {
  const firstFloor = floors.value?.[0]
  return firstFloor?.actName?.toLowerCase() || 'overgrowth' 
})

const backgroundClass = computed(() => {
  if (act1Name.value.includes('underdocks')) {
    return 'bg-underdocks'
  }
  // Default fallback
  return 'bg-overgrowth'
})
</script>

<template>
  <main class="dashboard" :class="backgroundClass">
  <div class="left-sidebar-wrapper">
      <div class="back-button-container">
        <UButton
          class="back-button"
          icon="i-heroicons-arrow-left"
          variant="ghost"
          color="neutral"
          @click="goBack"
        >
          Back
        </UButton>

      </div>
       <section class="stats-column">
     <StatCard
        title="Run Stats"
        :stats="[
          { label: 'Character', value: runs[0]?.character || 'N/A' },
          { label: 'Ascension', value: runs[0]?.ascension ?? 'N/A' },
          { label: 'Win', value: runs[0]?.win ? 'Yes' : 'No' },
          { label: 'Floors Reached', value: runs[0]?.floorReached ?? 'N/A' },
          { label: 'Damage Taken', value: runs[0]?.damageTaken ?? 'N/A' }
        ]"
      />
     </section>
     </div>
    <section class="main-content-column">
      <header class="dashboard-header">
        <h1>See<span class="highlight">The</span>Spire</h1>
      </header>
      
      <div class="map-card">
       <MapCard label="Map" :floors="floors" /> 
      </div>
    </section>

    <section class="right-column">
      <RelicCard :relics="player?.relics ?? []" :deck="player?.deck ?? []" />
    </section>
  </main>
</template>
<style scoped>

.dashboard {
  margin: 0;
  padding: 2rem;
  background-image:url("./imgs/overgrowth.webp") ; 
  background-repeat: no-repeat;
  background-repeat: no-repeat; 
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
  color: white;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
}

.left-sidebar-wrapper{
  display: flex;
  flex-direction: column;
  gap: 1rem; 
}

.stats-column {
  display: flex;
  flex-direction: column;
  padding-top: 3.1 rem;
  gap: .75rem;
}
.bg-overgrowth {
  background-image: url("/imgs/overgrowth.webp");
}

.bg-underdocks {
  background-image: url("/imgs/underdocks.webp");
}

.back-button-container {
  display: flex;
  justify-content: flex-start;
}
.highlight{
  color: #fec000;  -webkit-text-stroke: .5px black;
}

.back-button-container {
  margin-bottom: 1rem;
}

.main-content-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-header {
  text-align: center;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2.5rem;
}
</style>