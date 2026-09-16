import { useRunFile } from './useRunFile'
import type { Run } from '~/types/run'

interface RawRun {
  ascension: number
  map_point_history: FloorHistoryEntry[][]
  win: boolean
  total_damage_taken: number
  players: {
    character: string
    deck: unknown[]
    relics: unknown[]
  }[]
}
interface FloorHistoryEntry {
  player_stats?: { damage_taken?: number }[]
}

function parseRun(name: string, raw: RawRun): Run {
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
  const runs = ref<Run[]>([])

  async function loadRuns() {
    const runFile = useRunFile()
    // The .run extension is recognized as application/x-makeself by static
    // file servers, so $fetch won't auto-parse it as JSON — parse manually.
    runs.value = [parseRun(runFile.value.name, runFile.value.data)]
  }

  return { runs, loadRuns }
}

function calculateDamageTaken(raw: RawRun): number {
  return raw.map_point_history
    .flatMap(act => act)                         // flatten acts into individual floor entries
    .flatMap(floor => floor.player_stats || [])  // flatten into per-player stat objects
    .reduce((sum, stats) => sum + (stats.damage_taken || 0), 0)
}
