import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getAllDataSources, getDataSourceVersions } from 'api/dataSources'
import { getProjects } from 'api/projects'
import Dashboard from '../Dashboard'

vi.mock('api/dataSources')
vi.mock('api/projects')

const projects = [
  {
    id: 1,
    name: 'Support Analytics Project',
    description: 'Tracks support ticket privacy risk.',
    data_sources_count: 1,
    overall_status: 'yellow',
    personal_data_sources: 1,
    updated_at: '2026-05-18T10:00:00Z',
  },
]

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
    current_version_number: 2,
    metadata: {
      manual_data: 'Name: Anna Mueller\nEmail: anna@example.com\nTicket: Needs support.',
    },
    updated_at: '2026-05-18T10:00:00Z',
  },
]

const dataSourceVersions = [
  {
    id: 112,
    version_number: 2,
    name: 'Support Tickets',
    source_type: 'manual',
    source_type_display: 'Manual',
    data_format: 'text',
    data_format_display: 'Text',
    location: 'datasets/support.json',
    contains_personal_data: true,
    risk_level: 'medium',
    art_9_data: 'no',
    compliance_violations: [],
    metadata: {
      manual_data: 'Name: Anna Mueller\nEmail: anna@example.com\nTicket: Needs support.',
    },
    created_at: '2026-05-18T10:00:00Z',
  },
  {
    id: 111,
    version_number: 1,
    name: 'Support Tickets',
    source_type: 'manual',
    source_type_display: 'Manual',
    data_format: 'text',
    data_format_display: 'Text',
    location: 'datasets/support.json',
    contains_personal_data: false,
    risk_level: 'low',
    art_9_data: 'no',
    compliance_violations: [],
    metadata: {
      manual_data: 'Ticket: Needs support.',
    },
    created_at: '2026-05-17T10:00:00Z',
  },
]

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/data-sources/:dataSourceId/edit" element={<div>Edit data source destination</div>} />
        <Route path="/projects/:projectId" element={<div>Project details destination</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getProjects.mockResolvedValue(projects)
  getAllDataSources.mockResolvedValue(dataSources)
  getDataSourceVersions.mockResolvedValue(dataSourceVersions)
})

describe('Dashboard page', () => {
  test('opens data source action menu inside project preview', async () => {
    const user = userEvent.setup()

    renderDashboard()

    await screen.findByText('Support Analytics Project')
    await user.click(screen.getByRole('row', { name: /Support Analytics Project/ }))

    const previewDialog = await screen.findByRole('dialog', { name: /Project Preview/ })
    expect(previewDialog).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'More actions for Support Tickets' }))

    expect(screen.getByRole('menu', { name: 'Actions for Support Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Preview data source' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'View version history' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Edit data source' })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'View version history' }))

    expect(getDataSourceVersions).toHaveBeenCalledWith(1, 11)
    expect(await screen.findByText('Version History')).toBeInTheDocument()
  })
})
