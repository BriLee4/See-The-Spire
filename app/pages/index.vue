<script setup lang="ts">
import { ref, onMounted } from 'vue'
import gsap from 'gsap'

const box = ref<HTMLElement | null>(null)

// Fades the box in once, when the component mounts
onMounted(() => {
  if (!box.value) return
  gsap.from(box.value, {
    opacity: 0,
    y: 20,
    duration: 1,
    ease: 'power2.out'
  })
})

// Fades in on hover
function handleEnter() {
  if (!box.value) return
  gsap.to(box.value, { opacity: 1, duration: 0.3, ease: 'power2.out' })
}

// Fades back out on hover leave
function handleLeave() {
  if (!box.value) return
  gsap.to(box.value, { opacity: 0.4, duration: 0.3, ease: 'power2.out' })
}
</script>

<template>
  <div
    ref="box"
    class="test-box"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    Hover me
  </div>
</template>

<style scoped>
.test-box {
  width: 200px;
  height: 100px;
  margin: 100px auto;
  background: #6d5acd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 8px;
  opacity: 0.4;
}
</style>