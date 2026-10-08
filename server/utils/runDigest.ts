// Turns a raw .run file into (1) RunFacts computed in code and (2) a compact text digest
// for the model. Kept free of Nuxt/Nitro imports so scripts/preview-digest.ts can run it
// with plain Node while iterating on the prompt.
import type { Run, PlayerStat, MapPointHistory } from '../../app/types/run'
import type { RunFacts } from '../../shared/types/runAnalysis'

export interface RelicText {
  name: string
  description: string | null
}

export interface RunDigest {
  facts: RunFacts
  text: string
}

const PREFIX = /^(CARD|RELIC|POTION|ENCOUNTER|MONSTER|EVENT|CHARACTER|ACT|ENCHANTMENT)\./

export function stripId(id: string | null | undefined): string {
  return (id ?? '').replace(PREFIX, '')
}

// "[gold]Vigor[/gold]" -> "Vigor", "[star:3]" -> "3 stars"
export function stripMarkup(text: string): string {
  return text
    .replace(/\[star:(\d+)\]/g, '$1 stars')
    .replace(/\[\/?[a-z_]+(:[^\]]*)?\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Relic ids in the run file look like RELIC.VAJRA; D1 stores VAJRA.
export function relicIds(run: Run): string[] {
  const ids = new Set<string>()
  for (const relic of run.players[0]?.relics ?? []) ids.add(stripId(relic.id))
  for (const stats of allStats(run)) {
    for (const choice of stats.relic_choices ?? []) ids.add(stripId(choice.choice))
    for (const a of stats.ancient_choice ?? []) ids.add(stripId(a.TextKey))
  }
  return [...ids].filter(Boolean)
}

function allStats(run: Run): PlayerStat[] {
  return run.map_point_history.flat().flatMap(floor => floor.player_stats?.slice(0, 1) ?? [])
}

// "TABLET_OF_TRUTH.pages.INITIAL.options.SMASH.title" -> "TABLET_OF_TRUTH: SMASH"
function eventChoiceLabel(key: string): string {
  const parts = key.split('.')
  const option = parts.indexOf('options')
  if (option !== -1 && parts[option + 1]) return `${parts[0]}: ${parts[option + 1]}`
  return parts[0] ?? key
}

function countList(ids: string[]): string {
  const counts = new Map<string, number>()
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  return [...counts].map(([id, n]) => (n > 1 ? `${id} x${n}` : id)).join(', ')
}

function floorLine(floor: MapPointHistory, floorNumber: number, actNumber: number): string {
  const stats: Partial<PlayerStat> = floor.player_stats?.[0] ?? {}
  const room = floor.rooms?.[0]
  const parts: string[] = []

  let head = `F${floorNumber} A${actNumber} ${floor.map_point_type}`
  if (room?.model_id) head += ` ${stripId(room.model_id)}`
  parts.push(head)

  const fought = ['monster', 'elite', 'boss'].includes(room?.room_type ?? '')
  const hp = `${stats.current_hp ?? 0}/${stats.max_hp ?? 0}hp`
  parts.push(fought ? `-${stats.damage_taken ?? 0}hp in ${room?.turns_taken ?? 0} turns -> ${hp}` : hp)
  if (stats.hp_healed) parts.push(`healed ${stats.hp_healed}`)
  if (stats.max_hp_gained) parts.push(`+${stats.max_hp_gained} max hp`)
  if (stats.max_hp_lost) parts.push(`-${stats.max_hp_lost} max hp`)

  const ancient = stats.ancient_choice
  if (ancient?.length) {
    const chosen = ancient.find(a => a.was_chosen)
    const others = ancient.filter(a => !a.was_chosen).map(a => a.TextKey)
    parts.push(`ancient: took ${chosen?.TextKey ?? 'nothing'} over ${others.join(', ') || 'nothing'}`)
  } else if (stats.event_choices?.length) {
    parts.push(`event: ${stats.event_choices.map(e => eventChoiceLabel(e.title.key)).join(' -> ')}`)
  }

  if (floor.map_point_type === 'shop') {
    // Shop "choices" are the shelf, not a reward screen: report purchases, not skips.
    const bought = (stats.cards_gained ?? []).map(c => stripId(c.id))
    const relicsBought = (stats.bought_relics ?? []).map(stripId)
    parts.push(`shop: bought ${[...bought, ...relicsBought].join(', ') || 'nothing'}`)
    const shelf = [
      ...(stats.card_choices ?? []).filter(c => !c.was_picked).map(c => stripId(c.card.id)),
      ...(stats.relic_choices ?? []).filter(c => !c.was_picked).map(c => stripId(c.choice))
    ]
    if (shelf.length) parts.push(`passed on ${shelf.join(', ')}`)
  } else {
    if (stats.card_choices?.length) {
      const picked = stats.card_choices.filter(c => c.was_picked).map(c => stripId(c.card.id))
      const passed = stats.card_choices.filter(c => !c.was_picked).map(c => stripId(c.card.id))
      parts.push(picked.length
        ? `card: took ${picked.join(', ')} over ${passed.join(', ') || 'nothing'}`
        : `card: SKIPPED ${passed.join(', ')}`)
    }
    const picked = new Set(stats.card_choices?.filter(c => c.was_picked).map(c => c.card.id))
    const otherGains = (stats.cards_gained ?? []).filter(c => !picked.has(c.id)).map(c => stripId(c.id))
    if (otherGains.length) parts.push(`gained ${otherGains.join(', ')}`)

    if (stats.relic_choices?.length) {
      const took = stats.relic_choices.filter(c => c.was_picked).map(c => stripId(c.choice))
      const left = stats.relic_choices.filter(c => !c.was_picked).map(c => stripId(c.choice))
      parts.push(`relic: ${took.length ? `took ${took.join(', ')}` : 'took none'}${left.length ? ` (left ${left.join(', ')})` : ''}`)
    }
  }
  if (stats.relics_removed?.length) parts.push(`lost relics ${stats.relics_removed.map(stripId).join(', ')}`)
  if (stats.rest_site_choices?.length) parts.push(`rest: ${stats.rest_site_choices.join(', ')}`)
  if (stats.upgraded_cards?.length) parts.push(`upgraded ${stats.upgraded_cards.map(stripId).join(', ')}`)
  if (stats.cards_removed?.length) parts.push(`removed ${stats.cards_removed.map(c => stripId(c.id)).join(', ')}`)
  if (stats.cards_enchanted?.length) {
    parts.push(`enchanted ${stats.cards_enchanted.map(e => `${stripId(e.card.id)} with ${stripId(e.enchantment)}`).join(', ')}`)
  }
  if (stats.potion_used?.length) parts.push(`used potions ${stats.potion_used.map(stripId).join(', ')}`)
  const potionTaken = stats.potion_choices?.filter(c => c.was_picked).map(c => stripId(c.choice))
  if (potionTaken?.length) parts.push(`potion: took ${potionTaken.join(', ')}`)

  const gold: string[] = []
  if (stats.gold_gained) gold.push(`+${stats.gold_gained}`)
  if (stats.gold_spent) gold.push(`spent ${stats.gold_spent}`)
  if (stats.gold_lost) gold.push(`lost ${stats.gold_lost}`)
  if (stats.gold_stolen) gold.push(`stolen ${stats.gold_stolen}`)
  parts.push(`gold ${stats.current_gold ?? 0}${gold.length ? ` (${gold.join(', ')})` : ''}`)

  return parts.join(' | ')
}

export function buildRunDigest(run: Run, relics: Map<string, RelicText> = new Map()): RunDigest {
  const player = run.players[0]
  if (!player) throw new Error('Run has no players')

  const floorLines: string[] = []
  const damageByAct: RunFacts['damageByAct'] = []
  const fights: RunFacts['costliestFights'] = []
  const cardRewards = { seen: 0, picked: 0, skipped: 0 }
  const restSites = { heal: 0, smith: 0, other: 0 }
  let floorNumber = 0
  let elitesFought = 0
  let cardsRemoved = 0
  let goldSpent = 0
  let potionsUsed = 0
  let lowestHp: RunFacts['lowestHp'] = null

  run.map_point_history.forEach((act, actIndex) => {
    const actName = stripId(run.acts[actIndex]) || `ACT_${actIndex + 1}`
    let actDamage = 0
    floorLines.push(`-- Act ${actIndex + 1}: ${actName} --`)

    for (const floor of act) {
      floorNumber++
      const stats = floor.player_stats?.[0]
      const room = floor.rooms?.[0]
      floorLines.push(floorLine(floor, floorNumber, actIndex + 1))
      if (!stats) continue

      actDamage += stats.damage_taken ?? 0
      if (room?.room_type === 'elite') elitesFought++
      if (['monster', 'elite', 'boss'].includes(room?.room_type ?? '') && stats.damage_taken) {
        fights.push({ floor: floorNumber, encounter: stripId(room?.model_id) || room!.room_type, damage: stats.damage_taken })
      }
      if (stats.max_hp && (!lowestHp || stats.current_hp / stats.max_hp < lowestHp.hp / lowestHp.maxHp)) {
        lowestHp = { floor: floorNumber, hp: stats.current_hp, maxHp: stats.max_hp }
      }
      if (stats.card_choices?.length && floor.map_point_type !== 'shop') {
        cardRewards.seen++
        if (stats.card_choices.some(c => c.was_picked)) cardRewards.picked++
        else cardRewards.skipped++
      }
      for (const choice of stats.rest_site_choices ?? []) {
        if (choice === 'HEAL') restSites.heal++
        else if (choice === 'SMITH') restSites.smith++
        else restSites.other++
      }
      cardsRemoved += stats.cards_removed?.length ?? 0
      goldSpent += stats.gold_spent ?? 0
      potionsUsed += stats.potion_used?.length ?? 0
    }
    damageByAct.push({ act: actName, damage: actDamage })
  })

  const killedBy = [run.killed_by_encounter, run.killed_by_event]
    .map(stripId)
    .find(id => id && id !== 'NONE.NONE' && id !== 'NONE') ?? null

  const facts: RunFacts = {
    character: stripId(player.character),
    ascension: run.ascension,
    win: run.win,
    abandoned: run.was_abandoned,
    killedBy: run.win ? null : killedBy,
    floorsReached: floorNumber,
    runTimeMinutes: Math.round(run.run_time / 60),
    finalDeckSize: player.deck.length,
    finalRelicCount: player.relics.length,
    damageByAct,
    elitesFought,
    lowestHp,
    costliestFights: fights.sort((a, b) => b.damage - a.damage).slice(0, 3),
    cardRewards,
    restSites,
    cardsRemoved,
    goldSpent,
    potionsUsed
  }

  const deck = player.deck.map(c => {
    const name = stripId(c.id) + (c.current_upgrade_level ? '+' : '')
    return c.enchantment ? `${name}[${stripId(c.enchantment.id)}]` : name
  })
  const relicLines = player.relics.map(r => {
    const id = stripId(r.id)
    const info = relics.get(id)
    const desc = info?.description ? `: ${stripMarkup(info.description)}` : ''
    return `- ${info?.name ?? id} (floor ${r.floor_added_to_deck})${desc}`
  })

  const outcome = run.win ? 'WON' : run.was_abandoned ? 'ABANDONED' : `DIED on floor ${floorNumber}${killedBy ? ` to ${killedBy}` : ''}`

  const text = [
    `Character: ${facts.character} | Ascension ${run.ascension} | ${run.game_mode} | build ${run.build_id}`,
    `Outcome: ${outcome} | ${floorNumber} floors | ${facts.runTimeMinutes} min`,
    '',
    'Computed stats (trust these, do not recompute):',
    `- Damage taken by act: ${damageByAct.map(a => `${a.act} ${a.damage}`).join(', ')}`,
    `- Elites fought: ${elitesFought}`,
    `- Lowest HP: ${facts.lowestHp ? `${facts.lowestHp.hp}/${facts.lowestHp.maxHp} on floor ${facts.lowestHp.floor}` : 'n/a'}`,
    `- Costliest fights: ${facts.costliestFights.map(f => `F${f.floor} ${f.encounter} (-${f.damage})`).join(', ') || 'none'}`,
    `- Card rewards: ${cardRewards.seen} seen, ${cardRewards.picked} taken, ${cardRewards.skipped} skipped`,
    `- Rest sites: ${restSites.heal} heal, ${restSites.smith} smith, ${restSites.other} other`,
    `- Cards removed: ${cardsRemoved} | Gold spent: ${goldSpent} | Potions used: ${potionsUsed}`,
    '',
    `Final deck (${deck.length} cards, + = upgraded): ${countList(deck)}`,
    '',
    `Final relics (${player.relics.length}):`,
    ...relicLines,
    '',
    `Final potions: ${player.potions.map(p => stripId(p.id)).join(', ') || 'none'}`,
    '',
    'Floor by floor:',
    ...floorLines
  ].join('\n')

  return { facts, text }
}
