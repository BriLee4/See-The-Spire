export interface FloorSummary {
  // Position
  floorNumber: number       
  actIndex: number           
  actName: string            
  floorIndexInAct: number

  // Room
  mapPointType: string        // MapPointHistory.map_point_type
  roomType: string             // rooms[0].room_type
  encounterId?: string          // rooms[0].model_id
  monsterIds?: string[]          // rooms[0].monster_ids
  turnsTaken: number              // rooms[0].turns_taken

    //pllayer state
  currentHp: number
  maxHp: number
  damageTaken: number
  hpHealed: number
  currentGold: number
  goldGained: number
  goldLost: number
  goldSpent: number
  goldStolen: number

    //optional choices (depends on different type of floor/node)
  cardChoices?: { cardId: string; wasPicked: boolean }[]  // from card_choices: CardChoice[]
  cardsGained?: string[]
  cardsRemoved?: string[]
  upgradedCards?: string[]
  relicChoice?: { choice: string; was_picked: boolean }
  potionChoices?: { choice: string; was_picked: boolean }[]
  eventChoice?: { key: string; table: string }             // event_choices[0]?.title
  ancientChoice?: { textKey: string; wasChosen: boolean }[]
  restSiteChoices?: string[]
}