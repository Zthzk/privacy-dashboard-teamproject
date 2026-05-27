const dataSourcesCacheKey = 'privacy-dashboard.data-sources'

export function readCachedDataSources() {
  if (typeof window === 'undefined') return []

  try {
    const cachedDataSources = JSON.parse(window.sessionStorage.getItem(dataSourcesCacheKey) || '[]')
    return Array.isArray(cachedDataSources) ? cachedDataSources : []
  } catch {
    return []
  }
}

export function writeCachedDataSources(dataSources) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(dataSourcesCacheKey, JSON.stringify(dataSources))
  } catch {
    // Cache failures should never block data source workflows.
  }
}

export function upsertCachedDataSource(dataSource) {
  const cachedDataSources = readCachedDataSources()
  const nextDataSources = [
    dataSource,
    ...cachedDataSources.filter((cachedDataSource) => cachedDataSource.id !== dataSource.id),
  ]
  writeCachedDataSources(nextDataSources)
}

export function removeCachedDataSource(dataSourceId) {
  const cachedDataSources = readCachedDataSources()
  writeCachedDataSources(cachedDataSources.filter((dataSource) => dataSource.id !== dataSourceId))
}
