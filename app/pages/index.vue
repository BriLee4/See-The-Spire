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
 
errorMessage.value = ''
let parsed
try {
  parsed = JSON.parse(await file.text())
} catch {
  errorMessage.value = "Couldn't read that file. Is it a valid .run file?"
  return
}
if (!parsed?.players?.length || !Array.isArray(parsed?.map_point_history)) {
  errorMessage.value = "That file doesn't look like a Slay the Spire 2 run."
  return
}
runFile.value = { name: file.name, data: parsed }
  await navigateTo('/dashboard')
})

const resetFileUpload = () => {
  files.value = null
  runFile.value = null
  errorMessage.value = ''
}
const exampleFileUpload = async () => {
  const response = await fetch('/data/1788790424.run')
  if(!response.ok){
    errorMessage.value = "Could not load example run"
    return
  }
  const blob = await response.blob()

  const exampleFile = new File([blob], '1788790424.run',{
    type: blob.type
  })
  files.value = exampleFile
}


</script>

<template>
  <main class="main-page">
  <section class="file-loader">
    <header class="loader-header">
        <h1>See<span class="highlight">The</span>Spire</h1>
       <p class="subtitle">Upload your Slay the Spire run and see your recent run</p>
      </header>

      <div class="upload-container">
      <UFileUpload 
      v-model="files"
      color="neutral"
      highlight
      label="Drop your .run file here"
      description=".run files are located in your Slay the Spire save folder"
      class="w-100 h-160 -translate-x-1"
      accept= ".run"
      size=''
      :file-delete="false"
      :file-image="false"
      :icon="false"
        :ui="{
    base: 'bg-transparent hover:bg-amber-800/25',
    description:'text-white',
    label:'text-white'
  }"
      />
      </div>

      <section class = 'file-button'>
       <UButton class = 'example-button' 
       variant="ghost" 
       color="neutral" 
       @click="exampleFileUpload">Example Run
      </UButton>
          </section>
           <div v-if="errorMessage" class="file-loader-overlay">
             <p v-if="errorMessage" class="text-red-400">{{ errorMessage }}</p>

      <UButton type="reset" @click="resetFileUpload">Reset</UButton>
    </div>
    </section>
    <UFooter class="mt-auto">
      <template #default>
        <div class="flex justify-center items-center">
          <UButton 
            label="Protected by Cloudflare"
            icon="i-devicon-cloudflare" 
            trailing
            color="neutral" 
            variant="ghost" 
            to="https://www.cloudflare.com/" 
            aria-label="Cloudflare" 
            class="scale-150" 
          />
        </div>
      </template>
    </UFooter>
    </main>
</template>
<style scoped>
.main-page{
  font-size: 1.5rem;
  min-height: 100vh;
  background-image: url("/imgs/the_architect_event_encounter.webp");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.file-loader { 
  position: relative;
  margin-inline: auto;  
  margin-top: 6rem; 
  justify-content: center;
  border-radius: 1.25rem; 
  background-image:url("/imgs/submenu_panel.png") ; 
  background-repeat: no-repeat;
  background-repeat: no-repeat; 
  background-position: center;
  background-size: contain; 
  color: white; 
  display: grid;
  place-items: center;  
  width: 60rem; 
  height: 60rem; 
    padding: 3rem 2rem;
    font-size: 1.5rem;
}
.loader-header {
  text-align: center;
  margin-bottom: auto;
}
.loader-header h1 {
  font-size: 2.25rem;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 0.95rem;

  line-height: 1.3;
}

.upload-container {
  width: 100%;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-loader-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  z-index: 10;
  
}
.example-button{
  background-image: url("/imgs/event_button.webp");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%; 
  width: 200px;               
  height: 60px;              
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: none;
  background-color: transparent !important; 
  font-size: 1rem;
     transition: transform 0.1s ease, filter 0.1s ease;
}
.example-button:hover {
  transform: scale(1.08);
  background-color: transparent !important;
  
  filter: drop-shadow(0 0 6px #facc15) brightness(1.1); 
}
.file-button {
  margin-top: auto;
  padding-bottom: 2.5rem;
}

.highlight{
  color: #fec000;
}

.map-row {
  display: flex;
}
</style>