import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import OutlinedInput from '@mui/material/OutlinedInput'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import {
  ApiOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DatabaseFilled,
  EditOutlined,
  ExportOutlined,
  FileFilled,
  FileTextOutlined,
  FolderFilled,
  GlobalOutlined,
  LeftOutlined,
  MoreOutlined,
  PlusCircleFilled,
  SearchOutlined,
  UserOutlined,
  WarningFilled,
} from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { getDataSources } from 'api/dataSources'
import { getProject } from 'api/projects'
import { getProjectRiskAssessment } from 'api/riskAssessments'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    Promise.all([
      getProject(projectId),
      getDataSources(projectId),
      getProjectRiskAssessment(projectId),
    ])
      .then(([projectData, sourceList, riskData]) => {
        if (!isActive) return

        setProject(projectData)
        setDataSources(sourceList)
        setRiskAssessment(riskData)
      })
      .catch(() => {
        if (isActive) {
          setError('Could not load project details. Please check the backend connection and try again.')
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

  const filteredDataSources = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return dataSources

    return dataSources.filter((source) => {
      const fields = [source.name, source.location, source.source_type_display, source.data_format_display]
      return fields.some((field) => field?.toLowerCase().includes(query))
    })
  }, [dataSources, search])

  const metrics = riskAssessment?.metrics ?? {}
  const overallRisk = getOverallRiskChip(riskAssessment?.overall_status)

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
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Loading project details...</Alert>}

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
                  <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>
                    {project.name}
                  </Typography>
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
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
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
                  {riskAssessment?.reason || 'Risk assessment is not available yet.'}
                </Typography>
                <Divider />
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Reason</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${metrics.personal_data_sources ?? 0} out of ${metrics.total_data_sources ?? dataSources.length} data sources contain personal data. ${metrics.high_risk_sources ?? 0} sources are classified as high risk.`}
                  </Typography>
                </Stack>
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2">Recommendations</Typography>
                  {(riskAssessment?.recommendations ?? []).map((recommendation, index) => (
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
                <Button variant="outlined" endIcon={<ExportOutlined />} sx={{ alignSelf: 'flex-start' }}>
                  View Full Risk Report
                </Button>
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
                  onChange={(event) => setSearch(event.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  }
                  sx={{ width: { xs: '100%', md: 300 }, bgcolor: 'background.paper' }}
                />
              </Stack>
              <TableContainer>
                <Table sx={{ minWidth: 760, tableLayout: 'fixed' }} aria-label="Project data sources table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Source Name</TableCell>
                      <TableCell sx={{ width: 115 }}>Type</TableCell>
                      <TableCell sx={{ width: 115 }}>Format</TableCell>
                      <TableCell sx={{ width: 115 }}>Risk</TableCell>
                      <TableCell sx={{ width: 150 }}>Last Updated</TableCell>
                      <TableCell align="right" sx={{ width: 100 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDataSources.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography variant="subtitle1">
                            {dataSources.length === 0 ? 'No data sources added yet.' : 'No data sources match your search.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {filteredDataSources.map((source) => {
                      const SourceIcon = getSourceIcon(source.source_type)
                      const riskChip = getRiskChip(source.risk_level)

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
                              <IconButton size="small" aria-label={`More actions for ${source.name}`}>
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
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Rows per page: 5
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredDataSources.length === 0 ? '0 of 0' : `1-${Math.min(filteredDataSources.length, 5)} of ${filteredDataSources.length}`}
                </Typography>
              </Box>
            </MainCard>
          </Box>
        </>
      )}
    </Stack>
  )
}
