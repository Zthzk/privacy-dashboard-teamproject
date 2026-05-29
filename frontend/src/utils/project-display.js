import {
  CarOutlined,
  HeartOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'

import { mergeUniqueById, sampleProjects } from 'constants/dashboardSampleData'
import {
  readDeletedSampleProjectIds,
  readProjectStyleOverrides,
  readSampleProjectOverrides,
} from 'utils/project-cache'

export const projectStyleOptions = [
  { key: 'message', label: 'Support', color: 'primary' },
  { key: 'shopping', label: 'Commerce', color: 'success' },
  { key: 'traffic', label: 'Traffic', color: 'warning' },
  { key: 'health', label: 'Health', color: 'error' },
]

export const defaultProjectStyle = projectStyleOptions[0]

export const projectIconMap = {
  message: MessageOutlined,
  shopping: ShoppingCartOutlined,
  traffic: CarOutlined,
  health: HeartOutlined,
}

export function getProjectStyle(project) {
  const option = projectStyleOptions.find((item) => item.key === project?.icon_key) ?? defaultProjectStyle

  return {
    ...option,
    color: project?.color ?? option.color,
  }
}

export function getProjectTimestamp(project) {
  const timestamp = Date.parse(project?.created_at ?? project?.created ?? project?.updated_at ?? project?.updated ?? '')
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function sortProjectsNewestFirst(projects) {
  return [...projects].sort((firstProject, secondProject) => getProjectTimestamp(secondProject) - getProjectTimestamp(firstProject))
}

export function applyProjectStyleOverrides(projects, styleOverrides) {
  return projects.map((project) => ({
    ...project,
    ...(styleOverrides[String(project.id)] ?? {}),
  }))
}

export function getVisibleProjects(primaryProjects) {
  const deletedSampleProjectIds = new Set(readDeletedSampleProjectIds().map(String))
  const primaryProjectNames = new Set(primaryProjects.map((project) => project.name?.trim().toLowerCase()).filter(Boolean))
  const visibleSampleProjects = mergeUniqueById(readSampleProjectOverrides(), sampleProjects).filter(
    (project) => !deletedSampleProjectIds.has(String(project.id)) && !primaryProjectNames.has(project.name?.trim().toLowerCase()),
  )

  return sortProjectsNewestFirst(applyProjectStyleOverrides(mergeUniqueById(primaryProjects, visibleSampleProjects), readProjectStyleOverrides()))
}
