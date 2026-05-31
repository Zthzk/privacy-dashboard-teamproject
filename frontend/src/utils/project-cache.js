const projectsCacheKey = 'privacy-dashboard.projects'
const projectStyleOverridesCacheKey = 'privacy-dashboard.projectStyleOverrides'

function isLegacySampleProject(project) {
  return (
    project?.isSample === true ||
    String(project?.id ?? '').startsWith('sample-')
  )
}

export function readCachedProjects() {
  if (typeof window === 'undefined') return []

  try {
    const cachedProjects = JSON.parse(window.sessionStorage.getItem(projectsCacheKey) || '[]')
    return Array.isArray(cachedProjects) ? cachedProjects.filter((project) => !isLegacySampleProject(project)) : []
  } catch {
    return []
  }
}

export function writeCachedProjects(projects) {
  if (typeof window === 'undefined') return

  try {
    const safeProjects = Array.isArray(projects) ? projects.filter((project) => !isLegacySampleProject(project)) : []
    window.sessionStorage.setItem(projectsCacheKey, JSON.stringify(safeProjects))
  } catch {
    // Cache failures should never block project workflows.
  }
}

export function readProjectStyleOverrides() {
  if (typeof window === 'undefined') return {}

  try {
    const projectStyleOverrides = JSON.parse(window.sessionStorage.getItem(projectStyleOverridesCacheKey) || '{}')
    return projectStyleOverrides && typeof projectStyleOverrides === 'object' && !Array.isArray(projectStyleOverrides) ? projectStyleOverrides : {}
  } catch {
    return {}
  }
}

export function writeProjectStyleOverride(projectId, style) {
  if (typeof window === 'undefined') return

  try {
    const projectStyleOverrides = readProjectStyleOverrides()
    window.sessionStorage.setItem(
      projectStyleOverridesCacheKey,
      JSON.stringify({
        ...projectStyleOverrides,
        [String(projectId)]: style,
      }),
    )
  } catch {
    // Cache failures should never block project workflows.
  }
}
