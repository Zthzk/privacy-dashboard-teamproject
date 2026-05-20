import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { InfoCircleOutlined, SaveOutlined } from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { createDataSource } from 'api/dataSources'
import { getProjects } from 'api/projects'
import { upsertCachedDataSource } from 'utils/data-source-cache'

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

function SectionTitle({ number, children }) {
  return (
    <Typography variant="h5">
      {number}. {children}
    </Typography>
  )
}

export default function AddDataSource() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetProject = searchParams.get('project') ?? ''
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ ...initialForm, project: presetProject })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.project) nextErrors.project = 'Project is required.'
    if (!form.name.trim()) nextErrors.name = 'Data source name is required.'
    if (!form.location.trim()) nextErrors.location = 'Location or reference is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    setError('')

    try {
      const createdDataSource = await createDataSource(form.project, {
        name: form.name.trim(),
        location: form.location.trim(),
        source_type: form.source_type,
        data_format: form.data_format,
        metadata: {
          manual_data: form.manual_data.trim(),
        },
      })

      upsertCachedDataSource({
        ...createdDataSource,
        project_name: createdDataSource.project_name ?? selectedProject?.name ?? '',
      })

      navigate('/data-sources')
    } catch (saveError) {
      setError(saveError?.error ?? 'Could not save data source. Please check the form and try again.')
      setSaving(false)
    }
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
                    placeholder="e.g. support_emails.csv"
                    value={form.name}
                    error={Boolean(errors.name)}
                    helperText={errors.name || `${form.name.length} / 100`}
                    inputProps={{ maxLength: 100 }}
                    onChange={(event) => updateField('name', event.target.value)}
                  />
                  {presetProject ? (
                    <TextField
                      label="Project"
                      value={selectedProject?.name || 'Loading project...'}
                      helperText="Project cannot be changed here."
                      InputProps={{ readOnly: true }}
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
                    onChange={(event) => updateField('source_type', event.target.value)}
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
                    helperText={errors.location || 'Where is this data sourced from?'}
                    placeholder='e.g., "manual input" or "demo_reviews.txt"'
                    onChange={(event) => updateField('location', event.target.value)}
                  />
                </Box>
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
                  inputProps={{ maxLength: 2000 }}
                  onChange={(event) => updateField('manual_data', event.target.value)}
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
            <Button variant="outlined" color="secondary" onClick={() => navigate('/data-sources')}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving || projects.length === 0 || !form.name.trim()}>
              {saving ? 'Adding...' : 'Add Data Source'}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
