import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { deleteDataSource, getDataSourceVersions } from 'api/dataSources'
import { getProjectOverview, updateProject } from 'api/projects'
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
    current_version_number: 3,
    // Extra findings verify that project detail preview uses the shared three-item cap.
    compliance_violations: [
      'Names, surnames, and pseudonyms',
      'National identification numbers or tax identifiers',
      'Check for toxic language, hate speech, or historical biases within the text',
      'Verify presence of copyrighted text or content extracted in violation of opt-out mechanisms',
      'Emotional state indicators',
      'Synthetic speech / voice clone disclosure issue',
    ],
    metadata: {
      format_art9_risk: true,
      manual_data: 'Name: Anna Mueller\nEmail: anna@example.com\nTicket: Needs support.',
    },
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
    current_version_number: 1,
    metadata: {},
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

function LocationDestination({ label }) {
  const location = useLocation()

  // Render the destination URL so route-context tests can assert the exact navigation target.
  return <div>{`${label}: ${location.pathname}${location.search}`}</div>
}

const supportTicketVersions = [
  {
    id: 103,
    data_source: 11,
    project: 1,
    version_number: 3,
    name: 'Support Tickets',
    source_type: 'manual',
    source_type_display: 'Manual',
    data_format: 'text',
    data_format_display: 'Text',
    location: 'manual input',
    contains_personal_data: true,
    risk_level: 'high',
    art_9_data: 'possible',
    compliance_violations: ['Names, surnames, and pseudonyms', 'Medical diagnosis included'],
    metadata: {
      manual_data: 'Name: Anna Mueller\nMedical diagnosis included.',
      art_9_data: 'possible',
    },
    created_at: '2026-05-18T10:00:00Z',
  },
  {
    id: 102,
    data_source: 11,
    project: 1,
    version_number: 2,
    name: 'Support Tickets',
    source_type: 'manual',
    source_type_display: 'Manual',
    data_format: 'text',
    data_format_display: 'Text',
    location: 'manual input',
    contains_personal_data: true,
    risk_level: 'medium',
    art_9_data: 'no',
    compliance_violations: ['Names, surnames, and pseudonyms'],
    metadata: {
      manual_data: 'Name: Anna Mueller\nEmail: anna@example.com',
      art_9_data: 'no',
    },
    created_at: '2026-05-16T10:00:00Z',
  },
  {
    id: 101,
    data_source: 11,
    project: 1,
    version_number: 1,
    name: 'Support Tickets',
    source_type: 'manual',
    source_type_display: 'Manual',
    data_format: 'text',
    data_format_display: 'Text',
    location: 'manual input',
    contains_personal_data: false,
    risk_level: 'low',
    art_9_data: 'no',
    compliance_violations: [],
    metadata: {
      manual_data: 'Anonymized support ticket sample.',
      art_9_data: 'no',
    },
    created_at: '2026-05-14T10:00:00Z',
  },
]
function renderProjectDetails() {
  return render(
    <MemoryRouter initialEntries={['/projects/1']}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
        <Route path="/data-sources/new" element={<LocationDestination label="Add data source destination" />} />
        <Route path="/data-sources/:dataSourceId/edit" element={<LocationDestination label="Edit data source destination" />} />
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
  getDataSourceVersions.mockResolvedValue(supportTicketVersions)
  updateProject.mockImplementation(async (_, updateData) => ({ ...project, ...updateData }))
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
    expect(screen.getByText('Risk Distribution')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit Project/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Data Source/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Support Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Support Tickets' })).toBeInTheDocument()
    expect(screen.getByText('Top Detected Data Categories')).toBeInTheDocument()
    expect(screen.getByText('No data categories detected yet.')).toBeInTheDocument()
    expect(screen.queryByText('Contact Data')).not.toBeInTheDocument()
    expect(screen.queryByText('Direct Identifiers')).not.toBeInTheDocument()
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

    const dialog = screen.getByRole('dialog', { name: 'Dataset Preview' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getAllByText('Support Tickets').length).toBeGreaterThan(0)
    expect(screen.getByText(/Name: Anna Mueller/)).toBeInTheDocument()
    expect(screen.getByText(/Email: anna@example.com/)).toBeInTheDocument()
    expect(within(dialog).getByText('Risk Assessment')).toBeInTheDocument()
    expect(within(dialog).getByText('Personal Data')).toBeInTheDocument()
    expect(within(dialog).queryByText('Compliant')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Format review risk')).not.toBeInTheDocument()
    expect(within(dialog).getAllByText('Yes').length).toBeGreaterThan(0)
    expect(within(dialog).getByText('Selected compliance findings')).toBeInTheDocument()
    expect(within(dialog).getByText('Names, surnames, and pseudonyms')).toBeInTheDocument()
    // The shared preview should keep long findings lists collapsed in project details too.
    expect(within(dialog).queryByText('Verify presence of copyrighted text or content extracted in violation of opt-out mechanisms')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Emotional state indicators')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Synthetic speech / voice clone disclosure issue')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'View all findings' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  test('saves project icon and color through the backend API', async () => {
    const user = userEvent.setup()
    renderProjectDetails()
    await screen.findByText('Support Analytics Project')

    await user.click(screen.getByRole('button', { name: /Edit Project/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit Project' })
    await user.click(within(dialog).getByRole('button', { name: /Health/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Red' }))
    await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          icon_key: 'health',
          color: 'error',
        }),
      )
    })
  })

  test('opens dataset preview when clicking a data source row', async () => {
    const user = userEvent.setup()

    renderProjectDetails()

    await screen.findByText('Support Analytics Project')
    await user.click(screen.getByRole('row', { name: /Support Tickets/ }))

    expect(screen.getByRole('dialog', { name: 'Dataset Preview' })).toBeInTheDocument()
    expect(screen.getByText(/Ticket: Needs support/)).toBeInTheDocument()
  })

  test('opens add data source flow with project return context', async () => {
    const user = userEvent.setup()

    renderProjectDetails()

    await screen.findByText('Support Analytics Project')
    await user.click(screen.getByRole('button', { name: /Add Data Source/ }))
    // The query string tells AddDataSource to return to this project after save or cancel.
    expect(screen.getByText('Add data source destination: /data-sources/new?project=1&returnTo=project')).toBeInTheDocument()
  })

  test('opens edit data source flow with project return context', async () => {
    const user = userEvent.setup()

    renderProjectDetails()

    await screen.findByText('Support Analytics Project')
    await user.click(screen.getByRole('button', { name: 'Edit Support Tickets' }))
    // The query string tells EditDataSource to preserve project-detail context.
    expect(screen.getByText('Edit data source destination: /data-sources/11/edit?project=1&returnTo=project')).toBeInTheDocument()
  })

  test('uses personal data status in the project data source table', async () => {
    renderProjectDetails()

    await screen.findByText('Support Analytics Project')

    // Personal Data replaced the older compliant status in project data-source rows.
    expect(screen.getByRole('columnheader', { name: 'Personal Data' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Compliant' })).not.toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Support Tickets/ })).toHaveTextContent('Yes')
  })
  test('opens version history and shows privacy changes over time', async () => {
    const user = userEvent.setup()

    renderProjectDetails()

    await screen.findByText('Support Analytics Project')
    expect(screen.getByRole('columnheader', { name: 'Version' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Support Tickets/ })).toHaveTextContent('v3')

    await user.click(screen.getByRole('button', { name: 'Version history Support Tickets' }))

    expect(getDataSourceVersions).toHaveBeenCalledWith(1, 11)
    await screen.findByText('Version History')
    const dialog = screen.getByText('Version History').closest('[aria-label="Version History"]') ?? document.body
    expect(within(dialog).getByText('Version 3 Snapshot')).toBeInTheDocument()
    expect(within(dialog).getByText(/Medical diagnosis included/)).toBeInTheDocument()
    expect(within(dialog).getByText('Privacy Status Changes')).toBeInTheDocument()
    expect(within(dialog).getAllByText('Risk level').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('Art. 9 data').length).toBeGreaterThan(0)

    await user.click(within(dialog).getByRole('button', { name: 'Select version 1' }))

    expect(within(dialog).getByText('Version 1 Snapshot')).toBeInTheDocument()
    expect(within(dialog).getByText('This is the first stored version, so there is no earlier privacy status to compare.')).toBeInTheDocument()
  })
})
