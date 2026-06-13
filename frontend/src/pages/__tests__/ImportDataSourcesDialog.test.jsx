import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createDataSource } from 'api/dataSources'
import ImportDataSourcesDialog from '../ImportDataSourcesDialog'

// Mock the backend API so tests can control success / failure scenarios
vi.mock('api/dataSources')

// Sample project fixture used across tests
const project = {
  id: 1,
  name: 'Support Analytics Project',
}

// Valid JSON entries used for successful import flows
const validEntries = [
  {
    name: 'customer_reviews_2024',
    source_type: 'file',
    data_format: 'csv',
    location: 'data/customer_reviews_2024.csv',
  },
  {
    name: 'user_feedback_api',
    source_type: 'api',
    data_format: 'json',
    location: 'https://api.example.com/feedback',
  },
]

// Helper creating a fake API response for a created data source
const createdDataSource = (name) => ({
  id: Math.floor(Math.random() * 1000),
  project: 1,
  project_name: 'Support Analytics Project',
  name,
  source_type: 'file',
  data_format: 'csv',
  location: 'data/customer_reviews_2024.csv',
  metadata: {},
})

// Utility to create a File object containing JSON; used to simulate user file uploads
function makeJsonFile(entries, filename = 'datasources.json') {
  const blob = new Blob([JSON.stringify(entries)], { type: 'application/json' })
  return new File([blob], filename, { type: 'application/json' })
}

// Small render wrapper to mount the dialog with reasonable defaults
function renderDialog(props = {}) {
  return render(
    <ImportDataSourcesDialog
      open={true}
      onClose={vi.fn()}
      projectId={project.id}
      projectName={project.name}
      onImported={vi.fn()}
      {...props}
    />,
  )
}

// Reset mocks and provide a default successful createDataSource implementation before each test
beforeEach(() => {
  vi.clearAllMocks()
  createDataSource.mockImplementation(async (_projectId, payload) =>
    createdDataSource(payload.name),
  )
})

describe('ImportDataSourcesDialog', () => {
  // Smoke test: dialog renders with title, project name and file picker button
  test('renders dialog with file picker and project name', () => {
    renderDialog()

    expect(screen.getByText('Import Data Sources from JSON')).toBeInTheDocument()
    expect(screen.getByText(/Support Analytics Project/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Choose JSON file/i })).toBeInTheDocument()
  })

  // After uploading a valid JSON file, the UI should show a preview with entry names
  test('shows preview table after uploading a valid JSON file', async () => {
    const user = userEvent.setup()
    renderDialog()

    const file = makeJsonFile(validEntries)
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    expect(await screen.findByText('2 entries found')).toBeInTheDocument()
    expect(screen.getByText('customer_reviews_2024')).toBeInTheDocument()
    expect(screen.getByText('user_feedback_api')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Import 2 entries/i })).toBeInTheDocument()
  })

  // Full-import flow: all entries are created via API and the onImported callback is invoked
  test('imports all entries and shows success message', async () => {
    const user = userEvent.setup()
    const onImported = vi.fn()
    renderDialog({ onImported })

    const file = makeJsonFile(validEntries)
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    await user.click(await screen.findByRole('button', { name: /Import 2 entries/i }))

    await waitFor(() => {
      expect(screen.getByText(/All 2 data sources imported successfully/i)).toBeInTheDocument()
    })

    // Assert API was called for each entry with the expected payload shape
    expect(createDataSource).toHaveBeenCalledTimes(2)
    expect(createDataSource).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ name: 'customer_reviews_2024' }),
    )
    expect(createDataSource).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ name: 'user_feedback_api' }),
    )
    expect(onImported).toHaveBeenCalledTimes(1)
  })

  // Verify the Cancel button triggers the provided onClose callback
  test('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderDialog({ onClose })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // Uploading an invalid JSON file should show a parse error to the user
  test('shows parse error when uploaded file is not valid JSON', async () => {
    const user = userEvent.setup()
    renderDialog()

    const blob = new Blob(['this is not json'], { type: 'application/json' })
    const file = new File([blob], 'bad.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    expect(await screen.findByText(/Invalid JSON file/i)).toBeInTheDocument()
    expect(screen.queryByText(/entries found/i)).not.toBeInTheDocument()
  })

  // The dialog expects the JSON root to be an array; provide an informative error otherwise
  test('shows parse error when JSON is not an array', async () => {
    const user = userEvent.setup()
    renderDialog()

    const file = makeJsonFile({ name: 'not-an-array' })
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    expect(await screen.findByText(/JSON must be an array/i)).toBeInTheDocument()
  })

  // Missing required fields should be reported with the specific missing field name
  test('shows parse error when an entry is missing a required field', async () => {
    const user = userEvent.setup()
    renderDialog()

    const file = makeJsonFile([{ name: 'missing-fields' }])
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    expect(await screen.findByText(/missing required field "source_type"/i)).toBeInTheDocument()
  })

  // Reject unsupported source_type values with a clear error message
  test('shows parse error when an entry has an invalid source_type', async () => {
    const user = userEvent.setup()
    renderDialog()

    const file = makeJsonFile([{ name: 'bad-type', source_type: 'ftp', data_format: 'csv' }])
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    expect(await screen.findByText(/invalid source_type "ftp"/i)).toBeInTheDocument()
  })

  // If an API call fails during import, the process should abort and surface the server error
  test('aborts import and shows error when an entry fails to save', async () => {
    const user = userEvent.setup()
    createDataSource
      .mockResolvedValueOnce(createdDataSource('customer_reviews_2024'))
      .mockRejectedValueOnce({ error: 'A data source with this name already exists in this project.' })

    renderDialog()

    const file = makeJsonFile(validEntries)
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    await user.click(await screen.findByRole('button', { name: /Import 2 entries/i }))

    await waitFor(() => {
      expect(screen.getByText(/A data source with this name already exists/i)).toBeInTheDocument()
    })

    // Only the first entry was saved before the error; assert progress/error reporting
    expect(createDataSource).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/1 of 2 entries were saved before the error/i)).toBeInTheDocument()
  })

  // Ensure onImported is not called when the import failed
  test('does not call onImported when import fails', async () => {
    const user = userEvent.setup()
    const onImported = vi.fn()
    createDataSource.mockRejectedValue({ error: 'Server error' })

    renderDialog({ onImported })

    const file = makeJsonFile(validEntries)
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    await user.click(await screen.findByRole('button', { name: /Import 2 entries/i }))

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument()
    })

    expect(onImported).not.toHaveBeenCalled()
  })

  // After successful import the dialog action changes from Cancel to Close
  test('shows Close button instead of Cancel after successful import', async () => {
    const user = userEvent.setup()
    renderDialog()

    const file = makeJsonFile(validEntries)
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    await user.click(await screen.findByRole('button', { name: /Import 2 entries/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })
})
