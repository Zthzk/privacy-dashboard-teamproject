import { createBrowserRouter, Navigate } from 'react-router-dom'

import DashboardLayout from 'layout/Dashboard'
import AddDataSource from 'pages/AddDataSource'
import Dashboard from 'pages/Dashboard'
import DataSources from 'pages/DataSources'
import EditDataSource from 'pages/EditDataSource'
import ProjectDetails from 'pages/ProjectDetails'
import Projects from 'pages/Projects'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
        {
          path: 'projects',
          element: <Projects />,
        },
        {
          path: 'projects/:projectId',
          element: <ProjectDetails />,
        },
        {
          path: 'data-sources',
          element: <DataSources />,
        },
        {
          path: 'data-sources/new',
          element: <AddDataSource />,
        },
        {
          path: 'data-sources/:dataSourceId/edit',
          element: <EditDataSource />,
        },
      ],
    },
  ],
  { basename: import.meta.env.VITE_APP_BASE_NAME || '/' },
)

export default router
