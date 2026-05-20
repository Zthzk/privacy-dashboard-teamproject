const projectsCacheKey = 'privacy-dashboard.projects'

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

export function prependCachedProject(project) {
  const cachedProjects = readCachedProjects()
  const nextProjects = [
    project,
    ...cachedProjects.filter((cachedProject) => cachedProject.id !== project.id),
  ]
  writeCachedProjects(nextProjects)
}
