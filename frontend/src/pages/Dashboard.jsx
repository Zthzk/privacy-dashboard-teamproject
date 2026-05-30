import { useEffect, useMemo, useState } from 'react'
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
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import {
  CarOutlined,
  CloseOutlined,
  DatabaseOutlined,
  EyeOutlined,
  MailOutlined,
  MessageOutlined,
  MoreOutlined,
  RightOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { getAllDataSources } from 'api/dataSources'
import { getProjects } from 'api/projects'
import { mergeUniqueById, sampleDataSources, sampleProjects } from 'constants/dashboardSampleData'
import { getProjectStyle, getVisibleProjects, projectIconMap } from 'utils/project-display'

const riskSummary = [
  { label: 'Email addresses detected', value: '1,248', icon: MailOutlined, color: 'primary' },
  { label: 'License plates detected', value: '342', icon: CarOutlined, color: 'secondary' },
  { label: 'Potential PII fields', value: '12', icon: TeamOutlined, color: 'success' },
]

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function riskChipProps(risk) {
  const normalizedRisk = String(risk ?? '').toLowerCase()

  if (normalizedRisk === 'low') return { color: 'success', label: 'Low Risk' }
  if (normalizedRisk === 'high') return { color: 'error', label: 'High Risk' }
  return { color: 'warning', label: 'Medium Risk' }
}

function getSourceRisk(source) {
  const risk = source.risk ?? source.risk_level_display ?? source.risk_level
  const normalizedRisk = String(risk ?? '').toLowerCase()

  if (normalizedRisk === 'high' || normalizedRisk === 'red') return { label: 'High', color: 'error' }
  if (normalizedRisk === 'low' || normalizedRisk === 'green') return { label: 'Low', color: 'success' }
  return { label: risk || 'Medium', color: 'warning' }
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
  const [dataSources, setDataSources] = useState(sampleDataSources)
  const [selectedProjectId, setSelectedProjectId] = useState(sampleProjects[0]?.id ?? null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    Promise.all([getProjects(), getAllDataSources()])
      .then(([projectList, sourceList]) => {
        if (!isActive) return

        setProjects(getVisibleProjects(projectList))
        setDataSources(mergeUniqueById(sourceList, sampleDataSources))
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

      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

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
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Loading projects...</Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading && projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No projects available.</Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading && projects.map((project) => {
                const risk = riskChipProps(project.risk ?? project.risk_level)
                const selected = String(project.id) === String(selectedProjectId)

                return (
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

      {selectedProject && (
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pr: 7 }}>
          Data Source Preview
          <IconButton
            aria-label="Close data source preview"
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
                ['Overall Risk', riskChipProps(selectedProject.risk ?? selectedProject.risk_level).label],
                ['Contains Personal Data', 'Yes'],
                ['Art. 9 GDPR Data', 'Possible'],
                ['Last Updated', `${selectedProject.updated ?? formatDate(selectedProject.updated_at)}\n10:42 AM`],
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
                    color={label === 'Contains Personal Data' ? 'error.main' : label === 'Art. 9 GDPR Data' ? 'warning.dark' : 'text.primary'}
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
                      <TableRow key={source.id ?? source.name}>
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
                          <IconButton size="small" aria-label={`View ${source.name}`}>
                            <EyeOutlined />
                          </IconButton>
                          <IconButton size="small" aria-label={`More actions for ${source.name}`}>
                            <MoreOutlined />
                          </IconButton>
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
                  Consider pseudonymizing email addresses and applying data minimization to customer notes.
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
