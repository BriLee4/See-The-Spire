import type { MapPoint } from '~/types/map'

interface RawMapData {
  Point: MapPoint[] 
}

function parseMapPoint(raw: MapPoint): MapPoint {
  return {
    Col: raw.Col,
    Row: raw.Row,
    PointType: raw.PointType,
    ChildIds: raw.ChildIds,
  }
}

export function useMap() {
  const map = ref<MapPoint[]>([])

  async function loadMap(actFile: string) {
    const text = await $fetch<string>(`/data/${actFile}`, { responseType: 'text' })
    const raw: RawMapData = JSON.parse(text)
    map.value = raw.Point.map(parseMapPoint)
  }

  return { map, loadMap }
}