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
function goBack() {
  router.back() //
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
      <MapCard label="" :floors="floors" />
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
.back-button {
  position: absolute;
  display: flex;
  align-items: left;
  justify-content: left;
}
</style>