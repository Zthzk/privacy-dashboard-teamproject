import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { BulbOutlined, DeleteOutlined, FileTextOutlined, LinkOutlined, SaveOutlined } from '@ant-design/icons'

import DataFormatHintAlert from 'components/DataFormatHintAlert'
import MainCard from 'components/MainCard'
import { deleteDataSource, getDataFormatHints, getDataSource, updateDataSource } from 'api/dataSources'
import { getProjects } from 'api/projects'
import { removeCachedDataSource, upsertCachedDataSource } from 'utils/data-source-cache'

const sourceTypeOptions = [
  { value: 'file', label: 'File' },
  { value: 'database', label: 'Database' },
  { value: 'api', label: 'API' },
  { value: 'url', label: 'URL' },
  { value: 'manual', label: 'Manual Entry' },
  { value: 'other', label: 'Other' },
]

const dataFormatOptions = [
  { value: 'text', label: 'Text' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
  { value: 'image', label: 'Image' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
]

const initialForm = {
  project: '',
  name: '',
  location: '',
  source_type: 'manual',
  data_format: 'text',
  manual_data: '',
}

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function StatusRow({ label, children }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      {children}
    </Stack>
  )
}

function SidebarCard({ icon: Icon, iconColor = 'primary.main', iconBg = 'primary.lighter', title, children }) {
  return (
    <MainCard>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              color: iconColor,
              bgcolor: iconBg,
              flex: '0 0 auto',
            }}
          >
            <Icon style={{ fontSize: 22 }} />
          </Box>
          <Typography variant="h5">{title}</Typography>
        </Stack>
        {children}
      </Stack>
    </MainCard>
  )
}

function getProjectDetailsPath(projectId) {
  return projectId ? `/projects/${projectId}` : '/data-sources'
}

export default function EditDataSource() {
  const navigate = useNavigate()
  const { dataSourceId } = useParams()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')
  const invalidRoute = !projectId || !dataSourceId
  const [projects, setProjects] = useState([])
  const [dataSource, setDataSource] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(!invalidRoute)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dataFormatHints, setDataFormatHints] = useState({})
  const [isNotCompliant, setIsNotCompliant] = useState(false)
  const [violations, setViolations] = useState([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const nameInputRef = useRef(null)
  const locationInputRef = useRef(null)
  const manualDataInputRef = useRef(null)

  // Errors are silently ignored — a failed hints fetch must not block the form.
  useEffect(() => {
    getDataFormatHints()
      .then(setDataFormatHints)
      .catch(() => {})
  }, [])

  const activeHint = dataFormatHints[form.data_format] ?? null

  useEffect(() => {
    let isActive = true

    if (invalidRoute) return undefined

    Promise.all([getDataSource(projectId, dataSourceId), getProjects()])
      .then(([source, projectList]) => {
        if (!isActive) return

        setProjects(projectList)
        setDataSource(source)
        setForm({
          project: String(source.project ?? ''),
          name: source.name ?? '',
          location: source.location ?? '',
          source_type: source.source_type ?? 'manual',
          data_format: source.data_format ?? 'text',
          manual_data: source.metadata?.manual_data ?? '',
        })
      })
      .catch(() => {
        if (isActive) {
          setError('Could not load this data source. Please check the backend connection and try again.')
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
  }, [projectId, dataSourceId, invalidRoute])

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(form.project)),
    [form.project, projects],
  )
  const submitDisabled = saving || !form.name.trim()

  useEffect(() => {
    if (!loading && dataSource) {
      nameInputRef.current?.focus()
    }
  }, [loading, dataSource])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    if (field === 'data_format') {
      setIsNotCompliant(false)
      setViolations([])
    }
  }

  function updateSourceType(value) {
    setForm((current) => ({
      ...current,
      source_type: value,
      location: value === 'manual' && !current.location.trim() ? 'manual input' : current.location,
    }))
  }

  function moveFocusOnArrow(event, nextRef, previousRef) {
    if (event.key === 'ArrowDown' && nextRef?.current) {
      event.preventDefault()
      nextRef.current.focus()
    }

    if (event.key === 'ArrowUp' && previousRef?.current) {
      event.preventDefault()
      previousRef.current.focus()
    }
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.project) nextErrors.project = 'Project is required.'
    if (!form.name.trim()) nextErrors.name = 'Data source name is required.'
    if (!form.location.trim() && form.source_type !== 'manual') nextErrors.location = 'Location or reference is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()

    if (!validateForm() || !dataSource) return

    setSaving(true)
    setError('')

    try {
      const location = form.location.trim() || (form.source_type === 'manual' ? 'manual input' : '')
      const updateData = {
        project: form.project,
        name: form.name.trim(),
        location,
        source_type: form.source_type,
        data_format: form.data_format,
        metadata: {
          ...(dataSource.metadata ?? {}),
          manual_data: form.manual_data.trim(),
        },
      }
      const updatedSource = await updateDataSource(dataSource.project, dataSource.id, updateData)

      upsertCachedDataSource(updatedSource)
      navigate(getProjectDetailsPath(updatedSource.project ?? form.project))
    } catch (saveError) {
      if (saveError?.name?.[0]) {
        setErrors({ name: saveError.name[0] })
      } else {
        setError(saveError?.error ?? 'Could not update data source. Please try again.')
      }
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!dataSource) return

    setSaving(true)
    setError('')

    try {
      await deleteDataSource(dataSource.project, dataSource.id)
      removeCachedDataSource(dataSource.id)
      navigate(getProjectDetailsPath(dataSource.project))
    } catch {
      setError('Could not delete data source. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSave}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Breadcrumbs>
            <Link component={RouterLink} to="/data-sources" underline="hover" color="text.secondary">
              Data Sources
            </Link>
            <Typography color="text.primary">Edit Data Source</Typography>
          </Breadcrumbs>
          <Typography variant="h2">Edit Data Source</Typography>
          <Typography color="text.secondary">Update the details and source information of this data source.</Typography>
        </Stack>

        {invalidRoute && <Alert severity="error">Could not identify the data source to edit.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {loading && <Alert severity="info">Loading data source...</Alert>}

        {!loading && dataSource && (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(320px, 0.8fr)' },
                gap: 3,
                alignItems: 'start',
              }}
            >
              <MainCard>
                <Stack spacing={3}>
                  <Stack spacing={2}>
                    <Typography variant="h5">1. Basic Information</Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="Data Source Name"
                        required
                        placeholder="e.g. training_reviews.json"
                        value={form.name}
                        error={Boolean(errors.name)}
                        helperText={errors.name || `${form.name.length} / 100`}
                        inputRef={nameInputRef}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                        onChange={(event) => updateField('name', event.target.value)}
                        onKeyDown={(event) => moveFocusOnArrow(event, locationInputRef)}
                      />
                      <TextField
                        select
                        label="Project"
                        required
                        value={form.project}
                        error={Boolean(errors.project)}
                        helperText={errors.project || 'Move this data source to another project if needed.'}
                        onChange={(event) => updateField('project', event.target.value)}
                      >
                        {projects.map((project) => (
                          <MenuItem key={project.id} value={String(project.id)}>
                            {project.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Stack>

                  <Divider />

                  <Stack spacing={2}>
                    <Typography variant="h5">2. Source Information</Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                        gap: 2,
                      }}
                    >
                      <TextField
                        select
                        label="Source Type"
                        required
                        value={form.source_type}
                        helperText="How is this data source provided?"
                        onChange={(event) => updateSourceType(event.target.value)}
                      >
                        {sourceTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        label="Data Format"
                        required
                        value={form.data_format}
                        helperText="What is the format or structure of the data?"
                        onChange={(event) => updateField('data_format', event.target.value)}
                      >
                        {dataFormatOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Location / Reference"
                        required
                        value={form.location}
                        error={Boolean(errors.location)}
                        helperText={errors.location || (form.source_type === 'manual' ? 'Auto-filled for manual entries if left empty.' : 'Where is this data sourced from?')}
                        placeholder='e.g., "manual input" or "demo_reviews.txt"'
                        inputRef={locationInputRef}
                        onChange={(event) => updateField('location', event.target.value)}
                        onKeyDown={(event) => moveFocusOnArrow(event, manualDataInputRef, nameInputRef)}
                      />
                    </Box>

                    {/* key forces a remount on format change so the collapse state resets. */}
                    <DataFormatHintAlert key={form.data_format} hint={activeHint} />

                    {activeHint && (
                      <Stack spacing={1}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={isNotCompliant}
                              onChange={(e) => {
                                setIsNotCompliant(e.target.checked)
                                if (!e.target.checked) setViolations([])
                              }}
                              sx={{
                                color: 'error.main',
                                '&:hover': { color: 'error.dark' },
                                '&.Mui-checked': { color: 'error.dark' },
                              }}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ color: isNotCompliant ? 'error.dark' : 'error.main' }}>
                              Data is not compliant
                            </Typography>
                          }
                        />
                        <Collapse in={isNotCompliant}>
                          <Stack spacing={0.5} sx={{ pl: 1 }}>
                            <Typography variant="body2" fontWeight={500}>Select all that apply:</Typography>
                            <FormGroup>
                              {activeHint.checklist?.map((item) => (
                                <FormControlLabel
                                  key={item}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={violations.includes(item)}
                                      onChange={(e) => setViolations((prev) =>
                                        e.target.checked ? [...prev, item] : prev.filter((v) => v !== item)
                                      )}
                                    />
                                  }
                                  label={<Typography variant="body2">{item}</Typography>}
                                />
                              ))}
                            </FormGroup>
                          </Stack>
                        </Collapse>
                      </Stack>
                    )}
                  </Stack>

                  <Divider />

                  <Stack spacing={2}>
                    <Typography variant="h5">3. Manual Data Input (optional)</Typography>
                    <TextField
                      multiline
                      minRows={4}
                      placeholder={'Name: Anna Mueller\nEmail: anna@example.com\nComment: I live in Tuebingen and would like product support.'}
                      value={form.manual_data}
                      helperText={`${form.manual_data.length} / 2000`}
                      inputRef={manualDataInputRef}
                      slotProps={{ htmlInput: { maxLength: 2000 } }}
                      onChange={(event) => updateField('manual_data', event.target.value)}
                      onKeyDown={(event) => moveFocusOnArrow(event, null, locationInputRef)}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Use only small demo data for testing.
                    </Typography>
                  </Stack>

                </Stack>
              </MainCard>

              <Stack spacing={2}>
                <SidebarCard icon={FileTextOutlined} title="Data Source Summary">
                  <Stack spacing={1.5}>
                    <StatusRow label="Name">
                      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                        {form.name || dataSource.name}
                      </Typography>
                    </StatusRow>
                    <StatusRow label="Project">
                      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                        {selectedProject?.name ?? dataSource.project_name ?? `Project ${dataSource.project}`}
                      </Typography>
                    </StatusRow>
                    <StatusRow label="Updated">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(dataSource.updated_at)}
                      </Typography>
                    </StatusRow>
                    <StatusRow label="Status">
                      <Chip size="small" color="success" label="Active" />
                    </StatusRow>
                  </Stack>
                </SidebarCard>

                <SidebarCard
                  icon={LinkOutlined}
                  iconColor="secondary.main"
                  iconBg="secondary.lighter"
                  title="Source Details"
                >
                  <Stack spacing={1.5}>
                    <StatusRow label="Source Type">
                      <Chip size="small" color="primary" label={dataSource.source_type_display || form.source_type} />
                    </StatusRow>
                    <StatusRow label="Format">
                      <Chip size="small" color="secondary" label={dataSource.data_format_display || form.data_format} />
                    </StatusRow>
                    <StatusRow label="Reference">
                      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', overflowWrap: 'anywhere' }}>
                        {form.location || '-'}
                      </Typography>
                    </StatusRow>
                    <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                      Keep source details current so the project inventory stays accurate.
                    </Typography>
                  </Stack>
                </SidebarCard>

                <SidebarCard icon={BulbOutlined} title="Tip">
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 5.5 }}>
                    Use Save Changes after updating the name, reference, format, or manual sample data.
                  </Typography>
                </SidebarCard>
              </Stack>
            </Box>

            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 1,
                bgcolor: 'background.default',
                borderTop: 1,
                borderColor: 'divider',
                py: 2,
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                <Button variant="outlined" color="secondary" onClick={() => navigate(getProjectDetailsPath(form.project || dataSource.project))}>
                  Cancel
                </Button>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button variant="outlined" color="error" startIcon={<DeleteOutlined />} disabled={saving} onClick={() => setDeleteDialogOpen(true)}>
                    Delete Data Source
                  </Button>
                  <Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={submitDisabled}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </>
        )}

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete Data Source</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Delete &quot;{dataSource?.name}&quot; from this project? The project metrics and risk assessment will update after deletion.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button color="secondary" disabled={saving} onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button color="error" variant="contained" disabled={saving} onClick={handleDelete}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  )
}
