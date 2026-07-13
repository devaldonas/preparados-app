declare module 'supercluster' {
  interface SuperclusterOptions {
    radius?: number
    maxZoom?: number
    minZoom?: number
    minPoints?: number
    extent?: number
    nodeSize?: number
    log?: boolean
  }

  interface ClusterProperties {
    cluster?: boolean
    cluster_id?: number
    point_count?: number
    point_count_abbreviated?: number
    [key: string]: any
  }

  interface PointFeature<P = any> {
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
    properties: P & ClusterProperties
  }

  class Supercluster<P = any> {
    constructor(options?: SuperclusterOptions)
    load(points: PointFeature<P>[]): void
    getClusters(bbox: [number, number, number, number], zoom: number): PointFeature<P>[]
    getClusterExpansionZoom(clusterId: number): number
    getChildren(clusterId: number): PointFeature<P>[]
    getLeaves(clusterId: number, limit?: number, offset?: number): PointFeature<P>[]
  }

  export default Supercluster
}