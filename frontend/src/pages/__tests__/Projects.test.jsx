import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { deleteProject, getProjects, updateProject } from 'api/projects'
import Projects from '../Projects'

vi.mock('api/projects')

const baseProject = {
  id: 1,
  name: 'Customer Support NLP',
  description: 'Project inventory for customer support tickets.',
  data_sources_count: 3,
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-18T10:00:00Z',
}

function renderProjects() {
  return render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>,
  )
}

function readCachedProjects() {
  return JSON.parse(window.sessionStorage.getItem('privacy-dashboard.projects') || '[]')
}

async function openProjectMenu(projectName = baseProject.name) {
  const menuButton = await screen.findByLabelText(`More actions for ${projectName}`)
  await userEvent.click(menuButton)
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  window.confirm = vi.fn(() => true)
  getProjects.mockResolvedValue([baseProject])
})

describe('Projects page', () => {
  test('loads projects from the API and caches them for the next visit', async () => {
    renderProjects()

    expect(screen.getByText('Loading projects...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Customer Support NLP')).toBeInTheDocument()
    })

    expect(getProjects).toHaveBeenCalledTimes(1)
    expect(readCachedProjects()).toEqual([baseProject])
  })

  test('shows cached projects immediately while refreshing in the background', async () => {
    const cachedProject = {
      ...baseProject,
      id: 2,
      name: 'Cached Project',
      description: 'Shown before the backend refresh finishes.',
    }

    window.sessionStorage.setItem('privacy-dashboard.projects', JSON.stringify([cachedProject]))

    renderProjects()

    // This protects the perceived-performance optimization: returning users see the last list immediately.
    expect(screen.getByText('Cached Project')).toBeInTheDocument()
    expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Customer Support NLP')).toBeInTheDocument()
    })
  })

  test('keeps long project descriptions inside the description column', async () => {
    const longDescription = `good${'d'.repeat(300)}good${'d'.repeat(300)}`
    getProjects.mockResolvedValue([{ ...baseProject, description: longDescription }])

    renderProjects()

    const description = await screen.findByTitle(longDescription)

    // Regression check for long unbroken text that previously pushed table cells out of place.
    expect(description).toHaveStyle({
      display: '-webkit-box',
      overflow: 'hidden',
      overflowWrap: 'anywhere',
      WebkitLineClamp: '2',
    })
  })

  test('filters projects by text from name or description', async () => {
    getProjects.mockResolvedValue([
      baseProject,
      {
        ...baseProject,
        id: 2,
        name: 'Traffic Vision',
        description: 'Images collected for road monitoring.',
      },
    ])

    renderProjects()

    await screen.findByText('Customer Support NLP')

    await userEvent.type(screen.getByPlaceholderText('Search projects...'), 'road')

    expect(screen.getByText('Traffic Vision')).toBeInTheDocument()
    expect(screen.queryByText('Customer Support NLP')).not.toBeInTheDocument()
  })

  test('updates a project and writes the updated list back to cache', async () => {
    const user = userEvent.setup()
    const updatedProject = {
      ...baseProject,
      name: 'Updated ML Project',
      description: 'Updated description',
    }
    updateProject.mockResolvedValue(updatedProject)

    renderProjects()
    await screen.findByText('Customer Support NLP')

    await openProjectMenu()
    await user.click(within(screen.getByRole('menu')).getByText('Edit'))
    const dialog = await screen.findByRole('dialog', { name: 'Edit Project' })
    const nameInput = within(dialog).getByDisplayValue('Customer Support NLP')
    const descriptionInput = within(dialog).getByDisplayValue('Project inventory for customer support tickets.')

    await user.clear(nameInput)
    await user.type(nameInput, 'Updated ML Project')
    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'Updated description')
    await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Updated ML Project',
          description: 'Updated description',
        }),
      )
      expect(screen.getByText('Updated ML Project')).toBeInTheDocument()
    })

    expect(readCachedProjects()).toEqual([updatedProject])
  })

  test('deletes a project after confirmation and updates the cache', async () => {
    renderProjects()
    await screen.findByText('Customer Support NLP')

    await openProjectMenu()
    const menu = screen.getByRole('menu')
    await userEvent.click(within(menu).getByText('Delete'))

    await waitFor(() => {
      expect(deleteProject).toHaveBeenCalledWith(1)
      expect(screen.queryByText('Customer Support NLP')).not.toBeInTheDocument()
    })

    expect(readCachedProjects()).toEqual([])
  })
})
