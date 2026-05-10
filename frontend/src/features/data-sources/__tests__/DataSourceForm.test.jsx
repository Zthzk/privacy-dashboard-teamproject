/**
 This file is for testing we use it to verify that the frontend works as expected
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, beforeEach, test, expect } from 'vitest'
import DataSourceForm from '../DataSourceForm'
import * as dataSourcesApi from '../../../api/dataSources'

vi.mock('../../../api/dataSources')

const PROJECT_ID = 1
const CREATED_DATA_SOURCE = {
  id: 1,
  name: 'Customer CSV',
  source_type_display: 'File',
  data_format_display: 'CSV',
  contains_personal_data: true,
  description: '',
}

describe('DataSourceForm', () => {
  let onDataSourceAdded

  beforeEach(() => {
    onDataSourceAdded = vi.fn()
    vi.clearAllMocks()
  })

  function renderForm() {
    render(<DataSourceForm projectId={PROJECT_ID} onDataSourceAdded={onDataSourceAdded} />)
  }

  // Verifies the form renders all expected input fields so users can fill in every data source attribute.
  test('renders all form fields', () => {
    renderForm()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/source type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data format/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contains personal data/i)).toBeInTheDocument()
  })

  // Verifies the form passes the values the user typed to the API, not default or empty values.
  test('calls createDataSource with entered values on submit', async () => {
    dataSourcesApi.createDataSource.mockResolvedValue(CREATED_DATA_SOURCE)
    renderForm()

    await userEvent.type(screen.getByLabelText(/name/i), 'Customer CSV')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => {
      expect(dataSourcesApi.createDataSource).toHaveBeenCalledWith(
        PROJECT_ID,
        expect.objectContaining({ name: 'Customer CSV' }),
      )
    })
  })

  // Verifies the parent component is notified after a successful submission so it can update the list.
  test('calls onDataSourceAdded with the created data source on success', async () => {
    dataSourcesApi.createDataSource.mockResolvedValue(CREATED_DATA_SOURCE)
    renderForm()

    await userEvent.type(screen.getByLabelText(/name/i), 'Customer CSV')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => {
      expect(onDataSourceAdded).toHaveBeenCalledWith(CREATED_DATA_SOURCE)
    })
  })

  // Verifies the form clears itself after a successful submission so the user can add another data source immediately.
  test('resets name field after successful submission', async () => {
    dataSourcesApi.createDataSource.mockResolvedValue(CREATED_DATA_SOURCE)
    renderForm()

    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.type(nameInput, 'Customer CSV')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
    })
  })

  // Verifies the user sees an error message when the backend rejects the request, instead of silent failure.
  test('shows error message when the API call fails', async () => {
    dataSourcesApi.createDataSource.mockRejectedValue(new Error('Server error'))
    renderForm()

    await userEvent.type(screen.getByLabelText(/name/i), 'Bad Source')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  // Verifies the data source list is not updated when the submission fails, keeping the UI consistent with the backend state.
  test('does not call onDataSourceAdded when the API call fails', async () => {
    dataSourcesApi.createDataSource.mockRejectedValue(new Error('Server error'))
    renderForm()

    await userEvent.type(screen.getByLabelText(/name/i), 'Bad Source')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
    expect(onDataSourceAdded).not.toHaveBeenCalled()
  })
})
