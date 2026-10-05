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
