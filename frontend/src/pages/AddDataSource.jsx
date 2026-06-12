import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { InfoCircleOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons'

import DataFormatHintAlert from 'components/DataFormatHintAlert'
import MainCard from 'components/MainCard'
import { createDataSource, getDataFormatHints } from 'api/dataSources'
import { getProjects } from 'api/projects'
import { upsertCachedDataSource } from 'utils/data-source-cache'
import ImportDataSourcesDialog from './ImportDataSourcesDialog'

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

// Initial form state with default values
const initialForm = {
  project: '',
  name: '',
  location: '',
  source_type: 'manual',
  data_format: 'text',
  manual_data: '',
}

function SectionTitle({ number, children }) {
  return (
    <Typography variant="h5">
      {number}. {children}
    </Typography>
  )
}

function getProjectDetailsPath(projectId) {
  return projectId ? `/projects/${projectId}` : '/data-sources'
}

export default function AddDataSource() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetProject = searchParams.get('project') ?? ''
  
  // Core state management for form data, validation, and UI feedback
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ ...initialForm, project: presetProject })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dataFormatHints, setDataFormatHints] = useState({})
  const [isNotCompliant, setIsNotCompliant] = useState(false)
  const [violations, setViolations] = useState([])
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // Refs for keyboard navigation between form fields
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

  // Load available projects on component mount
  useEffect(() => {
    let isActive = true

    getProjects()
      .then((projectList) => {
        if (isActive) {
          setProjects(projectList)
        }
      })
      .catch(() => {
        if (isActive) {
          setError('Could not load projects. Please refresh the page.')
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

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(form.project)),
    [form.project, projects],
  )
  const submitDisabled = saving || projects.length === 0 || !form.name.trim()

  // Auto-focus name input after projects are loaded
  useEffect(() => {
    if (!loading) {
      nameInputRef.current?.focus()
    }
  }, [loading])

  // Update form field and clear associated error
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    if (field === 'data_format') {
      setIsNotCompliant(false)
      setViolations([])
    }
  }

  // Handle source type changes with auto-fill logic for manual entries
  function updateSourceType(value) {
    setForm((current) => ({
      ...current,
      source_type: value,
      location: value === 'manual' && !current.location.trim() ? 'manual input' : current.location,
    }))
  }

  // Enable arrow key navigation between form inputs
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

  // Validate form before submission - checks required fields
  function validateForm() {
    const nextErrors = {}
    if (!form.project) nextErrors.project = 'Project is required.'
    if (!form.name.trim()) nextErrors.name = 'Data source name is required.'
    if (!form.location.trim() && form.source_type !== 'manual') nextErrors.location = 'Location or reference is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // Submit form: validate, create data source, cache it, and navigate
  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    setError('')

    try {
      const location = form.location.trim() || (form.source_type === 'manual' ? 'manual input' : '')
      const createdDataSource = await createDataSource(form.project, {
        name: form.name.trim(),
        location,
        source_type: form.source_type,
        data_format: form.data_format,
        metadata: {
          manual_data: form.manual_data.trim(),
        },
        compliance_violations: isNotCompliant ? violations : [],
      })

      // Cache the newly created data source for quick access
      upsertCachedDataSource({
        ...createdDataSource,
        project_name: createdDataSource.project_name ?? selectedProject?.name ?? '',
      })

      // Navigate to project details or data sources list
      navigate(getProjectDetailsPath(createdDataSource.project ?? form.project))
    } catch (saveError) {
      setError(saveError?.error ?? 'Could not save data source. Please check the form and try again.')
      setSaving(false)
    }
  }

  // After successful bulk import, navigate to project
  function handleImported() {
    navigate(getProjectDetailsPath(form.project))
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Breadcrumbs>
            <Link component={RouterLink} to="/data-sources" underline="hover" color="text.secondary">
              Data Sources
            </Link>
            <Typography color="text.primary">Add Data Source</Typography>
          </Breadcrumbs>
          <Typography variant="h2">Add Data Source</Typography>
          <Typography color="text.secondary">Register a data source and record its source information.</Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {!loading && projects.length === 0 && (
          <Alert severity="info" action={<Button onClick={() => navigate('/projects')}>Go to Projects</Button>}>
            Create a project before adding data sources.
          </Alert>
        )}

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
                <SectionTitle number="1">Basic Information</SectionTitle>
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
                  {presetProject ? (
                    <TextField
                      label="Project"
                      value={selectedProject?.name || 'Loading project...'}
                      helperText="Project cannot be changed here."
                      slotProps={{ input: { readOnly: true } }}
                    />
                  ) : (
                    <TextField
                      select
                      label="Project"
                      required
                      value={form.project}
                      error={Boolean(errors.project)}
                      helperText={errors.project}
                      onChange={(event) => updateField('project', event.target.value)}
                    >
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </Box>
              </Stack>

              <Divider />

              <Stack spacing={2}>
                <SectionTitle number="2">Source Information</SectionTitle>
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
                <SectionTitle number="3">Manual Data Input (optional)</SectionTitle>
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
            <MainCard title="About Data Sources" sx={{ bgcolor: 'primary.lighter', borderColor: 'primary.light' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{ color: 'primary.main', pt: 0.25 }}>
                  <InfoCircleOutlined />
                </Box>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Adding data sources allows you to track the datasets, files, APIs, and references used in your ML pipelines.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Additional analysis can be added later in a dedicated workflow.
                  </Typography>
                </Stack>
              </Stack>
            </MainCard>

            <MainCard title="Project">
              <Stack spacing={1}>
                <Typography variant="subtitle1">
                  {selectedProject?.name || 'No project selected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProject?.description || 'Select the project this data source belongs to.'}
                </Typography>
              </Stack>
            </MainCard>
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
            <Button variant="outlined" color="secondary" onClick={() => navigate(getProjectDetailsPath(form.project))}>
              Cancel
            </Button>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<UploadOutlined />}
                onClick={() => setImportDialogOpen(true)}
                disabled={saving}
              >
                Import JSON
              </Button>
              <Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={submitDisabled}>
                {saving ? 'Adding...' : 'Add Data Source'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      <ImportDataSourcesDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        projectId={form.project || presetProject}
        projectName={selectedProject?.name}
        onImported={handleImported}
      />
    </Box>
  )
}
