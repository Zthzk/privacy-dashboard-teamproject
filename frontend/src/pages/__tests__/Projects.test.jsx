import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createProject, deleteProject, getProjects, updateProject } from 'api/projects'
import Projects from '../Projects'

vi.mock('api/projects')

const baseProject = {
  id: 1,
  name: 'Support Analytics Project',
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
      expect(screen.getByText('Support Analytics Project')).toBeInTheDocument()
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
      expect(screen.getByText('Support Analytics Project')).toBeInTheDocument()
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

    await screen.findByText('Support Analytics Project')

    await userEvent.type(screen.getByPlaceholderText('Search projects...'), 'road')

    expect(screen.getByText('Traffic Vision')).toBeInTheDocument()
    expect(screen.queryByText('Support Analytics Project')).not.toBeInTheDocument()
  })

  test('paginates projects with the selected page size', async () => {
    const pageFixtureProjects = ['Invoices Project', 'Road Analytics Project', 'Patient Trends Project', 'Support Analytics Project'].map((name, index) => ({
      ...baseProject,
      id: index + 1,
      name,
      updated_at: `2026-05-0${index + 1}T10:00:00Z`,
    }))
    const extraProjects = Array.from({ length: 8 }, (_, index) => ({
      ...baseProject,
      id: index + 5,
      name: `Project ${String(index + 5).padStart(2, '0')}`,
      updated_at: `2026-05-${String(index + 5).padStart(2, '0')}T10:00:00Z`,
    }))

    getProjects.mockResolvedValue([...pageFixtureProjects, ...extraProjects])

    renderProjects()

    await screen.findByText('Showing 1 to 10 of 12 projects')
    expect(screen.queryByText('Invoices Project')).not.toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Next page'))

    expect(screen.getByText('Showing 11 to 12 of 12 projects')).toBeInTheDocument()
    expect(screen.getByText('Invoices Project')).toBeInTheDocument()
  })

  test('moves focus between create project fields with arrow keys', async () => {
    createProject.mockResolvedValue(baseProject)
    const user = userEvent.setup()

    renderProjects()
    await screen.findByText('Support Analytics Project')

    await user.click(screen.getByRole('button', { name: 'New Project' }))
    const dialog = await screen.findByRole('dialog', { name: 'Create New Project' })
    const nameInput = within(dialog).getByLabelText(/Project Name/i)
    const descriptionInput = within(dialog).getByLabelText(/Description/i)

    await user.click(nameInput)
    await user.keyboard('{ArrowDown}')
    expect(descriptionInput).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(nameInput).toHaveFocus()
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
    await screen.findByText('Support Analytics Project')

    await user.click(screen.getByRole('button', { name: 'Edit Support Analytics Project' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit Project' })
    const nameInput = within(dialog).getByDisplayValue('Support Analytics Project')
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
    await screen.findByText('Support Analytics Project')

    await userEvent.click(screen.getByRole('button', { name: 'Delete Support Analytics Project' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete Project' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete Project' }))

    await waitFor(() => {
      expect(deleteProject).toHaveBeenCalledWith(1)
      expect(screen.queryByText('Support Analytics Project')).not.toBeInTheDocument()
    })

    expect(readCachedProjects()).toEqual([])
  })
})
