<script setup lang="ts">
import gsap from 'gsap'
import type { FloorSummary } from '~/types/floorSummary'
import { titleCase } from '~/utils/text'

const props = defineProps<{ floors: FloorSummary[] }>()

const card = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!card.value) return
  gsap.from(card.value, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
})

const floorsByAct = computed(() => {
  const grouped = new Map<number, { actIndex: number; actName: string; floors: FloorSummary[] }>()
  for (const floor of props.floors) {
    if (!grouped.has(floor.actIndex)) {
      grouped.set(floor.actIndex, { actIndex: floor.actIndex, actName: floor.actName, floors: [] })
    }
    grouped.get(floor.actIndex)!.floors.push(floor)
  }
  return [...grouped.values()].sort((a, b) => a.actIndex - b.actIndex)
})



function formatMonsterName(id: string): string {
  return titleCase(id.replace(/^MONSTER\./, ''))
}

function floorTitle(floor: FloorSummary): string {
  const location = `Floor ${floor.floorNumber} (${floor.actName})`
  if (['monster', 'elite', 'boss'].includes(floor.roomType) && floor.monsterIds?.length) {
    return `${location} — ${floor.monsterIds.map(formatMonsterName).join(' + ')}`
  }
  return `${location} — ${titleCase(floor.roomType)}`
}

const ANCIENT_EVENT_IMAGES = new Set([
  'vakuu', 'orobas', 'pael', 'tezcatara', 'nonupeipe', 'darv', 'tanx'
])
const BOSS_IMAGES = new Set([
  'aeonglass_boss', 'the_kin_boss', 'waterfall_giant_boss', 'vantom_boss',
  'the_insatiable_boss', 'kaiser_crab_boss', 'knowledge_demon_boss',
  'lagavulin_matriarch_boss', 'queen_boss', 'soul_fysh_boss',
  'test_subject_boss', 'ceremonial_beast_boss'
])


function findAncient(floor: FloorSummary): string {
  const key = floor.encounterId?.replace(/^EVENT\./, '').toLowerCase()
  return key && ANCIENT_EVENT_IMAGES.has(key) ? `/imgs/${key}.png` : '/imgs/stats_ancients.png'
}

function findBoss(floor: FloorSummary): string {
  const key = floor.encounterId?.replace(/^ENCOUNTER\./, '').toLowerCase()
  return key && BOSS_IMAGES.has(key) ? `/imgs/${key}.png` : '/imgs/lagavulin_matriarch_boss.png'
}

function floorImage(floor: FloorSummary): string {
  if (floor.mapPointType === 'ancient') return findAncient(floor)
  switch (floor.roomType) {
    case 'monster': return '/imgs/monster.png'
    case 'elite': return '/imgs/elite.png'
    case 'boss': return findBoss(floor)
    case 'treasure': return '/imgs/stats_chest.png'
    case 'shop': return '/imgs/shop.png'
    case 'rest_site': return '/imgs/rest_site.png'
    default: return '/imgs/stats_questionmark.png' // shop, rest_site, event, unknown
  }
}

</script>

<template>
  <div ref="card" class="map-card">
    <div v-for="act in floorsByAct" :key="act.actIndex" class="act-column">
        <img
          v-for="floor in act.floors.toReversed()"
          :key="floor.floorNumber"
          :src="floorImage(floor)"
          :alt="titleCase(floor.roomType)"
          :title="floorTitle(floor)"
          class="floor-node-img"
        />
         <h3 class="act-label">Act {{ act.actIndex + 1 }}: {{ act.actName }}</h3>
    </div>
  </div>
</template>

<style scoped>
.map-card {
  margin-inline: auto;
  margin-top: 1rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  background-image:url("/imgs/submenu_panel.png") ; 
  background-repeat: no-repeat;
  background-repeat: no-repeat; 
  background-position: center;
  background-size: 100% 100%;
  color: white;
  min-height: 50rem;
  min-width: 25rem;
  width: max-content;
  height: max-content;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end; 
}

.act-column {
  display: flex;
  flex-direction: column; 
  align-items: center;    
  flex: 1 1 0px; 
  text-align: center; 
  justify-content: flex-end; 
  gap: .375rem;
  height: 100%; 
  padding: 1.25;
  padding-bottom: 2.5rem;
}

.act-label {
  font-size: 1.25em;
  opacity: 0.8;
  margin-top: 4px; 
  color: #271c0c;
  font-weight: 700;
}

.floor-node {
  display: flex;
  justify-content: flex-end;
  padding: .375rem .625;
  border-radius: .5rem;
  background: #2a2640;
  font-size: 0.8rem;
  cursor: default;
  margin-bottom: .375rem;
}

.floor-node-img {
  width: 3rem;
  height: 3rem;
  object-fit: contain;
  cursor: default;
  background-color: #c3a58b;
  border-radius: 50%;
}
</style>