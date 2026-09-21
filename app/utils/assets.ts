import { titleCase } from './text'

function slug(id: string, prefix: string | RegExp): string {
  return id.replace(prefix, '').toLowerCase()
}

export function relicImageUrl(id: string): string {
  const base = useRuntimeConfig().public.assetBaseUrl
  return `${base}/relics/${slug(id, /^RELIC\./)}.png`
}

export function relicDisplayName(id: string): string {
  return titleCase(slug(id, /^RELIC\./))
}

export function cardImageUrl(id: string, upgraded?: boolean): string {
  const base = useRuntimeConfig().public.assetBaseUrl
  return `${base}/cards/${slug(id, /^CARD\./)}${upgraded ? '_plus' : ''}.png`
}

export function cardDisplayName(id: string): string {
  return titleCase(slug(id, /^CARD\./))
}