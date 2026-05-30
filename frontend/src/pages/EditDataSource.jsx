import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { BulbOutlined, DeleteOutlined, FileTextOutlined, LinkOutlined, SaveOutlined } from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { deleteDataSource, getDataSource, updateDataSource } from 'api/dataSources'
import { getProjects } from 'api/projects'
import { removeCachedDataSource, upsertCachedDataSource } from 'utils/data-source-cache'
import { mergeUniqueById, sampleDataSources, sampleProjects } from 'constants/dashboardSampleData'

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

function normalizeSampleDataSource(source) {
  if (!source) return null

  return {
    ...source,
    source_type: source.source_type ?? 'file',
    data_format: source.data_format ?? String(source.data_format_display ?? 'text').toLowerCase(),
  }
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

  useEffect(() => {
    let isActive = true

    if (invalidRoute) return undefined

    Promise.all([getDataSource(projectId, dataSourceId), getProjects()])
      .then(([source, projectList]) => {
        if (!isActive) return

        setProjects(mergeUniqueById(projectList, sampleProjects))
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
          const sampleSource = normalizeSampleDataSource(sampleDataSources.find((source) => String(source.id) === String(dataSourceId)))

          if (sampleSource) {
            setProjects(sampleProjects)
            setDataSource(sampleSource)
            setForm({
              project: String(sampleSource.project ?? ''),
              name: sampleSource.name ?? '',
              location: sampleSource.location ?? '',
              source_type: sampleSource.source_type ?? 'file',
              data_format: sampleSource.data_format ?? 'text',
              manual_data: sampleSource.metadata?.manual_data ?? '',
            })
            setError('')
          } else {
            setError('Could not load this data source. Please check the backend connection and try again.')
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
  }, [projectId, dataSourceId, invalidRoute])

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

  async function handleSave(event) {
    event.preventDefault()

    if (!validateForm() || !dataSource) return

    setSaving(true)
    setError('')

    try {
      const updateData = {
        project: form.project,
        name: form.name.trim(),
        location: form.location.trim(),
        source_type: form.source_type,
        data_format: form.data_format,
        metadata: {
          ...(dataSource.metadata ?? {}),
          manual_data: form.manual_data.trim(),
        },
      }
      const updatedSource = dataSource.isSample
        ? {
          ...dataSource,
          ...updateData,
          project_name: selectedProject?.name ?? dataSource.project_name,
          source_type_display: sourceTypeOptions.find((option) => option.value === updateData.source_type)?.label ?? updateData.source_type,
          data_format_display: dataFormatOptions.find((option) => option.value === updateData.data_format)?.label ?? updateData.data_format,
          updated_at: new Date().toISOString(),
        }
        : await updateDataSource(dataSource.project, dataSource.id, updateData)

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
    if (!dataSource || !window.confirm(`Delete "${dataSource.name}"?`)) return

    setSaving(true)
    setError('')

    try {
      if (!dataSource.isSample) {
        await deleteDataSource(dataSource.project, dataSource.id)
      }
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
                        placeholder="e.g. support_emails.csv"
                        value={form.name}
                        error={Boolean(errors.name)}
                        helperText={errors.name || `${form.name.length} / 100`}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                        onChange={(event) => updateField('name', event.target.value)}
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
                    <Typography variant="h5">3. Manual Data Input (optional)</Typography>
                    <TextField
                      multiline
                      minRows={4}
                      placeholder={'Name: Anna Mueller\nEmail: anna@example.com\nComment: I live in Tuebingen and would like product support.'}
                      value={form.manual_data}
                      helperText={`${form.manual_data.length} / 2000`}
                      slotProps={{ htmlInput: { maxLength: 2000 } }}
                      onChange={(event) => updateField('manual_data', event.target.value)}
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
                  <Button variant="outlined" color="error" startIcon={<DeleteOutlined />} disabled={saving} onClick={handleDelete}>
                    Delete Data Source
                  </Button>
                  <Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving || !form.name.trim()}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  )
}
