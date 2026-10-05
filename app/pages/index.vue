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
    <header class="loader-header">
        <h1>See<span class="highlight">The</span>Spire</h1>
      <p>Upload your Slay the Spire run and see your recent run</p>
      </header>

    <section class="file-loader">
      <UFileUpload 
      v-model="files"
      color="neutral"
      highlight
      label="Drop your .run file here"
      description=".run files are located in your Slay the Spire save folder"
      class="w-100 h-135 -translate-x-1 translate-y-12"
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
      <section class = 'file-button'>
       <UButton size="lg" color="secondary" @click="exampleFileUpload">Example Run</UButton>
          </section>
           <div v-if="files?.size || errorMessage" class="file-loader-overlay">
             <p v-if="errorMessage" class="text-red-400">{{ errorMessage }}</p>

      <UButton type="reset" @click="resetFileUpload">Reset</UButton>
    </div>
    </section>
  </main>
    <UFooter>
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
</template>
<style scoped>
.main-page{
 font-size: 1.5rem; 
  min-height: 95vh; 
}
.file-loader { 
  position: relative;
  margin-inline: auto;   
  justify-content: center;
  border-radius: 1.25rem; 
  background-image:url("/imgs/submenu_panel_short.png") ; 
  background-repeat: no-repeat;
  background-repeat: no-repeat; 
  background-position: center;
  background-size: contain; 
  color: white; 
  display: grid;
  place-items: center;  
  width: 30rem; 
  height: 45rem; 
  padding-top: 3.1px;
    font-size: 1.5rem;
}

.file-loader-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  z-index: 10;
  
}

.loader-header {
  text-align: center;
  padding: 2rem 1rem;
}
.file-button{
   position: relative;
  top: 50px;
}

.highlight{
  color: #fec000;  -webkit-text-stroke: .5px black;
}

.map-row {
  display: flex;
}
</style>