import { useRunFile } from './useRunFile'
import type { Run } from '~/types/run'

interface RawRun {
  ascension: number
  map_point_history: unknown[][]
  win: boolean
  players: {
    character: string
    deck: unknown[]
    relics: unknown[]
  }[]
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
    win: raw.win
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
