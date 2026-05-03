/**
 * Fetches and displays all data sources belonging to a project.
 * Also renders the form to add new data sources.
 */
import { useState, useEffect } from 'react'
import DataSourceForm from './DataSourceForm'
import { fetchDataSources } from '../api/dataSources'

//Placeholder should be changed when US01 is fully implemented
const PROJECT_ID = 1

function DataSourceList() {
  const [dataSources, setDataSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    loadDataSources()
  }, [])

  /** Loads data sources from the backend and updates state. */
  async function loadDataSources() {
    try {
      const data = await fetchDataSources(PROJECT_ID)
      setDataSources(data)
    } catch {
      setFetchError('Could not load data sources. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  /** Appends a newly created data source to the list without refetching. */
  function handleDataSourceAdded(newDataSource) {
    setDataSources(current => [...current, newDataSource])
  }

  if (loading) {
    return <p>Loading data sources...</p>
  }

  if (fetchError) {
    return <p>{fetchError}</p>
  }

  return (
    <section>
      {dataSources.length === 0
        ? <p>No data sources yet.</p>
        : <ul>
            {dataSources.map(dataSource => (
              <li key={dataSource.id}>
                <strong>{dataSource.name}</strong>
                <span> — {dataSource.source_type_display} / {dataSource.data_format_display}</span>
                {dataSource.contains_personal_data && <span> — Contains personal data</span>}
                {dataSource.description && <p>{dataSource.description}</p>}
              </li>
            ))}
          </ul>
      }
      <DataSourceForm projectId={PROJECT_ID} onDataSourceAdded={handleDataSourceAdded} />
    </section>
  )
}

export default DataSourceList
