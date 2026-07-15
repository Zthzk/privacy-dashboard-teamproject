import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createDataSource, getDataFormatHints } from 'api/dataSources'
import { getProjects } from 'api/projects'
import AddDataSource from '../AddDataSource'

// Mock backend API calls so tests run without a real server
vi.mock('api/dataSources')
vi.mock('api/projects')

// Sample project fixture used across tests
const project = {
  id: 1,
  name: 'Support Analytics Project',
  description: 'Project inventory for support tickets.',
  data_sources_count: 0,
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-18T10:00:00Z',
}

// Sample data source returned by the backend after a successful create
const createdDataSource = {
  id: 11,
  project: 1,
  project_name: 'Support Analytics Project',
  name: 'Support Tickets',
  location: 'datasets/support.json',
  source_type: 'manual',
  source_type_display: 'Manual',
  data_format: 'text',
  data_format_display: 'Text',
  metadata: { manual_data: 'Example support ticket' },
}

// Renders the current URL so tests can assert navigation behavior without a real browser
function LocationDestination({ label }) {
  const location = useLocation()

  // Render the destination URL so tests can assert explicit return-path behavior.
  return <div>{`${label}: ${location.pathname}${location.search}`}</div>
}

// Mounts AddDataSource inside a router with sibling routes for asserting navigation targets
function renderAddDataSource(initialEntry = '/data-sources/new?project=1') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/data-sources/new" element={<AddDataSource />} />
        <Route path="/data-sources" element={<LocationDestination label="Data sources destination" />} />
        <Route path="/projects" element={<div>Projects destination</div>} />
        <Route path="/projects/:projectId" element={<LocationDestination label="Project details destination" />} />
      </Routes>
    </MemoryRouter>,
  )
}

// Reads cached data sources from sessionStorage to verify the cache was updated after save
function readCachedDataSources() {
  return JSON.parse(window.sessionStorage.getItem('privacy-dashboard.data-sources') || '[]')
}

// Reset mocks and provide default API responses before each test
beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  getProjects.mockResolvedValue([project])
  createDataSource.mockResolvedValue(createdDataSource)
  getDataFormatHints.mockResolvedValue({})
})

describe('AddDataSource page', () => {
  // Full happy-path: preset project loads, form is filled, data source is created and cached,
  // then the page navigates to /data-sources (global flow without returnTo=project)
  test('loads the preset project and creates a data source', async () => {
    const user = userEvent.setup()

    renderAddDataSource()

    expect(await screen.findByDisplayValue('Support Analytics Project')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Data Source Name/i), 'Support Tickets')
    await user.type(screen.getByLabelText(/Location \/ Reference/i), 'datasets/support.json')
    await user.type(screen.getByPlaceholderText(/Name: Anna Mueller/i), 'Example support ticket')
    await user.click(screen.getByRole('button', { name: /Add Data Source/ }))

    await waitFor(() => {
      expect(createDataSource).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Support Tickets',
          location: 'datasets/support.json',
          source_type: 'manual',
          data_format: 'text',
          metadata: { manual_data: 'Example support ticket' },
        }),
      )
      expect(screen.getByText('Data sources destination: /data-sources')).toBeInTheDocument()
    })

    expect(readCachedDataSources()).toEqual([createdDataSource])
  })

  // When the user arrives via a project page (returnTo=project), saving should return to
  // the project overview rather than the global data-source list
  test('returns to project details after creating from project context', async () => {
    const user = userEvent.setup()

    renderAddDataSource('/data-sources/new?project=1&returnTo=project')

    expect(await screen.findByDisplayValue('Support Analytics Project')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Data Source Name/i), 'Support Tickets')
    await user.type(screen.getByLabelText(/Location \/ Reference/i), 'datasets/support.json')
    await user.click(screen.getByRole('button', { name: /Add Data Source/ }))

    await waitFor(() => {
      expect(screen.getByText('Project details destination: /projects/1')).toBeInTheDocument()
    })
  })

  // Cancel uses the same return context as save so users do not lose their place
  test('cancels back to the selected project details page', async () => {
    const user = userEvent.setup()

    renderAddDataSource('/data-sources/new?project=1&returnTo=project')

    await screen.findByDisplayValue('Support Analytics Project')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Project details destination: /projects/1')).toBeInTheDocument()
  })

  // Submitting without filling required fields should show inline errors and not call the API
  test('shows validation errors when required fields are missing', async () => {
    const { container } = renderAddDataSource('/data-sources/new')
    await screen.findByRole('heading', { name: 'Add Data Source' })

    fireEvent.submit(container.querySelector('form'))

    expect(await screen.findByText('Project is required.')).toBeInTheDocument()
    expect(screen.getByText('Data source name is required.')).toBeInTheDocument()
    expect(createDataSource).not.toHaveBeenCalled()
  })

  // When no projects exist yet, the form shows a call-to-action directing the user to create one first
  test('points users to projects when no projects exist', async () => {
    getProjects.mockResolvedValue([])

    renderAddDataSource('/data-sources/new')

    expect(await screen.findByText('Create a project before adding data sources.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Projects' })).toBeInTheDocument()
  })
})
