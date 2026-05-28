import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import OutlinedInput from '@mui/material/OutlinedInput'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import {
  ApiOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DatabaseFilled,
  DeleteOutlined,
  EditOutlined,
  FileFilled,
  FileTextOutlined,
  FolderFilled,
  GlobalOutlined,
  LeftOutlined,
  PlusCircleFilled,
  SearchOutlined,
  UserOutlined,
  WarningFilled,
} from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { deleteDataSource } from 'api/dataSources'
import { getProjectOverview } from 'api/projects'

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

function getBooleanChip(value) {
  return value ? { label: 'Yes', color: 'warning' } : { label: 'No', color: 'success' }
}

function getArt9Chip(source) {
  if (hasArt9Data(source)) return { label: 'Possible', color: 'error' }
  if (source.art_9_data === 'no' || source.metadata?.art_9_data === 'no') return { label: 'No', color: 'success' }
  return { label: 'Unknown', color: 'default' }
}

function getOverallRiskChip(status) {
  if (status === 'red') return { label: 'High Risk', color: 'error' }
  if (status === 'yellow') return { label: 'Medium Risk', color: 'warning' }
  return { label: 'Low Risk', color: 'success' }
}

function getSourceIcon(sourceType) {
  if (sourceType === 'database') return DatabaseFilled
  if (sourceType === 'api') return GlobalOutlined
  if (sourceType === 'manual') return FileTextOutlined
  return FileFilled
}

function hasArt9Data(source) {
  return (
    ['possible', 'yes', true].includes(source.art_9_data) ||
    ['possible', 'yes', true].includes(source.metadata?.art_9_data) ||
    source.metadata?.contains_art9_data === true
  )
}

function isHighRisk(source) {
  return ['high', 'red'].includes(source.risk_level)
}

function isMediumRisk(source) {
  return ['medium', 'yellow'].includes(source.risk_level)
}

function buildRiskAssessmentFallback(dataSources) {
  const metrics = {
    total_data_sources: dataSources.length,
    personal_data_sources: dataSources.filter((source) => source.contains_personal_data === true).length,
    high_risk_sources: dataSources.filter(isHighRisk).length,
    medium_risk_sources: dataSources.filter(isMediumRisk).length,
    art_9_sources: dataSources.filter(hasArt9Data).length,
  }

  let overallStatus = 'green'
  let reason = 'No personal data or high-risk categories are currently detected.'
  const recommendations = ['Keep data source metadata documented and review it when sources change.']

  if (metrics.high_risk_sources > 0 || metrics.art_9_sources > 0) {
    overallStatus = 'red'
    reason = 'At least one data source is high risk or contains GDPR Art. 9 special category data.'
    recommendations.unshift('Review high-risk and Art. 9 data sources before model training.')
  } else if (metrics.personal_data_sources > 0 || metrics.medium_risk_sources > 0) {
    overallStatus = 'yellow'
    reason = 'At least one data source contains personal data or has medium risk level.'
    recommendations.unshift('Review legal basis for processing and minimize directly identifying attributes.')
  }

  return {
    overall_status: overallStatus,
    reason,
    metrics,
    recommendations,
  }
}

function SummaryCard({ title, value, helper, color, icon: Icon }) {
  return (
    <MainCard sx={{ borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
            flexShrink: 0,
          }}
        >
          <Icon style={{ fontSize: 27 }} />
        </Box>
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" color="text.primary">
            {title}
          </Typography>
          <Typography variant="h2">{value}</Typography>
          <Typography variant="body2" color="text.secondary">
            {helper}
          </Typography>
        </Stack>
      </Stack>
    </MainCard>
  )
}

export default function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [dataSources, setDataSources] = useState([])
  const [riskAssessment, setRiskAssessment] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [deletingDataSourceId, setDeletingDataSourceId] = useState(null)
  const [dataSourcePendingDelete, setDataSourcePendingDelete] = useState(null)

  useEffect(() => {
    let isActive = true

    getProjectOverview(projectId)
      .then((overview) => {
        if (!isActive) return

        setProject(overview.project)
        setDataSources(overview.data_sources ?? [])
        setRiskAssessment(overview.risk_assessment ?? null)
        setPage(0)
      })
      .catch((loadError) => {
        if (isActive) {
          if (loadError?.status === 404) {
            setNotFound(true)
            setError('Project not found.')
          } else {
            setError('Could not load project details. Please check the backend connection and try again.')
          }
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
  }, [projectId])

  async function confirmDeleteDataSource() {
    if (!dataSourcePendingDelete) return

    const sourceToDelete = dataSourcePendingDelete
    const previousDataSources = dataSources

    setDeletingDataSourceId(sourceToDelete.id)
    setDataSourcePendingDelete(null)
    setDataSources((currentSources) => currentSources.filter((source) => source.id !== sourceToDelete.id))
    setError('')

    try {
      await deleteDataSource(sourceToDelete.project, sourceToDelete.id)
      const overview = await getProjectOverview(projectId)
      setProject(overview.project)
      setDataSources(overview.data_sources ?? [])
      setRiskAssessment(overview.risk_assessment ?? null)
      setPage(0)
    } catch {
      setDataSources(previousDataSources)
      setError('Could not delete data source. Please try again.')
    } finally {
      setDeletingDataSourceId(null)
    }
  }

  const filteredDataSources = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return dataSources

    return dataSources.filter((source) => {
      const fields = [
        source.name,
        source.description,
        source.location,
        source.source_type_display,
        source.data_format_display,
        source.risk_level_display,
        source.art_9_data_display,
      ]
      return fields.some((field) => field?.toLowerCase().includes(query))
    })
  }, [dataSources, search])

  const visibleDataSources = useMemo(
    () => filteredDataSources.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredDataSources, page, rowsPerPage],
  )

  const effectiveRiskAssessment = useMemo(
    () => riskAssessment ?? buildRiskAssessmentFallback(dataSources),
    [dataSources, riskAssessment],
  )
  const metrics = effectiveRiskAssessment.metrics ?? {}
  const overallRisk = getOverallRiskChip(effectiveRiskAssessment.overall_status)

  const summaryCards = [
    {
      title: 'Total Sources',
      value: metrics.total_data_sources ?? dataSources.length,
      helper: 'Across all source types',
      color: 'primary',
      icon: DatabaseFilled,
    },
    {
      title: 'Personal Data',
      value: metrics.personal_data_sources ?? dataSources.filter((source) => source.contains_personal_data).length,
      helper: 'Sources contain personal data',
      color: 'success',
      icon: UserOutlined,
    },
    {
      title: 'High Risk',
      value: metrics.high_risk_sources ?? dataSources.filter((source) => source.risk_level === 'high').length,
      helper: 'High risk data sources',
      color: 'error',
      icon: WarningFilled,
    },
    {
      title: 'Medium Risk',
      value: metrics.medium_risk_sources ?? dataSources.filter(isMediumRisk).length,
      helper: 'Sources needing review',
      color: 'warning',
      icon: WarningFilled,
    },
    {
      title: 'Art. 9 Data',
      value: metrics.art_9_sources ?? dataSources.filter((source) => ['possible', 'yes'].includes(source.art_9_data)).length,
      helper: 'Special category data',
      color: 'secondary',
      icon: ApiOutlined,
    },
  ]

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Button
          component={RouterLink}
          to="/projects"
          startIcon={<LeftOutlined />}
          sx={{ alignSelf: 'flex-start', px: 0 }}
        >
          Back to Projects
        </Button>
        <Typography variant="h2">Project Details</Typography>
        <Typography color="text.secondary">Project inventory, source metrics, and privacy risk in one place</Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Loading project details...</Alert>}

      {!loading && notFound && (
        <Button variant="contained" component={RouterLink} to="/projects" sx={{ alignSelf: 'flex-start' }}>
          Back to Projects
        </Button>
      )}

      {!loading && project && (
        <>
          <MainCard>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    flexShrink: 0,
                  }}
                >
                  <FolderFilled style={{ fontSize: 31 }} />
                </Box>
                <Stack spacing={1} sx={{ minWidth: 0 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
                    <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>
                      {project.name}
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                    {project.description || 'No description provided.'}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <CalendarOutlined />
                      <Typography variant="body2" color="text.secondary">
                        Created: {formatDate(project.created_at)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <ClockCircleOutlined />
                      <Typography variant="body2" color="text.secondary">
                        Last Updated: {formatDate(project.updated_at)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
              <Button
                variant="contained"
                startIcon={<PlusCircleFilled />}
                onClick={() => navigate(`/data-sources/new?project=${project.id}`)}
              >
                Add Data Source
              </Button>
            </Stack>
          </MainCard>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {summaryCards.map((item) => (
              <SummaryCard key={item.title} {...item} />
            ))}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', xl: 'minmax(340px, 0.9fr) minmax(0, 1.9fr)' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <MainCard>
              <Stack spacing={2}>
                <Typography variant="h5">Risk Assessment</Typography>
                <Divider />
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">Overall Status</Typography>
                  <Chip label={overallRisk.label} color={overallRisk.color} size="small" variant="outlined" />
                </Stack>
                <Typography variant="body2">
                  {effectiveRiskAssessment.reason || 'Risk assessment is not available yet.'}
                </Typography>
                <Divider />
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Metrics</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${metrics.personal_data_sources ?? 0} out of ${metrics.total_data_sources ?? dataSources.length} data sources contain personal data. ${metrics.high_risk_sources ?? 0} sources are classified as high risk.`}
                  </Typography>
                </Stack>
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2">Recommendations</Typography>
                  {(effectiveRiskAssessment.recommendations ?? []).map((recommendation, index) => (
                    <Stack key={recommendation} direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'common.white',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                          mt: 0.2,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {recommendation}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </MainCard>

            <MainCard content={false}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', px: 2, py: 2 }}
              >
                <Typography variant="h5">Data Sources ({dataSources.length})</Typography>
                <OutlinedInput
                  size="small"
                  placeholder="Search data sources..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(0)
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  }
                  sx={{ width: { xs: '100%', md: 300 }, bgcolor: 'background.paper' }}
                />
              </Stack>
              <TableContainer>
                <Table sx={{ minWidth: 920, tableLayout: 'fixed' }} aria-label="Project data sources table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Source Name</TableCell>
                      <TableCell sx={{ width: 115 }}>Type</TableCell>
                      <TableCell sx={{ width: 115 }}>Format</TableCell>
                      <TableCell sx={{ width: 115 }}>Risk</TableCell>
                      <TableCell sx={{ width: 135 }}>Personal Data</TableCell>
                      <TableCell sx={{ width: 115 }}>Art. 9</TableCell>
                      <TableCell sx={{ width: 150 }}>Last Updated</TableCell>
                      <TableCell align="right" sx={{ width: 100 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDataSources.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography variant="subtitle1">
                            {dataSources.length === 0 ? 'No data sources added yet.' : 'No data sources match your search.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {visibleDataSources.map((source) => {
                      const SourceIcon = getSourceIcon(source.source_type)
                      const riskChip = getRiskChip(source.risk_level)
                      const personalDataChip = getBooleanChip(source.contains_personal_data)
                      const art9Chip = getArt9Chip(source)

                      return (
                        <TableRow key={source.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                              <Box
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: '50%',
                                  display: 'grid',
                                  placeItems: 'center',
                                  bgcolor: source.source_type === 'database' ? 'success.lighter' : 'primary.lighter',
                                  color: source.source_type === 'database' ? 'success.main' : 'primary.main',
                                  flexShrink: 0,
                                }}
                              >
                                <SourceIcon />
                              </Box>
                              <Typography variant="subtitle2" title={source.name} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {source.name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip label={source.source_type_display} color="primary" size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={source.data_format_display} color="secondary" size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={riskChip.label} color={riskChip.color} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={personalDataChip.label} color={personalDataChip.color} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={art9Chip.label} color={art9Chip.color} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{formatDate(source.updated_at)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                              <IconButton
                                size="small"
                                aria-label={`Edit ${source.name}`}
                                onClick={() => navigate(`/data-sources/${source.id}/edit?project=${source.project}`)}
                              >
                                <EditOutlined />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Delete ${source.name}`}
                                disabled={deletingDataSourceId === source.id}
                                onClick={() => setDataSourcePendingDelete(source)}
                              >
                                <DeleteOutlined />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredDataSources.length}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setPage(0)
                }}
              />
            </MainCard>
          </Box>

          <Dialog
            open={Boolean(dataSourcePendingDelete)}
            onClose={() => setDataSourcePendingDelete(null)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Delete Data Source</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Delete &quot;{dataSourcePendingDelete?.name}&quot; from this project? This will update the project metrics and risk assessment.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button color="secondary" onClick={() => setDataSourcePendingDelete(null)}>
                Cancel
              </Button>
              <Button
                color="error"
                variant="contained"
                disabled={Boolean(deletingDataSourceId)}
                onClick={confirmDeleteDataSource}
              >
                {deletingDataSourceId ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Stack>
  )
}
