<script setup lang="ts">
const files = ref<File | null>(null)
const runFile = useRunFile()
const errorMessage = ref('')
watch(files, async(file) => {
  if(!file) return
  if(!file.name.endsWith('.run')){
    errorMessage.value = 'Invalid file type. Please upload a .run file.'
    return
  } 

  const text = await file.text()
  const parsed = JSON.parse(text)

  runFile.value = { name: file.name, data: parsed}

  await navigateTo('/dashboard')

})
const resetFileUpload = () => {
  files.value = null
  runFile.value = null
  errorMessage.value = ''
}



</script>

<template>
  <main class="main-page">
    <header class="loader-header">
        <h1>See<span class="highlight">The</span>Spire</h1>
      <p>Upload your Slay the Spire run and see the stats</p>
      </header>

    <section class="file-loader">
      <UFileUpload 
      v-model="files"
      color="neutral"
      highlight
      label="Drop your .run file here"
      description=".run files are located in your Slay the Spire save folder"
      class="w-120 h-70"
      accept= ".run"
      :file-delete="false"
      :file-image="false"
      />
      <div v-if="files?.size" class="file-loader-overlay">
      <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
      <UButton type="reset" @click="resetFileUpload">Reset</UButton>
    </div>
    </section>
  </main>
</template>
<style scoped>
.main-page{
    font-size: 25px;
    background-color: #1e1b2e;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    min-height: 100vh;
}
.file-loader { 
  position: relative;
  margin-inline: auto;  
  padding: 10px  10px; 
  justify-content: center;
  border-radius: 20px; 
  background: #222C11; 
  color: white; 
    display: grid;
  place-items: center;     /* Centers horizontally and vertically instantly */
  width: 550px; 
  height: 350px; 
}

.file-loader-overlay {
  position: absolute;
  bottom: 75px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;
  
}
.loader-header {
  text-align: center;
  padding: 2rem 1rem;
}

.highlight{
  color: #fec000;  -webkit-text-stroke: .5px black;
}

.map-row {
  display: flex;
}
</style>