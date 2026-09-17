export interface Run {
  id: string              // from filename, e.g. "1788790424"
  character: string        // run_data.players[0].character, prefix "CHARACTER." stripped
  ascension: number
  floorReached: number       // sum of len(act) across map_point_history
  deckSize: number         // run_data.players[0].deck.length
  relicCount: number        // run_data.players[0].relics.length
  win: boolean              //run_data.win
  damageTaken: number       // run_data.total_damage_taken
}