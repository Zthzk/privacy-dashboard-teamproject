import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getAllDataSources } from 'api/dataSources'
import { getProjects } from 'api/projects'
import Dashboard from '../Dashboard'

vi.mock('api/dataSources')
vi.mock('api/projects')

const projects = [
  {
    id: 1,
    name: 'Support Analytics Project',
    description: 'Project inventory for support tickets.',
    data_sources_count: 3,
    overall_status: 'yellow',
    personal_data_sources: 1,
    medium_risk_sources: 1,
    high_risk_sources: 1,
    art_9_sources: 1,
    created_at: '2026-05-01T10:00:00Z',
    updated_at: '2026-05-18T10:00:00Z',
  },
]

const dataSources = [
  {
    id: 11,
    project: 1,
    name: 'Support Tickets',
    source_type_display: 'File',
    data_format_display: 'JSON',
    contains_personal_data: true,
    risk_level: 'medium',
    art_9_data: 'no',
  },
  {
    id: 12,
    project: 1,
    name: 'Model Audit',
    source_type_display: 'File',
    data_format_display: 'CSV',
    contains_personal_data: false,
    risk_level: 'high',
    art_9_data: 'no',
  },
  {
    id: 13,
    project: 1,
    name: 'Voice Samples',
    source_type_display: 'File',
    data_format_display: 'Audio',
    contains_personal_data: true,
    risk_level: 'high',
    art_9_data: 'possible',
  },
]

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getProjects.mockResolvedValue(projects)
  getAllDataSources.mockResolvedValue(dataSources)
})

describe('Dashboard page', () => {
  test('risk summary renders reliable metrics without category-derived labels', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Support Analytics Project')).toBeInTheDocument()
    })

    expect(screen.getByText('Risk Summary')).toBeInTheDocument()
    expect(screen.queryByText('Contact data sources')).not.toBeInTheDocument()
    expect(screen.queryByText('Location data sources')).not.toBeInTheDocument()
    expect(screen.getByText('Total data sources')).toBeInTheDocument()
    expect(screen.getByText('Personal data sources')).toBeInTheDocument()
    expect(screen.getByText('High risk sources')).toBeInTheDocument()
    expect(screen.getByText('Art. 9 sources')).toBeInTheDocument()
    expect(screen.getByText('Review projects with personal data or Art. 9 data before using their data sources in model training.')).toBeInTheDocument()
  })
})
