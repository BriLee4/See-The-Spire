import type { Run, MapPointHistory} from '~/types/run'
import type { FloorSummary } from '~/types/floorSummary'

function parseFloor(
    floor: MapPointHistory,
    actIndex: number,
    floorIndexInAct: number,
    actName: string,
    floorNumber: number
    ): FloorSummary {
        const stats = floor.player_stats[0]
        const room = floor.rooms[0]

 return {
    floorNumber,
    actIndex,
    actName,
    floorIndexInAct,
    mapPointType: floor.map_point_type,
    roomType: room?.room_type ?? 'unknown',
    encounterId: room?.model_id,
    monsterIds: room?.monster_ids,
    turnsTaken: room?.turns_taken ?? 0,
    currentHp: stats?.current_hp ?? 0,
    maxHp: stats?.max_hp ?? 0,
    damageTaken: stats?.damage_taken ?? 0,
    hpHealed: stats?.hp_healed ?? 0,
    currentGold: stats?.current_gold ?? 0,
    goldGained: stats?.gold_gained ?? 0,
    goldLost: stats?.gold_lost ?? 0,
    goldSpent: stats?.gold_spent ?? 0,
    goldStolen: stats?.gold_stolen ?? 0,
    cardChoices: stats?.card_choices?.map(c => ({ cardId: c.card.id, wasPicked: c.was_picked })),
    cardsGained: stats?.cards_gained?.map(c => c.id),
    cardsRemoved: stats?.cards_removed?.map(c => c.id),
    upgradedCards: stats?.upgraded_cards,
    relicChoice: stats?.relic_choices?.find(c => c.was_picked),
    potionChoices: stats?.potion_choices,
    eventChoice: stats?.event_choices?.[0]
      ? { key: stats.event_choices[0].title.key, table: stats.event_choices[0].title.table }
      : undefined,
    ancientChoice: stats?.ancient_choice?.map(a => ({ textKey: a.TextKey, wasChosen: a.was_chosen })),
    restSiteChoices: stats?.rest_site_choices
  }
}

function parseFloors(raw: Run): FloorSummary[]{
    const floors: FloorSummary[] = []
    raw.map_point_history.forEach((floorsInAct, actIndex) => {
    const actName = raw.acts[actIndex]?.replace(/^ACT\./, '') ?? `Act ${actIndex + 1}`
    floorsInAct.forEach((floor, floorIndexInAct) => {
    floors.push(parseFloor(floor, actIndex, floorIndexInAct, actName, floors.length + 1))
    })
  })
  return floors
}

export function useFloors(){
    const floors = ref<FloorSummary[]>([])

    function loadFloors(raw: Run){
        floors.value = parseFloors(raw)
    }

    return {floors, loadFloors}
}