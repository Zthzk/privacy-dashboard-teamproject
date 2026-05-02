/**
 * Fetches and displays all data sources belonging to the project.
 * Also renders the form to add new data sources.
 */
import { useState, useEffect } from 'react'
import DataSourceForm from './DataSourceForm'

const PROJECT_ID = 1

function DataSourceList() {
  const [dataSources, setDataSources] = useState([])

  useEffect(() => {
    fetch(`/api/projects/${PROJECT_ID}/datasources/`)
      .then(response => response.json())
      .then(data => setDataSources(data.data_sources))
  }, [])

  function handleDataSourceAdded(newDataSource) {
    setDataSources(current => [...current, newDataSource])
  }

  return (
    <section>
      <h2>Data Sources</h2>
      <ul>
        {dataSources.map(dataSource => (
          <li key={dataSource.id}>{dataSource.name}</li>
        ))}
      </ul>
      <DataSourceForm projectId={PROJECT_ID} onDataSourceAdded={handleDataSourceAdded} />
    </section>
  )
}

export default DataSourceList
