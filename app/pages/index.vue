<script setup lang="ts">
import gsap from 'gsap'
const value = ref(null)
const { runs, loadRuns } = useRuns()
onMounted(loadRuns)
</script>

<template>
  <main class="main-page">
    <header class="loader-header">
      <h1>SeeTheSpire</h1>
      <p>Upload your Slay the Spire run file to view stats</p>
      </header>

    <section class="file-loader">
      <UFileUpload color="neutral"
      highlight
      label="Drop your .run file here"
      description=".run files are located in your Slay the Spire save folder"
      class="w-120 h-70"
      accept= ".run"
      />
    </section>
  </main>
</template>
<style scoped>
.main-page{
    font-family: 'Kreon', serif;
    font-size: 25px;
    background-color: #1e1b2e;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    min-height: 100vh;
}
.file-loader { margin-inline: auto;  
  padding: 20px  20px; 
  justify-content: center;
  border-radius: 20px; 
  background: #222C11; 
  color: white; 

}
.file-loader{
  display: grid;
  place-items: center;     /* Centers horizontally and vertically instantly */
  width: 550px; 
  height: 350px; 
}

.loader-header {
  text-align: center;
  padding: 2rem 1rem;
}


.map-row {
  display: flex;
}
</style>