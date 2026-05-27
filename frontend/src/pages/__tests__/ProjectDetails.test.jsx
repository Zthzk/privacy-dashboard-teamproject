import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getDataSources } from 'api/dataSources'
import { getProject } from 'api/projects'
import { getProjectRiskAssessment } from 'api/riskAssessments'
import ProjectDetails from '../ProjectDetails'

vi.mock('api/dataSources')
vi.mock('api/projects')
vi.mock('api/riskAssessments')

const project = {
  id: 1,
  name: 'Customer Support NLP',
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
  getProject.mockResolvedValue(project)
  getDataSources.mockResolvedValue(dataSources)
  getProjectRiskAssessment.mockResolvedValue(riskAssessment)
})

describe('ProjectDetails page', () => {
  test('loads project details, risk metrics, and data sources', async () => {
    renderProjectDetails()

    expect(screen.getByText('Loading project details...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Customer Support NLP')).toBeInTheDocument()
    })

    expect(getProject).toHaveBeenCalledWith('1')
    expect(getDataSources).toHaveBeenCalledWith('1')
    expect(getProjectRiskAssessment).toHaveBeenCalledWith('1')
    expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    expect(screen.getByText('Support Tickets')).toBeInTheDocument()
    expect(screen.getByText('Customer Chat Logs')).toBeInTheDocument()
    expect(screen.getByText('Personal Data')).toBeInTheDocument()
    expect(screen.getByText('High Risk')).toBeInTheDocument()
  })
})
