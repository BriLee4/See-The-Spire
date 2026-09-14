export interface MapPoint {
  Col: number        // 0-7
  Row: number           
  PointType: string       // room type
  ChildIds: [number, number][]         // list of child map points
}