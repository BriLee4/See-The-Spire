export interface RelicInfo {
  id: string
  name: string
  description: string | null
  rarity_key: string | null
  image_url: string | null
}

export default defineEventHandler(async (event) => {
  const db = useDatabase("myDatabase")

  const { ids } = getQuery(event)
  const list = String(ids ?? "")
    .split(",")
    .map(id => id.trim().replace(/^RELIC\./, ""))
    .filter(Boolean)

  if (!list.length) return {} as Record<string, RelicInfo>

  const placeholders = list.map(() => "?").join(",")
  const rows = await db
    .prepare(`SELECT id, name, description, rarity_key, image_url FROM relics WHERE id IN (${placeholders})`)
    .all(...list) as RelicInfo[]

  return Object.fromEntries(rows.map(r => [r.id, r])) as Record<string, RelicInfo>
})
