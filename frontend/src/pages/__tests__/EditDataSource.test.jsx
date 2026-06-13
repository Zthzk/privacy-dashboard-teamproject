import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { deleteDataSource, getDataFormatHints, getDataSource, updateDataSource } from 'api/dataSources'
import { getProjects } from 'api/projects'
import EditDataSource from '../EditDataSource'

vi.mock('api/dataSources')
vi.mock('api/projects')

const project = {
  id: 1,
  name: 'Support Analytics Project',
  description: 'Project inventory for support tickets.',
}

const dataSource = {
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
  updated_at: '2026-05-18T10:00:00Z',
}

const updatedDataSource = {
  ...dataSource,
  name: 'Updated Support Tickets',
  location: 'datasets/support-updated.json',
}

function LocationDestination({ label }) {
  const location = useLocation()

  // Render the destination URL so return-context assertions stay independent from page internals.
  return <div>{`${label}: ${location.pathname}${location.search}`}</div>
}

function renderEditDataSource(initialEntry = '/data-sources/11/edit?project=1', routerOptions = {}) {
  const initialEntries = routerOptions.initialEntries ?? [initialEntry]
  const initialIndex = routerOptions.initialIndex ?? initialEntries.length - 1

  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <Routes>
        <Route path="/data-sources/:dataSourceId/edit" element={<EditDataSource />} />
        <Route path="/data-sources" element={<LocationDestination label="Data sources destination" />} />
        <Route path="/projects/:projectId" element={<LocationDestination label="Project details destination" />} />
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
  getDataFormatHints.mockResolvedValue({})
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
      expect(screen.getByText('Data sources destination: /data-sources')).toBeInTheDocument()
    })

    expect(readCachedDataSources()).toEqual([updatedDataSource])
  })

  test('returns to project details after saving from project context', async () => {
    const user = userEvent.setup()

    // Saving from project details must not redirect users back to the global data-source list.
    renderEditDataSource('/data-sources/11/edit?project=1&returnTo=project')

    const nameInput = await screen.findByDisplayValue('Support Tickets')

    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Support Tickets')
    await user.click(screen.getByRole('button', { name: /Save Changes/ }))

    await waitFor(() => {
      expect(screen.getByText('Project details destination: /projects/1')).toBeInTheDocument()
    })
  })

  test('deletes a data source after confirmation and clears it from cache', async () => {
    const user = userEvent.setup()
    window.sessionStorage.setItem('privacy-dashboard.data-sources', JSON.stringify([dataSource]))

    renderEditDataSource()

    await screen.findByDisplayValue('Support Tickets')
    await user.click(screen.getByRole('button', { name: /Delete Data Source/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete Data Source' })
    expect(within(dialog).getByText('Delete "Support Tickets" from this project? The project metrics and risk assessment will update after deletion.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(deleteDataSource).toHaveBeenCalledWith(1, 11)
      expect(screen.getByText('Data sources destination: /data-sources')).toBeInTheDocument()
    })

    expect(readCachedDataSources()).toEqual([])
  })

  test('cancels back to the previous page', async () => {
    const user = userEvent.setup()

    renderEditDataSource('/data-sources/11/edit?project=1', {
      initialEntries: ['/data-sources', '/data-sources/11/edit?project=1'],
    })

    await screen.findByDisplayValue('Support Tickets')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Data sources destination: /data-sources')).toBeInTheDocument()
  })

  test('returns to project details when canceling from project context without history', async () => {
    const user = userEvent.setup()

    // This guards the explicit returnTo query param when browser history cannot help.
    renderEditDataSource('/data-sources/11/edit?project=1&returnTo=project')

    await screen.findByDisplayValue('Support Tickets')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Project details destination: /projects/1')).toBeInTheDocument()
  })

  test('shows an error for an invalid edit route', () => {
    // Without a project id the API route cannot be constructed safely.
    renderEditDataSource('/data-sources/11/edit')

    expect(screen.getByText('Could not identify the data source to edit.')).toBeInTheDocument()
    expect(getDataSource).not.toHaveBeenCalled()
    expect(getDataFormatHints).not.toHaveBeenCalled()
  })
})
