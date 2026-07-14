import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
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

  test('opens the same dataset preview from the action button', async () => {
    const user = userEvent.setup()

    renderDataSources()

    await screen.findByText('Support Tickets')
    await user.click(screen.getByRole('button', { name: 'Preview Support Tickets' }))

    expect(screen.getByRole('dialog', { name: /Dataset Preview/ })).toBeInTheDocument()
    expect(screen.getByText(/Ticket: Needs support/)).toBeInTheDocument()
  })
})
