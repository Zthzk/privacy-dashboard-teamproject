/**
 * Page for viewing and adding data sources for a project.
 */
import React from 'react'
import DataSourceList from "./DataSourceList";

function DataSourcesPage() {
  return (
    <main>
      <h1>Data Sources</h1>
      <DataSourceList />
    </main>
  );
}

export default DataSourcesPage;
