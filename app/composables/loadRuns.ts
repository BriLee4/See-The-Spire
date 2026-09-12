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

function parseRun(raw: RawRun): Run {
  const player = raw.players[0]
  if (!player) throw new Error('Run has no players')

  return {
    id: '1788790424',
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
    // The .run extension is recognized as application/x-makeself by static
    // file servers, so $fetch won't auto-parse it as JSON — parse manually.
    const text = await $fetch<string>('/data/1788790424.run', { responseType: 'text' })
    runs.value = [parseRun(JSON.parse(text))]
  }

  return { runs, loadRuns }
}
