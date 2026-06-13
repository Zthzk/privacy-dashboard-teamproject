import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { deleteDataSource, getAllDataSources } from 'api/dataSources'
import { getProjects } from 'api/projects'
import DataSources from '../DataSources'

vi.mock('api/dataSources')
vi.mock('api/projects')

const project = {
  id: 1,
  name: 'Support Analytics Project',
}

const dataSources = [
  {
    id: 11,
    project: 1,
    project_name: 'Support Analytics Project',
    name: 'Support Tickets',
    location: 'datasets/support.json',
    source_type: 'manual',
    source_type_display: 'Manual',
    data_format: 'text',
    data_format_display: 'Text',
    contains_personal_data: true,
    risk_level: 'medium',
    preview_text: 'Name: Anna Mueller\nEmail: anna@example.com\nTicket: Needs support.',
    metadata: {},
    updated_at: '2026-05-18T10:00:00Z',
  },
]

function renderDataSources() {
  return render(
    <MemoryRouter initialEntries={['/data-sources']}>
      <Routes>
        <Route path="/data-sources" element={<DataSources />} />
        <Route path="/data-sources/:dataSourceId/edit" element={<div>Edit destination</div>} />
        <Route path="/projects/:projectId" element={<div>Project details destination</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  getAllDataSources.mockResolvedValue(dataSources)
  getProjects.mockResolvedValue([project])
  deleteDataSource.mockResolvedValue()
})

describe('DataSources page', () => {
  test('opens dataset preview when clicking a data source row', async () => {
    const user = userEvent.setup()

    renderDataSources()

    await screen.findByText('Support Tickets')
    await user.click(screen.getByRole('row', { name: /Support Tickets/ }))

    expect(screen.getByRole('dialog', { name: 'Dataset Preview' })).toBeInTheDocument()
    expect(screen.getByText(/Name: Anna Mueller/)).toBeInTheDocument()
    expect(screen.getByText(/Email: anna@example.com/)).toBeInTheDocument()
  })

  test('opens the same dataset preview from the action button', async () => {
    const user = userEvent.setup()

    renderDataSources()

    await screen.findByText('Support Tickets')
    await user.click(screen.getByRole('button', { name: 'Preview Support Tickets' }))

    expect(screen.getByRole('dialog', { name: 'Dataset Preview' })).toBeInTheDocument()
    expect(screen.getByText(/Ticket: Needs support/)).toBeInTheDocument()
  })
})
