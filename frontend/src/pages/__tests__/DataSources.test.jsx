import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { deleteDataSource, getAllDataSources, getDataSourceVersions } from 'api/dataSources'
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
    current_version_number: 2,
    art_9_data: 'possible',
    // More than three findings verifies the compact card limit and the all-findings popup.
    compliance_violations: [
      'Voice recordings capable of identifying specific natural persons',
      'Health-related speech patterns or medical vocal biomarkers',
      'Names, surnames, and pseudonyms',
      'National identification numbers or tax identifiers',
      'Emotional state indicators',
      'Synthetic speech / voice clone disclosure issue',
    ],
    metadata: {
      format_art9_risk: true,
      manual_data: 'Name: Anna Mueller\nEmail: anna@example.com\nTicket: Needs support.',
      risk_source: 'compliance_violations',
    },
    updated_at: '2026-05-18T10:00:00Z',
  },
]

const supportTicketVersions = [
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
    art_9_data: 'possible',
    compliance_violations: ['Health-related speech patterns or medical vocal biomarkers'],
    metadata: {
      manual_data: 'Name: Anna Mueller\nEmail: anna@example.com\nTicket: Needs medical support.',
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
  getDataSourceVersions.mockResolvedValue(supportTicketVersions)
  deleteDataSource.mockResolvedValue()
})

describe('DataSources page', () => {
  test('shows risk summaries and risk levels instead of source locations', async () => {
    const riskSources = [
      { ...dataSources[0], id: 1, name: 'High Source', risk_level: 'high' },
      { ...dataSources[0], id: 2, name: 'Medium Source', risk_level: 'medium' },
      { ...dataSources[0], id: 3, name: 'Low Source', risk_level: 'low' },
    ]
    getAllDataSources.mockResolvedValue(riskSources)

    renderDataSources()

    await screen.findByText('High Source')
    expect(screen.getByText('Total Data Sources').parentElement).toHaveTextContent('3')
    expect(screen.getByText('High Risk').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Medium Risk').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Low Risk').parentElement).toHaveTextContent('1')
    expect(screen.getByRole('columnheader', { name: 'Risk Level' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Location / Reference' })).not.toBeInTheDocument()
    expect(screen.getByRole('row', { name: /High Source/ })).toHaveTextContent('High')
    expect(screen.getByRole('row', { name: /Medium Source/ })).toHaveTextContent('Medium')
    expect(screen.getByRole('row', { name: /Low Source/ })).toHaveTextContent('Low')
  })

  test('shows the most recently edited data source first', async () => {
    getAllDataSources.mockResolvedValue([
      { ...dataSources[0], id: 12, name: 'Older Source', updated_at: '2026-05-17T10:00:00Z' },
      { ...dataSources[0], id: 13, name: 'Recently Edited Source', updated_at: '2026-05-19T10:00:00Z' },
    ])

    renderDataSources()

    await screen.findByText('Recently Edited Source')
    const rows = screen.getAllByRole('row')
    const recentRowIndex = rows.findIndex((row) => within(row).queryByText('Recently Edited Source'))
    const olderRowIndex = rows.findIndex((row) => within(row).queryByText('Older Source'))

    expect(recentRowIndex).toBeLessThan(olderRowIndex)
  })

  test('paginates the main data sources table', async () => {
    const sourceList = Array.from({ length: 12 }, (_, index) => ({
      ...dataSources[0],
      id: index + 1,
      name: `Data Source ${String(index + 1).padStart(2, '0')}`,
      updated_at: `2026-05-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
    }))
    getAllDataSources.mockResolvedValue(sourceList)

    renderDataSources()

    await screen.findByText('Showing 1 to 10 of 12 data sources')
    expect(screen.queryByText('Data Source 01')).not.toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Next page'))

    expect(screen.getByText('Showing 11 to 12 of 12 data sources')).toBeInTheDocument()
    expect(screen.getByText('Data Source 01')).toBeInTheDocument()
  })

  test('opens dataset preview when clicking a data source row', async () => {
    const user = userEvent.setup()

    renderDataSources()

    await screen.findByText('Support Tickets')
    await user.click(screen.getByRole('row', { name: /Support Tickets/ }))

    const dialog = screen.getByRole('dialog', { name: /Dataset Preview/ })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText(/Name: Anna Mueller/)).toBeInTheDocument()
    expect(screen.getByText(/Email: anna@example.com/)).toBeInTheDocument()
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    expect(screen.queryByText('Risk source')).not.toBeInTheDocument()
    expect(within(dialog).getByText('Personal Data')).toBeInTheDocument()
    expect(within(dialog).queryByText('Compliant')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Format review risk')).not.toBeInTheDocument()
    expect(within(dialog).getAllByText('Yes').length).toBeGreaterThan(0)
    expect(screen.getByText('Selected compliance findings')).toBeInTheDocument()
    expect(screen.getByText('Change History')).toBeInTheDocument()
    expect(await screen.findByText('Current v2')).toBeInTheDocument()
    expect(screen.getByText('Compared with v1')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'View full history' })).toBeInTheDocument()
    expect(within(dialog).getByTestId('risk-severity-marker')).toHaveAttribute('data-severity-position', '50')
    within(dialog)
      .getAllByTestId('compliance-finding-marker')
      .forEach((marker) => {
        expect(marker).toHaveAttribute('data-marker-tone', 'neutral')
      })
    expect(screen.getByText('Voice recordings capable of identifying specific natural persons')).toBeInTheDocument()
    expect(screen.getByText('Health-related speech patterns or medical vocal biomarkers')).toBeInTheDocument()
    expect(screen.getByText('Names, surnames, and pseudonyms')).toBeInTheDocument()
    // Hidden findings prove the inline preview remains capped at three entries.
    expect(screen.queryByText('National identification numbers or tax identifiers')).not.toBeInTheDocument()
    expect(screen.queryByText('Emotional state indicators')).not.toBeInTheDocument()
    expect(screen.queryByText('Synthetic speech / voice clone disclosure issue')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View all findings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Data Source' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Project' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy sample preview' })).not.toBeInTheDocument()
  })

  test('opens all selected compliance findings in a popup', async () => {
    const user = userEvent.setup()

    renderDataSources()

    await screen.findByText('Support Tickets')
    await user.click(screen.getByRole('button', { name: 'Preview Support Tickets' }))

    expect(screen.queryByText('Synthetic speech / voice clone disclosure issue')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'View all findings' }))

    // The popup should contain the findings intentionally hidden from the compact preview card.
    const findingsDialog = screen.getByRole('dialog', { name: 'All selected compliance findings' })
    expect(within(findingsDialog).getByText('National identification numbers or tax identifiers')).toBeInTheDocument()
    expect(within(findingsDialog).getByText('Emotional state indicators')).toBeInTheDocument()
    expect(within(findingsDialog).getByText('Synthetic speech / voice clone disclosure issue')).toBeInTheDocument()

    await user.click(within(findingsDialog).getByRole('button', { name: 'Close findings popup' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'All selected compliance findings' })).not.toBeInTheDocument()
    })
  })

  test('opens the complete version history from the dataset preview', async () => {
    const user = userEvent.setup()

    renderDataSources()

    await screen.findByText('Support Tickets')
    await user.click(screen.getByRole('button', { name: 'Preview Support Tickets' }))

    const previewDialog = screen.getByRole('dialog', { name: /Dataset Preview/ })
    await within(previewDialog).findByText('Current v2')
    await user.click(within(previewDialog).getByRole('button', { name: 'View full history' }))

    const historyDialog = screen.getByRole('dialog', { name: /Version History/ })
    expect(within(historyDialog).getByText('Version 2 Snapshot')).toBeInTheDocument()
    expect(within(historyDialog).getByRole('button', { name: 'Select version 1' })).toBeInTheDocument()

    await user.click(within(historyDialog).getByRole('button', { name: 'Close version history' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Version History/ })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('dialog', { name: /Dataset Preview/ })).toBeInTheDocument()
  })

  test('opens the same dataset preview from the action button', async () => {
    const user = userEvent.setup()

    renderDataSources()

    await screen.findByText('Support Tickets')
    await user.click(screen.getByRole('button', { name: 'Preview Support Tickets' }))

    expect(screen.getByRole('dialog', { name: /Dataset Preview/ })).toBeInTheDocument()
    expect(screen.getByText(/Ticket: Needs support/)).toBeInTheDocument()
  })

  test('opens version history from the main data sources table', async () => {
    const user = userEvent.setup()

    renderDataSources()

    await screen.findByText('Support Tickets')

    expect(screen.getByRole('columnheader', { name: 'Version' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Support Tickets/ })).toHaveTextContent('v2')

    await user.click(screen.getByRole('button', { name: 'Version history Support Tickets' }))

    expect(getDataSourceVersions).toHaveBeenCalledWith(1, 11)
    await screen.findByText('Version History')
    expect(screen.getByText('Version 2 Snapshot')).toBeInTheDocument()
    expect(screen.getByText('Privacy Status Changes')).toBeInTheDocument()
    expect(screen.getAllByText(/Risk level/).length).toBeGreaterThan(0)
  })
})
