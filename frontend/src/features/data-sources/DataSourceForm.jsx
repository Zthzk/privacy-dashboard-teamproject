/**
 * Form for adding a new data source to a project.
 * Calls onDataSourceAdded with the created data source on success.
 */
import React, { useState } from 'react'
import { createDataSource } from '../../api/dataSources'

const SOURCE_TYPES = ['file', 'database', 'api', 'url', 'manual', 'other']
const DATA_FORMATS = ['text', 'image', 'csv', 'json', 'other']

function DataSourceForm({ projectId, onDataSourceAdded }) {
  const [name, setName] = useState('')
  const [sourceType, setSourceType] = useState('file')
  const [dataFormat, setDataFormat] = useState('text')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [containsPersonalData, setContainsPersonalData] = useState(false)
  const [error, setError] = useState(null)

  /** Submits the form data to the backend and adds the result to the list on success. */
  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    try {
      const newDataSource = await createDataSource(projectId, {
        name,
        source_type: sourceType,
        data_format: dataFormat,
        description,
        location,
        contains_personal_data: containsPersonalData,
      })
      onDataSourceAdded(newDataSource)
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  /** Resets all form fields back to their default values. */
  function resetForm() {
    setName('')
    setSourceType('file')
    setDataFormat('text')
    setDescription('')
    setLocation('')
    setContainsPersonalData(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Data Source</h2>

      {error && <p>{error}</p>}

      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          required
        />
      </label>

      <label>
        Source Type
        <select value={sourceType} onChange={event => setSourceType(event.target.value)}>
          {SOURCE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>

      <label>
        Data Format
        <select value={dataFormat} onChange={event => setDataFormat(event.target.value)}>
          {DATA_FORMATS.map(format => (
            <option key={format} value={format}>{format}</option>
          ))}
        </select>
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
        />
      </label>

      <label>
        Location
        <input
          type="text"
          value={location}
          onChange={event => setLocation(event.target.value)}
        />
      </label>

      <label>
        Contains Personal Data
        <input
          type="checkbox"
          checked={containsPersonalData}
          onChange={event => setContainsPersonalData(event.target.checked)}
        />
      </label>

      <button type="submit">Add</button>
    </form>
  )
}

export default DataSourceForm
