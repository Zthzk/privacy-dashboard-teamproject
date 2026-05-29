const projectsCacheKey = 'privacy-dashboard.projects'
const deletedSampleProjectsCacheKey = 'privacy-dashboard.deletedSampleProjects'
const sampleProjectOverridesCacheKey = 'privacy-dashboard.sampleProjectOverrides'
const projectStyleOverridesCacheKey = 'privacy-dashboard.projectStyleOverrides'

export function readCachedProjects() {
  if (typeof window === 'undefined') return []

  try {
    const cachedProjects = JSON.parse(window.sessionStorage.getItem(projectsCacheKey) || '[]')
    return Array.isArray(cachedProjects) ? cachedProjects : []
  } catch {
    return []
  }
}

export function writeCachedProjects(projects) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(projectsCacheKey, JSON.stringify(projects))
  } catch {
    // Cache failures should never block project workflows.
  }
}

export function readDeletedSampleProjectIds() {
  if (typeof window === 'undefined') return []

  try {
    const deletedProjectIds = JSON.parse(window.sessionStorage.getItem(deletedSampleProjectsCacheKey) || '[]')
    return Array.isArray(deletedProjectIds) ? deletedProjectIds : []
  } catch {
    return []
  }
}

export function markSampleProjectDeleted(projectId) {
  if (typeof window === 'undefined') return

  try {
    const deletedProjectIds = new Set(readDeletedSampleProjectIds().map(String))
    deletedProjectIds.add(String(projectId))
    window.sessionStorage.setItem(deletedSampleProjectsCacheKey, JSON.stringify([...deletedProjectIds]))
  } catch {
    // Cache failures should never block project workflows.
  }
}

export function readSampleProjectOverrides() {
  if (typeof window === 'undefined') return []

  try {
    const sampleProjectOverrides = JSON.parse(window.sessionStorage.getItem(sampleProjectOverridesCacheKey) || '[]')
    return Array.isArray(sampleProjectOverrides) ? sampleProjectOverrides : []
  } catch {
    return []
  }
}

export function writeSampleProjectOverride(project) {
  if (typeof window === 'undefined') return

  try {
    const sampleProjectOverrides = readSampleProjectOverrides()
    const nextSampleProjectOverrides = [
      project,
      ...sampleProjectOverrides.filter((sampleProject) => sampleProject.id !== project.id),
    ]
    window.sessionStorage.setItem(sampleProjectOverridesCacheKey, JSON.stringify(nextSampleProjectOverrides))
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
