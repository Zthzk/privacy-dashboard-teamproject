import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { deleteDataSource } from 'api/dataSources'
import { getProjectOverview } from 'api/projects'
import ProjectDetails from '../ProjectDetails'

vi.mock('api/dataSources')
vi.mock('api/projects')

const project = {
  id: 1,
  name: 'Support Analytics Project',
  description: 'Project inventory for support tickets.',
  data_sources_count: 2,
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-18T10:00:00Z',
}

const dataSources = [
  {
    id: 11,
    project: 1,
    name: 'Support Tickets',
    source_type: 'file',
    source_type_display: 'File',
    data_format: 'json',
    data_format_display: 'JSON',
    contains_personal_data: true,
    risk_level: 'high',
    art_9_data: 'unknown',
    preview_text: 'Name: Anna Mueller\nEmail: anna@example.com\nTicket: Needs support.',
    metadata: { data_category_keys: ['contact_data', 'direct_identifiers'] },
    updated_at: '2026-05-18T10:00:00Z',
  },
  {
    id: 12,
    project: 1,
    name: 'Customer Chat Logs',
    source_type: 'database',
    source_type_display: 'Database',
    data_format: 'text',
    data_format_display: 'Text',
    contains_personal_data: true,
    risk_level: 'medium',
    art_9_data: 'unknown',
    metadata: { data_category_keys: ['contact_data'] },
    updated_at: '2026-05-17T10:00:00Z',
  },
]

const riskAssessment = {
  project_id: 1,
  overall_status: 'yellow',
  overall_status_display: 'Medium Risk',
  reason: 'At least one data source contains personal data or has medium risk level.',
  metrics: {
    total_data_sources: 2,
    personal_data_sources: 2,
    high_risk_sources: 1,
    medium_risk_sources: 1,
    art_9_sources: 0,
  },
  top_detected_data_categories: [
    {
      key: 'contact_data',
      label: 'Contact Data',
      group: 'personal_data',
      is_art_9: false,
      source_count: 2,
    },
    {
      key: 'direct_identifiers',
      label: 'Direct Identifiers',
      group: 'personal_data',
      is_art_9: false,
      source_count: 1,
    },
  ],
  recommendations: [
    'Review legal basis for processing and ensure documentation is up to date.',
    'Minimize directly identifying attributes where possible.',
  ],
}

function renderProjectDetails() {
  return render(
    <MemoryRouter initialEntries={['/projects/1']}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getProjectOverview.mockResolvedValue({
    project,
    data_sources: dataSources,
    risk_assessment: riskAssessment,
  })
  deleteDataSource.mockResolvedValue()
})

describe('ProjectDetails page', () => {
  test('loads project details, risk metrics, and data sources', async () => {
    renderProjectDetails()

    expect(screen.getByText('Loading project details...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Support Analytics Project')).toBeInTheDocument()
    })

    expect(getProjectOverview).toHaveBeenCalledWith('1')
    expect(screen.getAllByText('Medium Risk').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Support Tickets').length).toBeGreaterThan(0)
    expect(screen.getByText('Customer Chat Logs')).toBeInTheDocument()
    expect(screen.getAllByText('Personal Data').length).toBeGreaterThan(0)
    expect(screen.getByText('High Risk')).toBeInTheDocument()
    expect(screen.getByText('Contact Data')).toBeInTheDocument()
    expect(screen.getByText('Direct Identifiers')).toBeInTheDocument()
    expect(screen.queryByText('Risk Drivers')).not.toBeInTheDocument()
  })

  test('deletes a data source from project details and refreshes overview data', async () => {
    const user = userEvent.setup()
    getProjectOverview
      .mockResolvedValueOnce({
        project,
        data_sources: dataSources,
        risk_assessment: riskAssessment,
      })
      .mockResolvedValueOnce({
        project: { ...project, data_sources_count: 1 },
        data_sources: [dataSources[1]],
        risk_assessment: {
          ...riskAssessment,
          metrics: {
            total_data_sources: 1,
            personal_data_sources: 1,
            high_risk_sources: 0,
            medium_risk_sources: 1,
            art_9_sources: 0,
          },
        },
      })

    renderProjectDetails()

    await screen.findByText('Support Analytics Project')
    await user.click(screen.getByRole('button', { name: 'Delete Support Tickets' }))
    expect(screen.getByText('Delete "Support Tickets" from this project? The project metrics and risk assessment will update immediately after deletion.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(deleteDataSource).toHaveBeenCalledWith(1, 11)
      expect(getProjectOverview).toHaveBeenCalledTimes(2)
    })
  })

  test('previews a data source sample from project details', async () => {
    const user = userEvent.setup()

    renderProjectDetails()

    await screen.findByText('Support Analytics Project')
    await user.click(screen.getByRole('button', { name: 'Preview Support Tickets' }))

    expect(screen.getByRole('dialog', { name: 'Dataset Preview' })).toBeInTheDocument()
    expect(screen.getAllByText('Support Tickets').length).toBeGreaterThan(0)
    expect(screen.getByText(/Name: Anna Mueller/)).toBeInTheDocument()
    expect(screen.getByText(/Email: anna@example.com/)).toBeInTheDocument()
  })

  test('opens dataset preview when clicking a data source row', async () => {
    const user = userEvent.setup()

    renderProjectDetails()

    await screen.findByText('Support Analytics Project')
    await user.click(screen.getByRole('row', { name: /Support Tickets/ }))

    expect(screen.getByRole('dialog', { name: 'Dataset Preview' })).toBeInTheDocument()
    expect(screen.getByText(/Ticket: Needs support/)).toBeInTheDocument()
  })
})
