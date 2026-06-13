import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import OutlinedInput from '@mui/material/OutlinedInput'
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
  ApiOutlined,
  CloseOutlined,
  AudioOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PictureOutlined,
  PlusOutlined,
  SearchOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { deleteDataSource, getAllDataSources } from 'api/dataSources'
import { getProjects } from 'api/projects'
import { readCachedDataSources, removeCachedDataSource, writeCachedDataSources } from 'utils/data-source-cache'

const DATA_FORMAT_ICONS = {
  text: { icon: FileTextOutlined, color: '#1677ff' },
  csv: { icon: DatabaseOutlined, color: '#52c41a' },
  json: { icon: ApiOutlined, color: '#fa8c16' },
  image: { icon: PictureOutlined, color: '#722ed1' },
  audio: { icon: AudioOutlined, color: '#eb2f96' },
  video: { icon: VideoCameraOutlined, color: '#13c2c2' },
  other: { icon: FileTextOutlined, color: '#8c8c8c' },
}

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getRiskChip(riskLevel) {
  if (riskLevel === 'high' || riskLevel === 'red') return { label: 'High', color: 'error' }
  if (riskLevel === 'medium' || riskLevel === 'yellow') return { label: 'Medium', color: 'warning' }
  return { label: 'Low', color: 'success' }
}

function getDataSourcePreviewText(source) {
  // Prefer the API preview field, but keep older cached/manual entries previewable.
  return source?.preview_text || source?.metadata?.preview_text || source?.metadata?.manual_data || ''
}

function SummaryCard({ title, value, helper, color, icon: Icon }) {
  return (
    <MainCard
      sx={{
        borderColor: `${color}.light`,
        bgcolor: `${color}.lighter`,
      }}
    >
      <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: `${color}.main`,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: `${color}.light`,
          }}
        >
          <Icon style={{ fontSize: 24 }} />
        </Box>
        <Stack spacing={0.75}>
          <Typography color="text.secondary">{title}</Typography>
          <Typography variant="h2">{value}</Typography>
          <Typography variant="body2" color="text.secondary">
            {helper}
          </Typography>
        </Stack>
      </Stack>
    </MainCard>
  )
}

export default function DataSources() {
  const navigate = useNavigate()
  const [dataSources, setDataSources] = useState(() => readCachedDataSources())
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(() => readCachedDataSources().length === 0)
  const [projectsLoaded, setProjectsLoaded] = useState(false)
  const [error, setError] = useState('')
  const [dataSourcePendingPreview, setDataSourcePendingPreview] = useState(null)

  useEffect(() => {
    let isActive = true

    getAllDataSources()
      .then((sourceList) => {
        if (isActive) {
          setDataSources(sourceList)
          writeCachedDataSources(sourceList)
        }
      })
      .catch(() => {
        if (isActive) {
          setError('Could not load data sources. Please check the backend connection and refresh the page.')
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    getProjects()
      .then((projectList) => {
        if (isActive) {
          setProjects(projectList)
        }
      })
      .catch(() => {
        if (isActive) {
          setError('Could not load projects. Please check the backend connection and refresh the page.')
        }
      })
      .finally(() => {
        if (isActive) {
          setProjectsLoaded(true)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const filteredDataSources = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return dataSources

    return dataSources.filter((source) => {
      const fields = [source.name, source.location, source.project_name, source.source_type_display, source.data_format_display]
      return fields.some((field) => field?.toLowerCase().includes(query))
    })
  }, [dataSources, search])

  const summaryCards = useMemo(
    () => {
      const isInitialLoad = loading && dataSources.length === 0

      return [
        {
          title: 'Total Data Sources',
          value: isInitialLoad ? '-' : dataSources.length,
          helper: 'Across all projects',
          color: 'primary',
          icon: DatabaseOutlined,
        },
        {
          title: 'File Sources',
          value: isInitialLoad ? '-' : dataSources.filter((source) => source.source_type === 'file').length,
          helper: 'Uploaded or referenced files',
          color: 'success',
          icon: FileTextOutlined,
        },
        {
          title: 'API Sources',
          value: isInitialLoad ? '-' : dataSources.filter((source) => source.source_type === 'api').length,
          helper: 'External or internal APIs',
          color: 'warning',
          icon: ApiOutlined,
        },
        {
          title: 'Manual Entries',
          value: isInitialLoad ? '-' : dataSources.filter((source) => source.source_type === 'manual').length,
          helper: 'Entered directly in the dashboard',
          color: 'secondary',
          icon: DatabaseOutlined,
        },
      ]
    },
    [dataSources, loading],
  )

  function handleEditDataSource(dataSource) {
    if (dataSource) {
      navigate(`/data-sources/${dataSource.id}/edit?project=${dataSource.project}`)
    }
  }

  async function handleDeleteDataSource(dataSource) {
    if (!dataSource || !window.confirm(`Delete "${dataSource.name}"?`)) {
      return
    }

    setError('')

    try {
      await deleteDataSource(dataSource.project, dataSource.id)
      setDataSources((currentSources) => currentSources.filter((source) => source.id !== dataSource.id))
      removeCachedDataSource(dataSource.id)
    } catch {
      setError('Could not delete data source. Please try again.')
    }
  }

  const previewText = getDataSourcePreviewText(dataSourcePendingPreview)
  const previewRiskChip = getRiskChip(dataSourcePendingPreview?.risk_level)

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'flex-start' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.75 }}>
            Data Sources
          </Typography>
          <Typography color="text.secondary">Manage and monitor all data sources used in your projects.</Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <OutlinedInput
            size="small"
            placeholder="Search data sources..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
            sx={{ width: { xs: '100%', sm: 360 }, bgcolor: 'background.paper' }}
          />
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => navigate('/data-sources/new')}>
            Add Data Source
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {projects.length === 0 && projectsLoaded && (
        <Alert severity="info" action={<Button onClick={() => navigate('/projects')}>Go to Projects</Button>}>
          Create a project before adding data sources.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
          gap: 2.5,
        }}
      >
        {summaryCards.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </Box>

      <MainCard content={false}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table
            sx={{
              minWidth: 1260,
              tableLayout: 'fixed',
              '& .MuiTableCell-head': {
                whiteSpace: 'nowrap',
                fontSize: 13,
              },
              '& .MuiTableCell-root': {
                verticalAlign: 'middle',
              },
            }}
            aria-label="Data sources table"
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 280 }}>Data Source Name</TableCell>
                <TableCell sx={{ width: 180 }}>Project</TableCell>
                <TableCell sx={{ width: 120 }}>Type</TableCell>
                <TableCell sx={{ width: 120 }}>Format</TableCell>
                <TableCell sx={{ width: 270 }}>Location / Reference</TableCell>
                <TableCell sx={{ width: 150 }}>Last Updated</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Loading data sources...</Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading && filteredDataSources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1">
                      {dataSources.length === 0 ? 'No data sources added yet.' : 'No data sources match your search.'}
                    </Typography>
                    {dataSources.length === 0 && (
                      <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                        Add a data source from this page or from a project detail page.
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                filteredDataSources.map((source) => (
                    // Rows open the same preview as the eye action
                    <TableRow
                      key={source.id}
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
                      <TableCell>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
                          {(() => {
                            const fmt = DATA_FORMAT_ICONS[source.data_format] ?? DATA_FORMAT_ICONS.other
                            return <fmt.icon style={{ color: fmt.color }} />
                          })()}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              title={source.name}
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {source.name}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`/projects/${source.project}`}
                          underline="hover"
                          onClick={(event) => event.stopPropagation()}
                          sx={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {source.project_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color="primary" label={source.source_type_display} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color="secondary" label={source.data_format_display} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          title={source.location || '-'}
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {source.location || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(source.updated_at)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                          <Tooltip title="Preview data source">
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`Preview ${source.name}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setDataSourcePendingPreview(source)
                                }}
                              >
                                <EyeOutlined />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Edit data source">
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`Edit ${source.name}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleEditDataSource(source)
                                }}
                              >
                                <EditOutlined />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete data source">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Delete ${source.name}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleDeleteDataSource(source)
                                }}
                              >
                                <DeleteOutlined />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>

      <Dialog
        open={Boolean(dataSourcePendingPreview)}
        onClose={() => setDataSourcePendingPreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pr: 7 }}>Dataset Preview</DialogTitle>
        <IconButton
          aria-label="Close dataset preview"
          onClick={() => setDataSourcePendingPreview(null)}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseOutlined />
        </IconButton>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Dataset Details
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="h5">{dataSourcePendingPreview?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {dataSourcePendingPreview?.location || 'No source location provided.'}
                </Typography>
              </Stack>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Risk Metadata
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Chip
                  size="small"
                  variant="outlined"
                  color="primary"
                  label={dataSourcePendingPreview?.source_type_display ?? dataSourcePendingPreview?.source_type ?? '-'}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  color="secondary"
                  label={dataSourcePendingPreview?.data_format_display ?? dataSourcePendingPreview?.data_format ?? '-'}
                />
                <Chip size="small" variant="outlined" color={previewRiskChip.color} label={`${previewRiskChip.label} Risk`} />
              </Stack>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Sample Preview
              </Typography>
              {previewText ? (
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    maxHeight: 360,
                    overflow: 'auto',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                    color: 'text.primary',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {previewText}
                </Box>
              ) : (
                <DialogContentText>No preview available for this data source.</DialogContentText>
              )}
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

    </Stack>
  )
}
