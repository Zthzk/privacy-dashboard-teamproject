import React, { useRef, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { CheckCircleOutlined, CloseCircleOutlined, UploadOutlined } from '@ant-design/icons'

import { createDataSource } from 'api/dataSources'
import { upsertCachedDataSource } from 'utils/data-source-cache'

// Define validation constraints for bulk import
const REQUIRED_FIELDS = ['name', 'source_type', 'data_format']
const ALLOWED_SOURCE_TYPES = ['file', 'database', 'api', 'url', 'manual', 'other']
// audio and video added in US-07 — kept in sync so imports don't reject formats the backend accepts
const ALLOWED_DATA_FORMATS = ['text', 'csv', 'json', 'image', 'audio', 'video', 'other']

// Validate individual entry against required fields and allowed values
function validateEntry(entry, index) {
  for (const field of REQUIRED_FIELDS) {
    if (!entry[field] || !String(entry[field]).trim()) {
      return `Entry ${index + 1}: missing required field "${field}".`
    }
  }
  if (!ALLOWED_SOURCE_TYPES.includes(entry.source_type)) {
    return `Entry ${index + 1}: invalid source_type "${entry.source_type}". Allowed: ${ALLOWED_SOURCE_TYPES.join(', ')}.`
  }
  if (!ALLOWED_DATA_FORMATS.includes(entry.data_format)) {
    return `Entry ${index + 1}: invalid data_format "${entry.data_format}". Allowed: ${ALLOWED_DATA_FORMATS.join(', ')}.`
  }
  return null
}

// Parse JSON file and return array of entries
function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (!Array.isArray(parsed)) {
          reject(new Error('JSON must be an array of data source objects.'))
        } else if (parsed.length === 0) {
          reject(new Error('JSON array is empty.'))
        } else {
          resolve(parsed)
        }
      } catch {
        reject(new Error('Invalid JSON file. Please check the file format.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsText(file)
  })
}

// Transform raw entry to API payload format with defaults for optional fields
function toPayload(entry) {
  return {
    name: String(entry.name).trim(),
    location: entry.location ? String(entry.location).trim() : (entry.source_type === 'manual' ? 'manual input' : ''),
    source_type: entry.source_type,
    data_format: entry.data_format,
    metadata: {
      manual_data: entry.manual_data ? String(entry.manual_data).trim() : '',
    },
  }
}

export default function ImportDataSourcesDialog({ open, onClose, projectId, projectName, onImported }) {
  const fileInputRef = useRef(null)
  
  // State for parsed entries, errors, and import progress
  const [entries, setEntries] = useState([])
  const [parseError, setParseError] = useState('')
  const [importState, setImportState] = useState('idle') // idle | importing | done | error
  const [importError, setImportError] = useState('')
  const [progress, setProgress] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)

  // Reset all state and clear file input
  function reset() {
    setEntries([])
    setParseError('')
    setImportState('idle')
    setImportError('')
    setProgress(0)
    setCompletedCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Close dialog only if not currently importing
  function handleClose() {
    if (importState === 'importing') return
    reset()
    onClose()
  }

  // Handle file selection: parse JSON and validate all entries before preview
  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setParseError('')
    setEntries([])

    try {
      const parsed = await parseJsonFile(file)

      // Validate all entries before showing preview
      for (let i = 0; i < parsed.length; i++) {
        const validationError = validateEntry(parsed[i], i)
        if (validationError) {
          setParseError(validationError)
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
        }
      }

      setEntries(parsed)
    } catch (err) {
      setParseError(err.message)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Import all entries sequentially with progress tracking and error handling
  async function handleImport() {
    if (!entries.length || !projectId) return

    setImportState('importing')
    setImportError('')
    setProgress(0)
    setCompletedCount(0)

    // Process each entry and track progress
    for (let i = 0; i < entries.length; i++) {
      try {
        const created = await createDataSource(projectId, toPayload(entries[i]))
        // Cache the newly created data source for quick access
        upsertCachedDataSource({
          ...created,
          project_name: created.project_name ?? projectName ?? '',
        })
        setCompletedCount(i + 1)
        setProgress(Math.round(((i + 1) / entries.length) * 100))
      } catch (err) {
        // Prefer the most specific error available. Django field-level errors (e.g. duplicate
        // name from validate_constraints) are nested in err.errors — surface those first so
        // the user sees the actual reason rather than the generic "validation failed" message.
        const fieldError = err.errors && Object.values(err.errors).flat()[0]
        const message = fieldError ?? err?.error ?? `Failed on entry ${i + 1} ("${entries[i].name}"). Import stopped.`
        setImportError(message)
        setImportState('error')
        return
      }
    }

    setImportState('done')
    onImported?.()
  }

  // Computed UI state flags
  const isImporting = importState === 'importing'
  const isDone = importState === 'done'
  const hasError = importState === 'error'

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Data Sources from JSON</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Format hint */}
          <Alert severity="info">
            Upload a JSON file containing an array of data source objects. Each entry must have{' '}
            <strong>name</strong>, <strong>source_type</strong>, and <strong>data_format</strong>.
            All entries will be added to project <strong>{projectName || projectId}</strong>.
          </Alert>

          {/* File picker */}
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isImporting || isDone}
            />
            <Button
              variant="outlined"
              startIcon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || isDone}
            >
              Choose JSON file
            </Button>
          </Box>

          {/* Parse error */}
          {parseError && <Alert severity="error">{parseError}</Alert>}

          {/* Preview table */}
          {entries.length > 0 && !isDone && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
              </Typography>
              <TableContainer sx={{ maxHeight: 300, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Source Type</TableCell>
                      <TableCell>Data Format</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow
                        key={index}
                        sx={
                          hasError && index === completedCount
                            ? { bgcolor: 'error.lighter' }
                            : index < completedCount
                              ? { bgcolor: 'success.lighter' }
                              : {}
                        }
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell>
                          <Chip label={entry.source_type} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={entry.data_format} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontStyle: entry.location ? 'normal' : 'italic' }}>
                          {entry.location || (entry.source_type === 'manual' ? 'manual input' : '—')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          {/* Progress */}
          {isImporting && (
            <Stack spacing={1}>
              <Typography variant="body2">
                Importing {completedCount} of {entries.length}…
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Stack>
          )}

          {/* Import error */}
          {hasError && (
            <Alert severity="error" icon={<CloseCircleOutlined />}>
              {importError}
              <br />
              <Typography variant="caption">
                {completedCount} of {entries.length} entries were saved before the error.
              </Typography>
            </Alert>
          )}

          {/* Success */}
          {isDone && (
            <Alert severity="success" icon={<CheckCircleOutlined />}>
              All {entries.length} data {entries.length === 1 ? 'source' : 'sources'} imported successfully.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isImporting} color="secondary" variant="outlined">
          {isDone ? 'Close' : 'Cancel'}
        </Button>
        {!isDone && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={entries.length === 0 || isImporting || !projectId}
          >
            {isImporting ? `Importing… (${completedCount}/${entries.length})` : `Import ${entries.length || ''} ${entries.length === 1 ? 'entry' : 'entries'}`.trim()}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
