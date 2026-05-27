import React, { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
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
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { createProject, deleteProject, getProjects, updateProject } from 'api/projects'
import { readCachedProjects, writeCachedProjects } from 'utils/project-cache'

const initialCreateForm = {
  name: '',
  description: '',
}

const initialEditForm = {
  name: '',
  description: '',
}

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function SummaryCard({ title, value, helper, color, icon: Icon }) {
  return (
    <MainCard
      sx={{
        borderColor: `${color}.light`,
        bgcolor: `${color}.lighter`,
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" color={`${color}.main`}>
            {title}
          </Typography>
          <Typography variant="h2">{value}</Typography>
          <Typography variant="body2" color={`${color}.main`}>
            {helper}
          </Typography>
        </Stack>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'background.paper',
            color: `${color}.main`,
            boxShadow: 1,
          }}
        >
          <Icon style={{ fontSize: 24 }} />
        </Box>
      </Stack>
    </MainCard>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState(() => readCachedProjects())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(() => readCachedProjects().length === 0)
  const [error, setError] = useState('')
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuProject, setMenuProject] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState(initialCreateForm)
  const [createErrors, setCreateErrors] = useState({})
  const [creating, setCreating] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editForm, setEditForm] = useState(initialEditForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let isActive = true
    const hasCachedProjects = readCachedProjects().length > 0

    getProjects()
      .then((projectList) => {
        if (isActive) {
          setProjects(projectList)
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

    if (!query) return projects

    return projects.filter((project) => {
      const fields = [project.name, project.description]
      return fields.some((field) => field?.toLowerCase().includes(query))
    })
  }, [projects, search])

  const summaryCards = useMemo(
    () => [
      {
        title: 'Total Projects',
        value: projects.length,
        helper: projects.length === 1 ? '1 project created' : `${projects.length} projects created`,
        color: 'primary',
        icon: FolderOutlined,
      },
      {
        title: 'Data Sources',
        value: projects.reduce((total, project) => total + (project.data_sources_count ?? 0), 0),
        helper: 'Across all projects',
        color: 'secondary',
        icon: FileTextOutlined,
      },
      {
        title: 'Empty Projects',
        value: projects.filter((project) => (project.data_sources_count ?? 0) === 0).length,
        helper: 'No data sources yet',
        color: 'warning',
        icon: FolderOutlined,
      },
      {
        title: 'Active Inventory',
        value: projects.filter((project) => (project.data_sources_count ?? 0) > 0).length,
        helper: 'Projects with sources',
        color: 'success',
        icon: FolderOutlined,
      },
    ],
    [projects],
  )

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
      setProjects((currentProjects) => {
        const nextProjects = [
          createdProject,
          ...currentProjects.filter((project) => project.id !== createdProject.id),
        ]
        writeCachedProjects(nextProjects)
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
    setEditForm({
      name: project.name ?? '',
      description: project.description ?? '',
    })
    closeProjectMenu()
  }

  function closeEditDialog() {
    setEditingProject(null)
    setEditForm(initialEditForm)
    setSaving(false)
  }

  async function handleSaveEdit(event) {
    event.preventDefault()

    if (!editingProject || !editForm.name.trim()) return

    setSaving(true)
    setError('')

    try {
      const updatedProject = await updateProject(editingProject.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      })
      setProjects((currentProjects) => {
        const nextProjects = currentProjects.map((project) => (project.id === updatedProject.id ? updatedProject : project))
        writeCachedProjects(nextProjects)
        return nextProjects
      })
      closeEditDialog()
    } catch {
      setError('Could not update the project. Please check the form and try again.')
      setSaving(false)
    }
  }

  async function handleDelete(project) {
    closeProjectMenu()

    if (!window.confirm(`Delete "${project.name}"? This will also remove its data sources.`)) {
      return
    }

    setError('')

    try {
      await deleteProject(project.id)
      setProjects((currentProjects) => {
        const nextProjects = currentProjects.filter((item) => item.id !== project.id)
        writeCachedProjects(nextProjects)
        return nextProjects
      })
    } catch {
      setError('Could not delete the project. Please try again.')
    }
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'flex-start' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.75 }}>
            Projects
          </Typography>
          <Typography color="text.secondary">Overview of all your ML pipeline projects</Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <OutlinedInput
            size="small"
            placeholder="Search projects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
            sx={{ width: { xs: '100%', sm: 360 }, bgcolor: 'background.paper' }}
          />
          <Button
            variant="contained"
            startIcon={<PlusOutlined aria-hidden="true" />}
            sx={{ minWidth: 150 }}
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
        {summaryCards.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </Box>

      <MainCard content={false}>
        <TableContainer>
          <Table sx={{ minWidth: 900, tableLayout: 'fixed' }} aria-label="Projects table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 200 }}>Project Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell sx={{ width: 140 }}>Data Sources</TableCell>
                <TableCell sx={{ width: 170 }}>Last Updated</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Loading projects...</Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading && filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
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
                filteredProjects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                        {project.name}
                      </Typography>
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
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{project.data_sources_count ?? 0}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(project.updated_at)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          aria-label={`More actions for ${project.name}`}
                          onClick={(event) => openProjectMenu(event, project)}
                        >
                          <MoreOutlined />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeProjectMenu}>
        <MenuItem onClick={() => openEditDialog(menuProject)}>
          <EditOutlined style={{ marginRight: 10 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDelete(menuProject)} sx={{ color: 'error.main' }}>
          <DeleteOutlined style={{ marginRight: 10 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={createDialogOpen} onClose={closeCreateDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleCreateProject}>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Project Name"
                required
                placeholder="Enter project name"
                value={createForm.name}
                error={Boolean(createErrors.name)}
                helperText={createErrors.name}
                onChange={(event) => {
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                  setCreateErrors((current) => ({ ...current, name: '' }))
                }}
              />
              <TextField
                label="Description"
                multiline
                minRows={3}
                placeholder="Describe the purpose and scope of this project"
                value={createForm.description}
                onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
              />
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

      <Dialog open={Boolean(editingProject)} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSaveEdit}>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Project Name"
                required
                value={editForm.name}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
              />
              <TextField
                label="Description"
                multiline
                minRows={3}
                value={editForm.description}
                onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" color="secondary" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || !editForm.name.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
