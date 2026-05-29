import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createDataSource, getDataFormatHints } from 'api/dataSources'
import { getProjects } from 'api/projects'
import AddDataSource from '../AddDataSource'

vi.mock('api/dataSources')
vi.mock('api/projects')

const project = {
  id: 1,
  name: 'Support Analytics Project',
  description: 'Project inventory for support tickets.',
  data_sources_count: 0,
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-18T10:00:00Z',
}

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

function renderAddDataSource(initialEntry = '/data-sources/new?project=1') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/data-sources/new" element={<AddDataSource />} />
        <Route path="/data-sources" element={<div>Data sources destination</div>} />
        <Route path="/projects" element={<div>Projects destination</div>} />
        <Route path="/projects/:projectId" element={<div>Project details destination</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function readCachedDataSources() {
  return JSON.parse(window.sessionStorage.getItem('privacy-dashboard.data-sources') || '[]')
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  getProjects.mockResolvedValue([project])
  createDataSource.mockResolvedValue(createdDataSource)
  getDataFormatHints.mockResolvedValue({})
})

describe('AddDataSource page', () => {
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
      expect(screen.getByText('Project details destination')).toBeInTheDocument()
    })

    expect(readCachedDataSources()).toEqual([createdDataSource])
  })

  test('cancels back to the selected project details page', async () => {
    const user = userEvent.setup()

    renderAddDataSource()

    await screen.findByDisplayValue('Support Analytics Project')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Project details destination')).toBeInTheDocument()
  })

  test('shows validation errors when required fields are missing', async () => {
    const { container } = renderAddDataSource('/data-sources/new')
    await screen.findByRole('heading', { name: 'Add Data Source' })

    fireEvent.submit(container.querySelector('form'))

    expect(await screen.findByText('Project is required.')).toBeInTheDocument()
    expect(screen.getByText('Data source name is required.')).toBeInTheDocument()
    expect(createDataSource).not.toHaveBeenCalled()
  })

  test('points users to projects when no projects exist', async () => {
    getProjects.mockResolvedValue([])

    renderAddDataSource('/data-sources/new')

    expect(await screen.findByText('Create a project before adding data sources.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Projects' })).toBeInTheDocument()
  })
})
