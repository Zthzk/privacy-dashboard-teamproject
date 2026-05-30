import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { createProject, deleteProject, getProjects, updateProject } from 'api/projects'
import {
  markSampleProjectDeleted,
  readCachedProjects,
  writeCachedProjects,
  writeProjectStyleOverride,
  writeSampleProjectOverride,
} from 'utils/project-cache'
import {
  defaultProjectStyle,
  getProjectStyle,
  getVisibleProjects,
  projectColorOptions,
  projectIconMap,
  projectIconOptions,
  sortProjectsNewestFirst,
} from 'utils/project-display'

const initialCreateForm = {
  name: '',
  description: '',
  icon_key: defaultProjectStyle.key,
  color: defaultProjectStyle.color,
}

function HighRiskShieldIcon(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14 3.5L22.25 6.6V13.05C22.25 18.25 18.92 22.96 14 24.5C9.08 22.96 5.75 18.25 5.75 13.05V6.6L14 3.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M14 9V15.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 19.25H14.02" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getProjectRisk(project) {
  const riskValue = project.overall_status ?? project.risk_status ?? project.risk_level

  if (project.name === 'Health Insights' || project.art_9_sources > 0 || riskValue === 'red') {
    return { level: 'high', label: 'High', color: 'error' }
  }

  if (project.name === 'Traffic Monitoring Vision' || riskValue === 'yellow' || riskValue === 'medium' || riskValue === 'high') {
    return { level: 'medium', label: 'Medium', color: 'warning' }
  }

  if ((project.high_risk_sources ?? 0) > 0) {
    return { level: 'high', label: 'High', color: 'error' }
  }

  if ((project.medium_risk_sources ?? 0) > 0 || (project.personal_data_sources ?? 0) > 0) {
    return { level: 'medium', label: 'Medium', color: 'warning' }
  }

  return { level: 'low', label: 'Low', color: 'success' }
}

function ProjectIcon({ project }) {
  const style = getProjectStyle(project)
  const Icon = project.icon || projectIconMap[style.key] || FolderOutlined

  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 42,
        height: 42,
        border: 1,
        borderColor: `${style.color}.light`,
        bgcolor: `${style.color}.lighter`,
        color: `${style.color}.main`,
      }}
    >
      <Icon />
    </Avatar>
  )
}

function sortProjectsForOverview(projects, sortMode) {
  return [...projects].sort((firstProject, secondProject) => {
    if (sortMode === 'name-asc') {
      return firstProject.name.localeCompare(secondProject.name)
    }

    if (sortMode === 'name-desc') {
      return secondProject.name.localeCompare(firstProject.name)
    }

    return Date.parse(secondProject.updated_at ?? '') - Date.parse(firstProject.updated_at ?? '')
  })
}

function MetricCard({ title, value, helper, color, icon: Icon }) {
  return (
    <MainCard
      sx={{
        height: '100%',
        borderColor: 'divider',
        '& .MuiCardContent-root': { p: 2.5 },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            display: 'grid',
            flexShrink: 0,
            placeItems: 'center',
            border: 1,
            borderColor: `${color}.light`,
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
          }}
        >
          <Icon style={{ fontSize: 26 }} />
        </Box>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="h2" sx={{ lineHeight: 1.05 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {helper}
          </Typography>
        </Stack>
      </Stack>
    </MainCard>
  )
}

function FilterButton({ active, label, icon, onClick }) {
  return (
    <Button
      variant={active ? 'contained' : 'outlined'}
      color={active ? 'primary' : 'secondary'}
      startIcon={icon}
      onClick={onClick}
      sx={{
        minHeight: 42,
        px: 2,
        bgcolor: active ? undefined : 'background.paper',
        borderColor: active ? undefined : 'divider',
        color: active ? undefined : 'text.primary',
        boxShadow: active ? 2 : 'none',
      }}
    >
      {label}
    </Button>
  )
}

function RiskChip({ risk }) {
  return (
    <Chip
      icon={<Box component="span" sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: `${risk.color}.main`, ml: 0.5 }} />}
      label={risk.label}
      color={risk.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 700, '& .MuiChip-icon': { color: 'transparent' } }}
    />
  )
}

function EditProjectDialog({ project, saving, onClose, onSave }) {
  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSave({
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
    })
  }

  return (
    <Dialog open={Boolean(project)} onClose={onClose} fullWidth maxWidth="sm">
      <Box key={project?.id ?? 'edit-project'} component="form" onSubmit={handleSubmit}>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Project Name
              </Typography>
              <Box
                component="input"
                name="name"
                required
                defaultValue={project?.name ?? ''}
                sx={{
                  width: '100%',
                  height: 44,
                  px: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  font: 'inherit',
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Description
              </Typography>
              <Box
                component="textarea"
                name="description"
                defaultValue={project?.description ?? ''}
                sx={{
                  width: '100%',
                  height: 150,
                  p: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  font: 'inherit',
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  resize: 'none',
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" color="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !project?.name?.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default function Projects() {
  const navigate = useNavigate()
  const createNameRef = useRef(null)
  const createDescriptionRef = useRef(null)
  const [projects, setProjects] = useState(() => getVisibleProjects(readCachedProjects()))
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortMode, setSortMode] = useState('updated')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [loading, setLoading] = useState(() => readCachedProjects().length === 0)
  const [error, setError] = useState('')
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuProject, setMenuProject] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState(initialCreateForm)
  const [createErrors, setCreateErrors] = useState({})
  const [creating, setCreating] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deleteDialogProject, setDeleteDialogProject] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let isActive = true
    const cachedProjects = readCachedProjects()
    const hasCachedProjects = cachedProjects.length > 0

    getProjects()
      .then((projectList) => {
        if (isActive) {
          const nextProjects = getVisibleProjects(projectList)
          setProjects(nextProjects)
          writeCachedProjects(projectList)
        }
      })
      .catch(() => {
        if (isActive && !hasCachedProjects) {
          setError('Could not load projects. Please check the backend connection and refresh the page.')
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

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()

    const searchedProjects = query ? projects.filter((project) => {
      const fields = [project.name, project.description]
      return fields.some((field) => field?.toLowerCase().includes(query))
    }) : projects

    const nextProjects = searchedProjects.filter((project) => {
      const risk = getProjectRisk(project)

      if (activeFilter === 'low' || activeFilter === 'medium' || activeFilter === 'high') {
        return risk.level === activeFilter
      }

      return true
    })

    return sortProjectsForOverview(nextProjects, sortMode)
  }, [activeFilter, projects, search, sortMode])

  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / rowsPerPage))
  const currentPage = Math.min(page, pageCount - 1)
  const firstVisibleProject = filteredProjects.length === 0 ? 0 : currentPage * rowsPerPage + 1
  const lastVisibleProject = Math.min(filteredProjects.length, (currentPage + 1) * rowsPerPage)
  const paginatedProjects = filteredProjects.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)

  const dashboardStats = useMemo(
    () => {
      const projectRisks = projects.map(getProjectRisk)

      return {
        mediumRisk: projectRisks.filter((risk) => risk.level === 'medium').length,
        highRisk: projectRisks.filter((risk) => risk.level === 'high').length,
        summaryCards: [
          {
            title: 'Total Projects',
            value: projects.length,
            helper: 'All projects',
            color: 'primary',
            icon: FolderOutlined,
          },
          {
            title: 'Total Data Sources',
            value: projects.reduce((total, project) => total + (project.data_sources_count ?? 0), 0),
            helper: 'Across all projects',
            color: 'secondary',
            icon: DatabaseOutlined,
          },
          {
            title: 'Medium Risk',
            value: projectRisks.filter((risk) => risk.level === 'medium').length,
            helper: 'Projects needing review',
            color: 'warning',
            icon: WarningOutlined,
          },
          {
            title: 'High Risk',
            value: projectRisks.filter((risk) => risk.level === 'high').length,
            helper: 'Needs immediate attention',
            color: 'error',
            icon: HighRiskShieldIcon,
          },
        ],
      }
    },
    [projects],
  )

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'low', label: 'Low Risk', icon: <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} /> },
    { key: 'medium', label: 'Medium Risk', icon: <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'warning.main' }} /> },
    { key: 'high', label: 'High Risk', icon: <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main' }} /> },
  ]

  function openProjectMenu(event, project) {
    setMenuAnchor(event.currentTarget)
    setMenuProject(project)
  }

  function closeProjectMenu() {
    setMenuAnchor(null)
    setMenuProject(null)
  }

  function closeCreateDialog() {
    setCreateDialogOpen(false)
    setCreateForm(initialCreateForm)
    setCreateErrors({})
    setCreating(false)
  }

  function handleCreateNameKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      createDescriptionRef.current?.focus()
    }
  }

  function handleCreateDescriptionKeyDown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      createNameRef.current?.focus()
    }
  }

  async function handleCreateProject(event) {
    event.preventDefault()

    if (!createForm.name.trim()) {
      setCreateErrors({ name: 'Project name is required.' })
      return
    }

    setCreating(true)
    setError('')

    try {
      const createdProject = await createProject({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      })
      const timestampedProject = {
        ...createdProject,
        icon_key: createForm.icon_key,
        color: createForm.color,
        created_at: createdProject.created_at ?? new Date().toISOString(),
      }
      writeProjectStyleOverride(timestampedProject.id, {
        icon_key: createForm.icon_key,
        color: createForm.color,
      })
      setProjects((currentProjects) => {
        const nextProjects = sortProjectsNewestFirst([
          timestampedProject,
          ...currentProjects.filter((project) => project.id !== timestampedProject.id),
        ])
        writeCachedProjects(nextProjects.filter((project) => !project.isSample))
        return nextProjects
      })
      closeCreateDialog()
    } catch (createError) {
      if (createError?.name?.[0]) {
        setCreateErrors({ name: createError.name[0] })
      } else {
        setError(createError?.error ?? 'Could not create project. Please try again.')
      }
      setCreating(false)
    }
  }

  function openEditDialog(project) {
    setEditingProject(project)
    closeProjectMenu()
  }

  function closeEditDialog() {
    setEditingProject(null)
    setSaving(false)
  }

  function openDeleteDialog(project) {
    setDeleteDialogProject(project)
    closeProjectMenu()
  }

  function closeDeleteDialog() {
    setDeleteDialogProject(null)
  }

  async function handleSaveEdit(form) {
    if (!editingProject || !form.name.trim()) return

    setSaving(true)
    setError('')

    try {
      const updateData = {
        name: form.name.trim(),
        description: form.description.trim(),
      }
      const updatedProject = editingProject.isSample
        ? {
          ...editingProject,
          ...updateData,
          updated_at: new Date().toISOString(),
        }
        : await updateProject(editingProject.id, updateData)

      setProjects((currentProjects) => {
        const nextProjects = sortProjectsNewestFirst(currentProjects.map((project) => (project.id === updatedProject.id ? updatedProject : project)))
        if (updatedProject.isSample) {
          writeSampleProjectOverride(updatedProject)
        } else {
          writeCachedProjects(nextProjects.filter((project) => !project.isSample))
        }
        return nextProjects
      })
      closeEditDialog()
    } catch {
      setError('Could not update the project. Please check the form and try again.')
      setSaving(false)
    }
  }

  async function handleDeleteProject() {
    if (!deleteDialogProject) return

    setError('')

    try {
      if (deleteDialogProject.isSample) {
        markSampleProjectDeleted(deleteDialogProject.id)
      } else {
        await deleteProject(deleteDialogProject.id)
      }

      setProjects((currentProjects) => {
        const nextProjects = sortProjectsNewestFirst(currentProjects.filter((item) => item.id !== deleteDialogProject.id))
        writeCachedProjects(nextProjects.filter((item) => !item.isSample))
        return nextProjects
      })
      closeDeleteDialog()
    } catch {
      setError('Could not delete the project. Please try again.')
    }
  }

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'flex-end' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h1" sx={{ mb: 0.75, fontSize: { xs: 30, md: 36 } }}>
            Projects
          </Typography>
          <Typography color="text.secondary">Manage and monitor all ML privacy projects</Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'stretch' }}>
          <OutlinedInput
            placeholder="Search projects..."
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
            sx={{ width: { xs: '100%', sm: 360 }, height: 48, bgcolor: 'background.paper' }}
          />
          <Button
            variant="contained"
            startIcon={<PlusOutlined aria-hidden="true" />}
            sx={{ minWidth: 160, boxShadow: 3 }}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Project
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
          gap: 2.5,
        }}
      >
        {dashboardStats.summaryCards.map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </Box>

      <Stack spacing={2.5} sx={{ minWidth: 0 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto' }}>
            {filterOptions.map((option) => (
              <FilterButton
                key={option.key}
                active={activeFilter === option.key}
                label={option.label}
                icon={option.icon}
                onClick={() => {
                  setActiveFilter(option.key)
                  setPage(0)
                }}
              />
            ))}
          </Stack>
          <Select
            size="small"
            value={sortMode}
            onChange={(event) => {
              setSortMode(event.target.value)
              setPage(0)
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  mt: 0.75,
                  borderRadius: 1,
                  boxShadow: 3,
                  '& .MuiMenuItem-root': {
                    minHeight: 40,
                    fontSize: 14,
                  },
                },
              },
            }}
            sx={{
              minWidth: { xs: '100%', md: 180 },
              height: 42,
              bgcolor: 'background.paper',
              '& .MuiSelect-select': {
                py: 1,
                fontSize: 14,
              },
            }}
            aria-label="Sort projects"
          >
            <MenuItem value="updated">Recently Updated</MenuItem>
            <MenuItem value="name-asc">A to Z</MenuItem>
            <MenuItem value="name-desc">Z to A</MenuItem>
          </Select>
        </Stack>

        <MainCard content={false}>
          <TableContainer>
            <Table sx={{ minWidth: 1040, tableLayout: 'fixed' }} aria-label="Projects table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 230 }}>Project Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell sx={{ width: 145 }}>Data Sources</TableCell>
                  <TableCell sx={{ width: 150 }}>Risk</TableCell>
                  <TableCell sx={{ width: 170 }}>Last Updated</TableCell>
                  <TableCell align="right" sx={{ width: 110 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Loading projects...</Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && filteredProjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1">
                        {projects.length === 0 ? 'No projects created yet.' : 'No projects match your search.'}
                      </Typography>
                      {projects.length === 0 && (
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                          Create your first project to start tracking data sources.
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  paginatedProjects.map((project) => {
                    const risk = getProjectRisk(project)

                    return (
                      <TableRow
                        key={project.id}
                        hover
                        onClick={() => navigate(`/projects/${project.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', minWidth: 0 }}>
                            <ProjectIcon project={project} />
                            <Typography
                              variant="subtitle2"
                              color="text.primary"
                              sx={{
                                overflowWrap: 'anywhere',
                              }}
                            >
                              {project.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            title={project.description || 'No description provided.'}
                            sx={{
                              display: '-webkit-box',
                              overflow: 'hidden',
                              overflowWrap: 'anywhere',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                            }}
                          >
                            {project.description || 'No description provided.'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{project.data_sources_count ?? 0}</TableCell>
                        <TableCell>
                          <RiskChip risk={risk} />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(project.updated_at)}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton
                            size="small"
                            aria-label={`More actions for ${project.name}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              openProjectMenu(event, project)
                            }}
                          >
                            <MoreOutlined />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ p: 2, borderTop: 1, borderColor: 'divider', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing {firstVisibleProject} to {lastVisibleProject} of {filteredProjects.length} projects
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: 'space-between', sm: 'flex-end' }, alignItems: 'center' }}>
              <IconButton
                disabled={currentPage === 0}
                aria-label="Previous page"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <RightOutlined style={{ transform: 'rotate(180deg)' }} />
              </IconButton>
              <Button variant="outlined" sx={{ minWidth: 44, bgcolor: 'primary.lighter' }}>{currentPage + 1}</Button>
              <IconButton
                disabled={currentPage >= pageCount - 1}
                aria-label="Next page"
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <RightOutlined />
              </IconButton>
              <Select
                size="small"
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setPage(0)
                }}
                sx={{ minWidth: 115 }}
              >
                <MenuItem value={5}>5 / page</MenuItem>
                <MenuItem value={10}>10 / page</MenuItem>
              </Select>
            </Stack>
          </Stack>
        </MainCard>
      </Stack>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeProjectMenu}>
        <MenuItem onClick={() => openEditDialog(menuProject)}>
          <EditOutlined style={{ marginRight: 10 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => openDeleteDialog(menuProject)} sx={{ color: 'error.main' }}>
          <DeleteOutlined style={{ marginRight: 10 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={Boolean(deleteDialogProject)} onClose={closeDeleteDialog} fullWidth maxWidth="xs">
        <DialogTitle>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'error.lighter',
                color: 'error.main',
              }}
            >
              <HighRiskShieldIcon />
            </Box>
            Delete Project
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete "{deleteDialogProject?.name}"? This will also remove its data sources from this dashboard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" color="secondary" onClick={closeDeleteDialog}>
            Cancel
          </Button>
          <Button type="button" variant="contained" color="error" onClick={handleDeleteProject}>
            Delete Project
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialogOpen} onClose={closeCreateDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleCreateProject}>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Project Name"
                required
                placeholder="Enter project name"
                inputRef={createNameRef}
                value={createForm.name}
                error={Boolean(createErrors.name)}
                helperText={createErrors.name}
                onKeyDown={handleCreateNameKeyDown}
                onChange={(event) => {
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                  setCreateErrors((current) => ({ ...current, name: '' }))
                }}
              />
              <TextField
                label="Description"
                multiline
                rows={5}
                placeholder="Describe the purpose and scope of this project"
                inputRef={createDescriptionRef}
                value={createForm.description}
                onKeyDown={handleCreateDescriptionKeyDown}
                onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                slotProps={{
                  input: {
                    sx: {
                      alignItems: 'flex-start',
                      '& textarea': { resize: 'none' },
                    },
                  },
                }}
              />
              <Stack spacing={1}>
                <Typography variant="subtitle2">Project Icon</Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                    gap: 1,
                  }}
                >
                  {projectIconOptions.map((option) => {
                    const Icon = projectIconMap[option.key] ?? FolderOutlined
                    const selected = createForm.icon_key === option.key

                    return (
                      <Button
                        key={option.key}
                        type="button"
                        variant={selected ? 'outlined' : 'text'}
                        color={selected ? 'primary' : 'secondary'}
                        onClick={() => setCreateForm((current) => ({ ...current, icon_key: option.key }))}
                        sx={{
                          minHeight: 72,
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: `${createForm.color}.main`,
                            color: 'common.white',
                          }}
                        >
                          <Icon />
                        </Box>
                        {option.label}
                      </Button>
                    )
                  })}
                </Box>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Background Color</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                  {projectColorOptions.map((option) => {
                    const selected = createForm.color === option.key

                    return (
                      <Button
                        key={option.key}
                        type="button"
                        variant={selected ? 'contained' : 'outlined'}
                        color={option.key}
                        onClick={() => setCreateForm((current) => ({ ...current, color: option.key }))}
                        startIcon={
                          <Box
                            component="span"
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: `${option.key}.main`,
                              border: '1px solid',
                              borderColor: selected ? 'common.white' : `${option.key}.main`,
                            }}
                          />
                        }
                      >
                        {option.label}
                      </Button>
                    )
                  })}
                </Stack>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" color="secondary" onClick={closeCreateDialog}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !createForm.name.trim()}>
              {creating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <EditProjectDialog project={editingProject} saving={saving} onClose={closeEditDialog} onSave={handleSaveEdit} />
    </Stack>
  )
}
