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
const exampleFileUpload = async () => {
  const response = await fetch('data/1788790424.run')
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
      class="w-90 h-120 -translate-x-1"
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
       <UButton type="submit" size="xl" color ="secondary" @click="exampleFileUpload">Example Run</UButton>
          </section>
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
  justify-content: center;
  border-radius: 20px; 
  background-image:url("/imgs/submenu_panel_short.png") ; 
  background-repeat: no-repeat;
  background-repeat: no-repeat; 
  background-position: center;
  background-size: contain; 
  color: white; 
  display: grid;
  place-items: center;  
  width: 800px; 
  height: 600px; 
  padding-top: 50px;
}

.file-loader-overlay {
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