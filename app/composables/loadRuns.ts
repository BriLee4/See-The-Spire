import { useRunFile } from './useRunFile'
import type { Run } from '~/types/run'
import type { RunSummary } from '~/types/runSummary'
import type { FloorSummary } from '~/types/floorSummary'



function parseRun(name: string, raw: Run): RunSummary {
  const player = raw.players[0]
  if (!player) throw new Error('Run has no players')

  return {
    id: name.replace(/\.run$/, ''),
    character: player.character.replace(/^CHARACTER\./, ''),
    ascension: raw.ascension,
    floorReached: raw.map_point_history.reduce((sum, act) => sum + act.length, 0),
    deckSize: player.deck.length,
    relicCount: player.relics.length,
    win: raw.win,
    damageTaken: calculateDamageTaken(raw)
  }
}


export function useRuns() {
  const runs = ref<RunSummary[]>([])

  async function loadRuns() {
    const runFile = useRunFile()
    if(runFile.value === null){
      throw new Error('No runfile Found')
    }
    runs.value = [parseRun(runFile.value.name, runFile.value.data as Run)]
  }

  return { runs, loadRuns }
}

function calculateDamageTaken(raw: Run): number {
  return raw.map_point_history
    .flatMap(act => act)                         // flatten acts into individual floor entries
    .flatMap(floor => floor.player_stats || [])  // flatten into per-player stat objects
    .reduce((sum, stats) => sum + (stats.damage_taken || 0), 0)
}
