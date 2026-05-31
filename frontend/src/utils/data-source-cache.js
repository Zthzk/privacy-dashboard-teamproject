const dataSourcesCacheKey = 'privacy-dashboard.data-sources'

function isLegacySampleDataSource(dataSource) {
  return (
    dataSource?.isSample === true ||
    String(dataSource?.id ?? '').startsWith('sample-')
  )
}

export function readCachedDataSources() {
  if (typeof window === 'undefined') return []

  try {
    const cachedDataSources = JSON.parse(window.sessionStorage.getItem(dataSourcesCacheKey) || '[]')
    return Array.isArray(cachedDataSources)
      ? cachedDataSources.filter((dataSource) => !isLegacySampleDataSource(dataSource))
      : []
  } catch {
    return []
  }
}

export function writeCachedDataSources(dataSources) {
  if (typeof window === 'undefined') return

  try {
    const safeDataSources = Array.isArray(dataSources)
      ? dataSources.filter((dataSource) => !isLegacySampleDataSource(dataSource))
      : []
    window.sessionStorage.setItem(dataSourcesCacheKey, JSON.stringify(safeDataSources))
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
