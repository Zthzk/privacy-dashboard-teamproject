import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import {
  CloseOutlined,
  DatabaseOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  MessageOutlined,
  MoreOutlined,
  RightOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

import MainCard from 'components/MainCard'
import DataSourceVersionHistoryDialog from 'components/DataSourceVersionHistoryDialog'
import DatasetPreviewDialog from 'components/DatasetPreviewDialog'
import DashboardPdfExportButton from 'components/pdf/DashboardPdfExport'
import { getAllDataSources } from 'api/dataSources'
import { getProjects } from 'api/projects'
import { getProjectStyle, getVisibleProjects, projectIconMap } from 'utils/project-display'

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function projectRiskChipProps(project) {
  const riskValue = project.overall_status ?? project.risk_status ?? project.risk_level

  if (project.art_9_sources > 0 || riskValue === 'red') {
    return { color: 'error', label: 'High Risk' }
  }

  if (riskValue === 'yellow' || riskValue === 'medium' || riskValue === 'high') {
    return { color: 'warning', label: 'Medium Risk' }
  }

  if ((project.high_risk_sources ?? 0) > 0) {
    return { color: 'error', label: 'High Risk' }
  }

  if ((project.medium_risk_sources ?? 0) > 0 || (project.personal_data_sources ?? 0) > 0) {
    return { color: 'warning', label: 'Medium Risk' }
  }

  return { color: 'success', label: 'Low Risk' }
}

function getSourceRisk(source) {
  const risk = source.risk ?? source.risk_level_display ?? source.risk_level
  const normalizedRisk = String(risk ?? '').toLowerCase()

  if (normalizedRisk === 'high' || normalizedRisk === 'red') return { label: 'High', color: 'error' }
  if (normalizedRisk === 'low' || normalizedRisk === 'green') return { label: 'Low', color: 'success' }
  return { label: risk || 'Medium', color: 'warning' }
}

function hasArt9Data(source) {
  return (
    ['possible', 'yes', true].includes(source.art_9_data) ||
    ['possible', 'yes', true].includes(source.metadata?.art_9_data) ||
    source.metadata?.contains_art9_data === true
  )
}

function getProjectRisk(project) {
  return projectRiskChipProps(project)
}

function ProjectIcon({ project }) {
  const style = getProjectStyle(project)
  const Icon = project.icon || projectIconMap[style.key] || MessageOutlined

  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 40,
        height: 40,
        bgcolor: `${style.color}.main`,
        color: 'common.white',
      }}
    >
      <Icon />
    </Avatar>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState(() => getVisibleProjects([]))
  const [dataSources, setDataSources] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [dataSourcePendingPreview, setDataSourcePendingPreview] = useState(null)
  const [dataSourcePendingHistory, setDataSourcePendingHistory] = useState(null)
  const [dataSourceActionMenu, setDataSourceActionMenu] = useState({ anchorEl: null, source: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    Promise.all([getProjects(), getAllDataSources()])
      .then(([projectList, sourceList]) => {
        if (!isActive) return

        const visibleProjects = getVisibleProjects(projectList)
        setProjects(visibleProjects)
        setDataSources(sourceList)
        setSelectedProjectId((currentProjectId) => currentProjectId ?? visibleProjects[0]?.id ?? null)
      })
      .catch(() => {
        if (isActive) {
          setError('Could not load dashboard data. Please refresh the page.')
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const selectedProject = projects.find((project) => String(project.id) === String(selectedProjectId)) || projects[0]
  const selectedProjectSources = useMemo(
    () => dataSources.filter((source) => String(source.project) === String(selectedProject?.id)),
    [dataSources, selectedProject],
  )
  const selectedProjectMetrics = useMemo(() => {
    const personalDataSources = selectedProjectSources.filter((source) => source.contains_personal_data).length
    const art9Sources = selectedProjectSources.filter(hasArt9Data).length

    return {
      personalDataSources,
      art9Sources,
      personalDataLabel: `${personalDataSources} ${personalDataSources === 1 ? 'source' : 'sources'}`,
      art9Label: `${art9Sources} ${art9Sources === 1 ? 'source' : 'sources'}`,
    }
  }, [selectedProjectSources])
  const riskSummary = useMemo(
    () => [
      { label: 'Total data sources', value: dataSources.length, icon: DatabaseOutlined, color: 'primary' },
      { label: 'Personal data sources', value: dataSources.filter((source) => source.contains_personal_data).length, icon: TeamOutlined, color: 'success' },
      { label: 'High risk sources', value: dataSources.filter((source) => getSourceRisk(source).label === 'High').length, icon: ThunderboltOutlined, color: 'error' },
      { label: 'Art. 9 sources', value: dataSources.filter(hasArt9Data).length, icon: EyeOutlined, color: 'secondary' },
    ],
    [dataSources],
  )

  const closeDataSourceActionMenu = () => {
    setDataSourceActionMenu({ anchorEl: null, source: null })
  }

  const openDataSourceActionMenu = (event, source) => {
    event.stopPropagation()
    setDataSourceActionMenu({ anchorEl: event.currentTarget, source })
  }

  const openDataSourcePreview = (source) => {
    closeDataSourceActionMenu()
    setDataSourcePendingPreview(source)
  }

  const openDataSourceHistory = (source) => {
    closeDataSourceActionMenu()
    setDataSourcePendingHistory(source)
  }

  const editDataSource = (source) => {
    closeDataSourceActionMenu()
    if (source?.id) {
      setPreviewOpen(false)
      navigate(`/data-sources/${source.id}/edit?project=${source.project ?? selectedProject?.id}&returnTo=dashboard`)
    }
  }

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            Overview of your ML projects and their privacy risk status.
          </Typography>
        </Box>

        {/* Show export button only after data has loaded to avoid generating an empty report */}
        {!loading && (
          <DashboardPdfExportButton projects={projects} riskSummary={riskSummary} />
        )}

      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Main overview table */}
      <MainCard content={false}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 2 }}
        >
          <Typography variant="h5">Project Overview</Typography>
          <Button color="primary" sx={{ px: 0, minWidth: 'auto' }} onClick={() => navigate('/projects')}>
            &rarr;View All Projects
          </Button>
        </Stack>
        <TableContainer sx={{ maxHeight: 390, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 860 }} aria-label="Project privacy overview">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Data Sources</TableCell>
                <TableCell>Overall Risk</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Keep the table structure stable while projects and data sources are being fetched. */}
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Loading projects...</Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Empty state for a fresh workspace or when all projects are hidden. */}
              {!loading && projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No projects available.</Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Render one overview row per project. */}
              {!loading && projects.map((project) => {
                const risk = getProjectRisk(project)
                const selected = String(project.id) === String(selectedProjectId) 

                return (
                  /* Selecting a row updates the preview data before opening the dialog. */
                  <TableRow
                    hover
                    key={project.id}
                    selected={selected}
                    onClick={() => {
                      setSelectedProjectId(project.id)
                      setPreviewOpen(true)
                    }} 
                    sx={{
                      cursor: 'pointer',
                      /* Highlight selected row */
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        outline: '1px solid',
                        outlineColor: 'primary.light',
                      },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <ProjectIcon project={project} />
                        <Box>
                          <Typography variant="subtitle1">{project.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {project.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <DatabaseOutlined />
                        {/* Prefer the API count, then fall back to older cached/mock fields. */}
                        <Typography>{project.data_sources_count ?? project.sources ?? 0}</Typography> 
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" color={risk.color} label={risk.label} />
                    </TableCell>
                    <TableCell>{project.updated ?? formatDate(project.updated_at)}</TableCell>
                    <TableCell align="right">
                      <RightOutlined />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>

      {/* Quick project preview dialog shown from the overview table without leaving the dashboard. */}
      {selectedProject && (
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pr: 7 }}>
          Project Preview
          <IconButton
            aria-label="Close project preview"
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <ProjectIcon project={selectedProject} />
              <Typography variant="h4">{selectedProject.name}</Typography>
              <Chip size="small" color="success" label="Active" />
              <Button
                size="small"
                color="primary"
                endIcon={<RightOutlined aria-hidden="true" />}
                onClick={() => {
                  setPreviewOpen(false)
                  navigate(`/projects/${selectedProject.id}`)
                }}
              >
                to details
              </Button>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {[
                ['Overall Risk', getProjectRisk(selectedProject).label],
                ['Contains Personal Data', selectedProjectMetrics.personalDataLabel],
                ['Art. 9 GDPR Data', selectedProjectMetrics.art9Label],
                ['Last Updated', selectedProject.updated ?? formatDate(selectedProject.updated_at)],
              ].map(([label, value], index) => (
                <Box
                  key={label}
                  sx={{
                    p: 1.5,
                    borderLeft: { sm: index === 0 ? 0 : '1px solid' },
                    borderTop: { xs: index === 0 ? 0 : '1px solid', sm: 0 },
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color={
                      label === 'Contains Personal Data' && selectedProjectMetrics.personalDataSources > 0
                        ? 'error.main'
                        : label === 'Art. 9 GDPR Data' && selectedProjectMetrics.art9Sources > 0
                          ? 'warning.dark'
                          : 'text.primary'
                    }
                    sx={{ whiteSpace: 'pre-line' }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="h5">Data Sources</Typography>
            <TableContainer>
              <Table size="small" aria-label="Selected project data sources">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Personal Data</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedProjectSources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No data sources linked to this project.</Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {selectedProjectSources.map((source) => {
                    const sourceRisk = getSourceRisk(source)
                    const containsPersonalData = source.personal ?? (source.contains_personal_data ? 'Yes' : 'No')

                    return (
                      <TableRow
                        key={source.id ?? source.name}
                        hover
                        tabIndex={0}
                        onClick={() => setDataSourcePendingPreview(source)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setDataSourcePendingPreview(source)
                          }
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{source.name}</TableCell>
                        <TableCell>{source.type ?? source.source_type_display ?? source.source_type}</TableCell>
                        <TableCell>{source.format ?? source.data_format_display ?? source.data_format}</TableCell>
                        <TableCell sx={{ color: containsPersonalData === 'Yes' ? 'error.main' : 'text.primary', fontWeight: 600 }}>
                          {containsPersonalData}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={sourceRisk.color}
                            label={sourceRisk.label}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            <Tooltip title="Preview data source">
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={`Preview ${source.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openDataSourcePreview(source)
                                  }}
                                >
                                  <EyeOutlined />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <IconButton
                              size="small"
                              aria-label={`More actions for ${source.name}`}
                              aria-controls={dataSourceActionMenu.source?.id === source.id ? 'dashboard-data-source-actions' : undefined}
                              aria-haspopup="menu"
                              aria-expanded={dataSourceActionMenu.source?.id === source.id ? 'true' : undefined}
                              onClick={(event) => openDataSourceActionMenu(event, source)}
                            >
                              <MoreOutlined />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Button color="primary" endIcon={<RightOutlined aria-hidden="true" />} sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/data-sources')}>
              View all data sources
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
      )}

      <Menu
        id="dashboard-data-source-actions"
        anchorEl={dataSourceActionMenu.anchorEl}
        open={Boolean(dataSourceActionMenu.anchorEl)}
        onClose={closeDataSourceActionMenu}
        onClick={(event) => event.stopPropagation()}
        slotProps={{
          list: {
            'aria-label': dataSourceActionMenu.source ? `Actions for ${dataSourceActionMenu.source.name}` : 'Data source actions',
          },
        }}
      >
        <MenuItem onClick={() => openDataSourcePreview(dataSourceActionMenu.source)}>
          <ListItemIcon>
            <EyeOutlined aria-hidden="true" />
          </ListItemIcon>
          <ListItemText>Preview data source</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => openDataSourceHistory(dataSourceActionMenu.source)}>
          <ListItemIcon>
            <HistoryOutlined aria-hidden="true" />
          </ListItemIcon>
          <ListItemText>View version history</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => editDataSource(dataSourceActionMenu.source)}>
          <ListItemIcon>
            <EditOutlined aria-hidden="true" />
          </ListItemIcon>
          <ListItemText>Edit data source</ListItemText>
        </MenuItem>
      </Menu>
      <DatasetPreviewDialog
        source={dataSourcePendingPreview}
        onClose={() => setDataSourcePendingPreview(null)}
        onOpenProject={() => {
          const projectId = dataSourcePendingPreview?.project ?? selectedProject?.id
          setDataSourcePendingPreview(null)
          if (projectId) {
            setPreviewOpen(false)
            navigate(`/projects/${projectId}`)
          }
        }}
        onEdit={() => {
          const source = dataSourcePendingPreview
          setDataSourcePendingPreview(null)
          editDataSource(source)
        }}
      />

      <DataSourceVersionHistoryDialog
        open={Boolean(dataSourcePendingHistory)}
        source={dataSourcePendingHistory}
        onClose={() => setDataSourcePendingHistory(null)}
      />
      {/* Aggregated risk indicators across all loaded data sources. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2.5 }}>
        <MainCard>
          <Stack spacing={2.25}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <ThunderboltOutlined />
              <Typography variant="h5">Risk Summary</Typography>
            </Stack>

            {riskSummary.map((item) => {
              const Icon = item.icon
              return (
                <Stack key={item.label} direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: `${item.color}.lighter`, color: `${item.color}.main` }}>
                      <Icon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h3" color={`${item.color}.main`}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box
                    sx={{
                      width: 82,
                      height: 28,
                      borderBottom: '3px solid',
                      borderColor: `${item.color}.main`,
                      borderRadius: '50%',
                      transform: 'skew(-18deg)',
                      opacity: 0.8,
                    }}
                  />
                </Stack>
              )
            })}

            <Divider />

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'warning.lighter', color: 'warning.dark' }}>
                <ThunderboltOutlined />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">Recommendation</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Review projects with personal data or Art. 9 data before using their data sources in model training.
                </Typography>
                <Button size="small" endIcon={<RightOutlined aria-hidden="true" />}>
                  View details
                </Button>
              </Box>
            </Stack>
          </Stack>
        </MainCard>
      </Box>
    </Stack>
  )
}
