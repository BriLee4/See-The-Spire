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

<<template>
  <main class="dashboard">
    <section class="stats-column">
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
      
      <StatCard label="Character" :value="runs[0]?.character || 'N/A'" />
      <StatCard label="Ascension" :value="runs[0]?.ascension || 'N/A'" />
      <StatCard label="Win" :value="runs[0]?.win ? 'Yes' : 'No'" />
      <StatCard label="Floors Reached" :value="runs[0]?.floorReached || 'N/A'" />
      <StatCard label="Damage Taken" :value="runs[0]?.damageTaken || 'N/A'" />
    </section>

    <section class="main-content-column">
      <header class="dashboard-header">
        <h1>SeeTheSpire</h1>
      </header>
      
      <div class="map-card">
        <MapCard label="Map" :floors="floors" />
      </div>
    </section>

    <section class="right-column">
    </section>
  </main>
</template>
<style scoped>

.dashboard {
  margin: 0;
  padding: 2rem;
  background-color: #1e1b2e;
  color: white;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 2rem;
}

.stats-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
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