<script setup lang="ts">
import gsap from 'gsap'
const runFile = useRunFile()
const { runs, loadRuns } = useRuns()
onMounted(async () => {
  if (!runFile.value) {
    await navigateTo('/')
    return
  }
  await loadRuns()
})
</script>

<template>
  <main class="dashboard">
    <header class="dashboard-header">
      <h1>SeeTheSpire</h1>
      <p>View your Slay the Spire runs and stats</p>
    </header>
    <section class="stats-row">
        <StatCard label="Character" :value="runs[0]?.character || 'N/A'" />
    </section>
    <section class="map-row">
      <MapCard label="Map" />
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
}
</style>