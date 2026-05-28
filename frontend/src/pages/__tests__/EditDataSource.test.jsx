import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { deleteDataSource, getDataSource, updateDataSource } from 'api/dataSources'
import { getProjects } from 'api/projects'
import EditDataSource from '../EditDataSource'

vi.mock('api/dataSources')
vi.mock('api/projects')

const project = {
  id: 1,
  name: 'Customer Support NLP',
  description: 'Project inventory for support tickets.',
}

const dataSource = {
  id: 11,
  project: 1,
  project_name: 'Customer Support NLP',
  name: 'Support Tickets',
  location: 'datasets/support.json',
  source_type: 'manual',
  source_type_display: 'Manual',
  data_format: 'text',
  data_format_display: 'Text',
  metadata: { manual_data: 'Example support ticket' },
  updated_at: '2026-05-18T10:00:00Z',
}

const updatedDataSource = {
  ...dataSource,
  name: 'Updated Support Tickets',
  location: 'datasets/support-updated.json',
}

function renderEditDataSource(initialEntry = '/data-sources/11/edit?project=1') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/data-sources/:dataSourceId/edit" element={<EditDataSource />} />
        <Route path="/data-sources" element={<div>Data sources destination</div>} />
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
  window.confirm = vi.fn(() => true)
  getProjects.mockResolvedValue([project])
  getDataSource.mockResolvedValue(dataSource)
  updateDataSource.mockResolvedValue(updatedDataSource)
  deleteDataSource.mockResolvedValue()
})

describe('EditDataSource page', () => {
  test('loads an existing data source and saves changes', async () => {
    const user = userEvent.setup()

    renderEditDataSource()

    const nameInput = await screen.findByDisplayValue('Support Tickets')
    const locationInput = screen.getByDisplayValue('datasets/support.json')

    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Support Tickets')
    await user.clear(locationInput)
    await user.type(locationInput, 'datasets/support-updated.json')
    await user.click(screen.getByRole('button', { name: /Save Changes/ }))

    await waitFor(() => {
      expect(updateDataSource).toHaveBeenCalledWith(
        1,
        11,
        expect.objectContaining({
          project: '1',
          name: 'Updated Support Tickets',
          location: 'datasets/support-updated.json',
          source_type: 'manual',
          data_format: 'text',
          metadata: expect.objectContaining({ manual_data: 'Example support ticket' }),
        }),
      )
      expect(screen.getByText('Project details destination')).toBeInTheDocument()
    })

    expect(readCachedDataSources()).toEqual([updatedDataSource])
  })

  test('deletes a data source after confirmation and clears it from cache', async () => {
    const user = userEvent.setup()
    window.sessionStorage.setItem('privacy-dashboard.data-sources', JSON.stringify([dataSource]))

    renderEditDataSource()

    await screen.findByDisplayValue('Support Tickets')
    await user.click(screen.getByRole('button', { name: /Delete Data Source/ }))

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Delete "Support Tickets"?')
      expect(deleteDataSource).toHaveBeenCalledWith(1, 11)
      expect(screen.getByText('Project details destination')).toBeInTheDocument()
    })

    expect(readCachedDataSources()).toEqual([])
  })

  test('cancels back to the current project details page', async () => {
    const user = userEvent.setup()

    renderEditDataSource()

    await screen.findByDisplayValue('Support Tickets')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Project details destination')).toBeInTheDocument()
  })

  test('shows an error for an invalid edit route', () => {
    renderEditDataSource('/data-sources/11/edit')

    expect(screen.getByText('Could not identify the data source to edit.')).toBeInTheDocument()
    expect(getDataSource).not.toHaveBeenCalled()
  })
})
