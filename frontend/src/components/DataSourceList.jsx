/**
 * Fetches and displays all data sources belonging to the project.
 * Also renders the form to add new data sources.
 */
import { useState, useEffect } from 'react'
import DataSourceForm from './DataSourceForm'

const PROJECT_ID = 1

function DataSourceList() {
  const [dataSources, setDataSources] = useState([])
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    fetch(`/api/projects/${PROJECT_ID}/datasources/`)
      .then(response => response.json())
      .then(data => setDataSources(data.data_sources))
      .catch(() => setFetchError('Could not load data sources. Is the backend running?'))
  }, [])

  function handleDataSourceAdded(newDataSource) {
    setDataSources(current => [...current, newDataSource])
  }

  if (fetchError) {
    return <p>{fetchError}</p>
  }

  return (
    <section>
      <h2>Data Sources</h2>
      {dataSources.length === 0
        ? <p>No data sources yet.</p>
        : <ul>
            {dataSources.map(dataSource => (
              <li key={dataSource.id}>{dataSource.name}</li>
            ))}
          </ul>
      }
      <DataSourceForm projectId={PROJECT_ID} onDataSourceAdded={handleDataSourceAdded} />
    </section>
  )
}

export default DataSourceList
