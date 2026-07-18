import {
  CarOutlined,
  HeartOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'

import { readProjectStyleOverrides } from 'utils/project-cache'

export const projectIconOptions = [
  { key: 'message', label: 'Support' },
  { key: 'shopping', label: 'Commerce' },
  { key: 'traffic', label: 'Traffic' },
  { key: 'health', label: 'Health' },
]

export const projectColorOptions = [
  { key: 'primary', label: 'Blue' },
  { key: 'success', label: 'Green' },
  { key: 'warning', label: 'Amber' },
  { key: 'error', label: 'Red' },
]

export const defaultProjectStyle = {
  ...projectIconOptions[0],
  color: projectColorOptions[0].key,
}

export const projectIconMap = {
  message: MessageOutlined,
  shopping: ShoppingCartOutlined,
  traffic: CarOutlined,
  health: HeartOutlined,
}

export function getProjectStyle(project) {
  const option = projectIconOptions.find((item) => item.key === project?.icon_key) ?? defaultProjectStyle

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
  return projects.map((project) => {
    const cachedStyle = styleOverrides[String(project.id)] ?? {}

    // Backend values are authoritative. Cache overrides only support projects
    // returned by older API versions that did not persist display styles.
    return {
      ...project,
      icon_key: project.icon_key ?? cachedStyle.icon_key,
      color: project.color ?? cachedStyle.color,
    }
  })
}

export function getVisibleProjects(primaryProjects) {
  return sortProjectsNewestFirst(applyProjectStyleOverrides(primaryProjects, readProjectStyleOverrides()))
}
