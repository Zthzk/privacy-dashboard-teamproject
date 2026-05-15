import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, describe, test, expect } from 'vitest'
import DataSourcesPanel from '../DataSourcesPanel'
import {
  getDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
} from '../../api/dataSources'

vi.mock('../../api/dataSources')

const mockProject = { id: 1, name: 'Test Project' }

const mockDataSource = {
  id: 1,
  name: 'Customer CSV',
  source_type: 'file',
  source_type_display: 'File',
  data_format: 'csv',
  data_format_display: 'CSV',
  location: 'datasets/customers.csv',
  description: 'Customer data',
  contains_personal_data: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  getDataSources.mockResolvedValue([])
})

describe('DataSourcesPanel', () => {
  test('shows placeholder when no project is selected', () => {
    render(<DataSourcesPanel project={null} />)
    expect(screen.getByText('No project selected.')).toBeInTheDocument()
  })

  test('loads and displays data sources for a project', async () => {
    getDataSources.mockResolvedValue([mockDataSource])
    render(<DataSourcesPanel project={mockProject} />)
    await waitFor(() => {
      expect(screen.getByText('Customer CSV')).toBeInTheDocument()
    })
    expect(getDataSources).toHaveBeenCalledWith(1)
  })

  test('shows empty state when project has no data sources', async () => {
    render(<DataSourcesPanel project={mockProject} />)
    await waitFor(() => {
      expect(screen.getByText('No data sources for this project yet.')).toBeInTheDocument()
    })
  })

  test('adds a new data source successfully', async () => {
    const user = userEvent.setup()
    const newDataSource = { ...mockDataSource, id: 2, name: 'New Source' }
    createDataSource.mockResolvedValue(newDataSource)
    render(<DataSourcesPanel project={mockProject} />)

    await waitFor(() => expect(getDataSources).toHaveBeenCalled())

    await user.type(screen.getByPlaceholderText('Customer CSV'), 'New Source')
    await user.click(screen.getByRole('button', { name: 'Add Data Source' }))

    await waitFor(() => {
      expect(createDataSource).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'New Source' }))
      expect(screen.getByText('New Source')).toBeInTheDocument()
    })
  })

  test('shows error when adding a data source fails', async () => {
    const user = userEvent.setup()
    createDataSource.mockRejectedValue({ message: 'Server error' })
    render(<DataSourcesPanel project={mockProject} />)

    await waitFor(() => expect(getDataSources).toHaveBeenCalled())

    await user.type(screen.getByPlaceholderText('Customer CSV'), 'New Source')
    await user.click(screen.getByRole('button', { name: 'Add Data Source' }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  test('switches to edit mode when Edit is clicked', async () => {
    getDataSources.mockResolvedValue([mockDataSource])
    render(<DataSourcesPanel project={mockProject} />)

    await waitFor(() => expect(screen.getByText('Customer CSV')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByDisplayValue('Customer CSV')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  test('updates a data source successfully', async () => {
    const user = userEvent.setup()
    getDataSources.mockResolvedValue([mockDataSource])
    const updatedDataSource = { ...mockDataSource, name: 'Updated CSV' }
    updateDataSource.mockResolvedValue(updatedDataSource)
    render(<DataSourcesPanel project={mockProject} />)

    await waitFor(() => expect(screen.getByText('Customer CSV')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const nameInput = screen.getByDisplayValue('Customer CSV')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated CSV')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(updateDataSource).toHaveBeenCalledWith(1, 1, expect.objectContaining({ name: 'Updated CSV' }))
      expect(screen.getByText('Updated CSV')).toBeInTheDocument()
    })
  })

  test('deletes a data source after confirmation', async () => {
    getDataSources.mockResolvedValue([mockDataSource])
    deleteDataSource.mockResolvedValue()
    window.confirm = vi.fn(() => true)
    render(<DataSourcesPanel project={mockProject} />)

    await waitFor(() => expect(screen.getByText('Customer CSV')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(deleteDataSource).toHaveBeenCalledWith(1, 1)
      expect(screen.queryByText('Customer CSV')).not.toBeInTheDocument()
    })
  })

  test('does not delete when confirmation is cancelled', async () => {
    getDataSources.mockResolvedValue([mockDataSource])
    window.confirm = vi.fn(() => false)
    render(<DataSourcesPanel project={mockProject} />)

    await waitFor(() => expect(screen.getByText('Customer CSV')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(deleteDataSource).not.toHaveBeenCalled()
    expect(screen.getByText('Customer CSV')).toBeInTheDocument()
  })
})

